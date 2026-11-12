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
import { BagIcon, CloseIcon, MinusIcon, PlusIcon, TrashIcon } from './icons';

/**
 * The template's cart drawer (templete/stride CartDrawer.tsx), opened by Add to Cart: the store's real cart lines with
 * quantity and remove, the subtotal, "View Full Cart" and "Checkout". The sand strip with the progress bar shows the
 * store's real minimum order (the template's "free shipping over $X" is not a promise any store made).
 */
export function StrideCartDrawer({ subdomain }: { subdomain: string }) {
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
    <div className={`fixed inset-0 z-[60] transition-[visibility] ${open ? 'visible' : 'pointer-events-none invisible delay-300'}`} aria-hidden={!open}>
      <div className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`} onClick={close} />
      <aside
        role="dialog"
        aria-label={t('Shopping cart')}
        data-rg="cart-drawer"
        className={`absolute right-0 top-0 flex h-[100dvh] w-full max-w-[400px] flex-col bg-white shadow-2xl transition-transform duration-300 ${open ? 'tranneutral-x-0' : 'tranneutral-x-full'}`}
      >
        <div className="flex items-center justify-between border-b border-[var(--st-line)] px-4 py-4 sm:px-5">
          <h2 className="text-[19px] font-extrabold tracking-[-0.015em]">
            {t('Your Cart')} ({count})
          </h2>
          <button type="button" onClick={close} aria-label={t('Close cart')} className="p-1">
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {minimum && minimum > 0 && lines.length > 0 && (
          <div className="border-b border-[var(--st-line)] bg-[var(--st-panel)] px-4 py-3 sm:px-5">
            <p className="text-xs">{shortfall > 0 ? t('Add {amount} more to place your order').replace('{amount}', formatPrice(shortfall)) : <b>{t('Your order can be placed')}</b>}</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/10">
              <div className="h-full rounded-full bg-[var(--st-brand)] transition-all duration-500" style={{ width: `${Math.min(100, (subtotal / minimum) * 100)}%` }} />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 sm:px-5">
          {!hydrated || lines.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-ink/60">
              <BagIcon className="h-12 w-12" />
              <p className="text-sm">{t('Your cart is empty')}</p>
              <Link href={`/store/${subdomain}`} onClick={close} className="st-btn">
                {t('Continue shopping')}
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--st-line)]">
              {lines.map((line) => (
                <li key={line.id} className="flex gap-3 py-4">
                  <span className="relative aspect-[4/5] w-16 shrink-0 overflow-hidden rounded-lg bg-[var(--st-well)]">
                    {line.image && <Image src={line.image} alt={line.name} fill sizes="80px" className="object-cover" />}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex justify-between gap-2">
                      <div className="min-w-0">
                        <Link href={`/store/${subdomain}/product/${line.productSlug}`} onClick={close} className="block text-[13px] font-semibold leading-snug hover:text-[var(--st-brand)]">
                          {line.name}
                        </Link>
                        {Object.keys(line.selectedOptions).length > 0 && (
                          <p className="truncate text-xs text-ink/60">{Object.entries(line.selectedOptions).map(([k, v]) => `${k}: ${v}`).join(' · ')}</p>
                        )}
                        {line.customDisplay && line.customDisplay.length > 0 && (
                          <p className="truncate text-xs text-ink/60">{line.customDisplay.map((v) => `${v.label}: ${v.value}`).join(' · ')}</p>
                        )}
                      </div>
                      <button type="button" onClick={() => removeLine(line.id)} aria-label={`${t('Remove')} ${line.name}`} className="h-fit shrink-0 p-1 text-ink/50 hover:text-red-600">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center border border-[var(--st-line)]">
                        <button type="button" className="p-2" aria-label={t('Decrease quantity')} onClick={() => setQuantity(line.id, line.quantity - (line.quantityStep ?? 1))}>
                          <MinusIcon className="h-3 w-3" />
                        </button>
                        <span className="w-7 text-center text-xs font-semibold">{line.quantity}</span>
                        <button
                          type="button"
                          className="p-2 disabled:opacity-40"
                          aria-label={t('Increase quantity')}
                          disabled={line.maxQuantity !== undefined && line.quantity + (line.quantityStep ?? 1) > line.maxQuantity}
                          onClick={() => setQuantity(line.id, line.quantity + (line.quantityStep ?? 1))}
                        >
                          <PlusIcon className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="text-sm font-bold">{formatPrice(line.unitPrice * line.quantity)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {hydrated && lines.length > 0 && (
          <div className="border-t border-[var(--st-line)] px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-5">
            <div className="flex justify-between text-sm font-bold">
              <span>{t('Subtotal')}</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="mt-4 space-y-2">
              <Link href={`/store/${subdomain}/cart`} onClick={close} className="st-btn-outline w-full">
                {t('View Full Cart')}
              </Link>
              <Link href={`/store/${subdomain}/checkout`} onClick={close} className="st-btn w-full" data-rg="checkout-button">
                {t('Checkout')}
              </Link>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
