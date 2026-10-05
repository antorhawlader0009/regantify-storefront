'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useShallow } from 'zustand/react/shallow';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useCartStore, useCartHydrated } from '@/providers/cart-store-provider';
import { formatPrice } from '../lib/formatPrice';
import { useCartDrawer } from '../lib/cartDrawer';
import { CartOffers } from './CartOffers';

const SLIDE_MS = 300;

/**
 * StorePal's slide-in cart: opens from the right when the shopper taps the cart
 * icon or adds a product, over a dimmed page. Quantity and remove work in place,
 * the offers box shows the discount / free-delivery progress, and Checkout is one
 * tap away. Closes on Esc, a tap outside, the X, or any page change, and locks the
 * page behind it from scrolling while open. It is the only cart UI the header
 * links to; the old /cart page is just a fallback for saved links.
 */
export function CartDrawer({ subdomain }: { subdomain: string }) {
  const open = useCartDrawer((s) => s.open);
  const closeDrawer = useCartDrawer((s) => s.closeDrawer);
  const pathname = usePathname();
  const hydrated = useCartHydrated();
  const lines = useCartStore(useShallow((s) => s.lines.filter((l) => l.subdomain === subdomain)));
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeLine = useCartStore((s) => s.removeLine);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  // Mount the offers box (it fetches) only once the drawer has been opened, then keep it.
  const [everOpened, setEverOpened] = useState(false);

  useEffect(() => {
    if (open) setEverOpened(true);
  }, [open]);

  // A page change (checkout, a product...) closes it.
  useEffect(() => {
    closeDrawer();
  }, [pathname, closeDrawer]);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDrawer();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKey);
      previouslyFocused?.focus?.();
    };
  }, [open, closeDrawer]);

  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);
  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const originalTotal = lines.reduce((sum, l) => sum + (l.originalUnitPrice ?? l.unitPrice) * l.quantity, 0);
  const saved = originalTotal - subtotal;

  return (
    <div
      className="fixed inset-0 z-[70]"
      style={{
        pointerEvents: open ? 'auto' : 'none',
        visibility: open ? 'visible' : 'hidden',
        transition: `visibility 0s linear ${open ? 0 : SLIDE_MS}ms`,
      }}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 bg-black/45 transition-opacity motion-reduce:transition-none ${open ? 'opacity-100' : 'opacity-0'}`}
        style={{ transitionDuration: `${SLIDE_MS}ms` }}
        onClick={closeDrawer}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={`absolute right-0 top-0 flex h-full w-full flex-col bg-canvas shadow-2xl transition-transform ease-out motion-reduce:transition-none sm:w-[420px] ${open ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ transitionDuration: `${SLIDE_MS}ms` }}
      >
        <div className="flex shrink-0 items-center justify-between px-5 pb-3 pt-5">
          <h2 className="flex items-center gap-2.5 text-[18px] font-bold leading-none text-ink">
            Cart
            {hydrated && itemCount > 0 && (
              <span className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-ink px-1.5 text-[12px] font-bold text-white">
                {itemCount}
              </span>
            )}
          </h2>
          <button
            ref={closeButtonRef}
            onClick={closeDrawer}
            aria-label="Close cart"
            className="-mr-1.5 rounded-full p-2 text-ink transition-colors hover:bg-surface hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <X size={20} />
          </button>
        </div>

        {!hydrated || lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 pb-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface">
              <ShoppingBag size={28} className="text-muted" aria-hidden />
            </div>
            <p className="mb-1 text-[16px] font-semibold text-ink">Your cart is empty</p>
            <p className="mb-5 text-[13px] text-muted">Add a product and it will show up here.</p>
            <button
              onClick={closeDrawer}
              className="rounded-lg bg-accent px-6 py-3 text-[13.5px] font-bold text-white shadow-sm transition-colors hover:bg-accent-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Continue shopping
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5">
              {everOpened && <CartOffers subdomain={subdomain} />}
              <ul className="divide-y divide-line">
                {lines.map((line) => (
                  <li key={line.id} className="flex gap-4 py-5">
                    <Link
                      href={`/store/${subdomain}/product/${line.productSlug}`}
                      className="relative h-[104px] w-[84px] shrink-0 overflow-hidden rounded-lg border border-line bg-surface"
                    >
                      {line.image ? <Image src={line.image} alt={line.name} fill sizes="84px" className="object-cover" /> : null}
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link
                            href={`/store/${subdomain}/product/${line.productSlug}`}
                            className="line-clamp-2 text-[14px] font-medium leading-snug text-ink hover:text-accent"
                          >
                            {line.name}
                          </Link>
                          {Object.keys(line.selectedOptions).length > 0 && (
                            <p className="mt-1 text-[12px] text-muted">
                              {Object.entries(line.selectedOptions)
                                .map(([k, v]) => `${k}: ${v}`)
                                .join(' · ')}
                            </p>
                          )}
                          {line.isPreOrder && <p className="mt-1 text-[12px] text-muted">Pre-order</p>}
                          {line.quantity > 1 && <p className="mt-1 text-[12px] text-muted">{formatPrice(line.unitPrice)} each</p>}
                        </div>
                        <button
                          onClick={() => removeLine(line.id)}
                          aria-label={`Remove ${line.name}`}
                          className="-mr-1 -mt-1 shrink-0 rounded-full p-1.5 text-muted transition-colors hover:bg-surface hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <div className="mt-auto flex items-end justify-between pt-3">
                        <div className="inline-flex items-center rounded-full border border-line-strong bg-canvas">
                          <button
                            onClick={() => setQuantity(line.id, line.quantity - 1)}
                            aria-label="Decrease quantity"
                            className="flex h-8 w-8 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                          >
                            <Minus size={13} />
                          </button>
                          <span className="min-w-[24px] text-center text-[13px] font-semibold tabular-nums">{line.quantity}</span>
                          <button
                            onClick={() => setQuantity(line.id, line.quantity + 1)}
                            aria-label="Increase quantity"
                            className="flex h-8 w-8 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                        <div className="text-right leading-tight">
                          {line.originalUnitPrice && line.originalUnitPrice > line.unitPrice && (
                            <span className="block text-[11.5px] text-muted line-through">
                              {formatPrice(line.originalUnitPrice * line.quantity)}
                            </span>
                          )}
                          <span className="text-[15px] font-bold tabular-nums text-ink">{formatPrice(line.unitPrice * line.quantity)}</span>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="shrink-0 border-t border-line bg-canvas px-5 pb-5 pt-4 shadow-[0_-10px_18px_-14px_rgba(0,0,0,0.35)]">
              {saved > 0 && (
                <p className="mb-1.5 flex items-center justify-between text-[13px] font-medium text-success">
                  <span>You save</span>
                  <span className="tabular-nums">{formatPrice(saved)}</span>
                </p>
              )}
              <p className="flex items-baseline justify-between">
                <span className="text-[14px] font-semibold text-ink">Subtotal</span>
                <span className="text-[22px] font-bold tabular-nums text-ink">{formatPrice(subtotal)}</span>
              </p>
              <p className="mb-4 mt-1 text-[12px] leading-snug text-muted">Delivery, coupons and gift cards are applied at checkout.</p>
              <Link
                href={`/store/${subdomain}/checkout`}
                className="flex h-12 w-full items-center justify-center rounded-lg bg-accent text-[14.5px] font-bold text-white shadow-sm transition-colors hover:bg-accent-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Checkout
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
