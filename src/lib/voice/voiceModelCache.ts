/**
 * Which voice model a call uses, when Super Admin can switch models (Admin > AI Settings > Voice model; /chat/status
 * `voiceModel` is the chosen file, e.g. "models/int4.onnx").
 *
 * The rule (the user's, 2026-10-25): a shopper who already has a model keeps using it until the chosen one has fully
 * downloaded; only then is the old one deleted and the new one used. So:
 *   - chooseVoiceModel(): the chosen model if this browser has it, else the model it has (the old one), else the chosen
 *     one (downloaded by the call itself);
 *   - voicePrefetch.ts downloads the chosen model in the background and, once it is complete in Cache Storage, calls
 *     dropOtherModels() so only the new one is kept.
 * Models live in Cache Storage MODEL_CACHE under their full address; every model file ends in ".onnx".
 */

/** Same name as piperWorker.ts MODEL_CACHE. */
export const MODEL_CACHE = 'regantify-voice';

const isModelUrl = (url: string) => /\.onnx$/.test(new URL(url).pathname);

/** The model file the call should load now (a path inside the voice folder `base`). */
export async function chooseVoiceModel(base: string, chosen: string): Promise<string> {
  try {
    const cache = await caches.open(MODEL_CACHE);
    if (await cache.match(base + chosen)) return chosen;
    for (const req of await cache.keys()) {
      // A complete model of this voice folder already here: keep using it until the chosen one arrives.
      if (req.url.startsWith(base) && isModelUrl(req.url)) return req.url.slice(base.length);
    }
  } catch {
    /* no Cache Storage (private mode): the call downloads the chosen one */
  }
  return chosen;
}

/** Deletes every model except `keepUrl` (and anything from an older voice folder) once the new one is complete. */
export async function dropOtherModels(cache: Cache, base: string, keepUrl: string): Promise<void> {
  for (const req of await cache.keys()) {
    if (req.url === keepUrl) continue;
    if (!req.url.startsWith(base) || isModelUrl(req.url)) await cache.delete(req);
  }
}
