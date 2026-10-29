'use client';

import { usePathname } from 'next/navigation';
import { useShallow } from 'zustand/react/shallow';
import { ShoppingBag } from 'lucide-react';
import { useCartHydrated, useCartStore } from '@/providers/cart-store-provider';
import { useFloatingCovered } from '@/lib/floatingCover';
import { useCartDrawer } from '../lib/cartDrawer';
import { useStoreText, useFormatPrice } from '../lib/storeText';
import { formatPrice as plainPrice } from '../lib/formatPrice';

/**
 * The cart as a tab on the right edge, halfway down the page, on desktop only (2026-10-29, the owner's request): the item count on the store's
 * colour and the total under it; a tap opens the cart drawer. Shown while the cart has something in it, on every page with the
 * store header; it steps aside while a full-screen layer (checkout, the cart itself, a photo viewer...) is open and on the cart page.
 */
export function SideCartTab({ subdomain }: { subdomain: string }) {
  const t = useStoreText();
  const formatPrice = useFormatPrice(plainPrice);
  const hydrated = useCartHydrated();
  const lines = useCartStore(useShallow((s) => s.lines.filter((l) => l.subdomain === subdomain)));
  const openDrawer = useCartDrawer((s) => s.openDrawer);
  const drawerOpen = useCartDrawer((s) => s.open);
  const covered = useFloatingCovered();
  const pathname = usePathname() ?? '';

  const count = lines.reduce((n, l) => n + l.quantity, 0);
  if (!hydrated || count === 0 || covered || drawerOpen || /\/cart\/?$/.test(pathname)) return null;
  const total = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);

  return (
    <button
      type="button"
      onClick={openDrawer}
      aria-label={t('Open cart')}
      data-rg="side-cart"
      className="fixed right-0 top-1/2 z-30 hidden w-[72px] lg:flex -translate-y-1/2 flex-col overflow-hidden rounded-l-xl text-center shadow-[0_6px_20px_-6px_rgba(16,24,40,0.35)] transition-transform hover:-translate-x-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <span className="flex flex-col items-center gap-1 bg-accent px-2 py-2.5 text-white">
        <ShoppingBag size={20} strokeWidth={2} aria-hidden />
        <span className="text-[12px] font-bold leading-tight">{t('{n} Items').replace('{n}', String(count))}</span>
      </span>
      <span className="bg-surface px-1.5 py-2 text-[12.5px] font-bold tabular-nums text-accent">{formatPrice(total)}</span>
    </button>
  );
}
