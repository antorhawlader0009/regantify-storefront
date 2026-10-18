import { NextResponse } from 'next/server';
import { getShopCategories, getShopHome, shopUrl } from '@/lib/shopApi';

// The Shop's sitemap (SHOP-plan.md Step 7 and 3.4 G): only the Shop's own pages, the home, every category with products and the curated
// collections shown on the home page (Step 9; a collection kept off the home page is not listed). Products are
// never listed here: each one's page belongs to its store (and is in that store's own sitemap).
const xmlEscape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export async function GET() {
  const [tree, home] = await Promise.all([getShopCategories(), getShopHome()]);
  const urls = [shopUrl('/')];
  if (tree.ok) {
    for (const top of tree.data) {
      if (top.productCount > 0) urls.push(shopUrl(`/c/${top.slug}`));
      for (const child of top.children) if (child.productCount > 0) urls.push(shopUrl(`/c/${child.slug}`));
    }
  }
  if (home.ok) for (const c of home.data.collections ?? []) urls.push(shopUrl(`/collections/${c.slug}`));
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${xmlEscape(u)}</loc></url>`)
    .join('\n')}\n</urlset>\n`;
  return new NextResponse(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}
