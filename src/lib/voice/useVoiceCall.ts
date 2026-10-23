'use client';

/**
 * The store AI chat's voice call (2026-10-22): the shopper taps the call button, hears a phone ring while the Piper
 * voice loads, and then talks with the assistant as on a WhatsApp call. Theme-independent: a template only draws the
 * screen (components/voice/VoiceCallScreen.tsx) and passes its chat's send function.
 *
 * One turn: the browser's speech recognition hears the shopper (speechInput.ts) -> the chat's own send (the server's
 * normal chat route with `voice: true`, so it answers short and in Bangla letters, and the turn is kept in the chat) ->
 * the reply is made speakable (banglaSpeech.ts) and spoken (voiceOut.ts: Piper, or Google when Piper is late).
 *
 * What makes it feel like a call:
 *   - "Calling..." then "Ringing..." with a ring tone, a pick-up blip, a call timer and a hang-up tone;
 *   - the assistant greets first;
 *   - the shopper can cut in: as soon as two words are heard that aren't the assistant's own voice coming back through
 *     the speaker (isEcho), it stops talking. On a phone (halfDuplex) the microphone hears the loudspeaker far too well
 *     for that, so listening is held while the assistant speaks and the shopper cuts in with the "stop" button;
 *   - a short "let me check" if the answer takes a moment;
 *   - "can you hear me?" after a long silence, then a polite goodbye;
 *   - the screen stays on during the call.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { speakableBangla, speechWords } from './banglaSpeech';
import { playConnect, playHangup, startRingback } from './callSounds';
import { SpeechInput } from './speechInput';
import { idlePiper, loadPiper } from './piperVoice';
import { deviceIsSlow, VoiceOut, type VoiceEngine } from './voiceOut';
import { pickProduct, wantsBack, wantsCloseCart, wantsHangUp, wantsOpen, wantsPhotoSearch, wantsShowCart } from './voiceIntents';
import type { ChatAction } from '../chatApi';

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
  storeName: string;
  /** Sends what the shopper said as a chat message (voice mode) and returns the assistant's reply. */
  send: (text: string, signal: AbortSignal) => Promise<VoiceTurn<P>>;
  /** Puts the spoken greeting into the chat too, so the AI knows it already greeted. */
  onGreeting?: (text: string) => void;
  /**
   * The shopper's photo -> the store's products it looks like (the chat's free picture match, no AI). When given, "I
   * want to search with a photo" opens the camera in the call.
   */
  photoSearch?: (file: File) => Promise<{ products: P[]; names: string[] }>;
  /** Opens a product's page in this tab ("পণ্যটা খুলে দেখাও", or the card's button); the call shrinks to its top bar. */
  onOpenProduct?: (slug: string) => void;
  /** Moves the shopper's own page: the store search with these words, or one page back. */
  navigate?: { search: (query: string) => void; back: () => void };
  /**
   * The store's slide-in cart: "কার্ট দেখাও" opens it (the call shrinks to its top bar so the cart can be seen), "কার্ট বন্ধ
   * করো" closes it. `show` returns the line to say (what is in it); `isOpen` tells whether it is open now.
   */
  cart?: { show: (open: boolean) => string; isOpen: () => boolean };
}

