import type { Metadata, Viewport } from 'next';
import type { CSSProperties } from 'react';
import { SHOP_NAME } from '@/lib/shopApi';
import { ShopBottomNav, ShopFooter } from '@/shop/ShopChrome';
import { SHOP_ACCENT, SHOP_ACCENT_DARK, SHOP_ACCENT_SOFT } from '@/shop/ui';

// The Regantify Shop (SHOP-plan.md Step 7): the platform's marketplace at shop.ROOT_DOMAIN (middleware.ts), or /shop on a local address.
// Its own design (2026-11-03: the red/coral marketplace design of the Regantify app, shop/ui.ts); no store theme is involved. Each page draws
// its own header (the search box shows the page's query).
export const metadata: Metadata = {
  title: { default: SHOP_NAME, template: `%s | ${SHOP_NAME}` },
  description: 'Products from many Bangladeshi online stores in one place. Search once, sign in once and buy from any of them.',
  // Step 13: Search Console / Bing for the Shop's own address (shop.ROOT_DOMAIN). Only the code from the HTML-tag method; a Domain property
  // verified by DNS needs neither. Unset = no tag.
  verification: {
    ...(process.env.SHOP_GOOGLE_SITE_VERIFICATION?.trim() ? { google: process.env.SHOP_GOOGLE_SITE_VERIFICATION.trim() } : {}),
    ...(process.env.SHOP_BING_SITE_VERIFICATION?.trim() ? { other: { 'msvalidate.01': process.env.SHOP_BING_SITE_VERIFICATION.trim() } } : {}),
  },
};

export const viewport: Viewport = { themeColor: SHOP_ACCENT };

const TOKENS = { '--shop-accent': SHOP_ACCENT, '--shop-accent-dark': SHOP_ACCENT_DARK, '--shop-soft': SHOP_ACCENT_SOFT } as CSSProperties;

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={TOKENS} className="min-h-screen bg-[#F6F7F9] pb-24 text-slate-900 md:pb-0">
      {children}
      <ShopFooter />
      <ShopBottomNav />
    </div>
  );
}
