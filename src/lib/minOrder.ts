'use client';

import { useEffect, useState } from 'react';
import { getStoreDeliveryCharges } from './checkoutApi';

/**
 * The store's minimum order (Store > Delivery Charge > Checkout rules, TellMe idea 56), read from the same public charges
 * answer the checkout uses, once per store per page load. Shared by every template: the cart page and cart drawer warn
 * before checkout (2026-10-28), the checkout itself still refuses a smaller order, and the server judges it again.
 */
const cache = new Map<string, Promise<number | null>>();

export function useMinOrderAmount(subdomain: string): number | null {
  const [amount, setAmount] = useState<number | null>(null);
  useEffect(() => {
    let live = true;
    let known = cache.get(subdomain);
    if (!known) {
      known = getStoreDeliveryCharges(subdomain)
        .then((c) => (c?.minOrderAmount ? Number(c.minOrderAmount) : null))
        .catch(() => null);
      cache.set(subdomain, known);
    }
    void known.then((v) => live && setAmount(v));
    return () => {
      live = false;
    };
  }, [subdomain]);
  return amount;
}

/** Taka still missing to reach the minimum (rounded up), 0 when reached or when there is no minimum. */
export function minOrderShortfall(minimum: number | null, subtotal: number): number {
  return minimum && minimum > 0 && subtotal < minimum ? Math.ceil(minimum - subtotal) : 0;
}
