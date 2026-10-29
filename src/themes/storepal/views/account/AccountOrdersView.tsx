'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useStorePalDesign } from '../../lib/designSettings';
import { useRouter } from 'next/navigation';
import { ChevronRight, Gift, Package, RotateCcw } from 'lucide-react';
import { OrderDetailsDialog } from '../../components/OrderDetailsDialog';
import { listCustomerOrders, fetchBuyAgain, fetchCustomerRewards, type CustomerOrder, type CustomerRewards } from '@/lib/customerAuthApi';
import { useCartStore } from '@/providers/cart-store-provider';
import { useStoreText, useFormatPrice } from '../../lib/storeText';
import { formatPrice as plainPrice } from '../../lib/formatPrice';
import { customerOrderStatusLabel } from '@/lib/orderStatusDisplay';
import { useCustomerAuthStore, useCustomerAuthHydrated } from '@/providers/customer-auth-store-provider';
import { AccountLayout } from '../../components/AccountLayout';
import { CourierTrackingLine } from '../../components/CourierTrackingCard';
import { orderLabel } from '@/lib/orderLabel';
import { useStoreDisplayName } from '../../lib/useStoreDisplayName';
import { MemoDownloadButton } from '../../components/MemoDownloadButton';
import { getStoreSocialLinks } from '@/lib/socialLinksApi';
import type { TrackedOrder } from '@/lib/checkoutApi';

