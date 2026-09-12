'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Ticket } from 'lucide-react';
import { listCustomerCoupons, type CustomerCoupon } from '@/lib/customerAuthApi';
import { useCustomerAuthStore, useCustomerAuthHydrated } from '@/providers/customer-auth-store-provider';
import { AccountLayout } from '../../components/AccountLayout';
import { useStoreDisplayName } from '../../lib/useStoreDisplayName';

function discountLabel(coupon: CustomerCoupon): string {
  if (coupon.discountType === 'FREE_SHIPPING') return 'Free Shipping';
  if (coupon.discountType === 'PERCENT') {
    return coupon.maxDiscount ? `${coupon.amount}% (Max ৳${coupon.maxDiscount})` : `${coupon.amount}%`;
  }
  return `৳${coupon.amount}`;
}

/** Account > Coupons — matches the reference "Your Coupons" (Code/Discount) screenshot. */
export function CouponsView({ subdomain }: { subdomain: string }) {
  const storeName = useStoreDisplayName(subdomain);
  const hydrated = useCustomerAuthHydrated();
  const customer = useCustomerAuthStore((s) => s.customer);
  const accessToken = useCustomerAuthStore((s) => s.accessToken);

  const [coupons, setCoupons] = useState<CustomerCoupon[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated || !accessToken) return;
    listCustomerCoupons(subdomain, accessToken)
      .then(setCoupons)
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load your coupons.'));
  }, [hydrated, accessToken, subdomain]);

  if (hydrated && !customer) {
    return (
      <AccountLayout subdomain={subdomain} storeName={storeName}>
        <div className="bg-surface border border-line rounded-lg p-6 text-center">
          <Ticket size={26} className="mx-auto text-muted mb-3" />
          <p className="text-[14px] text-ink font-semibold mb-1">Log in to see your coupons</p>
          <Link
            href={`/store/${subdomain}/account/login`}
            className="inline-block mt-3 px-5 py-2.5 rounded-md bg-ink hover:bg-ink/90 text-white text-[13px] font-bold transition-colors"
          >
            Log in
          </Link>
        </div>
      </AccountLayout>
    );
  }

  return (
    <AccountLayout subdomain={subdomain} storeName={storeName}>
      <h1 className="text-[22px] font-bold text-ink mb-5">Your Coupons</h1>

      <div className="bg-surface border border-line rounded-lg overflow-hidden">
        {error && <div className="p-5 text-[13px] text-accent">{error}</div>}

        {!error && coupons === null && <div className="p-8 text-center text-[13px] text-muted">Loading…</div>}

        {coupons && coupons.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-[13.5px] text-ink font-medium mb-1">No coupons available right now</p>
            <p className="text-[12.5px] text-muted">Check back later for offers on this store.</p>
          </div>
        )}

        {coupons && coupons.length > 0 && (
          <table className="w-full text-[13.5px]">
            <thead>
              <tr className="bg-canvas text-left text-ink">
                <th className="px-5 py-3 font-semibold">Code</th>
                <th className="px-5 py-3 font-semibold">Discount</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="border-t border-line">
                  <td className="px-5 py-3 font-mono font-semibold text-ink">{coupon.code}</td>
                  <td className="px-5 py-3 text-accent font-medium">{discountLabel(coupon)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AccountLayout>
  );
}
