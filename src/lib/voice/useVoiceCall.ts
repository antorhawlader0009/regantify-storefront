'use client';

/**
 * The store AI chat's voice call (2026-10-22): the shopper taps the call button, hears a phone ring while the Piper
 * voice loads, and then talks with the assistant as on a phone call. On screen the call is only a chat head over the real
 * store (components/voice/VoiceCallScreen.tsx); whatever the assistant shows goes on the store's own pages (showOnSite).
 * Theme-independent: a template draws nothing of its own and passes its chat's send function.
 *
 * One turn: the browser's speech recognition hears the shopper (speechInput.ts) -> the chat's own send (the server's
 * streamed chat route, POST chat/stream, with `voice: true`, so it answers short and in Bangla letters, and the turn is
 * kept in the chat) -> each finished sentence is made speakable (banglaSpeech.ts) and spoken as soon as it arrives
 * (voiceOut.ts stream(): Piper, or Google when Piper is late), so the first words come while the rest is being written.
 *
 * What makes it feel like a call:
 *   - "Calling..." then "Ringing..." with a ring tone, a pick-up blip, a call timer and a hang-up tone;
 *   - the assistant greets first;
 *   - the shopper can cut in: as soon as two words are heard that aren't the assistant's own voice coming back through
 *     the speaker (isEcho), it stops talking. On a phone (halfDuplex) the microphone hears the loudspeaker far too well
 *     for that, so listening is held while the assistant speaks and the shopper cuts in with the "stop" button;
 *   - while the answer hasn't started, a natural line about what was asked, then about any lookup, then "almost ready"
 *     (fillers.ts; made ahead while the call is quiet so they play at once);
 *   - "can you hear me?" after a long silence, then a polite goodbye;
 *   - the screen stays on during the call.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { speakableBangla, speechWords } from './banglaSpeech';
import { playConnect, playHangup, startRingback } from './callSounds';
import { SpeechInput } from './speechInput';
import { idlePiper, loadPiper, piperSpeed, setPiperModel, stopPiper } from './piperVoice';
import { chooseVoiceModel } from './voiceModelCache';
import { deviceIsSlow, markSlow, VoiceOut, type VoiceEngine, type VoiceStream } from './voiceOut';
import { appVoice, NativeVoiceOut, nativeProbe, nativeWarm, type VoiceOutLike } from './nativeVoice';
import { pickProduct, wantsBack, wantsCloseCart, wantsHangUp, wantsOpen, wantsPhotoSearch, wantsShowCart } from './voiceIntents';
import { firstFiller, linesToPrepare, stillFiller, toolFiller } from './fillers';
import type { ChatAction, ChatLive } from '../chatApi';

export interface CallLine {
  who: 'shopper' | 'assistant';
  text: string;
}

export type CallPhase = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';
export type TalkState = 'listening' | 'thinking' | 'speaking';

export interface VoiceTurn<P> {
  reply: string;
  products: P[];
  /** What the AI asked to do on the screen (search, open a product, back, cart, camera, hang up), already checked by the server. */
  actions?: ChatAction[];
}

/** What the call needs to know about a product it shows: its link name and its name (to open it by voice). */
export interface CallProductRef {
  slug: string;
  name: string;
}

export interface VoiceCallOptions<P extends CallProductRef> {
  /** The voice files' folder on R2 (from chat status), or null: then only the Google voice is used. */
  base: string | null;
  /** The voice model file in that folder Super Admin chose (chat status `voiceModel`). */
  model?: string;
  storeName: string;
  /** What the call says first (the store's own, Bangla only); empty = the built-in greeting with the store name. */
  greeting?: string | null;
  /** Speaking speed: 1 = normal (the store's choice: slow 0.85, fast 1.15). */
  speed?: number;
  /**
   * Sends what the shopper said as a chat message (voice mode) and returns the assistant's reply. `live` hears the
   * reply's finished pieces while it is still being written (POST chat/stream), so the call starts speaking early.
   */
  send: (text: string, signal: AbortSignal, live: ChatLive) => Promise<VoiceTurn<P>>;
  /** Puts the spoken greeting into the chat too, so the AI knows it already greeted. */
  onGreeting?: (text: string) => void;
  /**
   * "I want to search with a photo": the call never opens a camera of its own (the user's rule, 2026-10-27). The
   * assistant asks the shopper to use the store search's own photo button, and this makes that button stand out. The
   * search's results then come back through `photoFound`.
   */
  photoHint?: () => void;
  /** Opens a product's page in this tab ("পণ্যটা খুলে দেখাও", or a product the assistant talks about). */
  onOpenProduct?: (slug: string) => void;
  /**
   * Moves the shopper's own page: the store search with these words, the list of products the assistant is showing
   * (`picks`, the store's results page), or one page back.
   */
  navigate?: { search: (query: string) => void; picks: (slugs: string[]) => void; back: () => void };
  /**
   * The store's slide-in cart: "কার্ট দেখাও" opens it, "কার্ট বন্ধ করো" closes it. `show` returns the line to say (what is
   * in it); `isOpen` tells whether it is open now.
   */
  cart?: { show: (open: boolean) => string; isOpen: () => boolean };
  /**
   * The checkout form (the user's request, 2026-10-27): the assistant opens it when the shopper wants to buy, fills it
   * as the details are said (the template does that from the order), and closes it when they cancel. The shopper still
   * presses Place order themselves.
   */
  checkout?: { open: () => void; close: () => void };
}

