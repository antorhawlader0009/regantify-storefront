'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useShallow } from 'zustand/react/shallow';
import { useCartStore, useCartHydrated } from '@/providers/cart-store-provider';
import { useCoverFloating } from '@/lib/floatingCover';
import { minOrderShortfall, useMinOrderAmount } from '@/lib/minOrder';
import { useCartDrawer } from '../storepal/lib/cartDrawer';
import { formatPrice as plainPrice } from '../storepal/lib/formatPrice';
import { useStoreText, useFormatPrice } from '../storepal/lib/storeText';
import { CloseIcon, MinusIcon, PlusIcon, TrashIcon } from './icons';

/**
 * The template's cart drawer (templete/playmate CartDrawer.tsx), opened by Add to Cart: the store's real cart lines with
 * quantity and remove, the subtotal, and "View Full Cart & Checkout" to the cart page. The strip at the top shows the
 * store's real minimum order (the template's "free shipping over $59" is not a promise any store made).
 */
export function PlaymateCartDrawer({ subdomain }: { subdomain: string }) {
  const t = useStoreText();
  const formatPrice = useFormatPrice(plainPrice);
  const pathname = usePathname();
  // On the cart page the cart is already in view (the template's cards don't open the drawer there).
  const onCartPage = pathname.replace(/\/$/, '').endsWith('/cart');
  const wanted = useCartDrawer((s) => s.open);
  const open = wanted && !onCartPage;
  const close = useCartDrawer((s) => s.closeDrawer);
  // An Add to Cart on the cart page asks to open it; drop that so it doesn't pop open on the next page.
  useEffect(() => {
    if (onCartPage && wanted) close();
  }, [onCartPage, wanted, close]);
  useCoverFloating(open);
  const hydrated = useCartHydrated();
  const lines = useCartStore(useShallow((s) => s.lines.filter((l) => l.subdomain === subdomain)));
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeLine = useCartStore((s) => s.removeLine);
  const minimum = useMinOrderAmount(subdomain);

  useEffect(() => {
    close();
  }, [pathname, close]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, close]);

  const count = hydrated ? lines.reduce((sum, l) => sum + l.quantity, 0) : 0;
  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const shortfall = minOrderShortfall(minimum, subtotal);

  return (
    <div className={`fixed inset-0 z-[60] ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`} onClick={close} />
      <aside
        role="dialog"
        aria-label={t('Shopping cart')}
        data-rg="cart-drawer"
        className={`absolute right-0 top-0 flex h-[100dvh] w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-base font-bold text-ink">
            {t('Your Cart')} ({count})
          </h2>
          <button type="button" className="rounded p-1 text-ink" aria-label={t('Close cart')} onClick={close}>
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
        {minimum && minimum > 0 && lines.length > 0 && (
          <div className="border-b border-line bg-accent-light px-5 py-3 text-xs text-ink">
            {shortfall > 0 ? (
              <p>
                {t('Add {amount} more to place your order').replace('{amount}', formatPrice(shortfall))}
              </p>
            ) : (
              <p className="font-semibold text-accent">{t('Your order can be placed')}</p>
            )}
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${Math.min(100, (subtotal / minimum) * 100)}%` }} />
            </div>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-5 py-2">
          {!hydrated || lines.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="text-base font-semibold text-ink">{t('Your cart is empty')}</p>
              <p className="mt-1 text-sm text-muted">{t('Add a product and it will show up here.')}</p>
              <Link href={`/store/${subdomain}`} onClick={close} className="pm-btn-primary mt-5">
                {t('Continue shopping')}
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {lines.map((line) => (
                <li key={line.id} className="flex gap-3 py-4">
                  <span className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-[var(--pm-card)]">
                    {line.image && <Image src={line.image} alt={line.name} fill sizes="80px" className="object-cover" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link href={`/store/${subdomain}/product/${line.productSlug}`} onClick={close} className="block truncate text-sm font-semibold text-ink hover:text-accent">
                      {line.name}
                    </Link>
                    {Object.keys(line.selectedOptions).length > 0 && (
                      <p className="truncate text-xs text-muted">{Object.entries(line.selectedOptions).map(([k, v]) => `${k}: ${v}`).join(' · ')}</p>
                    )}
                    {line.customDisplay && line.customDisplay.length > 0 && (
                      <p className="truncate text-xs text-muted">{line.customDisplay.map((v) => `${v.label}: ${v.value}`).join(' · ')}</p>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      <div className="inline-flex items-center rounded-md border border-line-strong">
                        <button type="button" className="p-1.5 text-ink" aria-label={t('Decrease quantity')} onClick={() => setQuantity(line.id, line.quantity - (line.quantityStep ?? 1))}>
                          <MinusIcon className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-7 text-center text-sm font-semibold text-ink">{line.quantity}</span>
                        <button
                          type="button"
                          className="p-1.5 text-ink disabled:opacity-40"
                          aria-label={t('Increase quantity')}
                          disabled={line.maxQuantity !== undefined && line.quantity + (line.quantityStep ?? 1) > line.maxQuantity}
                          onClick={() => setQuantity(line.id, line.quantity + (line.quantityStep ?? 1))}
                        >
                          <PlusIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="text-sm font-bold text-ink">{formatPrice(line.unitPrice * line.quantity)}</span>
                    </div>
                  </div>
                  <button type="button" className="self-start rounded p-1 text-muted hover:text-red-500" aria-label={`${t('Remove')} ${line.name}`} onClick={() => removeLine(line.id)}>
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {hydrated && lines.length > 0 && (
          <div className="border-t border-line px-5 py-4">
            <div className="mb-3 flex items-center justify-between text-sm text-ink">
              <span className="font-medium">{t('Subtotal')}</span>
              <span className="text-lg font-extrabold">{formatPrice(subtotal)}</span>
            </div>
            <Link href={`/store/${subdomain}/cart`} onClick={close} className="pm-btn-primary w-full" data-rg="checkout-button">
              {t('View Full Cart & Checkout')}
            </Link>
            <button type="button" className="mt-2 w-full py-2 text-xs font-semibold uppercase tracking-wide text-muted hover:text-accent" onClick={close}>
              {t('Continue shopping')}
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
