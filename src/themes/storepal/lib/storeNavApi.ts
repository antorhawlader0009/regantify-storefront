import type { StorefrontCategoryDetail } from '@/lib/storefrontApi';

// Same host-detection pattern as checkoutApi.ts/socialLinksApi.ts — see
// either file's header comment for why this can't use the server-only
// API_URL from storefrontApi.ts. Checkout/thank-you are Client
// Components (they read cart state from localStorage), so they can't
// call storefrontApi.ts's own getStoreProducts directly the way the
// home/product pages do.
function apiOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL;
  if (configured) return configured.replace(/\/$/, '');
  if (typeof window === 'undefined') return 'http://localhost:4000';
  return `${window.location.protocol}//${window.location.hostname}:4000`;
}

export interface StoreNavData {
  categories: string[];
  categoryDetails: StorefrontCategoryDetail[];
}

const EMPTY_NAV: StoreNavData = { categories: [], categoryDetails: [] };

/**
 * Just enough of the full product-list response (see
 * StorefrontListData) for StoreHeader's category strip + dropdowns —
 * checkout/thank-you don't need the actual product list, only the
 * category names/children, so this skips returning `products` entirely
 * rather than have those pages fetch (and discard) the whole catalog.
 * Falls back to an empty nav rather than throwing: a checkout page with
 * no category strip is a fine degraded state, not worth blocking
 * "Place Order" over.
 */
export async function getStoreNavData(subdomain: string): Promise<StoreNavData> {
  try {
    const res = await fetch(`${apiOrigin()}/api/v1/store/${subdomain}/products`);
    if (!res.ok) return EMPTY_NAV;
    const data = await res.json();
    return {
      categories: Array.isArray(data.categories) ? data.categories : [],
      categoryDetails: Array.isArray(data.categoryDetails) ? data.categoryDetails : [],
    };
  } catch {
    return EMPTY_NAV;
  }
}
