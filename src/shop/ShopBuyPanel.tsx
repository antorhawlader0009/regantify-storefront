'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import type { StorefrontProduct } from '@/lib/storefrontApi';
import { taka, useShopSession, ShopApiError } from './shopClient';

/**
 * Options, quantity and "Add to cart" / "Buy now" on the Shop's product page (2026-11-03). Prices shown are the store's public ones; the
 * cart and checkout work them out again on the server, so nothing here decides what is charged. A product the one-login checkout can't take
 * (price on request, coming soon, a pick-your-own box, personalised text) is bought on the store's own website instead.
 */
export function ShopBuyPanel({ subdomain, product: p, storeUrl }: { subdomain: string; product: StorefrontProduct; storeUrl: string }) {
  const router = useRouter();
  const add = useShopSession((s) => s.add);
  const options = useMemo(() => [...(p.variationOptions ?? [])].sort((a, b) => a.position - b.position), [p.variationOptions]);
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [qty, setQty] = useState(Math.max(1, p.minOrderQuantity ?? 1, p.quantityStep ?? 1));
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  const websiteOnly = !!p.quoteOnly || !!p.comingSoon || !!p.bundlePick || (p.customFields?.length ?? 0) > 0;
  const allPicked = options.every((o) => picked[o.name]);
  const variant = options.length > 0 && allPicked ? p.variants.find((v) => options.every((o) => v.optionValues[o.name] === picked[o.name])) : undefined;

  const list = Number(variant?.listPrice ?? p.price);
  const sale = variant ? (variant.discountPrice != null ? Number(variant.discountPrice) : null) : p.discountPrice != null ? Number(p.discountPrice) : null;
  const price = sale !== null && sale < list ? sale : list;
  const stock = options.length > 0 ? (variant ? variant.stock : null) : (p.stockQuantity ?? null);
  const soldOut = !p.isPreOrder && stock !== null && stock <= 0;
  const step = Math.max(1, p.quantityStep ?? 1);
  const max = Math.min(99, p.maxOrderQuantity ?? 99, !p.isPreOrder && stock !== null && stock > 0 ? stock : 99);

  const valueSoldOut = (name: string, value: string) =>
    !p.isPreOrder && p.variants.length > 0 && !p.variants.some((v) => v.optionValues[name] === value && v.stock > 0 && options.every((o) => o.name === name || !picked[o.name] || v.optionValues[o.name] === picked[o.name]));

  async function put(buyNow: boolean) {
    setNote(null);
    if (!allPicked) {
      setNote({ ok: false, text: `Please choose ${options.filter((o) => !picked[o.name]).map((o) => o.name).join(' and ')}.` });
      return;
    }
    setBusy(true);
    try {
      await add({ subdomain, slug: p.slug, options: options.length ? picked : {}, quantity: qty });
      if (buyNow) router.push('/shop/cart');
      else setNote({ ok: true, text: 'Added to your cart.' });
    } catch (e) {
      setNote({ ok: false, text: e instanceof ShopApiError ? e.message : 'Could not add it. Please try again.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      <p className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-slate-900">{taka(price)}</span>
        {price < list ? <span className="text-sm text-slate-400 line-through">{taka(list)}</span> : null}
        {p.isPreOrder ? <span className="rounded bg-amber-50 px-1.5 py-0.5 text-xs text-amber-800">Pre-order</span> : null}
      </p>

      {options.map((o) => (
        <div key={o.id}>
          <p className="mb-1 text-sm font-medium text-slate-800">
            {o.name}
            {picked[o.name] ? <span className="font-normal text-slate-500">: {picked[o.name]}</span> : null}
          </p>
          <div className="flex flex-wrap gap-2">
            {o.values.map((v) => {
              const on = picked[o.name] === v;
              const out = valueSoldOut(o.name, v);
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => setPicked((s) => ({ ...s, [o.name]: v }))}
                  className={`rounded-lg border px-3 py-1.5 text-sm ${on ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-slate-200 text-slate-700 hover:border-emerald-600'} ${out ? 'text-slate-400 line-through' : ''}`}
                >
                  {v}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {websiteOnly ? (
        <a href={storeUrl} className="block rounded-lg bg-emerald-700 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-emerald-800">
          Buy on the store&apos;s website
        </a>
      ) : soldOut ? (
        <p className="rounded-lg bg-slate-100 px-3 py-2 text-center text-sm font-medium text-slate-600">Out of stock</p>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-700">Quantity</span>
            <div className="flex items-center rounded-lg border border-slate-200">
              <button type="button" className="px-3 py-1.5 text-lg" aria-label="Less" onClick={() => setQty((q) => Math.max(step, q - step))}>
                −
              </button>
              <span className="w-10 text-center text-sm tabular-nums">{qty}</span>
              <button type="button" className="px-3 py-1.5 text-lg" aria-label="More" onClick={() => setQty((q) => Math.min(max, q + step))}>
                +
              </button>
            </div>
            {stock !== null && stock > 0 && stock <= 5 && !p.isPreOrder ? <span className="text-xs text-red-600">Only {stock} left</span> : null}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" disabled={busy} onClick={() => put(false)} className="rounded-lg border border-emerald-700 px-4 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 disabled:opacity-60">
              Add to cart
            </button>
            <button type="button" disabled={busy} onClick={() => put(true)} className="rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">
              Buy now
            </button>
          </div>
        </>
      )}
      {note ? <p className={`text-sm ${note.ok ? 'text-emerald-700' : 'text-red-600'}`}>{note.text}</p> : null}
      <p className="text-xs text-slate-500">One sign-in, one cart for every store on the Shop. Each store sends its own parcel.</p>
    </div>
  );
}
