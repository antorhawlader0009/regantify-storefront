'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { shopProductPath } from '@/lib/shopApi';
import type { ShopPreviewLine, ShopStoreCard } from '@/lib/shopAccount';
import { cleanLines, shopApi, taka, useShopSession } from './shopClient';
import { useShopOverlay } from './overlay';

type Preview = {
  lines: ShopPreviewLine[];
  stores: Array<{ store: ShopStoreCard; subtotal: number; minOrderAmount: number | null; minOrderShort: number | null; lineIndexes: number[] }>;
  total: number;
};

const STATUS_TEXT: Record<ShopPreviewLine['status'], string> = {
  OK: '',
  REDUCED: 'Only this many can be bought now.',
  SOLD_OUT: 'Sold out',
  UNAVAILABLE: 'No longer available',
  WEBSITE_ONLY: 'Buy this on the store’s own website',
};

/**
 * The Shop's cart (2026-11-03): lines from any store, grouped by store with today's prices and stock (worked out again by the server, nothing
 * here decides a price). Checking out needs the one Shop sign-in.
 */
export function ShopCartView({ inPanel = false }: { inPanel?: boolean }) {
  const { ready, who, lines, setQuantity, remove } = useShopSession();
  const { open, close } = useShopOverlay();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (lines.length === 0) {
      setPreview({ lines: [], stores: [], total: 0 });
      return;
    }
    let live = true;
    shopApi<Preview>('market/cart/preview', { method: 'POST', body: { lines: cleanLines(lines) } })
      .then((p) => live && (setPreview(p), setError(null)))
      .catch((e: Error) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, [ready, lines]);

  if (!ready || (!preview && !error)) return <p className="py-10 text-center text-sm text-slate-500">Loading your cart…</p>;
  if (error) return <p className="py-10 text-center text-sm text-red-600">{error}</p>;
  if (!preview || preview.lines.length === 0)
    return (
      <div className="py-16 text-center">
        <p className="text-slate-700">Your cart is empty.</p>
        <Link href="/shop" onClick={close} className="mt-3 inline-block text-sm font-medium text-[var(--shop-accent)] hover:underline">
          Find something you like
        </Link>
      </div>
    );

  const buyable = preview.lines.some((l) => l.status === 'OK' || l.status === 'REDUCED');
  const blocked = preview.stores.some((s) => s.minOrderShort !== null);
  return (
    <div className="space-y-4">
      {inPanel ? null : <h1 className="text-lg font-semibold text-slate-900">Your cart</h1>}
      {preview.stores.map((s) => (
        <section key={s.store.subdomain} className="rounded-2xl bg-white shadow-[0_2px_12px_rgba(16,24,40,0.06)]">
          <header className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
            <p className="text-sm font-semibold text-slate-900">{s.store.name}</p>
            <p className="text-sm tabular-nums text-slate-700">{taka(s.subtotal)}</p>
          </header>
          <ul className="divide-y divide-slate-100">
            {s.lineIndexes.map((i) => {
              const l = preview.lines.find((x) => x.index === i);
              if (!l) return null;
              const okay = l.status === 'OK' || l.status === 'REDUCED';
              return (
                <li key={i} className="flex gap-3 px-4 py-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    {l.image ? <Image src={l.image.src} alt="" fill sizes="64px" className="object-cover" /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={shopProductPath(l.subdomain, l.slug)} onClick={close} className="line-clamp-2 text-sm font-medium text-slate-900 hover:underline">
                      {l.name}
                    </Link>
                    {Object.keys(l.selectedOptions).length ? (
                      <p className="text-xs text-slate-500">{Object.entries(l.selectedOptions).map(([k, v]) => `${k}: ${v}`).join(', ')}</p>
                    ) : null}
                    {STATUS_TEXT[l.status] ? <p className={`text-xs ${okay ? 'text-amber-700' : 'text-red-600'}`}>{STATUS_TEXT[l.status]}</p> : null}
                    <div className="mt-1.5 flex items-center gap-3">
                      {okay ? (
                        <div className="flex items-center rounded-lg border border-slate-200 text-sm">
                          <button type="button" className="px-2.5 py-0.5" aria-label="Less" onClick={() => setQuantity(i, lines[i].quantity - (l.step || 1))}>
                            −
                          </button>
                          <span className="w-8 text-center tabular-nums">{l.quantity}</span>
                          <button type="button" className="px-2.5 py-0.5" aria-label="More" onClick={() => setQuantity(i, lines[i].quantity + (l.step || 1))}>
                            +
                          </button>
                        </div>
                      ) : null}
                      <button type="button" className="text-xs text-slate-500 underline" onClick={() => remove([i])}>
                        Remove
                      </button>
                    </div>
                  </div>
                  <p className="shrink-0 text-sm font-medium tabular-nums text-slate-900">{okay ? taka(l.lineTotal) : ''}</p>
                </li>
              );
            })}
          </ul>
          {s.minOrderShort !== null ? (
            <p className="border-t border-slate-100 px-4 py-2 text-xs text-red-600">
              {s.store.name} takes orders from {taka(s.minOrderAmount ?? 0)}. Add {taka(s.minOrderShort)} more from this store.
            </p>
          ) : null}
        </section>
      ))}
      <div className="flex flex-col items-end gap-2 rounded-2xl bg-white shadow-[0_2px_12px_rgba(16,24,40,0.06)] p-4">
        <p className="text-sm text-slate-700">
          Products: <span className="font-semibold tabular-nums text-slate-900">{taka(preview.total)}</span>
        </p>
        <p className="text-xs text-slate-500">Delivery is added at checkout, by each store.</p>
        {buyable ? (
          <button
            type="button"
            disabled={blocked}
            onClick={() => (who ? open('checkout') : open('login', { after: 'checkout' }))}
            className={`w-full rounded-full px-5 py-3 text-sm font-semibold text-white sm:w-auto ${blocked ? 'cursor-not-allowed bg-slate-400' : 'bg-[var(--shop-accent)] hover:bg-[var(--shop-accent-dark)]'}`}
          >
            {who ? 'Checkout' : 'Sign in to checkout'}
          </button>
        ) : null}
      </div>
    </div>
  );
}