const MIN_RING_MS = 3600; // about one ring, even when the voice is ready at once
const MAX_RING_MS = 14000; // then the call connects anyway, on the Google voice
// Seconds of work per second of speech above which this device uses Google's voice (a little headroom below 1: the
// next sentence is made while one plays, and the phone is doing other work too).
const MAX_PIPER_RTF = 0.85;
const SILENCE_MS = 20000;
// No part of the answer has come by then: a line about what the shopper asked (fillers.ts), then "almost ready" lines.
const FIRST_FILLER_MS = 1100;
const STILL_FILLER_MS = 4000;
const MAX_FILLERS = 3;
const ECHO_TAIL_MS = 1500;
// Speech whose first words came this long after the assistant's voice stopped is the shopper's own, whatever it says.
const ECHO_START_GRACE_MS = 600;
// Phones: listening starts again this long after the assistant's voice stops (the speaker's last sound dies away).
const HOLD_RELEASE_MS = 350;

/** What is left of the finished reply after the pieces already spoken (compared without spaces, since pieces are trimmed). */
function remainderAfter(full: string, said: string): string {
  if (!said) return full;
  const target = said.replace(/\s+/g, '').length;
  let count = 0;
  let i = 0;
  for (; i < full.length && count < target; i++) if (!/\s/.test(full[i])) count++;
  return full.slice(i).trim();
}
/** 0.1 s of silence as a WAV, played during the tap so the browser lets the <audio> element play later (iPhone). */
function silentWavUrl(): string {
  const rate = 8000;
  const samples = 800;
  const v = new DataView(new ArrayBuffer(44 + samples * 2));
  const text = (at: number, s: string) => [...s].forEach((c, i) => v.setUint8(at + i, c.charCodeAt(0)));
  text(0, 'RIFF');
  v.setUint32(4, 36 + samples * 2, true);
  text(8, 'WAVE');
  text(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, rate, true);
  v.setUint32(28, rate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  text(36, 'data');
  v.setUint32(40, samples * 2, true);
  return URL.createObjectURL(new Blob([v.buffer], { type: 'audio/wav' }));
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * A phone or tablet: speaker and microphone are inches apart and Chrome's speech recognition (Android especially) does
 * no echo cancellation, so its own voice comes back as words. Then the call talks in turns instead of over each other.
 */
function isHalfDuplexDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  if (/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)) return true;
  // iPadOS reports itself as a Mac.
  return navigator.maxTouchPoints > 1 && typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
}

function lowEndDevice(): boolean {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean; effectiveType?: string } };
  if (nav.connection?.saveData) return true;
  if (nav.connection?.effectiveType && /(^|-)2g$/.test(nav.connection.effectiveType)) return true;
  return !!nav.deviceMemory && nav.deviceMemory <= 2;
}

