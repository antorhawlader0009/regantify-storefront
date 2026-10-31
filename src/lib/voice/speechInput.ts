/**
 * The shopper's voice -> text, with the browser's own speech recognition (Web Speech API: Chrome, Edge, Samsung
 * Internet, Safari). It is free, starts at once and streams words while the shopper is still talking, and Google's
 * Bangla model behind it ("bn-BD") also writes the English words people mix in. A model running fully inside the page
 * (Whisper and the like) is hundreds of MB for usable Bangla and several seconds per sentence on a phone, so it isn't
 * used. Firefox has no speech recognition: the call button is hidden there (voiceCallSupported).
 *
 * On a computer recognition runs for the whole call, also while the assistant speaks, so the shopper can cut in. On a
 * phone the loudspeaker sits next to the microphone and the browser's recognition has no echo cancellation, so the
 * assistant's own voice came back as the shopper's words: there the call holds listening while it speaks (hold()).
 * Browsers end a session after a pause or a minute; it is started again by itself until stop().
 *
 * An utterance is handed over once the shopper has paused for END_PAUSE_MS after a final result (or for
 * INTERIM_PAUSE_MS with only words in progress, for browsers that are slow to finalise).
 */

import { appVoice, NativeRecognition } from './nativeVoice';

interface RecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
export interface RecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<RecognitionResultLike>;
}
export interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: RecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  onspeechstart: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
export type RecognitionCtor = new () => Recognition;

export function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  // Inside the Regantify app the app's own speech recognition does the listening (nativeVoice.ts, STORE-APP-plan.md Step 8).
  if (appVoice()) return NativeRecognition;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** The call needs speech recognition, a microphone and WebAudio. */
export function voiceCallSupported(): boolean {
  // The app listens and speaks by itself: it needs neither the web view's microphone nor WebAudio.
  if (typeof window !== 'undefined' && appVoice()) return true;
  return !!recognitionCtor() && typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof AudioContext !== 'undefined';
}

const END_PAUSE_MS = 700;
const INTERIM_PAUSE_MS = 1600;
const UNFINISHED_PAUSE_MS = 1600;
// A phone number being said: people say it in groups and pause between them ("০১৭১২ ... ৩৪৫ ... ৬৭৮"), and a shopper
// reading it off a slip pauses longer. Until all its digits are heard, the turn waits this long after each group.
const PHONE_PAUSE_MS = 4000;

// Words a sentence doesn't end on: hearing one last means the shopper is still thinking, not done.
const UNFINISHED_WORDS = new Set(
  [
    'আর', 'এবং', 'কিন্তু', 'মানে', 'যে', 'বা', 'অথবা', 'তারপর', 'তাহলে', 'উম', 'উমম', 'এই', 'ওই', 'আমার', 'আমি', 'একটা', 'কয়টা', 'যদি', 'সাথে', 'জন্য',
    'and', 'but', 'or', 'so', 'um', 'uh', 'the', 'a', 'my', 'with', 'for', 'if',
  ].map((w) => w.normalize('NFC')),
);
const DIGIT_WORD = /^([0-9০-৯]+|শূন্য|এক|দুই|তিন|চার|পাঁচ|ছয়|সাত|আট|নয়|ডাবল|zero|one|two|three|four|five|six|seven|eight|nine|double)$/u;

/** Spoken digit words, Bangla and English (as the browser writes them), to their digit. */
const DIGIT_OF: Record<string, string> = {
  শূন্য: '0', জিরো: '0', zero: '0', এক: '1', ওয়ান: '1', one: '1', দুই: '2', টু: '2', two: '2', তিন: '3', থ্রি: '3', three: '3',
  চার: '4', ফোর: '4', four: '4', পাঁচ: '5', ফাইভ: '5', five: '5', ছয়: '6', সিক্স: '6', six: '6', সাত: '7', সেভেন: '7', seven: '7',
  আট: '8', এইট: '8', eight: '8', নয়: '9', নাইন: '9', nine: '9',
};
const REPEAT_OF: Record<string, number> = { ডাবল: 2, double: 2, ট্রিপল: 3, triple: 3 };

/**
 * The digits of a phone number in what was heard so far: digits written as digits (Bangla or Latin), spoken digit words
 * and "ডাবল ৫" / "double five". Only a run that looks like a phone number counts: it starts with 0 or 88, or the
 * shopper said "নাম্বার", "ফোন", "মোবাইল", "number", "phone", so a price ("১২০০ টাকা") or a count is never mistaken for one.
 */
export function spokenPhoneDigits(text: string): string {
  const words = text.normalize('NFC').toLowerCase().replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d))).split(/[\s,।.?!+\-]+/u).filter(Boolean);
  let digits = '';
  let repeat = 1;
  for (const w of words) {
    if (REPEAT_OF[w]) {
      repeat = REPEAT_OF[w];
      continue;
    }
    const d = /^\d+$/.test(w) ? w : DIGIT_OF[w];
    if (d) digits += d.length === 1 ? d.repeat(repeat) : d;
    else if (digits.length >= 3) break; // the number ended (words after it, like "আমার নাম...")
    else digits = ''; // digits before other words were a count or a price, not the number
    repeat = 1;
  }
  const askedPhone = /নাম্বার|নম্বর|নাম্বারটা|ফোন|মোবাইল|number|phone|mobile/u.test(text.toLowerCase());
  return /^(0|88)/.test(digits) || (askedPhone && digits.length >= 3) ? digits : '';
}

/** A Bangladeshi mobile number has been started but not finished (under 11 digits, 13 with 88 in front). */
function phoneUnfinished(text: string): boolean {
  const digits = spokenPhoneDigits(text);
  if (digits.length < 2) return false;
  const need = digits.startsWith('88') ? 13 : 11;
  return digits.length < need;
}

