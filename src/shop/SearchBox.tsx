'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatTaka, shopApiOrigin, type ShopSuggestData } from '@/lib/shopApi';

/**
 * The Shop's search box (SHOP-plan.md Step 7): Enter opens the results page; while typing (2+ letters, 200 ms after the last key) it shows
 * popular search words that found something and a few products, from GET /v1/shop/suggest. Links go to /shop/... so they work on the
 * Shop's own address and at /shop locally.
 */
export function SearchBox({ initial = '' }: { initial?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initial);
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<ShopSuggestData | null>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const text = q.trim();
    if (text.length < 2) {
      setData(null);
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      fetch(`${shopApiOrigin()}/v1/shop/suggest?q=${encodeURIComponent(text.slice(0, 80))}`, { signal: ctrl.signal })
        .then((r) => (r.ok ? (r.json() as Promise<ShopSuggestData>) : null))
        .then((d) => setData(d))
        .catch(() => undefined);
    }, 200);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [q]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const go = (text: string) => {
    const t = text.trim();
    setOpen(false);
    router.push(t ? `/shop/search?q=${encodeURIComponent(t)}` : '/shop/search');
  };

  const hasSuggestions = !!data && (data.queries.length > 0 || data.products.length > 0);

  return (
    <div ref={box} className="relative w-full">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          go(q);
        }}
      >
        <label htmlFor="shop-search" className="sr-only">
          Search products from every store
        </label>
        <input
          id="shop-search"
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false);
          }}
          placeholder="Search products from every store (panjabi, মধু, smart watch...)"
          autoComplete="off"
          maxLength={200}
          className="w-full rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
        />
      </form>
      {open && hasSuggestions ? (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          {data!.queries.length > 0 ? (
            <ul className="border-b border-slate-100 py-1">
              {data!.queries.map((term) => (
                <li key={term}>
                  <button type="button" onClick={() => go(term)} className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">
                    {term}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {data!.products.length > 0 ? (
            <ul className="py-1">
              {data!.products.map((p) => (
                <li key={p.productId}>
                  <a href={p.url} className="flex items-center justify-between gap-3 px-4 py-2 text-sm hover:bg-slate-50">
                    <span className="truncate text-slate-800">{p.name}</span>
                    <span className="shrink-0 text-slate-500">{formatTaka(p.price)}</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
