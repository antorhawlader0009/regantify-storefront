'use client';

import { useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useCartHydrated, useCartStore } from '@/providers/cart-store-provider';
import { trackViewCart } from '@/lib/ecommerceEvents';

/**
 * view_cart (Google Analytics 4 / Tag Manager) for StorePal's cart page,
 * once per visit, as soon as the saved cart has loaded and isn't empty.
 * Renders nothing; a separate
 * client component because CartView itself is a server component.
 */
export function CartViewTracker({ subdomain }: { subdomain: string }) {
  const hydrated = useCartHydrated();
  const lines = useCartStore(useShallow((s) => s.lines.filter((l) => l.subdomain === subdomain)));
  const tracked = useRef(false);

  useEffect(() => {
    if (!hydrated || tracked.current || lines.length === 0) return;
    tracked.current = true;
    trackViewCart(lines);
  }, [hydrated, lines]);

  return null;
}
