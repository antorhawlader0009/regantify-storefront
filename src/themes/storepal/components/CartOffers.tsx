'use client';

import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Tag, Truck } from 'lucide-react';
import { useCartStore, useCartHydrated } from '@/providers/cart-store-provider';
import { previewDiscounts, fetchDiscountOffers, type AutomaticDiscounts, type DiscountOffer } from '@/lib/checkoutApi';
import { formatPrice } from '@/lib/productDisplay';
import { isStoreWide, offerBenefit } from '../lib/offers';

/**
 * Marketing > Discounts on the StorePal cart page: the automatic discount (or
 * free delivery) the cart already qualifies for, so a shopper sees the saving
 * before checkout instead of first meeting it there. Same server preview
 * checkout uses, so the two never disagree; shows nothing when no discount
 * applies or the preview fails. Coupon codes are still entered at checkout.
 *
 * It also nudges: "Add ৳X more to get free delivery", for the nearest store-wide
 * offer that only needs a bigger cart total (never one limited to products or a
 * quantity, since those can't be judged from the cart total alone).
 */
export function CartOffers({ subdomain }: { subdomain: string }) {
  const hydrated = useCartHydrated();
  const lines = useCartStore(useShallow((s) => s.lines.filter((l) => l.subdomain === subdomain)));
  const [offers, setOffers] = useState<AutomaticDiscounts | null>(null);
  const [allOffers, setAllOffers] = useState<DiscountOffer[]>([]);
  useEffect(() => {
    let cancelled = false;
    fetchDiscountOffers(subdomain).then((list) => {
      if (!cancelled) setAllOffers(list);
    });
    return () => {
      cancelled = true;
    };
  }, [subdomain]);
  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const nextOffer = allOffers
    .filter((o) => isStoreWide(o) && !o.minQuantity && o.minCartAmount !== null && o.minCartAmount > subtotal)
    .sort((a, b) => (a.minCartAmount ?? 0) - (b.minCartAmount ?? 0))[0];
  const cartKey = lines.map((l) => `${l.productSlug}:${l.quantity}`).join(',');

  useEffect(() => {
    if (!hydrated || lines.length === 0) {
      setOffers(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      previewDiscounts(
        subdomain,
        lines.map((l) => ({ productSlug: l.productSlug, quantity: l.quantity })),
      ).then((result) => {
        if (!cancelled) setOffers(result);
      });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, subdomain, cartKey]);

  const discount = offers?.discount && offers.discount.discountAmount > 0 ? offers.discount : null;
  const freeShipping = offers?.freeShipping ?? null;
  if (lines.length === 0 || (!discount && !freeShipping && !nextOffer)) return null;

  return (
    <div className="mt-4 rounded-lg border border-line bg-success-bg px-4 py-3 text-[13px] text-success space-y-1.5">
      {nextOffer && nextOffer.minCartAmount !== null && (
        <div>
          <p className="font-medium">
            Add {formatPrice(nextOffer.minCartAmount - subtotal)} more to get {offerBenefit(nextOffer).toLowerCase()}
          </p>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-black/10" aria-hidden>
            <div
              className="h-full rounded-full bg-success"
              style={{ width: `${Math.min(100, Math.round((subtotal / nextOffer.minCartAmount) * 100))}%` }}
            />
          </div>
        </div>
      )}
      {discount && (
        <p className="flex items-center justify-between gap-3 font-medium">
          <span className="flex items-center gap-1.5">
            <Tag size={14} aria-hidden />
            {discount.name}
          </span>
          <span className="font-bold">You save {formatPrice(discount.discountAmount)}</span>
        </p>
      )}
      {freeShipping && (
        <p className="flex items-center gap-1.5 font-medium">
          <Truck size={14} aria-hidden />
          {freeShipping.name}: free delivery
        </p>
      )}
      {(discount || freeShipping) && (
        <p className="text-[12px] opacity-80">Applied automatically at checkout. Have a coupon code? Add it there.</p>
      )}
    </div>
  );
}
