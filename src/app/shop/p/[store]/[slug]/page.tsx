import type { Metadata } from 'next';
import { BadgeCheck, Star, Store as StoreIcon, Truck } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getShopProduct, shopUrl, storeSiteUrl } from '@/lib/shopApi';
import { noticeFor, ShopHeader, ShopNotice } from '@/shop/ShopChrome';
import { ShopBuyPanel } from '@/shop/ShopBuyPanel';
import { AboutText } from '@/shop/AboutText';
import { ShopGallery } from '@/shop/ShopGallery';
import { ui } from '@/shop/ui';

type Params = Promise<{ store: string; slug: string }>;

const STORE_ADDRESS = /^[a-z0-9-]{1,63}$/;

/** Plain text from a store's description (it may hold simple HTML); the Shop page shows text only. */
function plain(html: string | null | undefined, max = 2000): string {
  return (html ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|li|h\d|div)>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max);
}

function canonicalOf(store: string, slug: string): string {
  const own = storeSiteUrl(store, slug).split('?')[0];
  return own.startsWith('http') ? own : shopUrl(`/p/${store}/${slug}`);
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { store, slug } = await params;
  if (!STORE_ADDRESS.test(store)) return {};
  const r = await getShopProduct(store, decodeURIComponent(slug));
  if (!r.ok || !r.data) return { title: 'Product' };
  const p = r.data.product;
  return {
    title: `${p.name} | ${r.data.store.name}`,
    description: plain(p.summary || p.description, 160) || undefined,
    // The store's own page is the product's real home (one address per product for search engines).
    alternates: { canonical: canonicalOf(store, p.slug) },
  };
}

/**
 * The Shop's own product page (2026-11-03): a shopper signed in once on the Shop adds any store's product to one cart and checks out with
 * one address; each store gets its own order. The data is the app's product answer (the store's public product), kept 60 seconds.
 */
export default async function ShopProductPage({ params }: { params: Params }) {
  const { store, slug } = await params;
  if (!STORE_ADDRESS.test(store)) notFound();
  const r = await getShopProduct(store, decodeURIComponent(slug));
  if (!r.ok) {
    const n = noticeFor(r.paused);
    return (
      <>
        <ShopHeader />
        <ShopNotice title={n.title} text={n.text} />
      </>
    );
  }
  if (!r.data) notFound();
  const { product: p, store: s } = r.data;
  const photos = p.images?.length ? p.images.map((i) => i.large) : p.photoUrls;
  const about = plain(p.description);

  return (
    <>
      <ShopHeader />
      <main className="mx-auto grid max-w-6xl gap-6 px-4 pb-28 pt-6 md:grid-cols-2 md:gap-10 md:pb-6">
        <ShopGallery photos={photos} name={p.name} />

        <div className={`-mx-4 space-y-5 rounded-t-[28px] px-5 pb-6 pt-6 md:mx-0 md:rounded-[28px] ${ui.card}`}>
          <div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-500">{p.category || 'Product'}</span>
              {p.rating && p.rating.count > 0 ? (
                <span className="flex items-center gap-1 font-semibold text-slate-800">
                  <Star size={16} className="fill-amber-400 text-amber-400" aria-hidden /> {p.rating.average.toFixed(1)}
                  <span className="font-normal text-slate-500">({p.rating.count})</span>
                </span>
              ) : null}
            </div>
            <h1 className="mt-1.5 text-xl font-bold leading-snug text-slate-900 sm:text-2xl">{p.name}</h1>
            <a href={storeSiteUrl(s.subdomain)} className="mt-2 inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-[var(--shop-accent)]">
              <StoreIcon size={15} aria-hidden /> Sold by <span className="font-semibold text-slate-900">{s.name}</span>
              {s.verified ? <BadgeCheck size={15} className="text-[var(--shop-accent)]" aria-label="Verified seller" /> : null}
            </a>
          </div>

          {about ? <AboutText text={about} /> : null}

          <ShopBuyPanel subdomain={s.subdomain} product={p} storeUrl={storeSiteUrl(s.subdomain, p.slug)} />

          {r.data.alsoSoldBy > 0 ? (
            <Link href={`/shop/search?q=${encodeURIComponent(p.name.slice(0, 80))}`} className="block text-sm font-medium text-[var(--shop-accent)] hover:underline">
              Compare prices in {r.data.alsoSoldBy + 1} stores
            </Link>
          ) : null}

          <p className="flex items-start gap-2 rounded-2xl bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
            <Truck size={16} className="mt-0.5 shrink-0 text-[var(--shop-accent)]" aria-hidden />
            <span>
              {s.name} sends this parcel; its own delivery, returns and warranty apply.{' '}
              <a href={storeSiteUrl(s.subdomain, p.slug)} className="font-medium text-[var(--shop-accent)] hover:underline">
                See it on the store&apos;s website
              </a>
            </span>
          </p>
        </div>
      </main>
    </>
  );
}
