'use client';

import { useEffect, useState } from 'react';
import { fetchCustomerWholesale } from '@/lib/customerAuthApi';
import { useCustomerAuthStore, useCustomerAuthHydrated } from '@/providers/customer-auth-store-provider';

/**
 * Wholesale prices (TellMe idea 79): the logged-in shopper's own prices by product slug, fetched in the browser after login. They are
 * never part of the cached public store pages. Empty for everyone else. The checkout charges whatever the server decides, so this only
 * shows the price the shopper will get.
 */
const cache = new Map<string, Record<string, number>>();

export function useWholesalePrices(subdomain: string): Record<string, number> {
  const hydrated = useCustomerAuthHydrated();
  const customer = useCustomerAuthStore((s) => s.customer);
  const accessToken = useCustomerAuthStore((s) => s.accessToken);
  const key = customer ? `${subdomain}:${customer.id}` : '';
  const [prices, setPrices] = useState<Record<string, number>>(() => (key ? (cache.get(key) ?? {}) : {}));

  useEffect(() => {
    if (!hydrated || !customer || !accessToken) {
      setPrices({});
      return;
    }
    const cached = cache.get(key);
    if (cached) {
      setPrices(cached);
      return;
    }
    let cancelled = false;
    fetchCustomerWholesale(subdomain, accessToken)
      .then((r) => {
        const next = r.active ? r.prices : {};
        cache.set(key, next);
        if (!cancelled) setPrices(next);
      })
      .catch(() => !cancelled && setPrices({}));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, key, accessToken === null]);

  return prices;
}
