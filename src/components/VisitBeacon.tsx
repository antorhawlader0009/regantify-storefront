'use client';

import { useEffect } from 'react';
import { captureTrafficSource } from '@/lib/trafficSource';
import { apiOrigin, getOrCreateSessionKey } from '@/lib/visitSession';
import { listenForStoreCartAdds } from '@/lib/storeEvents';

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
    // Add-to-cart funnel step for Analytics, in every theme (analytics-plan.md Step 4).
    listenForStoreCartAdds(subdomain);
    try {
      const sessionKey = getOrCreateSessionKey(subdomain);
      // Fire-and-forget — no loading state, no retry, nothing in this
      // component ever needs to know whether it succeeded.
      void fetch(`${apiOrigin()}/v1/store/${subdomain}/visit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // traffic: where the shopper came from, for Analytics > Marketing.
        body: JSON.stringify({ sessionKey, traffic: captureTrafficSource(subdomain) }),
        keepalive: true,
      }).catch(() => {});
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
