'use client';

import { useCartStore } from '@/providers/cart-store-provider';

/**
 * Account pages are client components with only `subdomain` in scope
 * (see AccountLayout's own comment on why no server-fetched store row
 * is available there) — this best-effort resolves a display name from
 * whatever's cheaply available client-side: a cart line for this store
 * already carries its own storeName (set when the line was added from
 * a server-rendered product page), so a shopper who has anything in
 * their cart sees the real name; otherwise this falls back to the
 * subdomain itself, capitalized, which is still meaningfully better
 * than a generic placeholder.
 */
export function useStoreDisplayName(subdomain: string): string {
  const fromCart = useCartStore((s) => s.lines.find((l) => l.subdomain === subdomain)?.storeName);
  if (fromCart) return fromCart;
  return subdomain.charAt(0).toUpperCase() + subdomain.slice(1);
}
