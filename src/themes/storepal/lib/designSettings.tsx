'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { StorefrontDesignSettings, StorefrontMenuItem } from '@/lib/storefrontApi';

// Store > Design settings the vendor never saved. Must render StorePal
// exactly as it looked before those pages existed — keep in sync with the
// server's DesignSettingsService.DEFAULTS.
export const DEFAULT_DESIGN: StorefrontDesignSettings = {
  productImageShape: 'SQUARE',
  galleryStyle: 'BOTTOM',
  inStockMessage: null,
  outOfStockMessage: null,
  preOrderMessage: null,
  cardShowSummary: false,
  cardShowDefaultButton: false,
  cardShowViewButton: true,
  cardShowBuyNow: false,
  cardShowAddToCart: false,
  cardOptionsAsButtons: false,
  cardOptionsAsSelect: false,
  cardDisplayAsCard: true,
  cardShowVideo: false,
  cardShowWishlist: false,
  bannerEnabled: true,
  bannerContent: null,
  bannerStyle: 'MARQUEE',
  bannerBackgroundColor: null,
  layoutType: 'COMPACT',
  siteMenu: [],
  headerLeftMenu: [],
  headerRightMenu: [],
  mobileMenu: [],
};

const DesignContext = createContext<StorefrontDesignSettings>(DEFAULT_DESIGN);

/**
 * Mounted once by the store layout for StorePal, from the ISR-cached
 * store-info response, so every StorePal component (including the
 * client-only cart/checkout/account pages) reads the same settings
 * without another fetch or prop threading.
 */
export function StorePalDesignProvider({
  settings,
  showOutOfStockBadge = true,
  children,
}: {
  settings: StorefrontDesignSettings | null;
  showOutOfStockBadge?: boolean;
  children: ReactNode;
}) {
  // Spread over the defaults so an older cached response missing a newer
  // field still gets a sane value.
  return (
    <DesignContext.Provider value={{ ...DEFAULT_DESIGN, ...settings }}>
      <OutOfStockBadgeContext.Provider value={showOutOfStockBadge}>{children}</OutOfStockBadgeContext.Provider>
    </DesignContext.Provider>
  );
}

export function useStorePalDesign() {
  return useContext(DesignContext);
}

// Store > Stock Settings' "Show Out of Stock badge on product cards",
// carried by the same provider so ProductCard needs no new prop at its
// many call sites.
const OutOfStockBadgeContext = createContext(true);

export function useShowOutOfStockBadge() {
  return useContext(OutOfStockBadgeContext);
}

const OTHER_PATHS: Record<string, string> = {
  SHOP: '',
  ACCOUNT: '/account/login',
  TRACK_ORDER: '/orders',
};

/**
 * Where a Store > Design menu item links to. Same `/store/{subdomain}/...`
 * paths every other StorePal link uses (the middleware maps them on real
 * subdomains/custom domains). Null for an item that can't be resolved.
 * `loggedIn` sends "My Account" to the orders page, like the header's
 * account icon.
 */
export function menuItemHref(item: StorefrontMenuItem, subdomain: string, loggedIn = false): string | null {
  if (item.type === 'OTHER' && item.value === 'ACCOUNT' && loggedIn) return `/store/${subdomain}/account/orders`;
  const base = `/store/${subdomain}`;
  const v = encodeURIComponent(item.value);
  switch (item.type) {
    case 'PAGE':
      return `${base}/page/${v}`;
    case 'PRODUCT':
      return `${base}/product/${v}`;
    case 'CATEGORY':
      return `${base}?category=${v}`;
    case 'BRAND':
      return `${base}?brand=${v}`;
    case 'OTHER':
      return item.value in OTHER_PATHS ? `${base}${OTHER_PATHS[item.value]}` : null;
    case 'CUSTOM':
      // The server only accepts http(s)/relative/#/mailto/tel links.
      return item.value || null;
  }
}

export function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href);
}

/**
 * The product page's stock line with the vendor's Product Display
 * wording, or StorePal's built-in text when a message is blank.
 * "##stock" becomes the remaining count (dropped when stock isn't tracked).
 */
export function stockMessages(design: StorefrontDesignSettings) {
  return {
    inStock: (stock: number | undefined) => {
      if (!design.inStockMessage) return stock === undefined ? 'In stock' : `${stock} units in stock`;
      return design.inStockMessage.replace(/##stock/g, stock === undefined ? '' : String(stock)).replace(/\s+/g, ' ').trim();
    },
    outOfStock: design.outOfStockMessage || 'Out of stock',
    preOrder: design.preOrderMessage || 'Available for pre-order',
  };
}
