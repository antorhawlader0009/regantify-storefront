/**
 * Instant checkout link hand-off (/i/<token>, server/src/instant-checkout/). The link page fills the cart and stores here,
 * for this browser tab only (sessionStorage), the details the shop typed and the link's token. A template's checkout reads
 * the details once to fill its form (`takeInstantPrefill`), and useCheckout (shared by every template) sends the token with
 * the order so the server marks the link as used (`instantTokenFor`), then forgets it (`clearInstantHandoff`).
 */

const KEY = 'regantify-instant-checkout:';

export interface InstantPrefill {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  zone: 'DHAKA' | 'AROUND_DHAKA' | 'OUTSIDE_DHAKA' | null;
}

interface Handoff {
  /** Null when the hand-off is not from a link (the store's AI chat order card). */
  token: string | null;
  prefill: InstantPrefill | null;
}

function read(subdomain: string): Handoff | null {
  try {
    const raw = sessionStorage.getItem(`${KEY}${subdomain}`);
    const parsed = raw ? (JSON.parse(raw) as Handoff) : null;
    return parsed && (typeof parsed.token === 'string' || parsed.token === null) ? parsed : null;
  } catch {
    return null;
  }
}

export function setInstantHandoff(subdomain: string, token: string | null, prefill: InstantPrefill): void {
  try {
    sessionStorage.setItem(`${KEY}${subdomain}`, JSON.stringify({ token, prefill } satisfies Handoff));
  } catch {
    // Storage blocked: the cart is still filled, the shopper types the details.
  }
}

/** The shop's details for the checkout form, once (later reads get null, so a reload never overwrites what was typed). */
export function takeInstantPrefill(subdomain: string): InstantPrefill | null {
  const h = read(subdomain);
  if (!h?.prefill) return null;
  try {
    sessionStorage.setItem(`${KEY}${subdomain}`, JSON.stringify({ token: h.token, prefill: null } satisfies Handoff));
  } catch {
    // ignore
  }
  return h.prefill;
}

export function instantTokenFor(subdomain: string): string | undefined {
  return read(subdomain)?.token ?? undefined;
}

export function clearInstantHandoff(subdomain: string): void {
  try {
    sessionStorage.removeItem(`${KEY}${subdomain}`);
  } catch {
    // ignore
  }
}