const MIN_RING_MS = 3600; // about one ring, even when the voice is ready at once
const MAX_RING_MS = 14000; // then the call connects anyway, on the Google voice
const SILENCE_MS = 20000;
const FILLER_AFTER_MS = 1400;
const ECHO_TAIL_MS = 1500;
// Speech whose first words came this long after the assistant's voice stopped is the shopper's own, whatever it says.
const ECHO_START_GRACE_MS = 600;
// Phones: listening starts again this long after the assistant's voice stops (the speaker's last sound dies away).
const HOLD_RELEASE_MS = 350;
const FILLERS = ['আচ্ছা, একটু দেখছি।', 'হুম, এক সেকেন্ড।', 'ঠিক আছে, দেখে বলছি।'];
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
  // Small bar at the top instead of the full call screen, so a product page opened during the call can be seen.
  const [minimized, setMinimized] = useState(false);
  const [engine, setEngine] = useState<VoiceEngine>('piper');
  const [loadPct, setLoadPct] = useState<number | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [lang, setLangState] = useState<'bn-BD' | 'en-US'>('bn-BD');
  // The camera is open in the call for a photo search (components/voice/CallCamera.tsx draws it).
  const [camera, setCameraState] = useState(false);
  const cameraRef = useRef(false);
  const setCamera = (open: boolean) => {
    cameraRef.current = open;
    setCameraState(open);
  };

  const phaseRef = useRef<CallPhase>('idle');
  const talkRef = useRef<TalkState>('listening');
  const mutedRef = useRef(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const voiceRef = useRef<VoiceOut | null>(null);
  const inputRef = useRef<SpeechInput | null>(null);
  const stopRingRef = useRef<(() => void) | null>(null);
  const abortRef = useRef<AbortController | null>(null);
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
    setCamera(false);
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

  // `openAfter`: the shopper asked to open a product the call couldn't pick by itself; the AI's answer names it.
  const turn = async (id: number, text: string, openAfter = false) => {
    if (!live(id)) return;
    clearSilence();
    nudgedRef.current = false;
    caption('shopper', text);
    setTalk('thinking');
    const ac = new AbortController();
    abortRef.current = ac;

    // "Let me check" when the answer takes a moment; the reply waits for it to finish instead of cutting it.
    let filler: Promise<unknown> | null = null;
    const fillerTimer = setTimeout(() => {
      if (live(id) && talkRef.current === 'thinking' && Math.random() < 0.7) {
        const line = FILLERS[Math.floor(Math.random() * FILLERS.length)];
        // Its sound coming back through the speaker must not count as the shopper talking.
        spokenRef.current = { words: new Set(speechWords(line)), until: Infinity, endedAt: Infinity };
        holdListening();
        filler =
          voiceRef.current?.speak(speakableBangla(line)).finally(() => {
            voiceEnded();
            releaseListening();
          }) ?? null;
      }
    }, FILLER_AFTER_MS);

    let result: VoiceTurn<P> | null = null;
    try {
      result = await opts.current.send(text, ac.signal);
      errorsRef.current = 0;
    } catch {
      if (ac.signal.aborted) return;
      errorsRef.current++;
    } finally {
      clearTimeout(fillerTimer);
    }
    if (!live(id) || ac.signal.aborted) return;
    if (filler) await Promise.race([filler, sleep(2500)]);
    if (!live(id)) return;
    // The shopper opened the camera while this answer was on its way: it stays in the chat, unspoken.
    if (cameraRef.current) return;

    // The shopper kept talking while we waited: answer that instead (this reply stays in the chat).
    if (pendingRef.current) {
      const next = pendingRef.current;
      pendingRef.current = '';
      return turn(id, next);
    }
    if (!result) {
      if (errorsRef.current >= 2) return speak(id, 'দুঃখিত, এই মুহূর্তে উত্তর দিতে পারছি না। একটু পরে আবার কল করবেন।', () => hangUp());
      return speak(id, 'দুঃখিত, একটু সমস্যা হলো। আরেকবার বলবেন?');
    }
    if (result.products.length) setProducts(result.products);
    // Client-side tools: the AI decided what to do on the screen, the page does it, then the answer is spoken.
    let after: (() => void) | undefined;
    for (const a of result.actions ?? []) {
      if (a.type === 'open_product') {
        const p = result.products.find((x) => x.slug === a.slug) ?? productsRef.current.find((x) => x.slug === a.slug);
        if (p) return openProduct(id, p, result.reply);
      } else if (a.type === 'search') {
        opts.current.navigate?.search(a.query);
        setMinimized(true);
      } else if (a.type === 'go_back') {
        opts.current.navigate?.back();
      } else if (a.type === 'show_cart' && opts.current.cart) {
        opts.current.cart.show(true);
        setMinimized(true);
      } else if (a.type === 'close_cart' && opts.current.cart) {
        opts.current.cart.show(false);
        setMinimized(false);
      } else if (a.type === 'photo_search' && opts.current.photoSearch) {
        after = () => openCamera(id);
      } else if (a.type === 'hang_up') {
        after = () => hangUp();
      }
    }
    if (openAfter && result.products.length) return openProduct(id, result.products[0], result.reply);
    await speak(id, result.reply, after);
  };

  // Photo search: the camera opens in the call (a page may open the camera without a tap, but not the file picker).
  // Listening pauses while it is open, so the camera's moment of silence isn't taken as "nothing said".
  const openCamera = (id: number) => {
    if (!live(id)) return;
    clearSilence();
    voiceRef.current?.stop();
    inputRef.current?.setPaused(true);
    setCamera(true);
    void speak(id, 'ঠিক আছে, ক্যামেরা খুলছি। পণ্যটা ক্যামেরার সামনে ধরুন, আমি ছবি তুলে নিচ্ছি।', () => undefined);
  };
  const resumeListening = () => {
    inputRef.current?.setPaused(mutedRef.current);
  };
  const cancelCamera = () => {
    const id = callIdRef.current;
    setCamera(false);
    resumeListening();
    void speak(id, 'ঠিক আছে। কী খুঁজছেন মুখে বলুন, আমি দেখছি।');
  };
  const submitPhoto = async (file: File) => {
    const id = callIdRef.current;
    setCamera(false);
    voiceRef.current?.stop();
    if (!live(id) || !opts.current.photoSearch) return;
    setTalk('thinking');
    caption('shopper', '📷 ছবি পাঠালাম');
    let found: { products: P[]; names: string[] } = { products: [], names: [] };
    try {
      found = await opts.current.photoSearch(file);
    } catch {
      /* answered below as "not found" */
    }
    if (!live(id)) return;
    resumeListening();
    if (found.products.length) setProducts(found.products);
    const n = found.names.length;
    await speak(
      id,
      n === 1
        ? `মনে হচ্ছে এটা ${found.names[0]}। স্ক্রিনে দেখাচ্ছি, নিতে চাইলে সাইজ বা কয়টা লাগবে বলুন।`
        : n > 1
          ? `ছবির মতো ${String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)])}টা পণ্য পেয়েছি, স্ক্রিনে দেখাচ্ছি। কোনটা চান বলুন।`
          : 'হুবহু এই পণ্যটা আমাদের দোকানে পাইনি। কী খুঁজছেন মুখে বলুন, আমি দেখছি।',
    );
  };

  // Opens a product's page in this tab (the call keeps going: the widget lives in the store layout) and shrinks the call
  // to its top bar so the page can be seen. `say`: the AI's own answer, spoken instead of the fixed line.
  const openProduct = async (id: number, p: P, say?: string) => {
    if (!live(id)) return;
    opts.current.onOpenProduct?.(p.slug);
    setMinimized(true);
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
      setMinimized(false);
      return void speak(id, line);
    }
    if (cart && wantsShowCart(text)) {
      caption('shopper', text);
      voiceRef.current?.stop();
      const line = cart.show(true);
      setMinimized(true);
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
    if (opts.current.photoSearch && wantsPhotoSearch(text)) {
      caption('shopper', text);
      return openCamera(id);
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
    setMinimized(false);
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

    // Microphone permission first; the stream itself isn't kept (speech recognition opens its own).
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      if (callIdRef.current !== id) return;
      setProblem('মাইক্রোফোন চালু করার অনুমতি দিন, তারপর আবার কল করুন।');
      hangUp(true);
      return;
    }
    if (callIdRef.current !== id) return;

    const base = opts.current.base;
    const tryPiper = !!base && !deviceIsSlow() && !lowEndDevice();
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

    const piperOk = piper ? Promise.race([piper.then(() => true, () => false), sleep(MAX_RING_MS).then(() => false)]) : Promise.resolve(false);
    const [, ok] = await Promise.all([sleep(MIN_RING_MS), piperOk]);
    if (callIdRef.current !== id) return;

    stopRingRef.current?.();
    stopRingRef.current = null;
    playConnect(ctx);
    const first: VoiceEngine = ok ? 'piper' : 'google';
    setEngine(first);
    voiceRef.current = new VoiceOut(ctx, googleEls, base, first, () => setEngine('google'));
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
    const greeting = `আসসালামু আলাইকুম! ${opts.current.storeName} থেকে বলছি। বলুন, কীভাবে সাহায্য করতে পারি?`;
    opts.current.onGreeting?.(greeting);
    await speak(id, greeting);
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
    camera, cancelCamera, submitPhoto, openCamera: () => openCamera(callIdRef.current), canPhotoSearch: !!options.photoSearch,
    minimized, setMinimized, openProduct: (p: P) => openProduct(callIdRef.current, p),
    interrupt, halfDuplex: halfDuplexRef.current,
  };
}

export type VoiceCall<P extends CallProductRef> = ReturnType<typeof useVoiceCall<P>>;
