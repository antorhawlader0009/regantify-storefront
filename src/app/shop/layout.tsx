import type { Metadata } from 'next';
import { SHOP_NAME } from '@/lib/shopApi';
import { ShopFooter } from '@/shop/ShopChrome';

// The Regantify Shop (SHOP-plan.md Step 7): the platform's marketplace at shop.ROOT_DOMAIN (middleware.ts), or /shop on a local address.
// Its own simple design; no store theme is involved. Each page draws its own header (the search box shows the page's query).
export const metadata: Metadata = {
  title: { default: SHOP_NAME, template: `%s | ${SHOP_NAME}` },
  description: 'Products from many Bangladeshi online stores in one place. Search once, then buy on the store’s own page.',
  // Step 13: Search Console / Bing for the Shop's own address (shop.ROOT_DOMAIN). Only the code from the HTML-tag method; a Domain property
  // verified by DNS needs neither. Unset = no tag.
  verification: {
    ...(process.env.SHOP_GOOGLE_SITE_VERIFICATION?.trim() ? { google: process.env.SHOP_GOOGLE_SITE_VERIFICATION.trim() } : {}),
    ...(process.env.SHOP_BING_SITE_VERIFICATION?.trim() ? { other: { 'msvalidate.01': process.env.SHOP_BING_SITE_VERIFICATION.trim() } } : {}),
  },
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {children}
      <ShopFooter />
    </div>
  );
}
