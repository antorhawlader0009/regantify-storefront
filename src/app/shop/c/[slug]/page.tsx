import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { firstParam, getShopCategories, numberParam, searchShop, shopUrl, type ShopCategory, type ShopSearchInput } from '@/lib/shopApi';
import { ProductGrid } from '@/shop/ProductCard';
import { CategoryLinks, noticeFor, ShopHeader, ShopNotice } from '@/shop/ShopChrome';
import { Pagination, SearchFilters } from '@/shop/SearchControls';

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** The category with this slug, top-level or a child, and its top-level parent (for the category links row). */
function findCategory(tree: ShopCategory[], slug: string): { category: ShopCategory; top: ShopCategory } | null {
  for (const top of tree) {
    if (top.slug === slug) return { category: top, top };
    const child = top.children.find((c) => c.slug === slug);
    if (child) return { category: child, top };
  }
  return null;
}

// A category page (SHOP-plan.md Step 7): the Shop's real, browseable hierarchy, so it may be listed by search engines (page 1, default
// order); other orders and later pages point their canonical link at it.
export async function generateMetadata({ params, searchParams }: { params: Params; searchParams: SearchParams }): Promise<Metadata> {
  const { slug } = await params;
  const sp = await searchParams;
  const tree = await getShopCategories();
  const found = tree.ok ? findCategory(tree.data, slug) : null;
  if (!found) return { title: 'Category', robots: { index: false } };
  const plain = !firstParam(sp.sort) && !firstParam(sp.page) && !firstParam(sp.minPrice) && !firstParam(sp.maxPrice) && !firstParam(sp.inStock);
  const name = found.category.nameEn;
  return {
    title: name,
    description: `${name} from many Bangladeshi online stores${found.category.nameBn ? ` (${found.category.nameBn})` : ''}. Compare and buy on each store’s own page.`,
    alternates: { canonical: shopUrl(`/c/${slug}`) },
    robots: plain ? undefined : { index: false, follow: true },
  };
}

export default async function ShopCategoryPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { slug } = await params;
  const sp = await searchParams;
  const tree = await getShopCategories();
  if (!tree.ok) {
    const n = noticeFor(tree.paused);
    return (
      <>
        <ShopHeader />
        <ShopNotice title={n.title} text={n.text} />
      </>
    );
  }
  const found = findCategory(tree.data, slug);
  if (!found) notFound();

  const input: ShopSearchInput = {
    page: Math.min(20, Math.max(1, Math.floor(numberParam(sp.page) ?? 1))),
    sort: firstParam(sp.sort),
    minPrice: numberParam(sp.minPrice),
    maxPrice: numberParam(sp.maxPrice),
    inStock: firstParam(sp.inStock) === 'true',
    category: slug,
  };
  const result = await searchShop(input);
  const path = `/shop/c/${slug}`;
  return (
    <>
      <ShopHeader />
      <main className="mx-auto max-w-7xl px-4 py-6">
        <CategoryLinks categories={tree.data} active={found.top.slug} />
        <h1 className="mb-1 mt-4 text-xl font-semibold">
          {found.category.nameEn}
          {found.category.nameBn ? <span className="ml-2 text-base font-normal text-slate-500">{found.category.nameBn}</span> : null}
        </h1>
        {found.category.children.length > 0 ? (
          <div className="mb-3 flex flex-wrap gap-2 text-sm">
            {found.category.children
              .filter((c) => c.productCount > 0)
              .map((c) => (
                <a key={c.slug} href={`/shop/c/${c.slug}`} className="rounded-full bg-white px-3 py-1 text-slate-700 ring-1 ring-slate-200 hover:ring-emerald-600">
                  {c.nameEn}
                </a>
              ))}
          </div>
        ) : null}
        <SearchFilters action={path} input={input} />
        <div className="mt-4">
          {!result.ok ? (
            <ShopNotice {...noticeFor(result.paused)} />
          ) : result.data.items.length === 0 ? (
            <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">No products in this category yet.</p>
          ) : (
            <>
              <ProductGrid items={result.data.items} priorityFirst={6} />
              <Pagination path={path} input={input} hasMore={result.data.hasMore} />
            </>
          )}
        </div>
      </main>
    </>
  );
}
