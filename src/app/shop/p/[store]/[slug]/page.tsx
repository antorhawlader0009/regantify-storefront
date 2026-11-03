import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getShopProduct, shopUrl, storeSiteUrl } from '@/lib/shopApi';
import { noticeFor, ShopHeader, ShopNotice } from '@/shop/ShopChrome';
import { ShopBuyPanel } from '@/shop/ShopBuyPanel';

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
      <main className="mx-auto grid max-w-6xl gap-8 px-4 py-6 md:grid-cols-2">
        <div className="space-y-3">
          <div className="relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-white">
            {photos[0] ? <Image src={photos[0]} alt={p.name} fill priority sizes="(max-width: 768px) 100vw, 50vw" className="object-contain" /> : null}
          </div>
          {photos.length > 1 ? (
            <div className="grid grid-cols-5 gap-2">
              {photos.slice(1, 6).map((u) => (
                <div key={u} className="relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-white">
                  <Image src={u} alt="" fill sizes="20vw" className="object-cover" />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{p.name}</h1>
            <p className="mt-1 text-sm text-slate-600">
              Sold by{' '}
              <a href={storeSiteUrl(s.subdomain)} className="font-medium text-emerald-700 hover:underline">
                {s.name}
              </a>
              {s.verified ? <span className="ml-2 rounded bg-emerald-50 px-1.5 py-0.5 text-xs text-emerald-800">Verified seller</span> : null}
            </p>
          </div>

          <ShopBuyPanel subdomain={s.subdomain} product={p} storeUrl={storeSiteUrl(s.subdomain, p.slug)} />

          {r.data.alsoSoldBy > 0 ? (
            <Link href={`/shop/search?q=${encodeURIComponent(p.name.slice(0, 80))}`} className="block text-sm font-medium text-emerald-700 hover:underline">
              Compare prices in {r.data.alsoSoldBy + 1} stores
            </Link>
          ) : null}

          {about ? (
            <section>
              <h2 className="mb-1 text-sm font-semibold text-slate-900">About this product</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{about}</p>
            </section>
          ) : null}

          <p className="text-xs text-slate-500">
            Delivery, returns and warranty are {s.name}&apos;s own.{' '}
            <a href={storeSiteUrl(s.subdomain, p.slug)} className="text-emerald-700 hover:underline">
              See this product on the store&apos;s website
            </a>
          </p>
        </div>
      </main>
    </>
  );
}
