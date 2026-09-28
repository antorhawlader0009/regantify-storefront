// Shopping-funnel steps for the vendor's Analytics (analytics-plan.md
// Step 4): viewed a product, added to cart, reached checkout. Sent to the
// store's own API, not to any ad platform, keyed by the visit session
// (visitSession.ts), with nothing personal in them. Fire-and-forget:
// never awaited, never throws, never slows the shopper down.

import { CART_ADD_EVENT, type CartLine } from '@/stores/cart-store';
import { apiOrigin, getOrCreateSessionKey } from './visitSession';

export type StoreEventType = 'PRODUCT_VIEW' | 'ADD_TO_CART' | 'BEGIN_CHECKOUT';

export function sendStoreEvent(subdomain: string, type: StoreEventType, productId?: string) {
  try {
    void fetch(`${apiOrigin()}/v1/store/${subdomain}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionKey: getOrCreateSessionKey(subdomain), type, ...(productId && { productId }) }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // sessionStorage can throw in some private modes; a funnel step is never worth an error.
  }
}

let cartListenerAdded = false;
let cartSubdomain: string | null = null;

/**
 * ADD_TO_CART for every cart add, whichever theme's button did it (the
 * cart store's CART_ADD_EVENT). Called by VisitBeacon, which every theme
 * mounts; the listener is added once per page load.
 */
export function listenForStoreCartAdds(subdomain: string) {
  cartSubdomain = subdomain;
  if (cartListenerAdded || typeof window === 'undefined') return;
  cartListenerAdded = true;
  window.addEventListener(CART_ADD_EVENT, (e) => {
    const line = (e as CustomEvent<CartLine>).detail;
    // Carts saved before CartLine had productId have no id to send; the step still counts.
    if (cartSubdomain && line?.subdomain === cartSubdomain) sendStoreEvent(cartSubdomain, 'ADD_TO_CART', line.productId ?? undefined);
  });
}
