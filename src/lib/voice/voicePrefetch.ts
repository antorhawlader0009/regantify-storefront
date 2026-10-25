'use client';

/**
 * Downloads the voice call's files in the background, so a call never waits for the 30 MB voice (the user's request,
 * 2026-10-25). Started when the shopper opens the AI assistant (or a call link), well before they press call.
 *
 * Where it is kept, and why there (researched 2026-10-25):
 *   - Chrome keys its HTTP cache by the top-level SITE (scheme + main domain), not the exact address, so every store on
 *     {sub}.<root domain> shares one HTTP cache. The voice files on R2 are served immutable for a year with a strong
 *     ETag and byte ranges, so once one store downloaded them, every other store on the platform reads them from that
 *     cache with no download. An interrupted download is kept and resumed by the browser on the next try.
 *   - Cache Storage is per exact address, so it is a per-store copy: the model is also put there (the voice worker,
 *     piperWorker.ts, looks there first), which survives the HTTP cache being cleared for space. Copying it from the
 *     shared HTTP cache costs no network.
 *   - Stores on their own custom domain are different sites: browsers deliberately keep sites apart (cache and storage
 *     partitioning, also for hidden iframes since Chrome 115), so such a store downloads its own copy once.
 *
 * It downloads only on a fast connection that isn't asking to save data, on a device that can run the voice, at low
 * priority while the page is idle, small files first and the model last; it stops if the tab is closed or the
 * connection gets slow (the next visit resumes).
 */

import { deviceIsSlow } from './voiceOut';
import { dropOtherModels, MODEL_CACHE } from './voiceModelCache';

/** Read by the worker's importScripts / fetch, so they only need to reach the HTTP cache. Smallest first. */
const SMALL_FILES = ['model.onnx.json', 'piper_phonemize.js', 'ort.wasm.min.js', 'piper_phonemize.wasm', 'piper_phonemize.data', 'ort-wasm-simd.wasm'];

interface ConnectionLike extends EventTarget {
  saveData?: boolean;
  effectiveType?: string;
}

function connection(): ConnectionLike | undefined {
  return (navigator as Navigator & { connection?: ConnectionLike }).connection;
}

/** A connection fit for 30 MB in the background: not "save data", not 3G or slower. Unknown (Safari, Firefox) counts as fit. */
function connectionAllows(): boolean {
  const c = connection();
  if (!c) return true;
  if (c.saveData) return false;
  return !c.effectiveType || c.effectiveType === '4g';
}

/** A device that would use the Piper voice at all (the call skips it on these and uses Google's voice). */
function deviceAllows(): boolean {
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (memory && memory <= 2) return false;
  return !deviceIsSlow();
}

const idle = () =>
  new Promise<void>((resolve) => {
    const w = window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number };
    if (w.requestIdleCallback) w.requestIdleCallback(() => resolve(), { timeout: 3000 });
    else setTimeout(resolve, 1500);
  });

let started: string | null = null;

/**
 * Starts the background download once per page for this voice folder and model (`base` and `model` from /chat/status,
 * the model being Super Admin's choice). Never throws. A model this browser already had stays in use for calls until the
 * new one is complete; then the old one is deleted (voiceModelCache.ts).
 */
export function prefetchVoice(base: string | null, model: string): void {
  const key = `${base}${model}`;
  if (!base || started === key || typeof window === 'undefined' || typeof caches === 'undefined') return;
  if (!connectionAllows() || !deviceAllows()) return;
  started = key;
  void download(base, model).catch(() => {
    // Stopped or failed: a later open of the assistant may try again (the browser resumes what it already has).
    if (started === key) started = null;
  });
}

async function download(base: string, model: string): Promise<void> {
  await idle();
  const cache = await caches.open(MODEL_CACHE);
  const modelUrl = `${base}${model}`;
  if (await cache.match(modelUrl)) {
    // This store already has the chosen model: anything older left behind goes.
    await dropOtherModels(cache, base, modelUrl);
    return;
  }

  const ac = new AbortController();
  const stop = () => ac.abort();
  const onChange = () => {
    if (!connectionAllows()) ac.abort();
  };
  window.addEventListener('pagehide', stop);
  connection()?.addEventListener('change', onChange);
  // `priority` isn't in every TypeScript DOM lib yet; browsers without it ignore it.
  const init = { signal: ac.signal, priority: 'low', mode: 'cors', credentials: 'omit' } as RequestInit;
  try {
    for (const name of SMALL_FILES) {
      const res = await fetch(`${base}${name}`, init);
      await res.arrayBuffer(); // read to the end, so the browser keeps the whole file
    }
    const res = await fetch(modelUrl, init);
    if (!res.ok) throw new Error(`voice model ${res.status}`);
    // Streamed into Cache Storage, never whole in memory. put() stores it only once the whole body has arrived, so a
    // stopped download leaves the old model in place; only then is the old one deleted and the new one used.
    await cache.put(modelUrl, res);
    await dropOtherModels(cache, base, modelUrl);
  } finally {
    window.removeEventListener('pagehide', stop);
    connection()?.removeEventListener('change', onChange);
  }
}
