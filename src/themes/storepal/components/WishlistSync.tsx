'use client';

import { useEffect, useRef } from 'react';
import { useCustomerAuthStore, useCustomerAuthHydrated } from '@/providers/customer-auth-store-provider';
import { getServerWishlist, syncServerWishlist } from '@/lib/customerAuthApi';
import { readLocalWishlist, setLocalWishlist } from '../lib/wishlist';

/**
 * Wishlist at login (TellMe idea 62): when a shopper is logged in, what they saved in this browser and what their account
 * already holds are merged (nothing is lost either way), the browser gets the merged list and so does the account. Runs once
 * per login. Logged out, the wishlist stays in the browser as before. Renders nothing.
 */
export function WishlistSync({ subdomain }: { subdomain: string }) {
  const hydrated = useCustomerAuthHydrated();
  const customerId = useCustomerAuthStore((s) => s.customer?.id);
  const accessToken = useCustomerAuthStore((s) => s.accessToken);
  const doneFor = useRef<string | null>(null);

  useEffect(() => {
    if (!hydrated || !customerId || !accessToken) return;
    const key = `${customerId}:${subdomain}`;
    if (doneFor.current === key) return;
    doneFor.current = key;
    void (async () => {
      try {
        const server = await getServerWishlist(accessToken, subdomain);
        const merged = [...new Set([...server.items.map((i) => i.slug), ...readLocalWishlist(subdomain)])];
        setLocalWishlist(subdomain, merged);
        if (merged.length !== server.items.length) await syncServerWishlist(accessToken, subdomain, merged);
      } catch {
        // Offline or an old server: the browser's list keeps working on its own.
        doneFor.current = null;
      }
    })();
  }, [hydrated, customerId, accessToken, subdomain]);

  return null;
}
