'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X } from 'lucide-react';
import type { StorefrontProduct } from '@/lib/storefrontApi';
import { useCartStore } from '@/providers/cart-store-provider';
import { readLastView } from '../lib/recentlyViewed';
import { useStoreText, useFormatPrice } from '../lib/storeText';
import { formatPrice as plainPrice } from '../lib/formatPrice';

function apiOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL;
  if (configured) return configured.replace(/\/$/, '');
  return `${window.location.protocol}//${window.location.hostname}:4000`;
}

/** A visit counts as "coming back" when the last product was opened at least this long ago... */
const AWAY_MS = 30 * 60_000;
/** ...and not so long ago that it no longer matters. */
const STALE_MS = 14 * 86_400_000;

/**
 * "You were looking at this": when a shopper comes back to the store (the last product they opened was 30 minutes to 14 days ago, in
 * this browser), the top of the home page shows that product once per visit with a link back to it. Not shown when it is already in
 * the cart, after "×" on the same product, or when the product is no longer on sale (looked up fresh, so the price is today's).
 * Everything stays in the browser.
 */
export function ComebackNudge({ subdomain }: { subdomain: string }) {
  const t = useStoreText();
  const formatPrice = useFormatPrice(plainPrice);
  const [product, setProduct] = useState<StorefrontProduct | null>(null);
  const inCart = useCartStore((s) => s.lines.some((l) => l.subdomain === subdomain && l.productSlug === product?.slug));

  useEffect(() => {
    const seenKey = `storepal-comeback:${subdomain}`;
    const dismissKey = `storepal-comeback-dismissed:${subdomain}`;
    let already = false;
    try {
      already = sessionStorage.getItem(seenKey) === '1';
      sessionStorage.setItem(seenKey, '1');
    } catch {
      return;
    }
    const last = readLastView(subdomain);
    if (already || !last) return;
    const age = Date.now() - last.at;
    if (age < AWAY_MS || age > STALE_MS) return;
    try {
      if (localStorage.getItem(dismissKey) === last.slug) return;
    } catch {
      return;
    }
    const controller = new AbortController();
    fetch(`${apiOrigin()}/v1/store/${encodeURIComponent(subdomain)}/products/by-slugs?slugs=${encodeURIComponent(last.slug)}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((data: { products?: StorefrontProduct[] }) => setProduct(data.products?.[0] ?? null))
      .catch(() => undefined);
    return () => controller.abort();
  }, [subdomain]);

  if (!product || inCart) return null;
  const dismiss = () => {
    try {
      localStorage.setItem(`storepal-comeback-dismissed:${subdomain}`, product.slug);
    } catch {
      // Storage blocked: it just closes for now.
    }
    setProduct(null);
  };
  const onSale = product.discountPrice && Number(product.discountPrice) < Number(product.price);

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 pt-4">
      <div className="relative flex items-center gap-3 rounded-lg border border-line bg-surface p-3 pr-10 shadow-card">
        <Link href={`/store/${subdomain}/product/${product.slug}`} className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-canvas">
          {product.photoUrls[0] && <Image src={product.photoUrls[0]} alt={product.name} fill sizes="56px" className="object-cover" />}
        </Link>
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[11.5px] font-semibold uppercase tracking-wide text-accent">{t('You were looking at this')}</p>
          <p className="m-0 truncate text-[14px] font-semibold text-ink">{product.name}</p>
          <p className="m-0 text-[13px] text-muted">{formatPrice(onSale ? product.discountPrice! : product.price)}</p>
        </div>
        <Link href={`/store/${subdomain}/product/${product.slug}`} className="shrink-0 rounded-md bg-ink px-3 py-2 text-[12.5px] font-semibold text-white">
          {t('Take another look')}
        </Link>
        <button type="button" onClick={dismiss} aria-label={t('Close')} className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-muted hover:text-ink">
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
