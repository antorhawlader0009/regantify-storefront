/**
 * Speaking a reply on the call. Piper speaker 8 (piperVoice.ts) is the voice; the free Google Translate voice is the
 * fallback, used when Piper is late (the user's rule, 2026-10-22):
 *   - Piper isn't ready when the ring time is up (slow download, no CORS on the files, an old device),
 *   - a piece isn't made within LATE_MS of being needed,
 *   - this device made speech slower than real time twice (it then also starts the next call on Google, for 3 days).
 * Once a call switches to Google it stays on Google, so the voice doesn't change back and forth in one conversation.
 *
 * A reply is cut into pieces (banglaSpeech.speechChunks): every piece is requested at once (the worker makes them one by
 * one), and each is played as soon as the previous one ends. stop() is instant (barge-in).
 *
 * Google's voice is played as an <audio> URL (no CORS, so it can't be fetched or routed through WebAudio; routing a
 * no-CORS sound through WebAudio would make it silent). Its "level" for the avatar is therefore made up while it plays.
 */
import { cancelPiper, isPiperReady, synthesizePiper, type PiperAudio } from './piperVoice';
import { speechChunks } from './banglaSpeech';

export type VoiceEngine = 'piper' | 'google';

const LATE_MS = 2500;
const SLOW_KEY = 'regantify-voice-slow';
const SLOW_DAYS = 3;
const GOOGLE_MAX = 180; // the endpoint refuses much longer text

export function deviceIsSlow(): boolean {
  try {
    const until = Number(localStorage.getItem(SLOW_KEY));
    return until > Date.now();
  } catch {
    return false;
  }
}
function markSlow() {
  try {
    localStorage.setItem(SLOW_KEY, String(Date.now() + SLOW_DAYS * 86_400_000));
  } catch {
    /* private mode */
  }
}

/**
 * Google's voice answers 404 (an HTML page, which Chrome then blocks as ERR_BLOCKED_BY_ORB) to any request that carries
 * the page address in Referer, and an <audio> element can't drop it on its own. So the page's referrer policy is
 * `no-referrer` while a call uses Google's voice, and the store's normal policy (next.config.ts) comes back after.
 */
function pageReferrer(off: boolean) {
  let meta = document.querySelector<HTMLMetaElement>('meta[name="referrer"][data-voice-call]');
  if (!meta) {
    if (!off) return;
    meta = document.createElement('meta');
    meta.name = 'referrer';
    meta.setAttribute('data-voice-call', '');
    document.head.appendChild(meta);
  }
  meta.content = off ? 'no-referrer' : 'strict-origin-when-cross-origin';
}

export function googleVoiceUrls(text: string): string[] {
  const out: string[] = [];
  let cur = '';
  for (const part of text.split(/(?<=[,;:।])\s*|\s+/u)) {
    if (!part) continue;
    const next = cur ? `${cur} ${part}` : part;
    if (next.length > GOOGLE_MAX && cur) {
      out.push(cur);
      cur = part;
    } else cur = next;
  }
  if (cur) out.push(cur);
  return out.map((q) => `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=bn&q=${encodeURIComponent(q)}`);
}

export class VoiceOut {
  engine: VoiceEngine;
  private gen = 0;
  private source: AudioBufferSourceNode | null = null;
  private analyser: AnalyserNode;
  private levelBuf: Uint8Array<ArrayBuffer>;
  private googlePlaying = false;
  private slowPieces = 0;

  constructor(
    private ctx: AudioContext,
    /**
     * Two <audio> elements unlocked during the tap that started the call (iPhones only let such an element play later).
     * They take turns, so the next piece of Google's voice loads while the current one plays.
     */
    private googleEls: [HTMLAudioElement, HTMLAudioElement],
    private base: string | null,
    engine: VoiceEngine,
    private onFallback: (why: string) => void,
  ) {
    this.engine = engine;
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.connect(ctx.destination);
    this.levelBuf = new Uint8Array(new ArrayBuffer(this.analyser.fftSize));
  }

  /** Switches the rest of the call to Google. */
  fallback(why: string) {
    if (this.engine === 'google') return;
    this.engine = 'google';
    this.onFallback(why);
  }

  /** 0..1, how loud the assistant is right now (for the avatar's ring). */
  level(): number {
    if (this.googlePlaying) return 0.35 + 0.25 * Math.abs(Math.sin(performance.now() / 140));
    if (!this.source) return 0;
    this.analyser.getByteTimeDomainData(this.levelBuf);
    let sum = 0;
    for (const v of this.levelBuf) sum += ((v - 128) / 128) ** 2;
    return Math.min(1, Math.sqrt(sum / this.levelBuf.length) * 4);
  }

  /** Stops speaking at once; pieces still being made are dropped. */
  stop() {
    this.gen++;
    cancelPiper(this.gen);
    try {
      this.source?.stop();
    } catch {
      /* already ended */
    }
    this.source = null;
    for (const el of this.googleEls) el.pause();
    this.googlePlaying = false;
  }

