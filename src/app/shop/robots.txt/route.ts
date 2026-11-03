import { NextResponse } from 'next/server';
import { shopUrl } from '@/lib/shopApi';

// The Shop's robots.txt (SHOP-plan.md Step 7), served at shop.ROOT_DOMAIN/robots.txt (middleware.ts). Everything may be crawled: search
// pages say `noindex` themselves, and a crawler that is not let in can never read that. The sitemap line only when the platform has its domain.
export function GET() {
  const sitemap = shopUrl('/sitemap.xml');
  // The one-person pages of the Shop's own buying (2026-11-03) are not for search engines; they also say noindex themselves.
  const lines = ['User-agent: *', 'Allow: /', 'Disallow: /api/', 'Disallow: /cart', 'Disallow: /checkout', 'Disallow: /orders', 'Disallow: /login'];
  if (sitemap.startsWith('https://')) lines.push('', `Sitemap: ${sitemap}`);
  return new NextResponse(`${lines.join('\n')}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
}
