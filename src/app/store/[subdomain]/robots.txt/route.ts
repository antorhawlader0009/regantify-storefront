import { NextResponse } from 'next/server';
import { getStoreInfo, siteUrl } from '@/lib/storefrontApi';
import { decodeStoreSegment } from '@/lib/storeAddress';

// One store's robots.txt. On a store's own address (/robots.txt on {sub}.ROOT_DOMAIN or a custom domain) the middleware
// rewrites here, so every store answers with its own rules and a Sitemap line that names ITS address. Before this the
// platform's single robots.txt served every store: it had no Sitemap line, and its checkout rule only matched the long
// /store/{sub}/checkout form, not the clean /checkout.
//
// Blocked: the buying flow and one-person pages (nothing there is worth listing, and the crawler would only waste visits).
// Cart, wishlist and compare are left crawlable on purpose: they say `noindex` themselves (middleware.ts), and a crawler that
// is not allowed in can never read that.
// A store that switched indexing off (Store > SEO) blocks everything and has no sitemap line.
// The short ones end in a slash so "/t/" cannot catch some other page that merely starts with the letter.
const BLOCKED = ['checkout', 'payment-callback', 'account', 't/', 'pay/', 'r/', 'cart-link/', 'i/', 'confirm/'];

export async function GET(_request: Request, { params }: { params: Promise<{ subdomain: string }> }) {
  // The address the request came in on travels in the internal segment (lib/storeAddress.ts, PERFORMANCE-PLAN.md Step 8).
  const { subdomain, address } = decodeStoreSegment((await params).subdomain);
  const store = await getStoreInfo(subdomain).catch(() => null);
  if (!store) return new NextResponse('Not found', { status: 404 });

  const lines: string[] = ['User-agent: *'];
  if (store.seo && !store.seo.allowIndexing) {
    lines.push('Disallow: /');
  } else {
    lines.push('Allow: /');
    for (const segment of BLOCKED) {
      // Both forms of the address: /checkout and /store/{sub}/checkout.
      lines.push(`Disallow: /${segment}`, `Disallow: /store/*/${segment}`);
    }
    lines.push('', `Sitemap: ${await siteUrl(`/store/${subdomain}/sitemap.xml`, address)}`);
  }
  return new NextResponse(`${lines.join('\n')}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
}
