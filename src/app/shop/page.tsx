import type { Metadata } from 'next';
import Link from 'next/link';
import { getShopHome, shopUrl, SHOP_NAME, type ShopBanner, type ShopItem } from '@/lib/shopApi';
import { ProductGrid } from '@/shop/ProductCard';
import { CategoryLinks, noticeFor, ShopHeader, ShopNotice } from '@/shop/ShopChrome';

// The Shop home (SHOP-plan.md Step 7): Super Admin's banners (Step 9), featured products, Top products (the best of every store, with places
// for new stores), new arrivals, Super Admin's collections marked "show on home" (Step 9) and the categories, from GET /v1/shop/home. Kept 60 seconds; the API keeps its answer 5 minutes.
export const revalidate = 60;

export const metadata: Metadata = {
  title: { absolute: `${SHOP_NAME}: shop from many stores at once` },
  alternates: { canonical: shopUrl('/') },
};

function Section({ title, items, more }: { title: string; items: ShopItem[]; more?: { href: string; label: string } }) {
  if (items.length === 0) return null;
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        {more ? (
          <Link href={more.href} className="text-sm text-emerald-700 hover:underline">
            {more.label}
          </Link>
        ) : null}
      </div>
      <ProductGrid items={items} priorityFirst={title === 'Top products' ? 6 : 0} />
    </section>
  );
}

const TONE: Record<string, string> = {
  GREEN: 'bg-emerald-700 text-white',
  DARK: 'bg-slate-900 text-white',
  AMBER: 'bg-amber-100 text-amber-950',
};

/** A banner link is a Shop path or an https address (the server refuses anything else). Outside links open in a new tab. */
function Banners({ banners }: { banners: ShopBanner[] }) {
  if (banners.length === 0) return null;
  return (
    <div className="mt-4 grid gap-3">
      {banners.map((b) => {
        const inner = (
          <>
            <p className="text-base font-semibold sm:text-lg">{b.title}</p>
            {b.text ? <p className="mt-0.5 text-sm opacity-90">{b.text}</p> : null}
          </>
        );
        const cls = `block rounded-xl px-5 py-4 ${TONE[b.tone] ?? TONE.GREEN}`;
        if (!b.linkUrl) return <div key={b.id} className={cls}>{inner}</div>;
        const outside = /^https:///.test(b.linkUrl);
        return (
          <a key={b.id} href={b.linkUrl} className={`${cls} hover:opacity-95`} {...(outside ? { target: '_blank', rel: 'noopener' } : {})}>
            {inner}
          </a>
        );
      })}
    </div>
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
        <CategoryLinks categories={categories} />
        <Banners banners={banners} />
        {empty ? (
          <ShopNotice title={`${SHOP_NAME} is opening soon`} text="Stores are joining now. Please come back in a little while." />
        ) : (
          <>
            <Section title="Featured" items={featured} />
            <Section title="Top products" items={top} more={{ href: '/shop/search', label: 'See all' }} />
            <Section title="New arrivals" items={newArrivals} more={{ href: '/shop/search?sort=newest', label: 'See all' }} />
            {collections.map((c) => (
              <Section key={c.slug} title={c.title} items={c.items} more={{ href: `/shop/collections/${c.slug}`, label: 'See all' }} />
            ))}
          </>
        )}
      </main>
    </>
  );
}
