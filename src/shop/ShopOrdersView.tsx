'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { ShopImage } from '@/lib/shopAccount';
import { shopApi, ShopApiError, taka, useShopSession } from './shopClient';
import { useShopOverlay } from './overlay';

type Group = 'TO_PAY' | 'TO_SHIP' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
const GROUP_TEXT: Record<Group, string> = { TO_PAY: 'To pay', TO_SHIP: 'Being prepared', SHIPPED: 'On the way', DELIVERED: 'Delivered', CANCELLED: 'Cancelled' };

type ListOrder = {
  orderId: string;
  invoiceNumber: number;
  publicCode: string | null;
  status: string;
  group: Group;
  total: number;
  createdAt: string;
  store: { name: string; subdomain: string };
  itemCount: number;
  firstItem: { name: string; image: ShopImage | null } | null;
  payNow: { amount: number } | null;
};

type OrderDetail = {
  orderId: string;
  invoiceNumber: number;
  publicCode: string | null;
  status: string;
  group: Group;
  createdAt: string;
  store: { name: string; subdomain: string };
  trackUrl: string | null;
  payNow: { amount: number } | null;
  items: Array<{ name: string; image: ShopImage | null; quantity: number; lineTotal: number; options: Record<string, string>; isGift: boolean }>;
  subtotal: number;
  deliveryCharge: number;
  vatAmount: number;
  discountAmount: number;
  discountLabel: string | null;
  total: number;
  address: { name: string; phone: string };
};

const day = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { timeZone: 'Asia/Dhaka', day: 'numeric', month: 'short', year: 'numeric' });

function useSignedIn(next: string, inPanel: boolean) {
  const router = useRouter();
  const { ready, who, load } = useShopSession();
  const open = useShopOverlay((s) => s.open);
  useEffect(() => {
    if (!ready) void load();
    else if (!who) {
      if (inPanel) open('login', { after: 'orders' });
      else router.replace(`/shop/login?next=${encodeURIComponent(next)}`);
    }
  }, [ready, who, load, router, next, inPanel, open]);
  return ready && !!who;
}

async function payOnline(orderId: string, onError: (m: string) => void) {
  try {
    const r = await shopApi<{ paymentUrl: string }>(`market/orders/${orderId}/pay`, { method: 'POST' });
    window.location.href = r.paymentUrl;
  } catch (e) {
    onError(e instanceof ShopApiError ? e.message : 'Could not open the payment page.');
  }
}

