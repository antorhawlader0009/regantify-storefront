// Client-side (browser) auto-detect: "is the local NestJS API actually
// up?" — used by every browser-side fetch helper (checkoutApi.ts,
// customerAuthApi.ts, reviewsApi.ts, socialLinksApi.ts, chatApi.ts,
// VisitBeacon.tsx, themes/storepal/lib/storeNavApi.ts) to pick between
// your own local server (localhost:4000-on-whatever-host) and the real
// VPS (api.gadgetdepobd.com) with zero .env editing, so the SAME
// running `npm run dev` always talks to whichever one is actually
// available. Only kicks in when NEXT_PUBLIC_API_URL isn't explicitly
// set — an explicit .env value always wins outright, same as before
// this existed (see each call site's own apiOrigin()).
//
// Server-side data fetching (storefrontApi.ts, SSR/RSC) does its OWN
// equivalent check — see that file's own comment — since it runs in a
// different process/network context (the dev machine itself, not the
// visitor's browser) and reads API_URL, not NEXT_PUBLIC_API_URL.
//
// The VPS is this project's one real deployment target today (see
// CLAUDE.md's Deployment section + ~/regantify/docker-compose.yml) —
// hardcoded here rather than another env var, since the whole point is
// "works with zero config".
export const VPS_API_URL = 'https://api.gadgetdepobd.com';

const PROBE_TIMEOUT_MS = 800;
// Any cheap, unauthenticated, always-200 route works as a liveness
// probe — GET /v1/plans is public (see
// server/src/plans/plans.controller.ts) and doesn't touch the database
// in a way that could itself be slow.
const PROBE_PATH = '/v1/plans';

async function probeLocalApi(candidate: string): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(`${candidate}${PROBE_PATH}`, { signal: controller.signal });
    return res.ok;
  } catch {
    return false; // connection refused, DNS failure, timeout — local isn't up
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Resolved once per page load (module-level cache — a fresh tab reload
 * re-checks, nothing inside one running session ever checks twice).
 * Every call site awaits this before its first fetch of the page's
 * lifetime; once resolved, later calls reuse the same cached promise
 * for free.
 */
let cachedPromise: Promise<string> | null = null;

/** Resolves to the local API origin if it's actually reachable, otherwise the VPS's. */
export function detectApiOrigin(inferredLocalUrl: string): Promise<string> {
  if (!cachedPromise) {
    cachedPromise = probeLocalApi(inferredLocalUrl).then((localIsUp) => (localIsUp ? inferredLocalUrl : VPS_API_URL));
  }
  return cachedPromise;
}