/** Account > Orders — matches the reference "Your Orders" (Invoice/Status/Amount) screenshot. Also used as "Dashboard" (see reference "Hi, Name" screenshot), which is the same list with a greeting on top. */
export function AccountOrdersView({ subdomain }: { subdomain: string }) {
  const formatPrice = useFormatPrice(plainPrice);
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
  // "24 Oct 2026": Bangla month names on a Bangla store, digits always English (the owner's rule).
  const bn = useStorePalDesign().storeLanguage === 'bn';
  const dateText = (iso: string) =>
    new Date(iso).toLocaleDateString(bn ? 'bn-BD-u-nu-latn' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const [rewards, setRewards] = useState<CustomerRewards | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [again, setAgain] = useState<{ orderId: string; text: string } | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  // The order whose details dialog is open (OrderDetailsDialog), null = none.
  const [openId, setOpenId] = useState<string | null>(null);
  const openOrder = openId ? orders?.find((o) => o.id === openId) ?? null : null;
  useEffect(() => {
    void getStoreSocialLinks(subdomain).then((b) => setLogoUrl(b.logoUrl ?? null)).catch(() => undefined);
  }, [subdomain]);

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
      setAgain({ orderId, text: err instanceof Error ? err.message : t('Could not load that order.') });
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
      .catch((err) => setError(err instanceof Error ? err.message : t('Could not load your orders.')));
  }, [hydrated, accessToken, subdomain]);

  if (hydrated && !customer) {
    return (
      <AccountLayout subdomain={subdomain} storeName={storeName}>
        <div className="bg-surface border border-line rounded-lg p-6 text-center">
          <Package size={26} className="mx-auto text-muted mb-3" />
          <p className="text-[14px] text-ink font-semibold mb-1">{t('Log in to see your orders')}</p>
          <Link
            href={`/store/${subdomain}/account/login`}
            className="inline-block mt-3 px-5 py-2.5 rounded-md bg-ink hover:bg-ink/90 text-white text-[13px] font-bold transition-colors"
          >
            {t('Log in')}
          </Link>
        </div>
      </AccountLayout>
    );
  }

  return (
    <AccountLayout subdomain={subdomain} storeName={storeName}>
      <div className="@container">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="m-0 text-[20px] font-bold text-ink">{t('My orders')}</h2>
            {customer && <p className="m-0 mt-0.5 truncate text-[13px] text-muted">{t('Hi, {name}').replace('{name}', customer.fullName)}</p>}
          </div>
          {orders && orders.length > 0 && (
            <p className="m-0 shrink-0 text-[12.5px] text-muted">{t('{n} orders').replace('{n}', String(orders.length))}</p>
          )}
        </div>

        {rewards && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent" aria-hidden>
              <Gift size={19} />
            </span>
            <div className="min-w-0">
              <p className="m-0 text-[14.5px] font-semibold text-ink">
                {t('Reward points')}: <span className="tabular-nums">{rewards.balance}</span>
              </p>
              <p className="m-0 text-[12.5px] text-muted">{t('Use them at checkout. 1 point = ৳1.')}</p>
            </div>
          </div>
        )}

        {error && <div className="rounded-xl border border-line bg-surface p-5 text-[13px] text-accent">{error}</div>}
        {!error && orders === null && <div className="rounded-xl border border-line bg-surface p-8 text-center text-[13px] text-muted">{t('Loading…')}</div>}

        {orders && orders.length === 0 && (
          <div className="rounded-xl border border-line bg-surface px-6 py-12 text-center">
            <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-canvas text-muted" aria-hidden>
              <Package size={22} />
            </span>
            <p className="m-0 mb-1 text-[14.5px] font-semibold text-ink">{t('No orders yet')}</p>
            <p className="m-0 mb-4 text-[12.5px] text-muted">{t('Orders you place with this store will show up here.')}</p>
            <Link href={`/store/${subdomain}`} className="inline-block rounded-lg bg-ink px-5 py-2.5 text-[13px] font-bold text-white hover:opacity-90">
              {t('Start shopping')}
            </Link>
          </div>
        )}

        {orders && orders.length > 0 && (
          <ul className="m-0 list-none divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface p-0">
            {orders.map((order) => {
              const pics = order.items.map((it) => it.productImage).filter((p): p is string => !!p).slice(0, 3);
              const pieces = order.items.reduce((n, it) => n + it.quantity, 0);
              const tone =
                order.status === 'COMPLETED'
                  ? 'bg-success/10 text-success'
                  : ['CANCELLED', 'PAYMENT_FAILED', 'RETURN', 'REFUNDED'].includes(order.status)
                    ? 'bg-red-50 text-red-600'
                    : 'bg-accent/10 text-accent';
              const memoable = order.status !== 'PAYMENT_INITIATED' && order.status !== 'PAYMENT_FAILED';
              return (
                <li key={order.id} className="group relative px-4 py-3.5 transition-colors hover:bg-canvas/70">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-3 @xl:flex-nowrap">
                    {/* Photos of what is in the order, stacked. */}
                    <div className="flex shrink-0 -space-x-3" aria-hidden>
                      {pics.length > 0 ? (
                        pics.map((src, i) => (
                          <span key={i} className="relative block h-12 w-12 overflow-hidden rounded-lg border-2 border-surface bg-canvas shadow-[0_1px_3px_rgba(16,24,40,0.12)]">
                            <Image src={src} alt="" fill sizes="48px" className="object-cover" />
                          </span>
                        ))
                      ) : (
                        <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-canvas text-muted">
                          <Package size={20} />
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      {/* The order number opens the details; its click area covers the whole row. */}
                      <button
                        type="button"
                        onClick={() => setOpenId(order.id)}
                        className="block max-w-full truncate text-left text-[14.5px] font-semibold text-ink after:absolute after:inset-0 after:content-[''] group-hover:text-accent focus-visible:outline-none focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-accent"
                        title={t('View order details')}
                      >
                        {orderLabel(order)}
                      </button>
                      <p className="m-0 mt-0.5 text-[12.5px] text-muted">
                        {dateText(order.createdAt)} · {t('{n} items').replace('{n}', String(pieces))}
                      </p>
                      {order.courierTracking && (
                        <div className="relative z-[1] mt-1 text-[12px]">
                          <CourierTrackingLine tracking={order.courierTracking} />
                        </div>
                      )}
                    </div>

                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[12px] font-semibold ${tone}`}>{customerOrderStatusLabel(order.status)}</span>
                    <span className="w-24 shrink-0 text-right text-[15px] font-bold tabular-nums text-ink">{formatPrice(order.total)}</span>

                    <div className="relative z-[1] flex shrink-0 items-center gap-1.5 max-@xl:w-full max-@xl:justify-end">
                      <button
                        type="button"
                        onClick={() => buyAgain(order.id)}
                        disabled={busyId !== null}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line-strong bg-surface px-3 text-[12.5px] font-semibold text-ink transition-colors hover:border-accent hover:text-accent disabled:opacity-60"
                      >
                        <RotateCcw size={14} aria-hidden />
                        {busyId === order.id ? '…' : t('Buy again')}
                      </button>
                      {/* The memo of any order, not only on the thank-you page (the account answer carries the full order). */}
                      {memoable && (
                        <MemoDownloadButton
                          order={order as unknown as TrackedOrder}
                          storeName={storeName}
                          logoUrl={logoUrl}
                          label={t('Memo')}
                          busyLabel="…"
                          className="!h-9 !rounded-lg !px-3 !py-0 !text-[12.5px]"
                        />
                      )}
                      <ChevronRight size={18} className="hidden text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent @xl:block" aria-hidden />
                    </div>
                  </div>
                  {again?.orderId === order.id && <p className="relative z-[1] m-0 mt-2 text-right text-[12px] text-muted">{again.text}</p>}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {openOrder && (
        <OrderDetailsDialog
          subdomain={subdomain}
          order={openOrder as unknown as TrackedOrder}
          onClose={() => setOpenId(null)}
          actions={
            <>
              {again?.orderId === openOrder.id && <p className="m-0 mr-1 text-[12px] text-muted">{again.text}</p>}
              <button
                type="button"
                onClick={() => buyAgain(openOrder.id)}
                disabled={busyId !== null}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line-strong bg-surface px-3.5 py-2 text-[13px] font-semibold text-ink hover:border-accent hover:text-accent disabled:opacity-60"
              >
                <RotateCcw size={14} aria-hidden />
                {busyId === openOrder.id ? '…' : t('Buy again')}
              </button>
              {openOrder.status !== 'PAYMENT_INITIATED' && openOrder.status !== 'PAYMENT_FAILED' && (
                <MemoDownloadButton
                  order={openOrder as unknown as TrackedOrder}
                  storeName={storeName}
                  logoUrl={logoUrl}
                  label={t('Memo')}
                  busyLabel="…"
                  className="!px-3.5 !py-2 !text-[13px]"
                />
              )}
            </>
          }
        />
      )}
    </AccountLayout>
  );
}
