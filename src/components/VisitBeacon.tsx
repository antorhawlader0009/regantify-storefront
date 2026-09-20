'use client';

import { useEffect } from 'react';
import { detectApiOrigin } from '@/lib/detectApiOrigin';

// Same host-detection pattern as checkoutApi.ts/chatApi.ts (see their
// own comments for why): this runs in the browser, so it can't use the
// server-only API_URL storefrontApi.ts relies on. See detectApiOrigin.ts
// for the local-vs-VPS auto-detect.
async function apiOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_API_URL;
  if (configured) return configured.replace(/\/$/, '');
  return detectApiOrigin(`${window.location.protocol}//${window.location.hostname}:4000`);
}

// One sessionStorage key per store per browser tab-group, same
// generated-once-and-reused convention as useCheckout.ts's own
// sessionKey (see its comment) — NOT shared across different vendors'
// stores in the same browser, so browsing 3 different stores in one
// session correctly counts as a visit to each.
function getOrCreateSessionKey(subdomain: string): string {
  const key = `regantify-visit-session:${subdomain}`;
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;
  const generated = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  sessionStorage.setItem(key, generated);
  return generated;
}

/**
 * Monthly Visit tracking (PLAN.md Step 5) — fires one fire-and-forget
 * beacon per browser session per store per day. Mounted once in
 * store/[subdomain]/layout.tsx, OUTSIDE any theme's own components tree
 * (see StoreLayout's doc comment) so it counts a real visit regardless
 * of which theme (MEDIUM/MINIMAL/STOREPAL) the vendor has selected,
 * with no theme-specific code needed.
 *
 * Deliberately client-side rather than counted server-side on the
 * layout's own getStoreInfo() call: that call is ISR-cached (see
 * storefrontApi.ts's fetchJson, 60s revalidate window), so incrementing
 * there would only count cache MISSES, badly undercounting real shopper
 * traffic within the cache window. This component only ever runs once
 * per real browser page load, cache or no cache.
 *
 * Renders nothing, never blocks/delays the page, and never throws —
 * silently gives up on failure (a dropped beacon just means one fewer
 * count towards a usage NOTICE, never something that can break the
 * storefront — see the server's own comment on why the visit cap is
 * read-only, not an enforcement point).
 */
export function VisitBeacon({ subdomain }: { subdomain: string }) {
  useEffect(() => {
    try {
      const sessionKey = getOrCreateSessionKey(subdomain);
      // Fire-and-forget — no loading state, no retry, nothing in this
      // component ever needs to know whether it succeeded.
      void apiOrigin()
        .then((origin) =>
          fetch(`${origin}/v1/store/${subdomain}/visit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionKey }),
            keepalive: true,
          }),
        )
        .catch(() => {});
    } catch {
      // sessionStorage can throw in some private-browsing modes — a
      // visit beacon is never worth breaking the page over.
    }
    // subdomain is the only real dependency — a shopper navigating
    // between pages within the same store must NOT refire this (that
    // would defeat the whole "one per session per day" dedup on the
    // client side, relying entirely on the server's upsert to save it,
    // which would still work but means firing dozens of avoidable
    // requests per visit).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subdomain]);

  return null;
}
