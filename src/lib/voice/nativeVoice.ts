/**
 * The Regantify app's own voice for the AI call (STORE-APP-plan.md Step 8). Inside the app the page does NOT listen or speak itself: the app's
 * native code does. It listens with Android's speech recognition and speaks with the Piper voice run on the phone (ONNX Runtime), so the call
 * does not depend on the web view's microphone, on a 30 MB download per store or on a slow in-page voice.
 *
 * Everything else about the call stays in the page (the chat, the cart, the order card, the AI's actions, the fillers, the pause rules of
 * `SpeechInput`): the page only swaps two things, with the same shape as the browser's:
 *   - `NativeRecognition` stands in for the browser's SpeechRecognition (`recognitionCtor()` hands it out inside the app);
 *   - `NativeVoiceOut` stands in for `VoiceOut` (speak, stream, stop).
 *
 * The bridge is `window.RegantifyApp.voice`, which only the app puts there (web/Bridge.kt): `send(message)` to the app, `on(listener)` for
 * what the app says back. It exists only on pages of the one shop that is open. Messages are plain JSON; none carries anything secret.
 *
 * Page to app: probe, warm, rec-start {lang}, rec-abort, say {id, text, final}, prepare {text}, cut, config {speed}, end.
 * App to page: probe {ok}, ready {ok}, rec-result {resultIndex, results[{final, text}]}, rec-error {error}, rec-end,
 *              spoken-start {id}, spoken-end {id, ok}.
 */
import type { Recognition, RecognitionEventLike } from './speechInput';
import type { VoiceEngine, VoiceStream } from './voiceOut';

export type VoiceMessage = Record<string, unknown> & { ev?: string };

export interface AppVoiceBridge {
  send(message: Record<string, unknown>): void;
  /** Listens to what the app says; returns the function that stops listening. */
  on(listener: (event: VoiceMessage) => void): () => void;
}

/** The app's voice bridge, or null in a normal browser (and in an app too old to have it). */
export function appVoice(): AppVoiceBridge | null {
  if (typeof window === 'undefined') return null;
  const voice = (window as unknown as { RegantifyApp?: { voice?: AppVoiceBridge } }).RegantifyApp?.voice;
  return voice && typeof voice.send === 'function' && typeof voice.on === 'function' ? voice : null;
}

/** Asks the app whether it can listen (a speech recognition service is installed). False after 2 seconds of no answer. */
export function nativeProbe(bridge: AppVoiceBridge): Promise<boolean> {
  return new Promise((resolve) => {
    const off = bridge.on((e) => {
      if (e.ev !== 'probe') return;
      off();
      clearTimeout(timer);
      resolve(e.ok === true);
    });
    const timer = setTimeout(() => {
      off();
      resolve(false);
    }, 2000);
    bridge.send({ op: 'probe' });
  });
}

/** Makes the app load its voice (the on-phone model) while the call "rings". Resolves true when it is ready, false on a timeout or a failure. */
export function nativeWarm(bridge: AppVoiceBridge, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const off = bridge.on((e) => {
      if (e.ev !== 'ready') return;
      off();
      clearTimeout(timer);
      resolve(e.ok === true);
    });
    const timer = setTimeout(() => {
      off();
      resolve(false);
    }, timeoutMs);
    bridge.send({ op: 'warm' });
  });
}

