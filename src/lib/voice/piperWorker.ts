/**
 * Web Worker that turns Bangla text into speech with Piper (bn_BD google, speaker 8 "Standard" model), so the page never
 * freezes while speech is made. Ported from the piper-bangla-test project (src/lib/piperCore.js).
 *
 * Everything heavy comes from R2 (server src/storefront/voice-files.ts, `npm run voice:upload`), whose address the page
 * sends in "init": ONNX Runtime 1.18 (ort.wasm.min.js + its wasm), the eSpeak phonemizer and the 30 MB model. The model
 * is also kept in Cache Storage, so a second call starts in about a second even if the HTTP cache dropped it.
 *
 * Store pages are not cross-origin isolated (their images and embeds come from other sites), so ONNX Runtime runs on one
 * thread here. That is why the page measures each piece and falls back to the Google voice when this is too slow.
 */

declare const ort: {
  env: { wasm: { wasmPaths: string; numThreads: number; proxy: boolean } };
  Tensor: new (type: string, data: unknown, dims: number[]) => unknown;
  InferenceSession: { create(bytes: Uint8Array, opts: unknown): Promise<OrtSession> };
};
interface OrtSession {
  inputNames: string[];
  outputNames: string[];
  run(feeds: Record<string, unknown>): Promise<Record<string, { data: Float32Array }>>;
}
interface PiperConfig {
  audio?: { sample_rate?: number };
  espeak?: { voice?: string };
  inference?: { noise_scale?: number; length_scale?: number; noise_w?: number };
}
interface PhonemizerModule {
  callMain(args: string[]): void;
}
declare const createPiperPhonemize: (opts: Record<string, unknown>) => Promise<PhonemizerModule>;

// The worker's global scope, typed by hand (the "webworker" lib clashes with the DOM types the rest of the app uses).
interface WorkerScope {
  postMessage(message: unknown, transfer?: Transferable[]): void;
  onmessage: ((e: MessageEvent) => void) | null;
  importScripts(...urls: string[]): void;
}
const ctx = self as unknown as WorkerScope;
const MODEL_CACHE = 'regantify-voice';

let base = '';
/** The model file inside `base` (Super Admin's choice, or the one this browser already has: voiceModelCache.ts). */
let modelFile = 'model.onnx';
let config: Promise<PiperConfig> | null = null;
let session: Promise<OrtSession> | null = null;
let phonemizer: Promise<PhonemizerModule> | null = null;
let collector: { lines: { phoneme_ids: number[] }[]; errors: string[] } | null = null;

const log = (msg: string) => ctx.postMessage({ type: 'log', msg });

function loadRuntime() {
  if (typeof (self as unknown as { ort?: unknown }).ort === 'undefined') {
    ctx.importScripts(`${base}ort.wasm.min.js`);
    ort.env.wasm.wasmPaths = base;
    ort.env.wasm.numThreads = 1;
    ort.env.wasm.proxy = false;
  }
}

function loadConfig(): Promise<PiperConfig> {
  config ??= fetch(`${base}model.onnx.json`).then((r) => {
    if (!r.ok) throw new Error(`voice config ${r.status}`);
    return r.json() as Promise<PiperConfig>;
  });
  config.catch(() => (config = null));
  return config;
}

/** The model bytes: Cache Storage first, else the CDN (with progress), then kept in Cache Storage. */
async function modelBytes(onProgress: (p: number) => void): Promise<Uint8Array> {
  const url = `${base}${modelFile}`;
  const cache = await caches.open(MODEL_CACHE).catch(() => null);
  const hit = await cache?.match(url);
  if (hit) {
    onProgress(100);
    return new Uint8Array(await hit.arrayBuffer());
  }
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`voice model ${res.status}`);
  // The smaller models are sent Brotli-compressed: Content-Length is then the compressed size and more bytes arrive
  // than it says, so progress is capped at 99 until the end.
  const total = Number(res.headers.get('content-length')) || 0;
  const reader = res.body.getReader();
  let bytes = new Uint8Array(total || 32 * 1048576);
  let loaded = 0;
  let lastPct = -1;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (loaded + value.length > bytes.length) {
      const bigger = new Uint8Array(Math.max(bytes.length * 2, loaded + value.length));
      bigger.set(bytes.subarray(0, loaded));
      bytes = bigger;
    }
    bytes.set(value, loaded);
    loaded += value.length;
    const pct = total ? Math.min(99, Math.floor((loaded / total) * 100)) : 0;
    if (pct !== lastPct) onProgress((lastPct = pct));
  }
  if (loaded !== bytes.length) bytes = bytes.slice(0, loaded);
  onProgress(100);
  // Copies from an older voice folder are dropped; switching between models of this folder is voicePrefetch.ts's job
  // (the old one stays until the new one is complete).
  if (cache) {
    for (const key of await cache.keys()) if (!key.url.startsWith(base)) await cache.delete(key);
    await cache
      .put(url, new Response(bytes, { headers: { 'content-type': 'application/octet-stream' } }))
      .catch(() => log('model not kept in Cache Storage (no room)'));
  }
  return bytes;
}

function loadModel(onProgress: (p: number) => void): Promise<OrtSession> {
  session ??= (async () => {
    loadRuntime();
    const t0 = performance.now();
    const bytes = await modelBytes(onProgress);
    const s = await ort.InferenceSession.create(bytes, {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
      // Less RAM: no arena (it keeps its peak forever), no memory pattern (inputs change length every sentence).
      enableCpuMemArena: false,
      enableMemPattern: false,
    });
    log(`model ready in ${Math.round(performance.now() - t0)} ms`);
    return s;
  })();
  session.catch(() => (session = null));
  return session;
}

