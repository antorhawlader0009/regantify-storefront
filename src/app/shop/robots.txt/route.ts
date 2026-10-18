import { NextResponse } from 'next/server';
import { shopUrl } from '@/lib/shopApi';

// The Shop's robots.txt (SHOP-plan.md Step 7), served at shop.ROOT_DOMAIN/robots.txt (middleware.ts). Everything may be crawled: search
// pages say `noindex` themselves, and a crawler that is not let in can never read that. The sitemap line only when the platform has its domain.
export function GET() {
  const sitemap = shopUrl('/sitemap.xml');
  const lines = ['User-agent: *', 'Allow: /'];
  if (sitemap.startsWith('https://')) lines.push('', `Sitemap: ${sitemap}`);
  return new NextResponse(`${lines.join('\n')}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
}