/** Every order of the one Shop account (2026-11-03), from every store, including orders placed on a store's own website while signed in there. */
export function ShopOrdersList({ onOpen }: { onOpen?: (orderId: string) => void }) {
  const ok = useSignedIn('/shop/orders', !!onOpen);
  const close = useShopOverlay((s) => s.close);
  const [orders, setOrders] = useState<ListOrder[] | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const signOut = useShopSession((s) => s.signOut);
  const router = useRouter();

  useEffect(() => {
    if (!ok) return;
    shopApi<{ orders: ListOrder[]; hasMore: boolean }>(`market/orders?page=${page}`)
      .then((r) => {
        setOrders((prev) => (page === 1 ? r.orders : [...(prev ?? []), ...r.orders]));
        setHasMore(r.hasMore);
      })
      .catch((e: Error) => setError(e.message));
  }, [ok, page]);

  if (!ok || (!orders && !error)) return <p className="py-10 text-center text-sm text-slate-500">Loading…</p>;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {onOpen ? <span /> : <h1 className="text-lg font-semibold text-slate-900">My orders</h1>}
        <button
          type="button"
          onClick={async () => {
            await signOut();
            close();
            router.replace('/shop');
          }}
          className="text-sm text-slate-600 underline"
        >
          Sign out
        </button>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {orders && orders.length === 0 ? <p className="py-10 text-center text-sm text-slate-600">No orders yet.</p> : null}
      <ul className="divide-y divide-slate-100 rounded-2xl bg-white shadow-[0_2px_12px_rgba(16,24,40,0.06)]">
        {orders?.map((o) => (
          <li key={o.orderId} className="flex items-center gap-3 px-4 py-3">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
              {o.firstItem?.image ? <Image src={o.firstItem.image.src} alt="" fill sizes="56px" className="object-cover" /> : null}
            </div>
            <Link href={`/shop/orders/${o.orderId}`} onClick={(e) => { if (onOpen) { e.preventDefault(); onOpen(o.orderId); } }} className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">
                {o.firstItem?.name ?? 'Order'}
                {o.itemCount > 1 ? ` and ${o.itemCount - 1} more` : ''}
              </p>
              <p className="text-xs text-slate-500">
                {o.store.name} · {day(o.createdAt)} · {taka(o.total)}
              </p>
            </Link>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">{GROUP_TEXT[o.group] ?? o.status}</span>
              {o.payNow ? (
                <button type="button" onClick={() => payOnline(o.orderId, setError)} className="text-xs font-semibold text-[var(--shop-accent)] hover:underline">
                  Pay {taka(o.payNow.amount)}
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      {hasMore ? (
        <button type="button" onClick={() => setPage((p) => p + 1)} className="w-full rounded-lg border border-slate-200 bg-white py-2 text-sm text-slate-700">
          Show more
        </button>
      ) : null}
    </div>
  );
}

/** One order (2026-11-03): items, totals, and the store's own tracking page for the live delivery steps. */
export function ShopOrderDetail({ orderId, onBack }: { orderId: string; onBack?: () => void }) {
  const ok = useSignedIn(`/shop/orders/${orderId}`, !!onBack);
  const [o, setO] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ok) return;
    shopApi<OrderDetail>(`market/orders/${encodeURIComponent(orderId)}`)
      .then(setO)
      .catch((e: Error) => setError(e.message));
  }, [ok, orderId]);

  if (error) return <p className="py-10 text-center text-sm text-red-600">{error}</p>;
  if (!ok || !o) return <p className="py-10 text-center text-sm text-slate-500">Loading…</p>;
  return (
    <div className="space-y-4">
      <Link href="/shop/orders" onClick={(e) => { if (onBack) { e.preventDefault(); onBack(); } }} className="text-sm text-[var(--shop-accent)] hover:underline">
        ‹ My orders
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold text-slate-900">Order {o.publicCode ?? `#${o.invoiceNumber}`}</h1>
        <span className="rounded bg-slate-100 px-2 py-0.5 text-sm text-slate-700">{GROUP_TEXT[o.group] ?? o.status}</span>
      </div>
      <p className="text-sm text-slate-600">
        {o.store.name} · {day(o.createdAt)}
      </p>
      <ul className="divide-y divide-slate-100 rounded-2xl bg-white shadow-[0_2px_12px_rgba(16,24,40,0.06)]">
        {o.items.map((i, n) => (
          <li key={n} className="flex items-center gap-3 px-4 py-3">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
              {i.image ? <Image src={i.image.src} alt="" fill sizes="48px" className="object-cover" /> : null}
            </div>
            <div className="min-w-0 flex-1 text-sm">
              <p className="truncate font-medium text-slate-900">
                {i.quantity} × {i.name}
                {i.isGift ? ' (free gift)' : ''}
              </p>
              {Object.keys(i.options).length ? <p className="text-xs text-slate-500">{Object.entries(i.options).map(([k, v]) => `${k}: ${v}`).join(', ')}</p> : null}
            </div>
            <span className="text-sm tabular-nums">{taka(i.lineTotal)}</span>
          </li>
        ))}
      </ul>
      <dl className="space-y-0.5 rounded-2xl bg-white shadow-[0_2px_12px_rgba(16,24,40,0.06)] p-4 text-sm text-slate-700">
        <div className="flex justify-between">
          <dt>Products</dt>
          <dd className="tabular-nums">{taka(o.subtotal)}</dd>
        </div>
        {o.discountAmount > 0 ? (
          <div className="flex justify-between">
            <dt>{o.discountLabel ?? 'Discount'}</dt>
            <dd className="tabular-nums">− {taka(o.discountAmount)}</dd>
          </div>
        ) : null}
        <div className="flex justify-between">
          <dt>Delivery</dt>
          <dd className="tabular-nums">{taka(o.deliveryCharge)}</dd>
        </div>
        {o.vatAmount > 0 ? (
          <div className="flex justify-between">
            <dt>VAT</dt>
            <dd className="tabular-nums">{taka(o.vatAmount)}</dd>
          </div>
        ) : null}
        <div className="flex justify-between font-semibold text-slate-900">
          <dt>Total</dt>
          <dd className="tabular-nums">{taka(o.total)}</dd>
        </div>
      </dl>
      <div className="flex flex-wrap gap-2">
        {o.payNow ? (
          <button type="button" onClick={() => payOnline(o.orderId, setError)} className="rounded-full bg-[var(--shop-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--shop-accent-dark)]">
            Pay {taka(o.payNow.amount)}
          </button>
        ) : null}
        {o.trackUrl ? (
          <a href={o.trackUrl} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:border-[var(--shop-accent)]">
            Track delivery on the store&apos;s page
          </a>
        ) : null}
      </div>
    </div>
  );
}