function getPhonemizer(): Promise<PhonemizerModule> {
  phonemizer ??= (async () => {
    ctx.importScripts(`${base}piper_phonemize.js`);
    return createPiperPhonemize({
      print: (line: string) => {
        try {
          const j = JSON.parse(line);
          if (collector && Array.isArray(j.phoneme_ids)) collector.lines.push(j);
        } catch {
          /* not a JSON line */
        }
      },
      printErr: (msg: string) => collector?.errors.push(String(msg)),
      locateFile: (file: string) => (file.endsWith('.wasm') ? `${base}piper_phonemize.wasm` : file.endsWith('.data') ? `${base}piper_phonemize.data` : file),
    });
  })();
  phonemizer.catch(() => (phonemizer = null));
  return phonemizer;
}

async function phonemize(text: string, voice: string) {
  const run = async () => {
    const mod = await getPhonemizer();
    collector = { lines: [], errors: [] };
    try {
      mod.callMain(['-l', voice, '--input', JSON.stringify([{ text: text.trim() }]), '--espeak_data', '/espeak-ng-data']);
    } catch (e) {
      // Emscripten throws ExitStatus at the end of the program; that's fine when there is output.
      if (!collector.lines.length) throw e;
    }
    const { lines, errors } = collector;
    collector = null;
    if (!lines.length) throw new Error(`phonemizer gave nothing: ${errors.join(' | ').slice(0, 200)}`);
    return lines;
  };
  try {
    return await run();
  } catch {
    phonemizer = null; // a broken instance: start a fresh one once
    return run();
  }
}

function normalize(pcm: Float32Array): Float32Array {
  let peak = 0;
  for (let i = 0; i < pcm.length; i++) peak = Math.max(peak, Math.abs(pcm[i]));
  const k = 0.95 / Math.max(peak, 0.01);
  const out = new Float32Array(pcm.length);
  for (let i = 0; i < pcm.length; i++) out[i] = pcm[i] * k;
  return out;
}

async function synthesize(text: string, rate: number) {
  const cfg = await loadConfig();
  const s = await loadModel(() => undefined);
  const t0 = performance.now();
  const lines = await phonemize(text, cfg.espeak?.voice ?? 'bn');
  const inf = cfg.inference ?? {};
  const parts: Float32Array[] = [];
  for (const line of lines) {
    const ids = line.phoneme_ids;
    const feeds: Record<string, unknown> = {
      input: new ort.Tensor('int64', BigInt64Array.from(ids, (x) => BigInt(x)), [1, ids.length]),
      input_lengths: new ort.Tensor('int64', BigInt64Array.from([BigInt(ids.length)]), [1]),
      scales: new ort.Tensor('float32', Float32Array.from([inf.noise_scale ?? 0.667, (inf.length_scale ?? 1) / rate, inf.noise_w ?? 0.8]), [3]),
    };
    if (s.inputNames.includes('sid')) feeds.sid = new ort.Tensor('int64', BigInt64Array.from([BigInt(0)]), [1]);
    const out = await s.run(feeds);
    parts.push(normalize(out[s.outputNames[0]].data));
  }
  const sampleRate = cfg.audio?.sample_rate ?? 22050;
  const gap = Math.round(sampleRate * 0.1);
  const pcm = new Float32Array(parts.reduce((n, p) => n + p.length, 0) + gap * Math.max(0, parts.length - 1));
  let pos = 0;
  parts.forEach((p, i) => {
    pcm.set(p, pos);
    pos += p.length + (i < parts.length - 1 ? gap : 0);
  });
  return { pcm, sampleRate, ms: performance.now() - t0 };
}

// One job at a time: the phonemizer collects its output in one shared buffer.
let queue: Promise<unknown> = Promise.resolve();
let minGen = 0;

ctx.onmessage = (e: MessageEvent) => {
  const { id, type, text, rate } = e.data as { id?: number; type: string; text?: string; rate?: number; base?: string };
  if (type === 'init') {
    base = (e.data as { base: string }).base;
    modelFile = (e.data as { model?: string }).model || 'model.onnx';
    return;
  }
  // The shopper cut in: pieces queued before this are dropped instead of made (handled at once, not queued).
  if (type === 'cancel') {
    minGen = (e.data as { gen: number }).gen;
    return;
  }
  const gen = (e.data as { gen?: number }).gen ?? Infinity;
  queue = queue.then(async () => {
    try {
      if (gen < minGen) throw new Error('cancelled');
      if (type === 'preload') {
        await Promise.all([loadConfig(), loadModel((p) => ctx.postMessage({ id, type: 'progress', value: p })), getPhonemizer()]);
        // A first tiny run warms ONNX Runtime up, so the greeting isn't the slow one.
        await synthesize('হ্যালো', 1);
        // Then a short sentence measures this device: seconds of work per second of speech (rtf). Above 1 the voice
        // can't keep up with itself, and the call uses Google's voice from the start (useVoiceCall.ts).
        const probe = await synthesize('জি, বলুন কীভাবে সাহায্য করতে পারি।', 1);
        const rtf = probe.ms / 1000 / Math.max(0.1, probe.pcm.length / probe.sampleRate);
        ctx.postMessage({ id, type: 'done', result: { rtf } });
      } else if (type === 'synth') {
        const r = await synthesize(text ?? '', rate ?? 1);
        ctx.postMessage({ id, type: 'done', result: r }, [r.pcm.buffer]);
      } else throw new Error(`unknown request ${type}`);
    } catch (err) {
      ctx.postMessage({ id, type: 'error', error: String((err as Error)?.message ?? err) });
    }
  });
};
