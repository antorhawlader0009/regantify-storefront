import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getShopCategories, getShopCollection, shopUrl, SHOP_NAME } from '@/lib/shopApi';
import { ProductGrid } from '@/shop/ProductCard';
import { CategoryLinks, noticeFor, ShopHeader, ShopNotice } from '@/shop/ShopChrome';

type Params = Promise<{ slug: string }>;

// A curated collection (SHOP-plan.md Step 9): products Super Admin picked, in Super Admin's order, from GET /v1/shop/collections/:slug.
// Products that left the Shop are simply missing. Kept 60 seconds.
export const revalidate = 60;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const c = await getShopCollection(slug);
  if (!c.ok || !c.data) return { title: 'Collection', robots: { index: false } };
  return {
    title: c.data.title,
    description: c.data.description ?? `${c.data.title}: picked by ${SHOP_NAME} from many Bangladeshi online stores.`,
    alternates: { canonical: shopUrl(`/collections/${c.data.slug}`) },
  };
}

export default async function ShopCollectionPage({ params }: { params: Params }) {
  const { slug } = await params;
  const [c, tree] = await Promise.all([getShopCollection(slug), getShopCategories()]);
  if (!c.ok) {
    const n = noticeFor(c.paused);
    return (
      <>
        <ShopHeader />
        <ShopNotice title={n.title} text={n.text} />
      </>
    );
  }
  if (!c.data) notFound();
  return (
    <>
      <ShopHeader />
      <main className="mx-auto max-w-7xl px-4 py-6">
        {tree.ok ? <CategoryLinks categories={tree.data} /> : null}
        <h1 className="mb-1 mt-4 text-xl font-semibold">{c.data.title}</h1>
        {c.data.description ? <p className="mb-4 max-w-2xl text-sm text-slate-600">{c.data.description}</p> : null}
        {c.data.items.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">No products here right now.</p>
        ) : (
          <ProductGrid items={c.data.items} priorityFirst={6} />
        )}
      </main>
    </>
  );
}
