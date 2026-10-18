import type { Metadata } from 'next';
import { firstParam, numberParam, searchShop, type ShopSearchInput } from '@/lib/shopApi';
import { ProductGrid } from '@/shop/ProductCard';
import { noticeFor, ShopHeader, ShopNotice } from '@/shop/ShopChrome';
import { Pagination, SearchFilters } from '@/shop/SearchControls';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

// The Reseller tab (SHOP-plan.md Step 8): products that suppliers offer for resale, from the Shop search with scope=reseller. Only suppliers
// that are open to any store (approval mode OPEN) appear. A shopper can buy each one on its supplier's store like any Shop product; a store
// owner can add it to their own store from the dashboard ("Sell this in your store"). Like search results, not a page for search engines.
export const metadata: Metadata = { title: 'Products to resell', robots: { index: false, follow: true } };

export default async function ShopResellerPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const input: ShopSearchInput = {
    q: firstParam(sp.q)?.trim().slice(0, 200) || undefined,
    page: Math.min(20, Math.max(1, Math.floor(numberParam(sp.page) ?? 1))),
    sort: firstParam(sp.sort),
    minPrice: numberParam(sp.minPrice),
    maxPrice: numberParam(sp.maxPrice),
    inStock: firstParam(sp.inStock) === 'true',
    scope: 'reseller',
  };
  const result = await searchShop(input);
  return (
    <>
      <ShopHeader />
      <main className="mx-auto max-w-7xl px-4 py-6">
        <h1 className="text-xl font-semibold">Products to resell</h1>
        <p className="mb-4 mt-1 max-w-3xl text-sm text-slate-600">
          Have an online store on our platform? Add any of these to your store in one tap, sell at your price, and the supplier packs and ships
          the order for you. You see what you earn in your dashboard. Shopping? You can buy them straight from the supplier&apos;s store.
        </p>
        <SearchFilters action="/shop/reseller" input={input} withQuery />
        <div className="mt-4">
          {!result.ok ? (
            <ShopNotice {...noticeFor(result.paused)} />
          ) : result.data.items.length === 0 ? (
            <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
              {input.q ? <>No products to resell match “{input.q}”.</> : 'No products are offered for resale yet. Please come back later.'}
            </p>
          ) : (
            <>
              <ProductGrid items={result.data.items} priorityFirst={6} reseller />
              <Pagination path="/shop/reseller" input={input} hasMore={result.data.hasMore} />
            </>
          )}
        </div>
      </main>
    </>
  );
}
