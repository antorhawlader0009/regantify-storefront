'use client';

import { useEffect } from 'react';
import { setShopperStore } from '@/lib/customerAuthApi';
import { useCustomerAuthStoreApi } from '@/providers/customer-auth-store-provider';

/**
 * Tells the shopper sign-in code which store this page belongs to (server security F-46: a sign-in is for one store).
 * Set during render, so it is known before CustomerAuthProvider's first refresh runs (a parent's effect runs after its
 * children render). Moving to another store's pages in the same tab (path-based addresses) drops the other store's
 * sign-in from memory; it can't be used here anyway. Renders nothing.
 */
export function ShopperStoreScope({ subdomain }: { subdomain: string }) {
  if (typeof window !== 'undefined') setShopperStore(subdomain);
  const authStore = useCustomerAuthStoreApi();

  useEffect(() => {
    setShopperStore(subdomain);
    const { customer, subdomain: owner, clearSession } = authStore.getState();
    if (customer && owner && owner !== subdomain.toLowerCase()) clearSession();
  }, [authStore, subdomain]);

  return null;
}
