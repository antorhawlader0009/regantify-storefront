import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { firstParam, getShopHome, numberParam, searchShop, shopSearchQuery, type ShopSearchInput } from '@/lib/shopApi';
import { ProductGrid } from '@/shop/ProductCard';
import { noticeFor, ShopHeader, ShopNotice } from '@/shop/ShopChrome';
import { Pagination, SearchFilters } from '@/shop/SearchControls';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

// Search results (SHOP-plan.md Step 7). Never in a search engine (SHOP-plan.md 3.4 G: result pages are not pages worth listing); links are
// still followed. The middleware also sends `X-Robots-Tag: noindex` for any ?q= address.
export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const q = firstParam((await searchParams).q)?.trim();
  return { title: q ? `“${q.slice(0, 60)}”` : 'All products', robots: { index: false, follow: true } };
}

/** The store the shopper came from (Step 15): ?from= on this address, else the day-long cookie the middleware set. Its products come first. */
const STORE_ADDRESS = /^[a-z0-9-]{1,63}$/;

function inputFrom(sp: Record<string, string | string[] | undefined>, fromCookie: string | undefined): ShopSearchInput {
  const from = (firstParam(sp.from) ?? fromCookie)?.trim().toLowerCase();
  return {
    q: firstParam(sp.q)?.trim().slice(0, 200) || undefined,
    page: Math.min(20, Math.max(1, Math.floor(numberParam(sp.page) ?? 1))),
    sort: firstParam(sp.sort),
    minPrice: numberParam(sp.minPrice),
    maxPrice: numberParam(sp.maxPrice),
    inStock: firstParam(sp.inStock) === 'true',
    category: firstParam(sp.category)?.slice(0, 60),
    from: from && STORE_ADDRESS.test(from) ? from : undefined,
  };
}

export default async function ShopSearchPage({ searchParams }: { searchParams: SearchParams }) {
  const input = inputFrom(await searchParams, (await cookies()).get('shop_from')?.value);
  const result = await searchShop(input);
  if (!result.ok) {
    const n = noticeFor(result.paused);
    return (
      <>
        <ShopHeader query={input.q} />
        <ShopNotice title={n.title} text={n.text} />
      </>
    );
  }
  const { items, mode, hasMore, didYouMean } = result.data;
  // Nothing found: not a dead end (SHOP-plan.md 3.4 F). Show what sells well instead.
  const fallback = items.length === 0 ? await getShopHome() : null;
  return (
    <>
      <ShopHeader query={input.q} />
      <main className="mx-auto max-w-7xl px-4 py-6">
        <h1 className="mb-3 text-lg font-semibold">{input.q ? <>Results for “{input.q}”</> : 'All products'}</h1>
        {didYouMean ? (
          <p className="mb-3 text-sm text-slate-700">
            Did you mean{' '}
            <Link href={`/shop/search${shopSearchQuery({ ...input, q: didYouMean, page: 1 })}`} className="font-semibold text-emerald-700 hover:underline">
              {didYouMean}
            </Link>
            ?
          </p>
        ) : null}
        {mode === 'typo' ? <p className="mb-3 text-sm text-slate-600">No exact match, so these are close spellings.</p> : null}
        <SearchFilters action="/shop/search" input={input} />
        <div className="mt-4">
          {items.length > 0 ? (
            <>
              <ProductGrid items={items} priorityFirst={6} />
              <Pagination path="/shop/search" input={input} hasMore={hasMore} />
            </>
          ) : (
            <div>
              <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
                Nothing found{input.q ? <> for “{input.q}”</> : null}. Try fewer or different words, or Bangla / English spelling.
              </p>
              {fallback?.ok && fallback.data.top.length > 0 ? (
                <section className="mt-6">
                  <h2 className="mb-3 text-base font-semibold">Popular right now</h2>
                  <ProductGrid items={fallback.data.top.slice(0, 12)} />
                </section>
              ) : null}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
