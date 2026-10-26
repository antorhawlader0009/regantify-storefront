'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { StorefrontCategoryDetail, StorefrontProduct, StorefrontStockSettings } from '@/lib/storefrontApi';
import type { StoreFooterConfig } from '@/lib/socialLinksApi';
import { apiOrigin } from '@/lib/checkoutApi';
import { isOutOfStock } from '@/lib/productDisplay';
import { StoreHeader } from '../components/StoreHeader';
import { StoreFooter } from '../components/StoreFooter';
import { useCompare } from '../lib/compare';
import { formatPrice as plainPrice } from '../lib/formatPrice';
import { resolvePolicy, policyLines } from '../lib/policy';
import { useStorePalDesign } from '../lib/designSettings';
import { useFormatPrice } from '../lib/storeText';

interface CompareViewProps {
  subdomain: string;
  storeName: string;
  categories: string[];
  categoryDetails?: StorefrontCategoryDetail[];
  logoUrl?: string | null;
  footerConfig?: StoreFooterConfig | null;
  stockSettings?: StorefrontStockSettings;
}

/**
 * Compare products side by side (TellMe idea 74): up to 3 products, one column each, rows for today's price (campaign and flash sale
 * included), stock, brand, category, weight, warranty and returns, and the size / colour options. The slugs are kept in this browser; the
 * products come fresh by slug, so the price and stock are today's. Only what the store already holds is compared: there is no
 * specification field yet.
 */
export function CompareView({ subdomain, storeName, categories, categoryDetails, logoUrl, footerConfig, stockSettings }: CompareViewProps) {
  const formatPrice = useFormatPrice(plainPrice);
  const design = useStorePalDesign();
  const bn = design.storeLanguage === 'bn';
  const { slugs, toggle, clear } = useCompare(subdomain);
  const [products, setProducts] = useState<StorefrontProduct[] | null>(null);

  const wanted = slugs.join(',');
  useEffect(() => {
    if (!wanted) {
      setProducts([]);
      return;
    }
    const controller = new AbortController();
    fetch(`${apiOrigin()}/v1/store/${encodeURIComponent(subdomain)}/products/by-slugs?slugs=${encodeURIComponent(wanted)}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((data: { products?: StorefrontProduct[] }) => setProducts((data.products ?? []).sort((a, b) => slugs.indexOf(a.slug) - slugs.indexOf(b.slug))))
      .catch(() => undefined);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subdomain, wanted]);

  const rows: { label: string; cell: (p: StorefrontProduct) => React.ReactNode }[] = [
    {
      label: bn ? 'আজকের দাম' : 'Price today',
      cell: (p) => <span className="font-bold text-accent">{formatPrice(p.discountPrice ?? p.price)}</span>,
    },
    {
      label: bn ? 'স্টক' : 'In stock',
      cell: (p) => (isOutOfStock(p) ? (bn ? 'নেই' : 'No') : bn ? 'আছে' : 'Yes'),
    },
    { label: bn ? 'ব্র্যান্ড' : 'Brand', cell: (p) => p.brand || '–' },
    { label: bn ? 'ক্যাটাগরি' : 'Category', cell: (p) => p.category || '–' },
    { label: bn ? 'ওজন' : 'Weight', cell: (p) => (p.weight ? `${Number(p.weight)} ${p.weightUnit}` : '–') },
    { label: bn ? 'ওয়ারেন্টি' : 'Warranty', cell: (p) => policyLines(resolvePolicy(p, stockSettings), design.storeLanguage).warranty ?? '–' },
    { label: bn ? 'ফেরত বা বদল' : 'Returns', cell: (p) => policyLines(resolvePolicy(p, stockSettings), design.storeLanguage).returns ?? '–' },
    {
      label: bn ? 'সাইজ / রঙ' : 'Options',
      cell: (p) => (p.variationOptions && p.variationOptions.length > 0 ? p.variationOptions.map((o) => `${o.name}: ${o.values.join(', ')}`).join(' · ') : '–'),
    },
  ];

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <StoreHeader subdomain={subdomain} storeName={storeName} categories={categories} categoryDetails={categoryDetails} logoUrl={logoUrl} />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h1 className="m-0 text-[22px] font-bold text-ink">{bn ? 'পণ্য তুলনা' : 'Compare products'}</h1>
          {slugs.length > 0 && (
            <button type="button" onClick={clear} className="text-[12.5px] text-muted hover:text-accent">
              {bn ? 'সব মুছুন' : 'Clear all'}
            </button>
          )}
        </div>
        {products !== null && products.length < 2 ? (
          <div className="text-center py-16 bg-surface border border-line rounded-lg">
            <p className="text-[15px] font-semibold text-ink mb-1.5">{bn ? 'তুলনা করতে অন্তত ২টা পণ্য বাছুন' : 'Pick at least 2 products to compare'}</p>
            <Link href={`/store/${subdomain}`} className="inline-block mt-3 px-5 py-2.5 rounded-md bg-ink text-white text-[13px] font-semibold">
              {bn ? 'দোকানে ফিরুন' : 'Back to the shop'}
            </Link>
          </div>
        ) : products === null ? (
          <p className="text-[13px] text-muted">…</p>
        ) : (
          <div className="overflow-x-auto bg-surface border border-line rounded-lg">
            <table className="w-full min-w-[560px] border-collapse text-[13px]">
              <thead>
                <tr>
                  <th className="w-32 border-b border-line p-3" />
                  {products.map((p) => (
                    <th key={p.id} className="border-b border-l border-line p-3 align-top text-left font-normal">
                      <Link href={`/store/${subdomain}/product/${p.slug}`} className="block">
                        <span className="relative mb-2 block aspect-square w-full max-w-[180px] overflow-hidden rounded bg-canvas">
                          {p.photoUrls[0] && <Image src={p.photoUrls[0]} alt={p.name} fill sizes="180px" className="object-cover" />}
                        </span>
                        <span className="block font-semibold text-ink hover:text-accent">{p.name}</span>
                      </Link>
                      <button type="button" onClick={() => toggle(p.slug)} className="mt-1 text-[12px] text-muted hover:text-accent">
                        {bn ? 'সরান' : 'Remove'}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.label}>
                    <th className="border-b border-line p-3 text-left align-top font-semibold text-muted">{r.label}</th>
                    {products.map((p) => (
                      <td key={p.id} className="border-b border-l border-line p-3 align-top">
                        {r.cell(p)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <StoreFooter subdomain={subdomain} storeName={storeName} logoUrl={logoUrl} footerConfig={footerConfig} />
    </div>
  );
}
