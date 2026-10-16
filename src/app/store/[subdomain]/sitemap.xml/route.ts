import { NextResponse } from 'next/server';
import { getSitemapData, getStoreBlog, getStoreFaq, siteUrl } from '@/lib/storefrontApi';
import { decodeStoreSegment } from '@/lib/storeAddress';

// One store's sitemap. On a store's own address (/sitemap.xml on {sub}.ROOT_DOMAIN or a custom domain) the middleware rewrites
// here, and every URL below is the clean public form of that page on the same address the store is reached on (siteUrl).
// Before, the sitemap was only reachable at the long /store/{sub}/sitemap.xml, listed the long /store/{sub}/product/x form of
// each URL, and had no way to be found from robots.txt.
//
// What it lists is what the server says may be indexed (StorefrontService.getSitemapData): public products (with their first
// photos, so they can show up in image search), published pages and landing pages, collections, campaign pages, the magazine
// and the FAQ. A store that switched indexing off (Store > SEO) has no sitemap at all (404), and robots.txt blocks it.

function esc(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

/** W3C date (the day is enough); null for anything that is not a date, so a bad value never reaches the file. */
function day(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

interface Entry {
  loc: string;
  lastmod: string | null;
  images?: string[];
}

export async function GET(_request: Request, { params }: { params: Promise<{ subdomain: string }> }) {
  // The address the request came in on travels in the internal segment (lib/storeAddress.ts, PERFORMANCE-PLAN.md Step 8).
  const { subdomain, address } = decodeStoreSegment((await params).subdomain);

  const data = await getSitemapData(subdomain).catch(() => null);
  if (!data || !data.indexable) return new NextResponse('Not found', { status: 404 });

  // Store > Magazine posts and the FAQ (StorePal only; both lists are empty on any other theme).
  const [blog, faq] = await Promise.all([
    getStoreBlog(subdomain, 48).catch(() => ({ posts: [] as { slug: string; publishedAt: string }[] })),
    getStoreFaq(subdomain).catch(() => ({ items: [] as unknown[] })),
  ]);

  const url = (path: string) => siteUrl(`/store/${subdomain}${path}`, address);
  const newest = data.products.map((p) => p.updatedAt).sort().at(-1) ?? null;

  const entries: Entry[] = [
    { loc: await url(''), lastmod: day(newest) },
    ...(faq.items.length > 0 ? [{ loc: await url('/faq'), lastmod: null }] : []),
    ...(await Promise.all(blog.posts.map(async (b) => ({ loc: await url(`/blog/${b.slug}`), lastmod: day(b.publishedAt) })))),
    ...(await Promise.all(data.products.map(async (p) => ({ loc: await url(`/p/${p.slug}`), lastmod: day(p.updatedAt), images: p.photos })))),
    ...(await Promise.all(data.pages.map(async (p) => ({ loc: await url(`/page/${p.slug}`), lastmod: day(p.updatedAt) })))),
    ...(await Promise.all(data.landingPages.map(async (p) => ({ loc: await url(`/l/${p.slug}`), lastmod: day(p.updatedAt) })))),
    ...(await Promise.all(data.collections.map(async (p) => ({ loc: await url(`/collection/${p.slug}`), lastmod: day(p.updatedAt) })))),
    ...(await Promise.all(data.campaigns.map(async (p) => ({ loc: await url(`/campaigns/${p.slug}`), lastmod: day(p.updatedAt) })))),
  ];

  const body = entries
    .map((e) => {
      const images = (e.images ?? []).filter((src) => /^https?:\/\//.test(src)).map((src) => `    <image:image><image:loc>${esc(src)}</image:loc></image:image>`);
      return [`  <url>`, `    <loc>${esc(e.loc)}</loc>`, ...(e.lastmod ? [`    <lastmod>${e.lastmod}</lastmod>`] : []), ...images, `  </url>`].join('\n');
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${body}
</urlset>
`;

  return new NextResponse(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
}
