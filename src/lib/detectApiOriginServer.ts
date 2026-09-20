// Server-side (SSR/RSC) auto-detect: "is the local NestJS API actually
// up?" — the storefrontApi.ts equivalent of lib/detectApiOrigin.ts (that
// one is for browser-side fetch helpers; this one is for
// storefrontApi.ts's own server-only fetchJson, which runs on THIS
// machine during SSR, not the visitor's browser — "localhost" means
// something different in each context, see storefrontApi.ts's own
// header comment). Only kicks in when API_URL isn't explicitly set — an
// explicit .env value always wins outright, unchanged from before this
// existed.
//
// The VPS is this project's one real deployment target today (see
// CLAUDE.md's Deployment section + ~/regantify/docker-compose.yml) —
// hardcoded here rather than another env var, since the whole point is
// "works with zero config".
export const VPS_API_URL = 'https://api.gadgetdepobd.com';

const PROBE_TIMEOUT_MS = 800;
// Same public, cheap, always-200 liveness route as the browser-side
// detectApiOrigin.ts — see that file's own comment.
const PROBE_PATH = '/v1/plans';

async function probeLocalApi(candidate: string): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    // Deliberately NOT the `next: { revalidate, tags }` fetch config
    // fetchJson uses for real app data — this is a one-off liveness
    // check, not page content, and must never be cached/revalidated by
    // Next's data cache the way a real storefront request is.
    const res = await fetch(`${candidate}${PROBE_PATH}`, { signal: controller.signal, cache: 'no-store' });
    return res.ok;
  } catch {
    return false; // connection refused, DNS failure, timeout — local isn't up
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Resolved once per running dev-server process (module-level cache — a
 * restart of `npm run dev` re-checks, nothing inside one running process
 * ever checks twice). Every request through fetchJson awaits this before
 * its real fetch; once resolved, later calls reuse the same cached
 * promise for free.
 */
let cachedPromise: Promise<string> | null = null;

/** Resolves to the local API origin if it's actually reachable, otherwise the VPS's. */
export function detectApiOriginServer(inferredLocalUrl: string): Promise<string> {
  if (!cachedPromise) {
    cachedPromise = probeLocalApi(inferredLocalUrl).then((localIsUp) => {
      const resolved = localIsUp ? inferredLocalUrl : VPS_API_URL;
      // eslint-disable-next-line no-console
      console.log(
        localIsUp
          ? `[Regantify] SSR using LOCAL server: ${resolved}`
          : `[Regantify] SSR: local server not reachable at ${inferredLocalUrl} — falling back to VPS: ${resolved}`,
      );
      return resolved;
    });
  }
  return cachedPromise;
}
