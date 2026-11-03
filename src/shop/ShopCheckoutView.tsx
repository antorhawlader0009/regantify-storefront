'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BdAddressPicker } from '@/components/BdAddressPicker';
import { phoneInput } from '@/lib/phoneInput';
import type { ShopAddress, ShopCartLine, ShopCheckoutPreview, ShopPlacedOrder, ShopPreviewLine } from '@/lib/shopAccount';
import { cleanLines, shopApi, ShopApiError, taka, useShopSession } from './shopClient';
import { useShopOverlay } from './overlay';

type Form = { name: string; phone: string; district: string; thana: string; area: string; address: string };
const EMPTY: Form = { name: '', phone: '', district: '', thana: '', area: '', address: '' };
type StoreChoice = { payment?: string; couponCode?: string; note?: string };

const field = 'mt-1 block w-full rounded-[14px] border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm focus:border-[var(--shop-accent)] focus:outline-none';
const label = 'block text-sm text-slate-800';

/**
 * The Shop's checkout (2026-11-03): one address for every store, then one order per store, each made by that store's own checkout rules on
 * the server (prices, stock, delivery charge, coupons, payment methods). The same account and routes as the Regantify app.
 */
export function ShopCheckoutView({ inPanel = false }: { inPanel?: boolean }) {
  const router = useRouter();
  const overlay = useShopOverlay();
  const { ready, who, lines, remove } = useShopSession();
  const [buyable, setBuyable] = useState<ShopCartLine[] | null>(null);
  const [addresses, setAddresses] = useState<ShopAddress[]>([]);
  const [chosen, setChosen] = useState<string | 'new'>('new');
  const [form, setForm] = useState<Form>(EMPTY);
  const [save, setSave] = useState(true);
  const [choices, setChoices] = useState<Record<string, StoreChoice>>({});
  const [preview, setPreview] = useState<ShopCheckoutPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [placed, setPlaced] = useState<ShopPlacedOrder[] | null>(null);
  const keyRef = useRef(typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    if (!ready || who) return;
    if (inPanel) overlay.open('login', { after: 'checkout' });
    else router.replace('/shop/login?next=/shop/checkout');
  }, [ready, who, router, inPanel, overlay]);

  // Only the lines that can be bought now go to checkout (sold out or website-only ones stay in the cart).
  useEffect(() => {
    if (!ready || !who) return;
    const clean = cleanLines(lines);
    if (clean.length === 0) {
      setBuyable([]);
      return;
    }
    shopApi<{ lines: ShopPreviewLine[] }>('market/cart/preview', { method: 'POST', body: { lines: clean } })
      .then((p) => setBuyable(p.lines.filter((l) => l.status === 'OK' || l.status === 'REDUCED').map((l) => ({ subdomain: l.subdomain, slug: l.slug, options: l.selectedOptions, quantity: l.quantity }))))
      .catch((e: Error) => setError(e.message));
  }, [ready, who, lines]);

  useEffect(() => {
    if (!ready || !who) return;
    shopApi<{ addresses: ShopAddress[] }>('market/addresses')
      .then((r) => {
        setAddresses(r.addresses);
        const d = r.addresses.find((a) => a.isDefault) ?? r.addresses[0];
        if (d) setChosen(d.id);
      })
      .catch(() => undefined);
  }, [ready, who]);

  const address = useMemo(() => {
    if (chosen !== 'new') {
      const a = addresses.find((x) => x.id === chosen);
      if (a) return { name: a.receiver, phone: a.phone, district: a.district, thana: a.thana ?? undefined, area: a.area ?? undefined, address: a.address };
    }
    return { name: form.name.trim(), phone: form.phone, district: form.district, thana: form.thana || undefined, area: form.area || undefined, address: form.address.trim() };
  }, [chosen, addresses, form]);
  const addressReady = !!(address.name && /^01[3-9]\d{8}$/.test(address.phone) && address.district && address.address);

  const stores = useMemo(
    () => Object.entries(choices).map(([subdomain, c]) => ({ subdomain, ...(c.payment ? { payment: c.payment } : {}), ...(c.couponCode?.trim() ? { couponCode: c.couponCode.trim() } : {}), ...(c.note?.trim() ? { note: c.note.trim() } : {}) })),
    [choices],
  );

  // The preview, again after each change (a short pause so typing a coupon doesn't call on every letter).
  useEffect(() => {
    if (!buyable || buyable.length === 0 || !addressReady) {
      setPreview(null);
      return;
    }
    let live = true;
    const t = setTimeout(() => {
      shopApi<ShopCheckoutPreview>('market/checkout/preview', { method: 'POST', body: { lines: buyable, address, stores } })
        .then((p) => live && (setPreview(p), setError(null)))
        .catch((e: Error) => live && setError(e.message));
    }, 400);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [buyable, address, addressReady, stores]);

  const setChoice = (sub: string, patch: StoreChoice) => setChoices((c) => ({ ...c, [sub]: { ...c[sub], ...patch } }));

  async function place() {
    if (!buyable || !preview?.canPlace) return;
    setBusy(true);
    setError(null);
    try {
      if (chosen === 'new' && save) {
        await shopApi('market/addresses', {
          method: 'POST',
          body: { receiver: address.name, phone: address.phone, district: address.district, thana: address.thana, area: address.area, address: address.address },
        }).catch(() => undefined);
      }
      const r = await shopApi<{ orders: ShopPlacedOrder[] }>('market/checkout', { method: 'POST', body: { lines: buyable, address, stores, idempotencyKey: keyRef.current } });
      setPlaced(r.orders);
      // The bought lines leave the cart (same product and options).
      const bought = new Set(buyable.map((l) => `${l.subdomain}|${l.slug}|${JSON.stringify(Object.entries(l.options ?? {}).sort())}`));
      const idx = lines.map((l, i) => (bought.has(`${l.subdomain}|${l.slug}|${JSON.stringify(Object.entries(l.options ?? {}).sort())}`) ? i : -1)).filter((i) => i >= 0);
      if (idx.length) await remove(idx).catch(() => undefined);
    } catch (e) {
      setError(e instanceof ShopApiError ? e.message : 'Could not place the order. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function payOnline(orderId: string) {
    setError(null);
    try {
      const r = await shopApi<{ paymentUrl: string }>(`market/orders/${orderId}/pay`, { method: 'POST' });
      window.location.href = r.paymentUrl;
    } catch (e) {
      setError(e instanceof ShopApiError ? e.message : 'Could not open the payment page.');
    }
  }

  if (!ready || !who || buyable === null) return <p className="py-10 text-center text-sm text-slate-500">Loading…</p>;

  if (placed)
    return (
      <div className="space-y-4">
        <h1 className="text-lg font-semibold text-slate-900">Order placed</h1>
        <p className="text-sm text-slate-700">Each store got its own order and sends its own parcel.</p>
        <ul className="divide-y divide-slate-100 rounded-2xl bg-white shadow-[0_2px_12px_rgba(16,24,40,0.06)]">
          {placed.map((o) => (
            <li key={o.orderId} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-900">{o.store.name}</p>
                <p className="text-xs text-slate-500">
                  Order {o.publicCode ?? `#${o.invoiceNumber}`} · {taka(o.total)}
                </p>
              </div>
              <div className="flex gap-2">
                {o.payNow ? (
                  <button type="button" onClick={() => payOnline(o.orderId)} className="rounded-full bg-[var(--shop-accent)] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[var(--shop-accent-dark)]">
                    Pay {taka(o.payNow.amount)}
                  </button>
                ) : null}
                <Link href={`/shop/orders/${o.orderId}`} onClick={(e) => { if (inPanel) { e.preventDefault(); overlay.open('orders', { orderId: o.orderId }); } }} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:border-[var(--shop-accent)]">
                  View
                </Link>
              </div>
            </li>
          ))}
        </ul>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Link href="/shop/orders" onClick={(e) => { if (inPanel) { e.preventDefault(); overlay.open('orders'); } }} className="inline-block text-sm font-medium text-[var(--shop-accent)] hover:underline">
          All my orders
        </Link>
      </div>
    );

  if (buyable.length === 0)
    return (
      <div className="py-16 text-center">
        <p className="text-slate-700">Nothing in your cart can be bought right now.</p>
        <Link href="/shop/cart" onClick={(e) => { if (inPanel) { e.preventDefault(); overlay.open('cart'); } }} className="mt-3 inline-block text-sm font-medium text-[var(--shop-accent)] hover:underline">
          Back to the cart
        </Link>
      </div>
    );

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="space-y-4 lg:col-span-3">
        {inPanel ? null : <h1 className="text-lg font-semibold text-slate-900">Checkout</h1>}
        <section className="space-y-3 rounded-2xl bg-white shadow-[0_2px_12px_rgba(16,24,40,0.06)] p-4">
          <h2 className="text-sm font-semibold text-slate-900">Deliver to</h2>
          {addresses.map((a) => (
            <label key={a.id} className={`flex cursor-pointer gap-3 rounded-lg border px-3 py-2 text-sm ${chosen === a.id ? 'border-[var(--shop-accent)] bg-[var(--shop-soft)]' : 'border-slate-200'}`}>
              <input type="radio" name="addr" checked={chosen === a.id} onChange={() => setChosen(a.id)} className="mt-1 accent-[var(--shop-accent)]" />
              <span>
                <span className="font-medium text-slate-900">
                  {a.receiver} · {a.phone}
                </span>
                <span className="block text-slate-600">{[a.address, a.area, a.thana, a.district].filter(Boolean).join(', ')}</span>
              </span>
            </label>
          ))}
          <label className={`flex cursor-pointer gap-3 rounded-lg border px-3 py-2 text-sm ${chosen === 'new' ? 'border-[var(--shop-accent)] bg-[var(--shop-soft)]' : 'border-slate-200'}`}>
            <input type="radio" name="addr" checked={chosen === 'new'} onChange={() => setChosen('new')} className="mt-1 accent-[var(--shop-accent)]" />
            <span className="font-medium text-slate-900">A new address</span>
          </label>
          {chosen === 'new' ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={label}>
                Receiver name
                <input value={form.name} maxLength={100} onChange={(e) => setForm({ ...form, name: e.target.value })} className={field} />
              </label>
              <label className={label}>
                Mobile number
                <input inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: phoneInput(e.target.value) })} placeholder="01XXXXXXXXX" className={field} />
              </label>
              <BdAddressPicker
                district={form.district}
                thana={form.thana}
                area={form.area}
                onDistrict={(v) => setForm((f) => ({ ...f, district: v, thana: '', area: '' }))}
                onThana={(v) => setForm((f) => ({ ...f, thana: v, area: '' }))}
                onArea={(v) => setForm((f) => ({ ...f, area: v }))}
                lang="en"
                labels={{
                  district: 'District',
                  thana: 'Thana / Upazila',
                  districtPlaceholder: 'Select district',
                  thanaPlaceholder: 'Select thana / upazila',
                  thanaNeedsDistrict: 'Choose a district first',
                  other: 'Other (type it)',
                  typeDistrict: 'Type the district',
                  typeThana: 'Type the thana',
                  place: 'District, thana and area',
                  search: 'Search district or thana',
                  area: 'Area',
                  areaPlaceholder: 'Area (optional)',
                  typeArea: 'Type the area',
                }}
                labelClassName="block text-sm text-slate-800 mb-1"
                controlClassName="block w-full rounded-[14px] border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm focus:border-[var(--shop-accent)] focus:outline-none"
                fieldClassName="sm:col-span-2"
              />
              <label className={`${label} sm:col-span-2`}>
                House, road, area
                <textarea rows={2} maxLength={250} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={field} />
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
                <input type="checkbox" checked={save} onChange={(e) => setSave(e.target.checked)} className="accent-[var(--shop-accent)]" /> Save this address for next time
              </label>
            </div>
          ) : null}
        </section>

        {preview?.stores.map((s) => (
          <section key={s.store.subdomain} className="space-y-3 rounded-2xl bg-white shadow-[0_2px_12px_rgba(16,24,40,0.06)] p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">{s.store.name}</h2>
              <span className="text-xs text-slate-500">
                {s.lines.reduce((n, l) => n + l.quantity, 0)} item{s.lines.reduce((n, l) => n + l.quantity, 0) === 1 ? '' : 's'}
              </span>
            </div>
            <ul className="space-y-1 text-sm text-slate-700">
              {s.lines.map((l) => (
                <li key={l.index} className="flex justify-between gap-3">
                  <span className="min-w-0 truncate">
                    {l.quantity} × {l.name}
                    {Object.keys(l.selectedOptions).length ? ` (${Object.values(l.selectedOptions).join(', ')})` : ''}
                  </span>
                  <span className="tabular-nums">{taka(l.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={label}>
                Payment
                <select value={s.payment} onChange={(e) => setChoice(s.store.subdomain, { payment: e.target.value })} className={field}>
                  {s.payments.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className={label}>
                Coupon <span className="text-slate-400">(optional)</span>
                <input value={choices[s.store.subdomain]?.couponCode ?? ''} maxLength={50} onChange={(e) => setChoice(s.store.subdomain, { couponCode: e.target.value })} className={field} />
                {s.coupon && !s.coupon.ok && s.coupon.message ? <span className="mt-1 block text-xs text-red-600">{s.coupon.message}</span> : null}
              </label>
            </div>
            <dl className="space-y-0.5 text-sm">
              <Row k="Products" v={taka(s.subtotal)} />
              {s.discount ? <Row k={s.discount.name} v={`− ${taka(s.discount.amount)}`} /> : null}
              {s.coupon?.ok ? <Row k={`Coupon ${s.coupon.code}`} v={`− ${taka(s.coupon.amount)}`} /> : null}
              <Row k={`Delivery${s.delivery.estimatedDate ? ` (about ${new Date(s.delivery.estimatedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })})` : ''}`} v={s.delivery.freeShipping ? 'Free' : taka(s.delivery.charge)} />
              {s.vat > 0 ? <Row k="VAT" v={taka(s.vat)} /> : null}
              <Row k="Total" v={taka(s.estimatedTotal)} strong />
            </dl>
            {s.advance ? <p className="text-xs text-amber-700">This store asks for {taka(s.advance.amount)} paid online first; you can pay it right after placing the order.</p> : null}
            {s.blockers.map((b) => (
              <p key={b} className="text-xs text-red-600">
                {b}
              </p>
            ))}
          </section>
        ))}
      </div>

      <aside className="h-fit space-y-3 rounded-2xl bg-white shadow-[0_2px_12px_rgba(16,24,40,0.06)] p-4 lg:col-span-2">
        <h2 className="text-sm font-semibold text-slate-900">Summary</h2>
        {preview ? (
          <>
            <Row k={`${preview.stores.length} store${preview.stores.length === 1 ? '' : 's'}`} v={taka(preview.grandTotal)} strong />
            <p className="text-xs text-slate-500">Each store may add its own small platform charge when the order is placed.</p>
          </>
        ) : (
          <p className="text-sm text-slate-500">{addressReady ? 'Working out the totals…' : 'Fill in the delivery address to see the totals.'}</p>
        )}
        <button
          type="button"
          disabled={!preview?.canPlace || busy}
          onClick={place}
          className="w-full rounded-full bg-[var(--shop-accent)] py-2.5 text-sm font-semibold text-white hover:bg-[var(--shop-accent-dark)] disabled:bg-slate-400"
        >
          {busy ? 'Placing…' : 'Place order'}
        </button>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </aside>
    </div>
  );
}

function Row({ k, v, strong = false }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 ${strong ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
      <dt>{k}</dt>
      <dd className="tabular-nums">{v}</dd>
    </div>
  );
}
