'use client';

import { useEffect, useState } from 'react';
import type { StorefrontCardProduct } from '@/lib/storefrontApi';
import { ProductCard } from './ProductCard';
import { useStoreText } from '../lib/storeText';

function apiOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL;
  if (configured) return configured.replace(/\/$/, '');
  return `${window.location.protocol}//${window.location.hostname}:4000`;
}

/**
 * The product page's "Often bought together" row (TellMe idea 97). The server returns the vendor's own "Show with this" picks first, then the
 * products real orders pair with this one, leaving out hidden, sold-out, quote-only and size/colour products, at today's price. Shows nothing
 * when there are none or the request fails.
 */
export function BoughtTogether({ subdomain, slug, storeName }: { subdomain: string; slug: string; storeName: string }) {
  const t = useStoreText();
  const [products, setProducts] = useState<StorefrontCardProduct[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${apiOrigin()}/v1/store/${encodeURIComponent(subdomain)}/products/${encodeURIComponent(slug)}/bought-together`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((data: { products?: StorefrontCardProduct[] }) => setProducts(data.products ?? []))
      .catch(() => undefined);
    return () => controller.abort();
  }, [subdomain, slug]);

  if (products.length === 0) return null;
  return (
    <section className="bg-surface border border-line rounded p-4 sm:p-6 mb-5">
      <h3 className="text-[15px] font-bold text-ink mb-4">{t('Often bought together')}</h3>
      <div className="grid gap-2 sm:gap-4 grid-cols-2 sm:[grid-template-columns:repeat(auto-fill,minmax(200px,1fr))]">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} subdomain={subdomain} storeName={storeName} />
        ))}
      </div>
    </section>
  );
}
