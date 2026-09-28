// The shopper's visit session for one store: a random key kept in
// sessionStorage, shared by the visit beacon (VisitBeacon.tsx) and the
// shopping-funnel events (storeEvents.ts) so the vendor's Analytics can
// count each step once per session. Same generated-once-and-reused
// convention as useCheckout.ts's own sessionKey (see its comment), and
// NOT shared across different vendors' stores in the same browser, so
// browsing 3 different stores in one session counts as a visit to each.

export function getOrCreateSessionKey(subdomain: string): string {
  const key = `regantify-visit-session:${subdomain}`;
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;
  const generated = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  sessionStorage.setItem(key, generated);
  return generated;
}

// Same host-detection pattern as checkoutApi.ts/chatApi.ts (see their
// own comments for why): this runs in the browser, so it can't use the
// server-only API_URL storefrontApi.ts relies on.
export function apiOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL;
  if (configured) return configured.replace(/\/$/, '');
  return `${window.location.protocol}//${window.location.hostname}:4000`;
}
