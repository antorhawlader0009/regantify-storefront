'use client';

import { useShallow } from 'zustand/react/shallow';
import { useCartStore } from '@/providers/cart-store-provider';
import { minOrderShortfall, useMinOrderAmount } from '@/lib/minOrder';
import { formatPrice as plainPrice } from '../lib/formatPrice';
import { useFormatPrice, useStoreText } from '../lib/storeText';

/**
 * "Minimum order is ৳500. Add ৳120 more to order." with a progress bar, in the cart page and the cart drawer (2026-10-28),
 * so the shopper knows before opening the checkout. Shows nothing when the store has no minimum or the cart already reaches it.
 */
export function MinOrderNotice({ subdomain, className = '' }: { subdomain: string; className?: string }) {
  const t = useStoreText();
  const formatPrice = useFormatPrice(plainPrice);
  const minimum = useMinOrderAmount(subdomain);
  const subtotal = useCartStore(useShallow((s) => s.lines.filter((l) => l.subdomain === subdomain))).reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const missing = minOrderShortfall(minimum, subtotal);
  if (!minimum || missing <= 0 || subtotal <= 0) return null;
  const pct = Math.min(100, Math.round((subtotal / minimum) * 100));
  return (
    <div role="status" className={`rounded-md border border-accent/30 bg-accent/5 px-3.5 py-2.5 ${className}`}>
      <p className="m-0 text-[13px] font-semibold text-accent">
        {t('Minimum order is {amount}. Add {more} more to order.').replace('{amount}', formatPrice(minimum)).replace('{more}', formatPrice(missing))}
      </p>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line" aria-hidden>
        <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
