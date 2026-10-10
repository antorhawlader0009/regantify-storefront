'use client';

import { useEffect, useState } from 'react';
import type { StorefrontProduct } from '@/lib/storefrontApi';
import { ProductCard } from './ProductCard';
import { recordView, useRecentlyViewed } from '../lib/recentlyViewed';
import { useStoreText } from '../lib/storeText';

function apiOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL;
  if (configured) return configured.replace(/\/$/, '');
  return `${window.location.protocol}//${window.location.hostname}:4000`;
}

/** The most cards shown; the browser remembers a few more, in case some were hidden or deleted since. */
const SHOWN = 6;

/**
 * "Recently viewed" (StorePal only): the last products this shopper opened in this browser, at the bottom of the home
 * page and of a product page. On a product page, pass `currentSlug`: that product is remembered and left out of the row.
 * Only slugs are kept in the browser; the cards come fresh from the store (today's price and stock), and a product
 * that was deleted or hidden quietly isn't shown. Nothing renders until there is at least one to show.
 */
export function RecentlyViewed({ subdomain, storeName, currentSlug }: { subdomain: string; storeName: string; currentSlug?: string }) {
  const t = useStoreText();
  const { slugs, clear } = useRecentlyViewed(subdomain);
  const [products, setProducts] = useState<StorefrontProduct[]>([]);

  // Remember the product page being viewed.
  useEffect(() => {
    if (currentSlug) recordView(subdomain, currentSlug);
  }, [subdomain, currentSlug]);

  // What to show: the remembered slugs without the current product.
  const wanted = slugs.filter((s) => s !== currentSlug).join(',');
  useEffect(() => {
    if (!wanted) {
      setProducts([]);
      return;
    }
    const controller = new AbortController();
    fetch(`${apiOrigin()}/v1/store/${encodeURIComponent(subdomain)}/products/by-slugs?slugs=${encodeURIComponent(wanted)}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((data: { products?: StorefrontProduct[] }) => setProducts(data.products ?? []))
      .catch(() => undefined); // Offline or a slow API: the row just doesn't appear.
    return () => controller.abort();
  }, [subdomain, wanted]);

  const shown = products.slice(0, SHOWN);
  if (shown.length === 0) return null;

  return (
    <section aria-label={t('Recently viewed')} className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-[18px] font-bold text-ink">{t('Recently viewed')}</h2>
        <button type="button" onClick={clear} className="text-[12px] text-muted hover:text-accent transition-colors">
          {t('Clear')}
        </button>
      </div>
      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:[grid-template-columns:repeat(auto-fill,minmax(180px,1fr))]">
        {shown.map((product) => (
          <ProductCard key={product.id} product={product} subdomain={subdomain} storeName={storeName} />
        ))}
      </div>
    </section>
  );
}