  /**
   * Speaks already-speakable Bangla text. Resolves true when it was all said, false when stop() cut it.
   * `onStart` fires when the first sound plays.
   */
  async speak(text: string, onStart?: () => void): Promise<boolean> {
    this.stop();
    const gen = this.gen;
    const pieces = speechChunks(text);
    if (!pieces.length) return true;
    let started = false;
    const begin = () => {
      if (!started) {
        started = true;
        onStart?.();
      }
    };

    const made: (Promise<PiperAudio> | null)[] =
      this.engine === 'piper' && this.base ? pieces.map((p) => synthesizePiper(this.base!, p, gen)) : pieces.map(() => null);
    made.forEach((m) => m?.catch(() => undefined)); // handled where awaited

    for (let i = 0; i < pieces.length; i++) {
      if (gen !== this.gen) return false;
      const job = this.engine === 'piper' ? made[i] : null;
      if (job) {
        const audio = await Promise.race([job.catch(() => null), new Promise<'late'>((r) => setTimeout(() => r('late'), LATE_MS))]);
        if (gen !== this.gen) return false;
        if (audio === 'late' || audio === null) {
          this.fallback(audio === 'late' ? 'late' : 'failed');
          cancelPiper(gen + 1);
        } else {
          const secs = audio.pcm.length / audio.sampleRate;
          // Slower than real time: the pieces after this would leave gaps.
          if (audio.ms / 1000 > secs * 1.1 && ++this.slowPieces >= 2) {
            markSlow();
            this.fallback('slow');
            cancelPiper(gen + 1);
          }
          begin();
          if (!(await this.playPcm(audio, gen))) return false;
          continue;
        }
      }
      // Google for this piece and every one after it.
      const left = pieces.slice(i);
      const google = await this.playGoogle(left, gen, begin);
      if (google === 'stopped') return false;
      if (google === 'done') return gen === this.gen;
      // Google failed (blocked, rate-limited, offline). If Piper got ready meanwhile, it says the rest instead.
      if (!this.base || !isPiperReady()) return gen === this.gen;
      this.engine = 'piper';
      for (const piece of left.slice(google.failedAt)) {
        const audio = await synthesizePiper(this.base, piece, gen).catch(() => null);
        if (gen !== this.gen) return false;
        if (!audio) return true;
        begin();
        if (!(await this.playPcm(audio, gen))) return false;
      }
      return gen === this.gen;
    }
    return gen === this.gen;
  }

  private playPcm(a: PiperAudio, gen: number): Promise<boolean> {
    return new Promise((resolve) => {
      const buf = this.ctx.createBuffer(1, a.pcm.length, a.sampleRate);
      buf.copyToChannel(new Float32Array(a.pcm), 0);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.connect(this.analyser);
      src.onended = () => {
        if (this.source === src) this.source = null;
        resolve(gen === this.gen);
      };
      this.source = src;
      src.start();
    });
  }

  /** The call ended: the page's normal referrer policy comes back. */
  dispose() {
    this.stop();
    pageReferrer(false);
  }

  /**
   * Plays the pieces with Google's voice. While one plays, the other element already loads the next, so there is no
   * gap waiting for Google. `failedAt`: the piece Google couldn't give (the caller may hand the rest to Piper).
   */
  private async playGoogle(pieces: string[], gen: number, begin: () => void): Promise<'done' | 'stopped' | { failedAt: number }> {
    pageReferrer(true);
    // Every request with the piece it belongs to (a long piece can need several requests).
    const parts = pieces.flatMap((p, piece) => googleVoiceUrls(p).map((url) => ({ url, piece })));
    const load = (i: number) => {
      if (i >= parts.length) return;
      const el = this.googleEls[i % 2];
      el.preload = 'auto';
      el.src = parts[i].url;
      el.load();
    };
    load(0);
    load(1);
    for (let i = 0; i < parts.length; i++) {
      if (gen !== this.gen) return 'stopped';
      const el = this.googleEls[i % 2];
      const result = await new Promise<'ended' | 'stopped' | 'failed'>((resolve) => {
        let done = false;
        const finish = (v: 'ended' | 'stopped' | 'failed') => {
          if (done) return;
          done = true;
          clearTimeout(timer);
          el.onended = el.onerror = el.onpause = el.onplaying = null;
          this.googlePlaying = false;
          resolve(v);
        };
        // Google not answering at all: give up on it instead of hanging the call.
        const timer = setTimeout(() => finish('failed'), 8000);
        el.onended = () => finish('ended');
        el.onerror = () => finish('failed');
        el.onpause = () => finish(gen !== this.gen ? 'stopped' : el.ended ? 'ended' : 'stopped');
        el.onplaying = () => {
          clearTimeout(timer);
          this.googlePlaying = true;
          begin();
        };
        if (el.error) return finish('failed');
        el.play().catch(() => finish(gen !== this.gen ? 'stopped' : 'failed'));
      });
      if (result === 'stopped' || gen !== this.gen) return 'stopped';
      if (result === 'failed') return { failedAt: parts[i].piece };
      // This element is free again: it loads the piece after the next one.
      load(i + 2);
    }
    return 'done';
  }
}