/**
 * How long a pause ends the shopper's turn. A plain silence timer cuts people off mid-thought, so the words matter too
 * (the idea of "semantic endpointing"): a sentence ending on "and", "মানে", "আমার..." or a phone number being said in
 * groups ("০১৭১২ ... ৩৪৫") gets more time, a finished one is answered quickly.
 */
function pauseAfter(text: string, interim: boolean): number {
  // First, because the browser often writes "।" after a group of digits, which would otherwise look like a finished sentence.
  if (phoneUnfinished(text)) return PHONE_PAUSE_MS;
  const words = text.normalize('NFC').toLowerCase().replace(/[?।!.,]+$/u, '').split(/\s+/).filter(Boolean);
  const last = words[words.length - 1] ?? '';
  if (/[?।!]\s*$/u.test(text)) return END_PAUSE_MS;
  if (UNFINISHED_WORDS.has(last) || DIGIT_WORD.test(last)) return UNFINISHED_PAUSE_MS;
  return interim ? INTERIM_PAUSE_MS : END_PAUSE_MS;
}

export interface SpeechInputEvents {
  /** Words in progress (for the caption and for barge-in). */
  /** `startedAt`: when the first words of this utterance were heard (performance.now()), to tell an echo by its timing. */
  onHearing(text: string, startedAt: number): void;
  /** A finished utterance. */
  onUtterance(text: string, startedAt: number): void;
  /** The microphone was refused or is missing. */
  onBlocked(reason: 'denied' | 'no-mic' | 'no-service'): void;
}

export class SpeechInput {
  private rec: Recognition | null = null;
  private running = false;
  private paused = false;
  /** Held while the assistant speaks on a phone (separate from mute and the camera's pause). */
  private held = false;
  private finals = '';
  /** When the first words of the utterance being heard arrived (0 = none yet). */
  private startedAt = 0;
  private interim = '';
  private timer: ReturnType<typeof setTimeout> | null = null;
  private restarts = 0;

  constructor(
    private events: SpeechInputEvents,
    public lang = 'bn-BD',
  ) {}

  start() {
    this.running = true;
    this.paused = false;
    this.open();
  }

  /** Muted: nothing heard is used, and the browser stops listening. */
  setPaused(paused: boolean) {
    this.paused = paused;
    this.clear();
    if (paused) this.rec?.abort();
    else if (this.running) this.open();
  }

  /** Stops listening while the assistant's voice plays (phones), and starts again when it is released. */
  hold(on: boolean) {
    if (this.held === on) return;
    this.held = on;
    this.clear();
    if (on) this.rec?.abort();
    else if (this.running) this.open();
  }

  setLang(lang: string) {
    this.lang = lang;
    this.clear();
    this.rec?.abort(); // reopened by onend with the new language
  }

  /** Forget what was heard so far (it was the assistant's own voice, or it was already used). */
  clear() {
    this.finals = '';
    this.startedAt = 0;
    this.interim = '';
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  stop() {
    this.running = false;
    this.clear();
    const rec = this.rec;
    this.rec = null;
    if (rec) {
      rec.onend = null;
      rec.abort();
    }
  }

  private open() {
    if (!this.running || this.paused || this.held || this.rec) return;
    const Ctor = recognitionCtor();
    if (!Ctor) return this.events.onBlocked('no-mic');
    const rec = new Ctor();
    rec.lang = this.lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      if (this.paused || this.held) return;
      this.restarts = 0;
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) this.finals = `${this.finals} ${r[0].transcript}`.trim();
        else interim += r[0].transcript;
      }
      this.interim = interim.trim();
      const heard = `${this.finals} ${this.interim}`.trim();
      if (heard && !this.startedAt) this.startedAt = performance.now();
      if (heard) this.events.onHearing(heard, this.startedAt);
      if (this.timer) clearTimeout(this.timer);
      this.timer = setTimeout(() => this.flush(), pauseAfter(heard, !!this.interim));
    };
    rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        this.running = false;
        this.events.onBlocked('denied');
      } else if (e.error === 'no-service') {
        this.running = false;
        this.events.onBlocked('no-service');
      } else if (e.error === 'audio-capture') {
        this.running = false;
        this.events.onBlocked('no-mic');
      }
      // "no-speech", "network", "aborted": onend restarts it.
    };
    rec.onend = () => {
      if (this.rec === rec) this.rec = null;
      // A phone number half said when the browser ended the session on a pause (phones do that): keep what was heard and
      // listen again at once, so the rest of the number joins it; the pause timer still ends the turn if nothing comes.
      const heard = `${this.finals} ${this.interim}`.trim();
      const midNumber = !this.held && !!heard && phoneUnfinished(heard);
      if (midNumber) {
        // Interim words are not repeated by the next session, so they are kept as final.
        this.finals = heard;
        this.interim = '';
      } else if (!this.held && heard) {
        // Words heard just before the session ended are still an utterance.
        this.flush();
      }
      if (!this.running || this.paused || this.held) return;
      // A browser that ends at once every time (no network): back off instead of spinning (not mid-number: the shopper is talking).
      const wait = midNumber ? 0 : Math.min(2000, 100 * 2 ** this.restarts++);
      setTimeout(() => this.open(), wait);
    };
    this.rec = rec;
    try {
      rec.start();
    } catch {
      this.rec = null;
      setTimeout(() => this.open(), 300);
    }
  }

  private flush() {
    const text = `${this.finals} ${this.interim}`.replace(/\s+/g, ' ').trim();
    const startedAt = this.startedAt || performance.now();
    this.clear();
    if (text) this.events.onUtterance(text, startedAt);
  }
}
