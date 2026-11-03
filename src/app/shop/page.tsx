import type { Metadata } from 'next';
import Link from 'next/link';
import { getShopHome, shopUrl, SHOP_NAME, type ShopItem } from '@/lib/shopApi';
import { BannerCarousel } from '@/shop/BannerCarousel';
import { ProductGrid } from '@/shop/ProductCard';
import { CategoryLinks, noticeFor, ShopHeader, ShopNotice } from '@/shop/ShopChrome';
import { ui } from '@/shop/ui';

// The Shop home (SHOP-plan.md Step 7; redesigned 2026-11-03 in the app's marketplace look): Super Admin's banners as "#SpecialForYou",
// the categories as round buttons, featured products, Top products (the best of every store, with places for new stores) with sort chips,
// new arrivals and Super Admin's collections marked "show on home", from GET /v1/shop/home. Kept 60 seconds; the API keeps its answer 5 minutes.
export const revalidate = 60;

export const metadata: Metadata = {
  title: { absolute: `${SHOP_NAME}: shop from many stores at once` },
  alternates: { canonical: shopUrl('/') },
};

function SectionHead({ title, more }: { title: string; more?: string }) {
  return (
    <div className="mb-3 flex items-baseline justify-between">
      <h2 className={ui.sectionTitle}>{title}</h2>
      {more ? (
        <Link href={more} className={ui.seeAll}>
          See all
        </Link>
      ) : null}
    </div>
  );
}

function Section({ title, items, more, chips }: { title: string; items: ShopItem[]; more?: string; chips?: boolean }) {
  if (items.length === 0) return null;
  return (
    <section className="mt-9">
      <SectionHead title={title} more={more} />
      {chips ? (
        // Like the picture's filter chips: each opens the full list in that order.
        <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
          <span className={ui.chip(true)}>Popular</span>
          <Link href="/shop/search?sort=newest" className={ui.chip(false)}>
            Newest
          </Link>
          <Link href="/shop/search?sort=price_asc" className={ui.chip(false)}>
            Lowest price
          </Link>
          <Link href="/shop/search?sort=price_desc" className={ui.chip(false)}>
            Highest price
          </Link>
          <Link href="/shop/search?inStock=true" className={ui.chip(false)}>
            In stock
          </Link>
        </div>
      ) : null}
      <ProductGrid items={items} priorityFirst={title === 'Top products' ? 6 : 0} />
    </section>
  );
}

export default async function ShopHomePage() {
  const home = await getShopHome();
  if (!home.ok) {
    const n = noticeFor(home.paused);
    return (
      <>
        <ShopHeader />
        <ShopNotice title={n.title} text={n.text} />
      </>
    );
  }
  const { featured, top, newArrivals, categories } = home.data;
  const banners = home.data.banners ?? [];
  const collections = home.data.collections ?? [];
  const empty = featured.length === 0 && top.length === 0 && newArrivals.length === 0 && collections.length === 0;
  return (
    <>
      <ShopHeader />
      <main className="mx-auto max-w-7xl px-4 py-6">
        {banners.length > 0 ? (
          <section className="mb-8">
            <SectionHead title="#SpecialForYou" />
            <BannerCarousel banners={banners} />
          </section>
        ) : null}
        <CategoryLinks categories={categories} title="Category" />
        {empty ? (
          <ShopNotice title={`${SHOP_NAME} is opening soon`} text="Stores are joining now. Please come back in a little while." />
        ) : (
          <>
            <Section title="Featured" items={featured} />
            <Section title="Top products" items={top} more="/shop/search" chips />
            <Section title="New arrivals" items={newArrivals} more="/shop/search?sort=newest" />
            {collections.map((c) => (
              <Section key={c.slug} title={c.title} items={c.items} more={`/shop/collections/${c.slug}`} />
            ))}
          </>
        )}
      </main>
    </>
  );
}
