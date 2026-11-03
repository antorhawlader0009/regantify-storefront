'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Minus, Plus, ShoppingBag } from 'lucide-react';
import type { StorefrontProduct } from '@/lib/storefrontApi';
import { swatchColor } from '@/lib/swatchColor';
import { taka, useShopSession, ShopApiError } from './shopClient';
import { ui } from './ui';

const COLOUR_OPTION = /colou?r|রং|রঙ/i;

/**
 * Options, quantity and "Add to cart" / "Buy now" on the Shop's product page (2026-11-03, redesigned the same day like the reference
 * picture: "Select Size" as square chips, "Select Color : Brown" as round swatches, and a bottom bar with "Total price" and a big accent
 * "Add to cart" pill, which sticks above the phone menu on small screens). Prices shown are the store's public ones; the cart and checkout
 * work them out again on the server, so nothing here decides what is charged. A product the one-login checkout can't take (price on request,
 * coming soon, a pick-your-own box, personalised text) is bought on the store's own website instead.
 */
export function ShopBuyPanel({ subdomain, product: p, storeUrl }: { subdomain: string; product: StorefrontProduct; storeUrl: string }) {
  const router = useRouter();
  const add = useShopSession((s) => s.add);
  const options = useMemo(() => [...(p.variationOptions ?? [])].sort((a, b) => a.position - b.position), [p.variationOptions]);
  const [picked, setPicked] = useState<Record<string, string>>({});
  const step = Math.max(1, p.quantityStep ?? 1);
  const [qty, setQty] = useState(Math.max(step, p.minOrderQuantity ?? 1));
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  const websiteOnly = !!p.quoteOnly || !!p.comingSoon || !!p.bundlePick || (p.customFields?.length ?? 0) > 0;
  const allPicked = options.every((o) => picked[o.name]);
  const variant = options.length > 0 && allPicked ? p.variants.find((v) => options.every((o) => v.optionValues[o.name] === picked[o.name])) : undefined;

  const list = Number(variant?.listPrice ?? p.price);
  const sale = variant ? (variant.discountPrice != null ? Number(variant.discountPrice) : null) : p.discountPrice != null ? Number(p.discountPrice) : null;
  const price = sale !== null && sale < list ? sale : list;
  const off = price < list ? Math.round((1 - price / list) * 100) : 0;
  const stock = options.length > 0 ? (variant ? variant.stock : null) : (p.stockQuantity ?? null);
  const soldOut = !p.isPreOrder && stock !== null && stock <= 0;
  const max = Math.min(99, p.maxOrderQuantity ?? 99, !p.isPreOrder && stock !== null && stock > 0 ? stock : 99);

  const valueSoldOut = (name: string, value: string) =>
    !p.isPreOrder &&
    p.variants.length > 0 &&
    !p.variants.some((v) => v.optionValues[name] === value && v.stock > 0 && options.every((o) => o.name === name || !picked[o.name] || v.optionValues[o.name] === picked[o.name]));

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
    <div className="space-y-5">
      <p className="flex flex-wrap items-center gap-2">
        <span className="text-2xl font-extrabold text-[var(--shop-accent)]">{taka(price)}</span>
        {off > 0 ? (
          <>
            <span className="text-sm text-slate-400 line-through">{taka(list)}</span>
            <span className="rounded-full bg-[var(--shop-soft)] px-2 py-0.5 text-xs font-bold text-[var(--shop-accent)]">-{off}%</span>
          </>
        ) : null}
        {p.isPreOrder ? <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">Pre-order</span> : null}
      </p>

      {options.map((o) => {
        const colours = COLOUR_OPTION.test(o.name) ? o.values.map((v) => swatchColor(v)) : [];
        const asSwatches = colours.length > 0 && colours.every(Boolean);
        return (
          <div key={o.id}>
            <p className="mb-2 text-[15px] font-bold text-slate-900">
              Select {o.name}
              {picked[o.name] ? <span className="font-medium text-slate-500"> : {picked[o.name]}</span> : null}
            </p>
            <div className="flex flex-wrap gap-2.5">
              {o.values.map((v, n) => {
                const on = picked[o.name] === v;
                const out = valueSoldOut(o.name, v);
                const choose = () => setPicked((s) => ({ ...s, [o.name]: v }));
                return asSwatches ? (
                  <button
                    key={v}
                    type="button"
                    onClick={choose}
                    title={v}
                    aria-label={v}
                    aria-pressed={on}
                    className={`relative h-8 w-8 rounded-full ring-offset-2 transition ${on ? 'ring-2 ring-[var(--shop-accent)]' : 'ring-1 ring-slate-200'} ${out ? 'opacity-35' : ''}`}
                    style={{ background: colours[n] ?? undefined }}
                  />
                ) : (
                  <button key={v} type="button" onClick={choose} aria-pressed={on} className={ui.option(on, out)}>
                    {v}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {!websiteOnly && !soldOut ? (
        <div className="flex items-center gap-3">
          <span className="text-[15px] font-bold text-slate-900">Quantity</span>
          <div className="flex items-center rounded-full bg-slate-100 p-1">
            <button type="button" className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm" aria-label="Less" onClick={() => setQty((q) => Math.max(step, q - step))}>
              <Minus size={15} aria-hidden />
            </button>
            <span className="w-10 text-center text-sm font-semibold tabular-nums">{qty}</span>
            <button type="button" className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm" aria-label="More" onClick={() => setQty((q) => Math.min(max, q + step))}>
              <Plus size={15} aria-hidden />
            </button>
          </div>
          {stock !== null && stock > 0 && stock <= 5 && !p.isPreOrder ? <span className="text-xs font-semibold text-[var(--shop-accent)]">Only {stock} left</span> : null}
        </div>
      ) : null}

      {note ? <p className={`text-sm font-medium ${note.ok ? 'text-emerald-700' : 'text-[var(--shop-accent)]'}`}>{note.text}</p> : null}

      {/* The bottom bar: "Total price" and the action. Sticks above the phone menu on small screens. */}
      <div className="fixed inset-x-0 bottom-[84px] z-20 border-t border-slate-100 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(16,24,40,0.08)] backdrop-blur md:static md:inset-auto md:rounded-2xl md:border-0 md:bg-slate-50 md:p-4 md:shadow-none">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <div className="min-w-0">
            <p className="text-xs text-slate-500">Total price</p>
            <p className="text-lg font-extrabold tabular-nums text-slate-900">{taka(price * qty)}</p>
          </div>
          <div className="ml-auto flex gap-2">
            {websiteOnly ? (
              <a href={storeUrl} className={`${ui.primary} h-12 px-6`}>
                Buy on the store&apos;s website
              </a>
            ) : soldOut ? (
              <span className="inline-flex h-12 items-center rounded-full bg-slate-200 px-6 text-sm font-semibold text-slate-600">Out of stock</span>
            ) : (
              <>
                <button type="button" disabled={busy} onClick={() => put(true)} className={`${ui.secondary} hidden h-12 sm:inline-flex`}>
                  Buy now
                </button>
                <button type="button" disabled={busy} onClick={() => put(false)} className={`${ui.primary} h-12 px-6`}>
                  <ShoppingBag size={18} aria-hidden /> Add to cart
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      <p className="text-xs text-slate-500">One sign-in, one cart for every store on the Shop. Each store sends its own parcel.</p>
    </div>
  );
}
