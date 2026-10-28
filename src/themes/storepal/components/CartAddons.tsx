'use client';

import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Plus } from 'lucide-react';
import { useCartStore, useCartHydrated } from '@/providers/cart-store-provider';
import { formatPrice as plainPrice } from '../lib/formatPrice';
import type { StorefrontProduct } from '@/lib/storefrontApi';
import { useStoreText, useFormatPrice } from '../lib/storeText';

function apiOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL;
  if (configured) return configured.replace(/\/$/, '');
  return `${window.location.protocol}//${window.location.hostname}:4000`;
}

/**
 * "You may also like" in the StorePal cart and cart drawer (TellMe idea 48): the products the vendor picked in Add/Edit
 * Product > "Show with this" for what is in the cart, one tap to add. The server leaves out what is already in the
 * cart, hidden or sold-out products and ones with sizes or colours, and prices them as of today. Shows nothing when
 * the vendor picked nothing or the request fails.
 */
export function CartAddons({ subdomain }: { subdomain: string }) {
  const formatPrice = useFormatPrice(plainPrice);
  const t = useStoreText();
  const hydrated = useCartHydrated();
  const lines = useCartStore(useShallow((s) => s.lines.filter((l) => l.subdomain === subdomain)));
  const addLine = useCartStore((s) => s.addLine);
  const [products, setProducts] = useState<StorefrontProduct[]>([]);
  // Which products are in the cart changes what to suggest; quantities do not.
  const slugsKey = [...new Set(lines.map((l) => l.productSlug))].join(',');
  const storeName = lines[0]?.storeName ?? '';

  useEffect(() => {
    if (!hydrated || !slugsKey) {
      setProducts([]);
      return;
    }
    const controller = new AbortController();
    fetch(`${apiOrigin()}/v1/store/${encodeURIComponent(subdomain)}/cart-addons?slugs=${encodeURIComponent(slugsKey)}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((data: { products?: StorefrontProduct[] }) => setProducts(data.products ?? []))
      .catch(() => undefined); // Offline or a slow API: the box just doesn't appear.
    return () => controller.abort();
  }, [hydrated, subdomain, slugsKey]);

  if (products.length === 0) return null;

  return (
    <section aria-label={t('You may also like')} className="mt-4">
      <h2 className="mb-2 text-[14px] font-bold text-ink">{t('You may also like')}</h2>
      <ul className="space-y-2">
        {products.map((p) => {
          const price = p.discountPrice ?? p.price;
          return (
            <li key={p.id} className="flex items-center gap-3 rounded-lg border border-line bg-surface p-2">
              {p.photoUrls[0] ? (
                // eslint-disable-next-line @next/next/no-img-element -- a small thumbnail from the store's own product photos
                <img src={p.photoUrls[0]} alt="" className="h-14 w-14 shrink-0 rounded-md border border-line object-cover" />
              ) : (
                <span className="h-14 w-14 shrink-0 rounded-md bg-canvas" />
              )}
              <div className="min-w-0 flex-1">
                <p className="m-0 truncate text-[13px] font-medium text-ink">{p.name}</p>
                <p className="m-0 text-[13px] font-bold text-accent">
                  {formatPrice(price)}
                  {p.discountPrice && <span className="ml-1.5 text-[12px] font-normal text-muted line-through">{formatPrice(p.price)}</span>}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  addLine({
                    subdomain,
                    storeName,
                    productSlug: p.slug,
                    name: p.name,
                    image: p.photoUrls[0],
                    unitPrice: Number(price),
                    originalUnitPrice: p.discountPrice ? Number(p.price) : undefined,
                    quantity: Math.max(p.minOrderQuantity ?? 1, p.quantityStep ?? 1),
                    selectedOptions: {},
                    isPreOrder: p.isPreOrder,
                    minOrderQuantity: p.minOrderQuantity,
                    quantityStep: p.quantityStep,
                    productId: p.id,
                  })
                }
                className="inline-flex shrink-0 items-center gap-1 rounded-md border border-line-strong px-3 min-h-[36px] text-[12.5px] font-semibold text-ink transition-colors hover:bg-canvas"
                aria-label={`${t('Add')} ${p.name}`}
              >
                <Plus size={14} aria-hidden />
                {t('Add')}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
