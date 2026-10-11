'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Gift, Package, RotateCcw } from 'lucide-react';
import { listCustomerOrders, fetchBuyAgain, fetchCustomerRewards, type CustomerOrder, type CustomerRewards } from '@/lib/customerAuthApi';
import { useCartStore } from '@/providers/cart-store-provider';
import { useStoreText } from '../../lib/storeText';
import { formatPrice } from '../../lib/formatPrice';
import { customerOrderStatusLabel } from '@/lib/orderStatusDisplay';
import { useCustomerAuthStore, useCustomerAuthHydrated } from '@/providers/customer-auth-store-provider';
import { AccountLayout } from '../../components/AccountLayout';
import { CourierTrackingLine } from '../../components/CourierTrackingCard';
import { orderLabel } from '@/lib/orderLabel';
import { useStoreDisplayName } from '../../lib/useStoreDisplayName';

/** Account > Orders — matches the reference "Your Orders" (Invoice/Status/Amount) screenshot. Also used as "Dashboard" (see reference "Hi, Name" screenshot), which is the same list with a greeting on top. */
export function AccountOrdersView({ subdomain }: { subdomain: string }) {
  const storeName = useStoreDisplayName(subdomain);
  const hydrated = useCustomerAuthHydrated();
  const customer = useCustomerAuthStore((s) => s.customer);
  const accessToken = useCustomerAuthStore((s) => s.accessToken);

  const [orders, setOrders] = useState<CustomerOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const addLine = useCartStore((s) => s.addLine);
  const clearStore = useCartStore((s) => s.clearStore);
  const t = useStoreText();
  const [rewards, setRewards] = useState<CustomerRewards | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [again, setAgain] = useState<{ orderId: string; text: string } | null>(null);

  // "Buy again": the order's lines come back at today's price and stock and go into the cart; nothing is ordered.
  async function buyAgain(orderId: string) {
    if (!accessToken || busyId) return;
    setBusyId(orderId);
    setAgain(null);
    try {
      const res = await fetchBuyAgain(subdomain, accessToken, orderId);
      if (res.lines.length === 0) {
        setAgain({ orderId, text: t('None of these items are available right now.') });
        return;
      }
      clearStore(subdomain);
      for (const l of res.lines) {
        addLine({
          subdomain,
          storeName,
          productSlug: l.productSlug,
          name: l.name,
          image: l.image ?? undefined,
          unitPrice: l.unitPrice,
          originalUnitPrice: l.originalUnitPrice ?? undefined,
          quantity: l.quantity,
          selectedOptions: l.selectedOptions,
          isPreOrder: l.isPreOrder,
          minOrderQuantity: l.minOrderQuantity,
          quantityStep: l.quantityStep,
          productId: l.productId,
          variantId: l.variantId ?? undefined,
        });
      }
      if (res.notices.length > 0) {
        setAgain({ orderId, text: `${t('Not added')}: ${res.notices.map((n) => n.name).join(', ')}` });
        return;
      }
      router.push(`/store/${subdomain}/cart`);
    } catch (err) {
      setAgain({ orderId, text: err instanceof Error ? err.message : 'Could not load that order.' });
    } finally {
      setBusyId(null);
    }
  }

  // Reward points (TellMe idea 41): shown only when the store has them on.
  useEffect(() => {
    if (!hydrated || !accessToken) return;
    fetchCustomerRewards(subdomain, accessToken)
      .then((r) => setRewards(r.enabled ? r : null))
      .catch(() => setRewards(null));
  }, [hydrated, accessToken, subdomain]);

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

      {rewards && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-line bg-surface px-5 py-4">
          <Gift size={22} className="text-accent" aria-hidden />
          <div>
            <p className="text-[15px] font-semibold text-ink">{t('Reward points')}: {rewards.balance}</p>
            <p className="text-[12.5px] text-muted">{t('Use them at checkout. 1 point = ৳1.')}</p>
          </div>
        </div>
      )}

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
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-line">
                  <td className="px-5 py-3 text-ink font-medium">{orderLabel(order)}</td>
                  <td className="px-5 py-3 text-muted">
                    {customerOrderStatusLabel(order.status)}
                    {order.courierTracking && <CourierTrackingLine tracking={order.courierTracking} />}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-ink">{formatPrice(order.total)}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => buyAgain(order.id)}
                      disabled={busyId !== null}
                      className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-[12.5px] font-semibold text-ink hover:bg-canvas disabled:opacity-60"
                    >
                      <RotateCcw size={13} aria-hidden />
                      {busyId === order.id ? '…' : t('Buy again')}
                    </button>
                    {again?.orderId === order.id && <p className="m-0 mt-1 text-[12px] text-muted">{again.text}</p>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AccountLayout>
  );
}
