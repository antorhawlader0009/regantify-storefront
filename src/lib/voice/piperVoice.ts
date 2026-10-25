/**
 * Page side of the Piper voice (piperWorker.ts). One worker per tab; it is ended a few minutes after the last call so its
 * ~300 MB go back (a WebAssembly heap never shrinks otherwise). The next call starts it again from the cached model.
 */

export interface PiperAudio {
  pcm: Float32Array;
  sampleRate: number;
  /** How long making it took (ms), to judge whether this device is fast enough. */
  ms: number;
}

const IDLE_MS = 3 * 60 * 1000;

let worker: Worker | null = null;
let workerBase = '';
/** The model file the next worker loads (setPiperModel), and the one the running worker has. */
let modelFile = 'model.onnx';
let workerModel = '';

/**
 * Which model file in the voice folder to load (voiceModelCache.ts chooseVoiceModel picks it per call). A different
 * one than the running worker's starts a fresh worker on the next request.
 */
export function setPiperModel(file: string) {
  modelFile = file || 'model.onnx';
}
let ready: Promise<void> | null = null;
let readyDone = false;
let idleTimer: ReturnType<typeof setTimeout> | null = null;
let nextId = 1;
const pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void; onProgress?: (p: number) => void }>();

function getWorker(base: string): Worker {
  if (worker && workerBase === base && workerModel === modelFile) return worker;
  // Only an old worker for another folder or model is stopped (stopPiper also fails what it was still doing).
  if (worker) stopPiper();
  worker = new Worker(new URL('./piperWorker.ts', import.meta.url));
  workerBase = base;
  workerModel = modelFile;
  worker.postMessage({ type: 'init', base, model: modelFile });
  worker.onmessage = (e: MessageEvent) => {
    const { id, type } = e.data as { id: number; type: string };
    if (type === 'log') {
      if (process.env.NODE_ENV !== 'production') console.debug('[voice]', e.data.msg);
      return;
    }
    const p = pending.get(id);
    if (!p) return;
    if (type === 'progress') return p.onProgress?.(e.data.value);
    pending.delete(id);
    if (type === 'done') p.resolve(e.data.result);
    else p.reject(new Error(e.data.error));
  };
  worker.onerror = (e) => {
    for (const p of pending.values()) p.reject(new Error(`voice worker failed: ${e.message || 'unknown'}`));
    pending.clear();
    stopPiper();
  };
  return worker;
}

function request<T>(base: string, msg: Record<string, unknown>, onProgress?: (p: number) => void): Promise<T> {
  if (idleTimer) clearTimeout(idleTimer);
  return new Promise<T>((resolve, reject) => {
    const id = nextId++;
    // The worker first: making one may stop an old one, which fails everything pending.
    const w = getWorker(base);
    pending.set(id, { resolve: resolve as (v: unknown) => void, reject, onProgress });
    w.postMessage({ ...msg, id });
  });
}

/** Downloads (or reads from cache) and warms up the voice. Resolves once it can speak. */
export function loadPiper(base: string, onProgress?: (p: number) => void): Promise<void> {
  if (ready && workerBase === base && workerModel === modelFile) return ready;
  readyDone = false;
  ready = request<boolean>(base, { type: 'preload' }, onProgress).then(() => {
    readyDone = true;
  });
  ready.catch(() => (ready = null));
  return ready;
}

/** The voice has loaded and can speak now (no waiting). */
export function isPiperReady(): boolean {
  return readyDone && !!worker;
}

/** `gen`: pieces of one reply share it; cancelPiper(gen + 1) drops every piece of earlier replies still waiting. */
export function synthesizePiper(base: string, text: string, gen: number, rate = 1): Promise<PiperAudio> {
  return request<PiperAudio>(base, { type: 'synth', text, rate, gen });
}

export function cancelPiper(gen: number) {
  worker?.postMessage({ type: 'cancel', gen });
}

/** Called when a call ends: the worker stays a few minutes in case the shopper calls again. */
export function idlePiper() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    if (!pending.size) stopPiper();
  }, IDLE_MS);
}

export function stopPiper() {
  if (idleTimer) clearTimeout(idleTimer);
  worker?.terminate();
  worker = null;
  ready = null;
  readyDone = false;
  for (const p of pending.values()) p.reject(new Error('voice stopped'));
  pending.clear();
}
