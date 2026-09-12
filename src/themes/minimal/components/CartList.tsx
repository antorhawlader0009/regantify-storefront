'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, X } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useCartStore, useCartHydrated } from '@/providers/cart-store-provider';
import { formatPrice } from '@/lib/productDisplay';

interface CartListProps {
  subdomain: string;
  storeName: string;
}

export function CartList({ subdomain }: CartListProps) {
  const hydrated = useCartHydrated();
  const lines = useCartStore(useShallow((s) => s.lines.filter((l) => l.subdomain === subdomain)));
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeLine = useCartStore((s) => s.removeLine);

  if (!hydrated) return null;

  if (lines.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-[17px] font-display italic text-ink mb-1.5">Your cart is empty</p>
        <p className="text-[13px] text-muted mb-6">Find something you like and add it here.</p>
        <Link
          href={`/store/${subdomain}`}
          className="inline-flex items-center gap-2 text-[12.5px] tracking-[0.04em] uppercase text-ink border-b border-ink pb-1 hover:gap-3 transition-all"
        >
          Continue shopping
          <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);

  return (
    <div>
      <div>
        {lines.map((line) => (
          <div key={line.id} className="flex gap-4 py-5 border-b border-line last:border-0">
            <Link href={`/store/${subdomain}/product/${line.productSlug}`} className="relative w-18 h-22 sm:w-20 sm:h-24 shrink-0 bg-canvas overflow-hidden">
              {line.image ? (
                <Image src={line.image} alt={line.name} fill sizes="80px" className="object-cover" />
              ) : null}
            </Link>

            <div className="flex-1 min-w-0 flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/store/${subdomain}/product/${line.productSlug}`} className="text-[13.5px] text-ink hover:text-accent transition-colors">
                    {line.name}
                  </Link>
                  {Object.entries(line.selectedOptions).length > 0 && (
                    <p className="text-[11.5px] text-muted mt-0.5">
                      {Object.entries(line.selectedOptions).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                    </p>
                  )}
                  {line.isPreOrder && <p className="text-[11px] text-muted mt-1">Pre-order — ships in 20–25 days</p>}
                </div>
                <button
                  onClick={() => removeLine(line.id)}
                  className="text-muted hover:text-ink shrink-0"
                  aria-label="Remove item"
                >
                  <X size={15} strokeWidth={1.5} />
                </button>
              </div>

              <div className="mt-auto pt-3 flex items-center justify-between">
                <div className="inline-flex items-center border border-line">
                  <button
                    onClick={() => setQuantity(line.id, line.quantity - 1)}
                    className="w-7 h-7 text-ink text-sm leading-none hover:bg-canvas"
                  >
                    −
                  </button>
                  <span className="w-7 text-center text-[12px]">{line.quantity}</span>
                  <button
                    onClick={() => setQuantity(line.id, line.quantity + 1)}
                    className="w-7 h-7 text-ink text-sm leading-none hover:bg-canvas"
                  >
                    +
                  </button>
                </div>
                <div className="text-right">
                  <span className="text-[13.5px] text-ink">{formatPrice(line.unitPrice * line.quantity)}</span>
                  {line.originalUnitPrice && (
                    <span className="block text-[11px] text-muted line-through">
                      {formatPrice(line.originalUnitPrice * line.quantity)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-5 mt-1 border-t border-line flex items-center justify-between">
        <span className="text-[12px] text-muted">Subtotal — delivery calculated at checkout</span>
        <span className="text-[19px] text-ink">{formatPrice(subtotal)}</span>
      </div>

      <Link
        href={`/store/${subdomain}/checkout`}
        className="mt-5 flex items-center justify-center gap-2 w-full py-4 bg-ink hover:bg-accent-dark text-white text-[12.5px] tracking-[0.04em] uppercase transition-colors"
      >
        Proceed to Checkout
        <ArrowRight size={15} />
      </Link>
    </div>
  );
}