/** The browser's SpeechRecognition, done by the app. `SpeechInput` uses it unchanged, so its pause rules (phone numbers, unfinished words) still apply. */
export class NativeRecognition implements Recognition {
  lang = 'bn-BD';
  continuous = true;
  interimResults = true;
  maxAlternatives = 1;
  onresult: ((e: RecognitionEventLike) => void) | null = null;
  onerror: ((e: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;
  onspeechstart: (() => void) | null = null;
  private off: (() => void) | null = null;

  start() {
    const bridge = appVoice();
    if (!bridge) {
      this.onerror?.({ error: 'audio-capture' });
      return;
    }
    this.off = bridge.on((e) => {
      if (e.ev === 'rec-result') {
        const list = (Array.isArray(e.results) ? e.results : []) as Array<{ final?: boolean; text?: string }>;
        this.onresult?.({
          resultIndex: typeof e.resultIndex === 'number' ? e.resultIndex : 0,
          results: list.map((r) => ({ isFinal: r.final === true, 0: { transcript: String(r.text ?? '') } })),
        });
      } else if (e.ev === 'rec-error') {
        this.onerror?.({ error: String(e.error ?? 'aborted') });
      } else if (e.ev === 'rec-end') {
        this.detach();
        this.onend?.();
      }
    });
    bridge.send({ op: 'rec-start', lang: this.lang });
  }

  stop() {
    appVoice()?.send({ op: 'rec-abort' });
  }

  abort() {
    appVoice()?.send({ op: 'rec-abort' });
  }

  private detach() {
    this.off?.();
    this.off = null;
  }
}

/** What the call needs of its voice: `VoiceOut` (the browser's) and `NativeVoiceOut` (the app's) both fit it. */
export interface VoiceOutLike {
  engine: VoiceEngine;
  speed: number;
  level(): number;
  stop(): void;
  speak(text: string, onStart?: () => void): Promise<boolean>;
  prepare(text: string): Promise<void>;
  stream(onStart?: () => void): VoiceStream;
  dispose(): void;
}

interface Playing {
  id: number;
  started: boolean;
  onStart?: () => void;
  resolve: (ok: boolean) => void;
}

let sayCounter = 0;

/** The assistant's voice made by the app: pieces of speakable Bangla go over the bridge, the app says them one after the other. */
export class NativeVoiceOut implements VoiceOutLike {
  engine: VoiceEngine = 'piper';
  private current: Playing | null = null;
  private speaking = false;
  private off: () => void;
  private pace = 1;

  constructor(private bridge: AppVoiceBridge) {
    this.off = bridge.on((e) => {
      const cur = this.current;
      if (!cur || e.id !== cur.id) return;
      if (e.ev === 'spoken-start') {
        this.speaking = true;
        if (!cur.started) {
          cur.started = true;
          cur.onStart?.();
        }
      } else if (e.ev === 'spoken-end') {
        this.speaking = false;
        this.current = null;
        cur.resolve(e.ok !== false);
      }
    });
  }

  get speed() {
    return this.pace;
  }
  set speed(value: number) {
    this.pace = value;
    this.bridge.send({ op: 'config', speed: value });
  }

  level(): number {
    return this.speaking ? 0.35 + 0.25 * Math.abs(Math.sin(performance.now() / 140)) : 0;
  }

  stop() {
    const cur = this.current;
    this.current = null;
    this.speaking = false;
    if (cur) {
      this.bridge.send({ op: 'cut' });
      cur.resolve(false);
    }
  }

  private open(onStart?: () => void): { id: number; done: Promise<boolean> } {
    this.stop();
    const id = ++sayCounter;
    const done = new Promise<boolean>((resolve) => {
      this.current = { id, started: false, onStart, resolve };
    });
    return { id, done };
  }

  speak(text: string, onStart?: () => void): Promise<boolean> {
    if (!text.trim()) return Promise.resolve(true);
    const { id, done } = this.open(onStart);
    this.bridge.send({ op: 'say', id, text, final: true });
    return done;
  }

  stream(onStart?: () => void): VoiceStream {
    const { id, done } = this.open(onStart);
    let ended = false;
    return {
      push: (text: string) => {
        if (ended || !text.trim()) return;
        this.bridge.send({ op: 'say', id, text, final: false });
      },
      end: () => {
        if (ended) return;
        ended = true;
        this.bridge.send({ op: 'say', id, text: '', final: true });
      },
      done,
    };
  }

  /** The app makes the line's sound ahead of time, so it plays with no wait later (the call's fillers). */
  async prepare(text: string): Promise<void> {
    if (text.trim()) this.bridge.send({ op: 'prepare', text });
  }

  dispose() {
    this.stop();
    this.off();
    this.bridge.send({ op: 'end' });
  }
}
