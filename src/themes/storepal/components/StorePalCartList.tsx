'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Minus, Plus, X } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useCartStore, useCartHydrated } from '@/providers/cart-store-provider';
import { formatPrice as plainPrice } from '../lib/formatPrice';
import { useFormatPrice, useStoreText } from '../lib/storeText';

/**
 * The /cart page's lines and total. StorePal's own copy of Medium's CartList (Medium/Minimal are never edited for StorePal):
 * whole-taka prices like every other StorePal price (Medium's shows ".00"), the store language through t(), Bangla digits
 * when the store asked for them, and bigger quantity buttons for thumbs.
 */
export function StorePalCartList({ subdomain }: { subdomain: string }) {
  const t = useStoreText();
  const formatPrice = useFormatPrice(plainPrice);
  const hydrated = useCartHydrated();
  // useShallow: the filter builds a new array every call; comparing its contents keeps useSyncExternalStore from looping.
  const lines = useCartStore(useShallow((s) => s.lines.filter((l) => l.subdomain === subdomain)));
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeLine = useCartStore((s) => s.removeLine);

  if (!hydrated) return null;

  if (lines.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-lg font-semibold text-ink mb-1.5">{t('Your cart is empty')}</p>
        <p className="text-[13px] text-muted mb-5">{t('Find something you like and add it here.')}</p>
        <Link
          href={`/store/${subdomain}`}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-md bg-accent hover:bg-accent-dark text-white text-[13px] font-bold shadow-sm transition-colors"
        >
          {t('Continue shopping')}
          <ArrowRight size={14} aria-hidden />
        </Link>
      </div>
    );
  }

  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);

  return (
    <div>
      <ul className="m-0 list-none p-0">
        {lines.map((line) => {
          const options = Object.entries(line.selectedOptions);
          return (
            <li key={line.id} className="flex gap-3.5 py-4 border-b border-line last:border-0">
              <Link
                href={`/store/${subdomain}/product/${line.productSlug}`}
                className="relative w-[72px] h-[88px] sm:w-20 sm:h-24 shrink-0 bg-canvas border border-line rounded-md overflow-hidden"
              >
                {line.image ? <Image src={line.image} alt={line.name} fill sizes="80px" className="object-cover" /> : null}
              </Link>

              <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/store/${subdomain}/product/${line.productSlug}`}
                      className="text-[14px] font-medium text-ink leading-snug hover:text-accent line-clamp-2"
                    >
                      {line.name}
                    </Link>
                    {options.length > 0 && (
                      <p className="m-0 mt-0.5 text-[12px] text-muted">{options.map(([k, v]) => `${k}: ${v}`).join(', ')}</p>
                    )}
                    {line.isPreOrder && <p className="m-0 mt-1 text-[11.5px] font-medium text-accent">{t('Pre-order')}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLine(line.id)}
                    className="-m-1.5 p-1.5 text-muted hover:text-accent shrink-0 rounded"
                    aria-label={t('Remove item')}
                  >
                    <X size={16} aria-hidden />
                  </button>
                </div>

                <div className="mt-auto pt-2.5 flex items-center justify-between gap-3">
                  <div className="inline-flex items-center border border-line-strong rounded-md overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setQuantity(line.id, line.quantity - 1)}
                      aria-label={t('Decrease quantity')}
                      className="flex w-8 h-8 items-center justify-center text-ink hover:bg-canvas"
                    >
                      <Minus size={13} aria-hidden />
                    </button>
                    <span className="w-8 text-center text-[13px] font-medium tabular-nums">{line.quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(line.id, line.quantity + 1)}
                      aria-label={t('Increase quantity')}
                      className="flex w-8 h-8 items-center justify-center text-ink hover:bg-canvas"
                    >
                      <Plus size={13} aria-hidden />
                    </button>
                  </div>
                  <div className="text-right">
                    <span className="text-[14px] font-semibold text-ink tabular-nums">{formatPrice(line.unitPrice * line.quantity)}</span>
                    {line.originalUnitPrice && (
                      <span className="block text-[11.5px] text-muted line-through tabular-nums">
                        {formatPrice(line.originalUnitPrice * line.quantity)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="pt-4 mt-1 border-t border-line flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="m-0 text-[14px] font-semibold text-ink">{t('Subtotal')}</p>
          <p className="m-0 mt-0.5 text-[12px] text-muted">{t('Delivery is added at checkout.')}</p>
        </div>
        <span className="text-[20px] font-bold text-ink tabular-nums">{formatPrice(subtotal)}</span>
      </div>

      <Link
        href={`/store/${subdomain}/checkout`}
        data-rg="checkout-button"
        className="mt-4 flex items-center justify-center gap-2 w-full py-3.5 rounded-md bg-accent hover:bg-accent-dark text-white text-[14px] font-bold transition-colors shadow-sm"
      >
        {t('Proceed to Checkout')}
        <ArrowRight size={15} aria-hidden />
      </Link>
    </div>
  );
}
