import { NextResponse } from 'next/server';
import { getStoreProducts, siteUrl } from '@/lib/storefrontApi';

// Per-store sitemap at /store/:subdomain/sitemap.xml — every product a
// vendor adds through Add Product (with visibility: Public) shows up
// here automatically the next time this is crawled, with zero action
// from the vendor. Linked from the store's own robots.txt entry isn't
// possible per-store (robots.txt is site-wide, see app/robots.ts), so
// this also gets referenced from each product/store page's <link
// rel="sitemap"> — see generateMetadata in the relevant page.tsx files.
//
// NOTE: this covers one vendor's products. A site-wide sitemap listing
// every vendor's store would need a public "list all vendors" endpoint,
// which doesn't exist yet on the API (every non-storefront endpoint is
// auth-guarded) — see storefront/README.md.
export async function GET(_request: Request, { params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = await params;

  let products;
  try {
    ({ products } = await getStoreProducts(subdomain));
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }

  const urls = [
    { loc: siteUrl(`/store/${subdomain}`), lastmod: new Date().toISOString() },
    ...products.map((p) => ({
      loc: siteUrl(`/store/${subdomain}/product/${p.slug}`),
      lastmod: p.createdAt,
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n  </url>`).join('\n')}
</urlset>`;

  return new NextResponse(xml, { headers: { 'Content-Type': 'application/xml' } });
}
