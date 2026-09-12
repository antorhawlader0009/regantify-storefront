'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package } from 'lucide-react';
import { listCustomerOrders, type CustomerOrder } from '@/lib/customerAuthApi';
import { formatPrice } from '../../lib/formatPrice';
import { customerOrderStatusLabel } from '@/lib/orderStatusDisplay';
import { useCustomerAuthStore, useCustomerAuthHydrated } from '@/providers/customer-auth-store-provider';
import { AccountLayout } from '../../components/AccountLayout';
import { useStoreDisplayName } from '../../lib/useStoreDisplayName';

/** Account > Orders — matches the reference "Your Orders" (Invoice/Status/Amount) screenshot. Also used as "Dashboard" (see reference "Hi, Name" screenshot), which is the same list with a greeting on top. */
export function AccountOrdersView({ subdomain }: { subdomain: string }) {
  const storeName = useStoreDisplayName(subdomain);
  const hydrated = useCustomerAuthHydrated();
  const customer = useCustomerAuthStore((s) => s.customer);
  const accessToken = useCustomerAuthStore((s) => s.accessToken);

  const [orders, setOrders] = useState<CustomerOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated || !accessToken) return;
    listCustomerOrders(subdomain, accessToken)
      .then(setOrders)
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load your orders.'));
  }, [hydrated, accessToken, subdomain]);

  if (hydrated && !customer) {
    return (
      <AccountLayout subdomain={subdomain} storeName={storeName}>
        <div className="bg-surface border border-line rounded-lg p-6 text-center">
          <Package size={26} className="mx-auto text-muted mb-3" />
          <p className="text-[14px] text-ink font-semibold mb-1">Log in to see your orders</p>
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
      <h1 className="text-[22px] font-bold text-ink mb-5">{customer ? `Hi, ${customer.fullName}` : 'Your Orders'}</h1>

      <div className="bg-surface border border-line rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-line">
          <p className="text-[15px] font-semibold text-ink">{customer ? 'Recent Orders' : 'Your Orders'}</p>
        </div>

        {error && <div className="p-5 text-[13px] text-accent">{error}</div>}

        {!error && orders === null && <div className="p-8 text-center text-[13px] text-muted">Loading…</div>}

        {orders && orders.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-[13.5px] text-ink font-medium mb-1">No orders yet</p>
            <p className="text-[12.5px] text-muted mb-4">Orders you place with this store will show up here.</p>
            <Link
              href={`/store/${subdomain}`}
              className="inline-block px-4 py-2 rounded-md bg-ink hover:bg-ink/90 text-white text-[12.5px] font-bold transition-colors"
            >
              Start shopping
            </Link>
          </div>
        )}

        {orders && orders.length > 0 && (
          <table className="w-full text-[13.5px]">
            <thead>
              <tr className="bg-canvas text-left text-ink">
                <th className="px-5 py-3 font-semibold">Invoice</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-line">
                  <td className="px-5 py-3 text-ink font-medium">ORDER-{order.invoiceNumber}</td>
                  <td className="px-5 py-3 text-muted">{customerOrderStatusLabel(order.status)}</td>
                  <td className="px-5 py-3 text-right font-semibold text-ink">{formatPrice(order.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AccountLayout>
  );
}
