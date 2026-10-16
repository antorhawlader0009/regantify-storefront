/**
 * Which address a shopper used to reach a store, carried inside the internal path instead of read from the request
 * (PERFORMANCE-PLAN.md Step 8). Reading the request's headers made every store page render afresh on every view; with the
 * address in the path, Next.js can keep a rendered page and serve it again, one copy per address form.
 *
 * middleware.ts rewrites every store request to `/store/<segment>/...`, where the segment is
 *   `<subdomain>~c~<origin>`  the store's own address ({sub}.ROOT_DOMAIN or its custom domain): links drop `/store/{sub}`
 *   `<subdomain>~h~<origin>`  a known platform or local address (the root domain, an IP, localhost): links keep it
 *   `<subdomain>~d`           any other host: pages read the request as before (rendered fresh every time)
 * with `<origin>` (`https://shop.example.com`) in base64url. The middleware always builds the segment itself from the
 * request, so a visitor can't choose it. A segment with no `~` (a request that never went through the middleware) is
 * treated like `~d`.
 *
 * Pure functions, used by the middleware (edge), server pages and 'use client' pages alike.
 */

export type StoreAddress = { clean: boolean; origin: string };

function toBase64Url(text: string): string {
  return btoa(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text: string): string | null {
  try {
    const b64 = text.replace(/-/g, '+').replace(/_/g, '/');
    return atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  } catch {
    return null;
  }
}

/** The internal path segment for a store request. `address` null = read the request (rendered fresh). */
export function encodeStoreSegment(subdomain: string, address: StoreAddress | null): string {
  if (!address) return `${subdomain}~d`;
  return `${subdomain}~${address.clean ? 'c' : 'h'}~${toBase64Url(address.origin)}`;
}

/** The plain subdomain and the address from a `[subdomain]` route param. */
export function decodeStoreSegment(raw: string): { subdomain: string; address: StoreAddress | null } {
  const segment = safeDecode(raw);
  const [subdomain, mode, origin] = segment.split('~');
  if ((mode === 'c' || mode === 'h') && origin) {
    const decoded = fromBase64Url(origin);
    if (decoded && /^https?:\/\/[^/\s]+$/.test(decoded)) return { subdomain, address: { clean: mode === 'c', origin: decoded } };
  }
  return { subdomain, address: null };
}

/** Just the subdomain from a `[subdomain]` route param (what every API call and link needs). */
export function storeSubdomain(raw: string): string {
  return decodeStoreSegment(raw).subdomain;
}

function safeDecode(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}