export function useVoiceCall<P extends CallProductRef>(options: VoiceCallOptions<P>) {
  const opts = useRef(options);
  opts.current = options;

  const [phase, setPhaseState] = useState<CallPhase>('idle');
  const [talk, setTalkState] = useState<TalkState>('listening');
  const [seconds, setSeconds] = useState(0);
  const [muted, setMutedState] = useState(false);
  // The last two caption lines, oldest first (the shopper's words and the assistant's answer, in the order they came).
  const [lines, setLines] = useState<CallLine[]>([]);
  const caption = (who: CallLine['who'], text: string) =>
    setLines((prev) => {
      const last = prev[prev.length - 1];
      return (last?.who === who ? [...prev.slice(0, -1), { who, text }] : [...prev, { who, text }]).slice(-2);
    });
  const [products, setProductsState] = useState<P[]>([]);
  const productsRef = useRef<P[]>([]);
  const setProducts = (list: P[]) => {
    productsRef.current = list;
    setProductsState(list);
  };
  // The call is only a chat head over the real store (the user's rule, 2026-10-27): what the assistant shows goes on the
  // page itself. The products last put on the page, so the same ones aren't opened again on every answer.
  const shownKeyRef = useRef('');
  const [engine, setEngine] = useState<VoiceEngine>('piper');
  const [loadPct, setLoadPct] = useState<number | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [lang, setLangState] = useState<'bn-BD' | 'en-US'>('bn-BD');

  const phaseRef = useRef<CallPhase>('idle');
  const talkRef = useRef<TalkState>('listening');
  const mutedRef = useRef(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const voiceRef = useRef<VoiceOutLike | null>(null);
  const inputRef = useRef<SpeechInput | null>(null);
  const stopRingRef = useRef<(() => void) | null>(null);
  // Inside the app: stops listening for "hangup" (the app ended the call: its notification, its call bar, or a minute away from the app).
  const appHangRef = useRef<(() => void) | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Counts turns: an older turn's answer that arrives late (the shopper already cut in and asked again) is never spoken.
  const turnSeqRef = useRef(0);
  const pendingRef = useRef('');
  // The words the assistant is saying or just said; endedAt = when its voice stopped (Infinity while it plays), until = endedAt + the echo tail.
  const spokenRef = useRef<{ words: Set<string>; until: number; endedAt: number }>({ words: new Set(), until: 0, endedAt: 0 });
  const voiceEnded = () => {
    const now = performance.now();
    spokenRef.current.endedAt = now;
    spokenRef.current.until = now + ECHO_TAIL_MS;
  };
  const timersRef = useRef<{ clock?: ReturnType<typeof setInterval>; silence?: ReturnType<typeof setTimeout> }>({});
  const nudgedRef = useRef(false);
  const errorsRef = useRef(0);
  const heardAtRef = useRef(0);
  const wakeRef = useRef<{ release(): Promise<void> } | null>(null);
  const callIdRef = useRef(0);
  const halfDuplexRef = useRef(false);
  // How many assistant lines are playing now (a filler and the reply can overlap by a moment).
  const holdCountRef = useRef(0);
  /** Phones: no listening while the assistant's voice plays. */
  const holdListening = () => {
    if (!halfDuplexRef.current) return;
    holdCountRef.current++;
    inputRef.current?.hold(true);
  };
  /** Phones: listening again once no line is playing (shortly after, or at once when the shopper stopped it). */
  const releaseListening = (now = false) => {
    if (!halfDuplexRef.current) return;
    holdCountRef.current = Math.max(0, holdCountRef.current - 1);
    if (holdCountRef.current > 0) return;
    const go = () => {
      if (holdCountRef.current === 0) inputRef.current?.hold(false);
    };
    if (now) go();
    else setTimeout(go, HOLD_RELEASE_MS);
  };

  const setPhase = (p: CallPhase) => {
    phaseRef.current = p;
    setPhaseState(p);
  };
  const setTalk = (t: TalkState) => {
    talkRef.current = t;
    setTalkState(t);
  };
  const live = (id: number) => callIdRef.current === id && phaseRef.current === 'connected';

  /** Heard words that are mostly the assistant's own words coming back through the speaker. */
  const isEcho = (text: string, startedAt: number): boolean => {
    const { words, until, endedAt } = spokenRef.current;
    const soundingNow = talkRef.current === 'speaking' || endedAt === Infinity;
    if (!soundingNow) {
      if (performance.now() > until) return false;
      // Began after the voice stopped: the shopper's own answer, even when it repeats the assistant's words
      // ("এম সাইজ, সাদা" right after "সাইজ এম না এল, রং সাদা না নেভি?").
      if (startedAt > endedAt + ECHO_START_GRACE_MS) return false;
    }
    const heardWords = speechWords(text);
    if (!heardWords.length) return true;
    const known = [...words];
    const matched = heardWords.filter((w) => words.has(w) || (w.length >= 3 && known.some((s) => s.startsWith(w) || w.startsWith(s))));
    // While the assistant's voice is playing, a garbled copy of it can come back with a word or two that don't match:
    // cutting in then needs at least two words of the shopper's own.
    if (soundingNow && heardWords.length - matched.length < 2) return true;
    return matched.length / heardWords.length >= 0.6;
  };

  const clearSilence = () => {
    if (timersRef.current.silence) clearTimeout(timersRef.current.silence);
    timersRef.current.silence = undefined;
  };

  /** Ends the call. `keepOpen`: the ended screen stays (with `problem`) until close(). */
  const hangUp = useCallback((keepOpen = false) => {
    if (phaseRef.current === 'idle' || phaseRef.current === 'ended') return;
    callIdRef.current++;
    appHangRef.current?.();
    appHangRef.current = null;
    stopRingRef.current?.();
    stopRingRef.current = null;
    inputRef.current?.stop();
    inputRef.current = null;
    voiceRef.current?.dispose();
    voiceRef.current = null;
    abortRef.current?.abort();
    clearSilence();
    if (timersRef.current.clock) clearInterval(timersRef.current.clock);
    void wakeRef.current?.release().catch(() => undefined);
    wakeRef.current = null;
    idlePiper();
    const ctx = ctxRef.current;
    if (ctx) playHangup(ctx);
    setPhase('ended');
    setTimeout(() => {
      void ctx?.close().catch(() => undefined);
      if (ctxRef.current === ctx) ctxRef.current = null;
      if (!keepOpen && phaseRef.current === 'ended') setPhase('idle');
    }, 1600);
  }, []);

  const close = useCallback(() => {
    if (phaseRef.current === 'ended') setPhase('idle');
  }, []);

  // Speaks one assistant line; back to listening when it's done (unless the shopper cut in).
  const speak = async (id: number, raw: string, then?: () => void) => {
    const voice = voiceRef.current;
    if (!voice || !live(id)) return;
    const speakable = speakableBangla(raw);
    spokenRef.current = { words: new Set([...speechWords(raw), ...speechWords(speakable)]), until: Infinity, endedAt: Infinity };
    caption('assistant', raw);
    setTalk('speaking');
    holdListening();
    // What the shopper is saying right now is kept (they may have started just as this began); the assistant's own
    // voice coming back is caught by isEcho instead.
    const done = await voice.speak(speakable);
    voiceEnded();
    // Stopped (the shopper pressed stop, or something else is said instead): listen again at once.
    releaseListening(!done);
    if (!live(id) || !done) return;
    // What was heard while it spoke (and nobody cut in) was its own voice: dropped, so it can't join the shopper's answer.
    inputRef.current?.clear();
    setTalk('listening');
    if (then) then();
    else armSilence(id);
  };

  const armSilence = (id: number) => {
    clearSilence();
    timersRef.current.silence = setTimeout(() => {
      if (!live(id) || talkRef.current !== 'listening' || mutedRef.current) return;
      if (performance.now() - heardAtRef.current < SILENCE_MS / 2) return armSilence(id);
      if (!nudgedRef.current) {
        nudgedRef.current = true;
        void speak(id, 'হ্যালো, আমার কথা শুনতে পাচ্ছেন?');
      } else {
        void speak(id, 'ঠিক আছে, কিছু লাগলে আবার কল করবেন। ধন্যবাদ!', () => hangUp());
      }
    }, nudgedRef.current ? 15000 : SILENCE_MS);
  };

  // One shopper turn. The answer is streamed (POST chat/stream): each finished sentence is spoken as soon as it arrives,
  // so the first words come while the rest is still being written. Until then, natural lines about what was asked fill
  // the wait (fillers.ts), and a line about the lookup when the AI checks something (delivery, an order...). Fillers and
  // the answer go through one VoiceStream, so they never talk over each other: the answer follows the line being said.
  // `openAfter`: the shopper asked to open a product the call couldn't pick by itself; the AI's answer names it.
  const turn = async (id: number, text: string, openAfter = false) => {
    if (!live(id)) return;
    clearSilence();
    nudgedRef.current = false;
    caption('shopper', text);
    setTalk('thinking');
    const ac = new AbortController();
    abortRef.current = ac;
    const seq = ++turnSeqRef.current;
    // `cut`: the shopper stopped this turn's voice (cut in, or the stop button); the rest of its answer stays unspoken.
    const out: { stream: VoiceStream | null; cut: boolean } = { stream: null, cut: false };
    // Still this turn's to speak: the call goes on, no newer turn, not cut, and the shopper didn't keep talking.
    const mine = () => live(id) && seq === turnSeqRef.current && !ac.signal.aborted && !pendingRef.current && !out.cut;
    let answerStarted = false;
    let said = '';
    let fillers = 0;
    let toolSaid = false;
    const heard = new Set<string>();
    const addWords = (line: string, speakable: string) => {
      for (const w of [...speechWords(line), ...speechWords(speakable)]) heard.add(w);
    };
    const openOut = (): VoiceStream | null => {
      if (out.stream) return out.stream;
      const voice = voiceRef.current;
      if (!voice) return null;
      // Its sound coming back through the speaker must not count as the shopper talking.
      spokenRef.current = { words: heard, until: Infinity, endedAt: Infinity };
      holdListening();
      const s = voice.stream();
      out.stream = s;
      // Stopped before the end (barge-in, the stop button, a newer line): the microphone is given back at once, once.
      void s.done.then((ok) => {
        if (ok) return;
        out.cut = true;
        voiceEnded();
        releaseListening(true);
      });
      return s;
    };
    let stillTimer: ReturnType<typeof setInterval> | undefined;
    let firstTimer: ReturnType<typeof setTimeout> | undefined;
    const stopFillers = () => {
      clearTimeout(firstTimer);
      clearInterval(stillTimer);
    };
    const sayFiller = (line: string | null) => {
      if (!line || answerStarted || fillers >= MAX_FILLERS || !mine()) return;
      const s = openOut();
      if (!s) return;
      fillers++;
      const speakable = speakableBangla(line);
      addWords(line, speakable);
      s.push(speakable);
    };
    const sayPiece = (piece: string) => {
      if (!mine() || openAfter) return;
      const s = openOut();
      if (!s) return;
      answerStarted = true;
      stopFillers();
      // The shopper may cut in from now on (barge-in), as on any spoken answer.
      setTalk('speaking');
      said = said ? `${said} ${piece}` : piece;
      caption('assistant', said);
      const speakable = speakableBangla(piece);
      addWords(piece, speakable);
      s.push(speakable);
    };
    firstTimer = setTimeout(() => {
      sayFiller(firstFiller(text));
      stillTimer = setInterval(() => sayFiller(stillFiller()), STILL_FILLER_MS);
    }, FIRST_FILLER_MS);
    const listeners: ChatLive = {
      onSay: sayPiece,
      onTool: (name) => {
        if (toolSaid) return;
        toolSaid = true;
        sayFiller(toolFiller(name));
      },
    };

    // Says `rest` after what the stream already holds, waits for it all, then listens again (or runs `then`).
    const finish = async (full: string, rest: string, then?: () => void) => {
      const s = out.stream!;
      if (rest) {
        const speakable = speakableBangla(rest);
        addWords(rest, speakable);
        s.push(speakable);
      }
      if (out.cut) return;
      caption('assistant', full);
      setTalk('speaking');
      s.end();
      // A cut stream already gave the microphone back (openOut).
      if (!(await s.done)) return;
      voiceEnded();
      releaseListening();
      if (!live(id)) return;
      // What was heard while it spoke (and nobody cut in) was its own voice: dropped, so it can't join the shopper's answer.
      inputRef.current?.clear();
      setTalk('listening');
      if (then) then();
      else armSilence(id);
    };
    // Cuts a filler still playing (the answer won't be spoken); openOut's handler gives the microphone back.
    const drop = () => {
      if (out.stream && !out.cut) voiceRef.current?.stop();
    };

    let result: VoiceTurn<P> | null = null;
    try {
      result = await opts.current.send(text, ac.signal, listeners);
      errorsRef.current = 0;
    } catch {
      if (ac.signal.aborted) return;
      errorsRef.current++;
    } finally {
      stopFillers();
    }
    if (!live(id) || ac.signal.aborted || seq !== turnSeqRef.current) return;
    // The shopper kept talking while we waited: answer that instead (this reply stays in the chat).
    if (pendingRef.current) {
      const next = pendingRef.current;
      pendingRef.current = '';
      drop();
      return turn(id, next);
    }
    if (!result) {
      const giveUp = errorsRef.current >= 2;
      const line = giveUp ? 'দুঃখিত, এই মুহূর্তে উত্তর দিতে পারছি না। একটু পরে আবার কল করবেন।' : 'দুঃখিত, একটু সমস্যা হলো। আরেকবার বলবেন?';
      const then = giveUp ? () => hangUp() : undefined;
      if (out.stream) return finish(line, line, then);
      return speak(id, line, then);
    }
    if (result.products.length) setProducts(result.products);
    // What the stream hasn't said yet: the whole reply when nothing of it came early.
    const rest = remainderAfter(result.reply, said);
    // Client-side tools: the AI decided what to do on the screen, the page does it, then the answer is spoken.
    let after: (() => void) | undefined;
    // The page was moved by an action (or the cart opened): this answer's products are not put on the page as well.
    let moved = false;
    for (const a of result.actions ?? []) {
      if (a.type === 'open_product') {
        const p = result.products.find((x) => x.slug === a.slug) ?? productsRef.current.find((x) => x.slug === a.slug);
        if (p) {
          if (!out.stream) return openProduct(id, p, result.reply);
          shownKeyRef.current = '';
          showOnSite([p]);
          return finish(result.reply, rest);
        }
      } else if (a.type === 'search') {
        opts.current.navigate?.search(a.query);
        shownKeyRef.current = '';
        moved = true;
      } else if (a.type === 'go_back') {
        opts.current.navigate?.back();
        shownKeyRef.current = '';
        moved = true;
      } else if (a.type === 'show_cart' && opts.current.cart) {
        opts.current.cart.show(true);
        moved = true;
      } else if (a.type === 'close_cart' && opts.current.cart) {
        opts.current.cart.show(false);
      } else if (a.type === 'open_checkout' && opts.current.checkout) {
        opts.current.checkout.open();
        moved = true;
      } else if (a.type === 'close_checkout' && opts.current.checkout) {
        opts.current.checkout.close();
      } else if (a.type === 'photo_search') {
        opts.current.photoHint?.();
      } else if (a.type === 'hang_up') {
        after = () => hangUp();
      }
    }
    if (openAfter && result.products.length) {
      if (!out.stream) return openProduct(id, result.products[0], result.reply);
      shownKeyRef.current = '';
      showOnSite([result.products[0]]);
      return finish(result.reply, rest);
    }
    if (!moved && result.products.length) showOnSite(result.products);
    if (out.stream) return finish(result.reply, rest, after);
    await speak(id, result.reply, after);
  };

  /**
   * After the greeting, while the call is quiet, the filler lines are made ahead (VoiceOut.prepare), so the first line of
   * a wait plays at once. It waits whenever the assistant is thinking or talking: the voice worker does one job at a
   * time, and a reply must not queue behind this.
   */
  const prepareFillers = async (id: number) => {
    for (const line of linesToPrepare()) {
      while (live(id) && talkRef.current !== 'listening') await sleep(800);
      if (!live(id)) return;
      await voiceRef.current?.prepare(speakableBangla(line));
    }
  };

  /**
   * The products the assistant talks about go on the shopper's real page: one opens its page, several are listed on the
   * store's results page. The same products are not put on the page again (the AI repeats its cards while it talks).
   */
  const showOnSite = (list: P[]) => {
    const key = list.map((p) => p.slug).join(',');
    if (!key || key === shownKeyRef.current) return;
    shownKeyRef.current = key;
    if (list.length === 1) opts.current.onOpenProduct?.(list[0].slug);
    else opts.current.navigate?.picks(list.map((p) => p.slug));
  };

  // "ছবি দিয়ে খুঁজব": the store search's own photo button (the call opens no camera of its own).
  const askForPhoto = (id: number) => {
    if (!live(id)) return;
    opts.current.photoHint?.();
    void speak(id, 'অবশ্যই। উপরের সার্চ বক্সের পাশে ক্যামেরার বাটনে চাপুন, তারপর ছবিটা দিন। আমি দেখে বলছি।');
  };

  /**
   * The store's photo search finished during the call (the shopper used the search's photo button). Its results are
   * already on the page (the search's own results); the call says what it found, and "এটা নেব" works on them.
   */
  const photoFound = (found: P[]) => {
    const id = callIdRef.current;
    if (!live(id)) return;
    clearSilence();
    voiceRef.current?.stop();
    caption('shopper', 'ছবি দিলাম');
    setProducts(found);
    shownKeyRef.current = found.map((p) => p.slug).join(',');
    const n = found.length;
    void speak(
      id,
      n === 1
        ? `মনে হচ্ছে এটা ${found[0].name}। স্ক্রিনে দেখাচ্ছি, নিতে চাইলে সাইজ বা কয়টা লাগবে বলুন।`
        : n > 1
          ? `ছবির মতো ${n}টা পণ্য পেয়েছি, স্ক্রিনে দেখাচ্ছি। কোনটা চান বলুন।`
          : 'হুবহু এই পণ্যটা আমাদের দোকানে পাইনি। কী খুঁজছেন মুখে বলুন, আমি দেখছি।',
    );
  };

  // Opens a product's page in this tab (the call keeps going: the widget lives in the store layout).
  // `say`: the AI's own answer, spoken instead of the fixed line.
  const openProduct = async (id: number, p: P, say?: string) => {
    if (!live(id)) return;
    shownKeyRef.current = '';
    showOnSite([p]);
    await speak(id, say ?? `এই যে, ${p.name} এর পেজ খুলে দিলাম। কিছু জানতে চাইলে বলুন।`);
  };

  const onUtterance = (id: number, text: string, startedAt: number) => {
    if (!live(id) || mutedRef.current) return;
    if (isEcho(text, startedAt)) {
      inputRef.current?.clear();
      return;
    }
    if (wantsHangUp(text)) {
      caption('shopper', text);
      voiceRef.current?.stop();
      void speak(id, 'ঠিক আছে, কথা বলে ভালো লাগলো। কিছু লাগলে আবার কল করবেন, ধন্যবাদ!', () => hangUp());
      return;
    }
    const cart = opts.current.cart;
    if (cart && wantsCloseCart(text, cart.isOpen())) {
      caption('shopper', text);
      voiceRef.current?.stop();
      const line = cart.show(false);
      return void speak(id, line);
    }
    if (cart && wantsShowCart(text)) {
      caption('shopper', text);
      voiceRef.current?.stop();
      const line = cart.show(true);
      return void speak(id, line);
    }
    if (wantsBack(text) && opts.current.navigate) {
      caption('shopper', text);
      voiceRef.current?.stop();
      opts.current.navigate.back();
      return void speak(id, 'ঠিক আছে, আগের পেজে গেলাম।');
    }
    if (wantsOpen(text) && talkRef.current !== 'thinking') {
      caption('shopper', text);
      voiceRef.current?.stop();
      const shown = productsRef.current;
      const i = pickProduct(text, shown.map((p) => p.name));
      if (i >= 0) return void openProduct(id, shown[i]);
      return void turn(id, text, true);
    }
    if (opts.current.photoHint && wantsPhotoSearch(text)) {
      caption('shopper', text);
      voiceRef.current?.stop();
      return askForPhoto(id);
    }
    if (talkRef.current === 'thinking') {
      pendingRef.current = `${pendingRef.current} ${text}`.trim();
      caption('shopper', pendingRef.current);
      return;
    }
    if (talkRef.current === 'speaking') voiceRef.current?.stop();
    void turn(id, text);
  };

  const onHearing = (id: number, text: string, startedAt: number) => {
    if (!live(id) || mutedRef.current || isEcho(text, startedAt)) return;
    heardAtRef.current = performance.now();
    clearSilence();
    caption('shopper', text);
    // Barge-in: the shopper started talking over the assistant.
    if (talkRef.current === 'speaking' && speechWords(text).length >= 2) {
      voiceRef.current?.stop();
      voiceEnded();
      setTalk('listening');
    }
  };

  /** The "stop" button (phones, where talking over the assistant can't be heard): it stops and listens at once. */
  const interrupt = () => {
    if (phaseRef.current !== 'connected' || talkRef.current !== 'speaking') return;
    voiceRef.current?.stop();
    voiceEnded();
    inputRef.current?.clear();
    setTalk('listening');
    armSilence(callIdRef.current);
  };

  /** Must run inside the tap on the call button (browsers only allow sound and the microphone from a tap). */
  const start = useCallback(async () => {
    if (phaseRef.current !== 'idle') return;
    const id = ++callIdRef.current;
    const ctx = new AudioContext();
    void ctx.resume();
    ctxRef.current = ctx;
    const silence = silentWavUrl();
    const googleEls: [HTMLAudioElement, HTMLAudioElement] = [new Audio(), new Audio()];
    for (const el of googleEls) {
      el.src = silence;
      void el.play().catch(() => undefined);
    }

    setSeconds(0);
    setLines([]);
    setProducts([]);
    shownKeyRef.current = '';
    setProblem(null);
    setLoadPct(null);
    setMutedState((mutedRef.current = false));
    setTalk('listening');
    pendingRef.current = '';
    nudgedRef.current = false;
    errorsRef.current = 0;
    halfDuplexRef.current = isHalfDuplexDevice();
    holdCountRef.current = 0;
    setPhase('calling');

    // Inside the Regantify app the app itself listens and speaks (nativeVoice.ts, STORE-APP-plan.md Step 8): it asks for the microphone
    // by itself, and the phone's loudspeaker is next to its microphone, so the call holds listening while the assistant speaks.
    const nv = appVoice();
    const native = nv ? await nativeProbe(nv) : false;
    if (callIdRef.current !== id) return;
    if (native) halfDuplexRef.current = true;
    if (native && nv) {
      appHangRef.current = nv.on((e) => {
        if (e.ev === 'hangup' && callIdRef.current === id) hangUp();
      });
    }

    // Microphone permission first; the stream itself isn't kept (speech recognition opens its own).
    if (!native) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
        stream.getTracks().forEach((t) => t.stop());
      } catch {
        if (callIdRef.current !== id) return;
        setProblem('মাইক্রোফোন চালু করার অনুমতি দিন, তারপর আবার কল করুন।');
        hangUp(true);
        return;
      }
    }
    if (callIdRef.current !== id) return;

    const base = opts.current.base;
    const tryPiper = !native && !!base && !deviceIsSlow() && !lowEndDevice();
    // Super Admin's model if this browser has it, else the model it already has (kept until the new one has fully
    // downloaded in the background, voicePrefetch.ts), else the chosen one, downloaded now.
    if (tryPiper) setPiperModel(await chooseVoiceModel(base!, opts.current.model ?? 'model.onnx'));
    if (callIdRef.current !== id) return;
    const piper = tryPiper ? loadPiper(base!, (p) => setLoadPct(p)) : null;
    // Not an error for the shopper (the call goes on with Google's voice), but the reason helps whoever looks at the console.
    piper?.catch((e: Error) => console.warn(`[voice] Piper voice not used: ${e.message}`));

    await sleep(700);
    if (callIdRef.current !== id) return;
    setPhase('ringing');
    stopRingRef.current = startRingback(ctx);
    try {
      void (navigator as Navigator & { wakeLock?: { request(t: 'screen'): Promise<{ release(): Promise<void> }> } }).wakeLock
        ?.request('screen')
        .then((w) => (wakeRef.current = w))
        .catch(() => undefined);
    } catch {
      /* not supported */
    }

    // The app loads its own on-phone voice while the call rings; if that fails the app says the call with its other voices itself.
    const piperOk = native && nv ? nativeWarm(nv, MAX_RING_MS).then(() => true) : piper ? Promise.race([piper.then(() => true, () => false), sleep(MAX_RING_MS).then(() => false)]) : Promise.resolve(false);
    const [, loaded] = await Promise.all([sleep(MIN_RING_MS), piperOk]);
    if (callIdRef.current !== id) return;
    // The warm-up measured this device (piperWorker.ts): a phone that makes speech slower than it plays would leave
    // gaps and keep the phone busy, so the call starts on Google's voice instead, the voice worker is closed (its memory
    // goes back), and the next calls for 3 days skip it.
    const speed = native ? null : piperSpeed();
    const tooSlow = loaded && speed !== null && speed > MAX_PIPER_RTF;
    if (tooSlow) {
      console.warn(`[voice] this device makes speech at ${speed!.toFixed(2)}x real time: using Google's voice`);
      markSlow();
      stopPiper();
    }
    const ok = loaded && !tooSlow;

    stopRingRef.current?.();
    stopRingRef.current = null;
    playConnect(ctx);
    const first: VoiceEngine = ok ? 'piper' : 'google';
    setEngine(first);
    voiceRef.current = native && nv ? new NativeVoiceOut(nv) : new VoiceOut(ctx, googleEls, base, first, () => setEngine('google'));
    voiceRef.current.speed = opts.current.speed ?? 1;
    setPhase('connected');
    timersRef.current.clock = setInterval(() => setSeconds((s) => s + 1), 1000);

    const input = new SpeechInput(
      {
        onHearing: (t, s) => onHearing(id, t, s),
        onUtterance: (t, s) => onUtterance(id, t, s),
        onBlocked: (why) => {
          setProblem(why === 'denied' ? 'মাইক্রোফোন চালু করার অনুমতি দিন, তারপর আবার কল করুন।' : 'মাইক্রোফোন পাওয়া যাচ্ছে না।');
          hangUp(true);
        },
      },
      lang,
    );
    inputRef.current = input;
    input.start();

    await sleep(350);
    // It says it is an AI at once, so nobody takes it for a person.
    const greeting = opts.current.greeting?.trim() || `আসসালামু আলাইকুম! আমি ${opts.current.storeName}-এর এআই সহকারী। বলুন, কীভাবে সাহায্য করতে পারি?`;
    opts.current.onGreeting?.(greeting);
    await speak(id, greeting);
    void prepareFillers(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hangUp, lang]);

  const setMuted = (m: boolean) => {
    mutedRef.current = m;
    setMutedState(m);
    inputRef.current?.setPaused(m);
    if (m) clearSilence();
    else if (talkRef.current === 'listening') armSilence(callIdRef.current);
  };

  const setLang = (l: 'bn-BD' | 'en-US') => {
    setLangState(l);
    inputRef.current?.setLang(l);
  };

  /** 0..1 for the avatar: the assistant's loudness while it talks, a soft pulse while the shopper is heard. */
  const level = useCallback((): number => {
    if (talkRef.current === 'speaking') return voiceRef.current?.level() ?? 0;
    if (performance.now() - heardAtRef.current < 400) return 0.3 + 0.2 * Math.abs(Math.sin(performance.now() / 120));
    return 0;
  }, []);

  // Leaving the page (or the widget unmounting) ends the call.
  useEffect(() => () => hangUp(), [hangUp]);

  return {
    phase, talk, seconds, muted, setMuted, lines, products, engine, loadPct, problem, lang, setLang, start, hangUp, close, level,
    photoFound, askForPhoto: () => askForPhoto(callIdRef.current), canPhotoSearch: !!options.photoHint,
    openProduct: (p: P) => openProduct(callIdRef.current, p),
    interrupt, halfDuplex: halfDuplexRef.current,
  };
}

export type VoiceCall<P extends CallProductRef> = ReturnType<typeof useVoiceCall<P>>;
