'use client';

import { useEffect, useState } from 'react';
import type { StorefrontProduct } from '@/lib/storefrontApi';
import { ProductCard } from './ProductCard';

function apiOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL;
  if (configured) return configured.replace(/\/$/, '');
  return `${window.location.protocol}//${window.location.hostname}:4000`;
}

// One answer per store for the whole visit: moving between account sections must not fetch the products again.
const cache = new Map<string, StorefrontProduct[]>();

/**
 * The store's own products, drawn behind "My account" (AccountLayout), so the dialog reads as sitting on top of the shop and the page behind it is not
 * empty. Purely for looks: it cannot be clicked, tabbed to or read by a screen reader (the dialog has the focus), and it shows nothing until the products
 * arrive. The floating chat and WhatsApp buttons stay hidden (CoverFloating in AccountLayout); only these cards show.
 */
export function AccountBackdrop({ subdomain, storeName }: { subdomain: string; storeName: string }) {
  const [products, setProducts] = useState<StorefrontProduct[]>(() => cache.get(subdomain) ?? []);
  useEffect(() => {
    if (cache.has(subdomain)) return;
    const controller = new AbortController();
    fetch(`${apiOrigin()}/v1/store/${encodeURIComponent(subdomain)}/products?view=list`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { products?: StorefrontProduct[] } | null) => {
        const list = (data?.products ?? []).slice(0, 12);
        cache.set(subdomain, list);
        setProducts(list);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [subdomain]);

  if (products.length === 0) return null;
  return (
    <div aria-hidden inert className="pointer-events-none select-none">
      <div className="mx-auto max-w-6xl px-3 py-6 sm:px-6">
        <div className="grid grid-cols-2 gap-2 sm:gap-4 sm:[grid-template-columns:repeat(auto-fill,minmax(180px,1fr))]">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} subdomain={subdomain} storeName={storeName} />
          ))}
        </div>
      </div>
    </div>
  );
}
