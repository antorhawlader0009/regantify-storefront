import type { StorefrontCategoryDetail } from '@/lib/storefrontApi';
import { detectApiOrigin } from '@/lib/detectApiOrigin';

// Same host-detection pattern as checkoutApi.ts/socialLinksApi.ts — see
// either file's header comment for why this can't use the server-only
// API_URL from storefrontApi.ts, and detectApiOrigin.ts for the
// local-vs-VPS auto-detect. Checkout/thank-you are Client Components
// (they read cart state from localStorage), so they can't call
// storefrontApi.ts's own getStoreProducts directly the way the
// home/product pages do.
async function apiOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_API_URL;
  if (configured) return configured.replace(/\/$/, '');
  if (typeof window === 'undefined') return 'http://localhost:4000';
  return detectApiOrigin(`${window.location.protocol}//${window.location.hostname}:4000`);
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
    const origin = await apiOrigin();
    const res = await fetch(`${origin}/v1/store/${subdomain}/products`);
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

export interface StoreSearchProduct {
  slug: string;
  name: string;
  photoUrls: string[];
  price: string;
  discountPrice?: string | null;
}

const EMPTY_SEARCH_INDEX: StoreSearchProduct[] = [];

/**
 * Lean product list (name/slug/photo/price only) for StoreHeader's live
 * search-suggestions dropdown — same `/products` endpoint as
 * getStoreNavData above (and the same reasoning: header components
 * don't have a server-fetched product list in scope on every page), but
 * this one keeps the `products` array instead of discarding it. Falls
 * back to an empty list rather than throwing — no suggestions dropdown
 * is a fine degraded state, Enter-to-search still works either way.
 */
export async function getStoreSearchIndex(subdomain: string): Promise<StoreSearchProduct[]> {
  try {
    const origin = await apiOrigin();
    const res = await fetch(`${origin}/v1/store/${subdomain}/products`);
    if (!res.ok) return EMPTY_SEARCH_INDEX;
    const data = await res.json();
    if (!Array.isArray(data.products)) return EMPTY_SEARCH_INDEX;
    return data.products.map((p: { slug: string; name: string; photoUrls?: string[]; price: string; discountPrice?: string | null }) => ({
      slug: p.slug,
      name: p.name,
      photoUrls: p.photoUrls ?? [],
      price: p.price,
      discountPrice: p.discountPrice ?? null,
    }));
  } catch {
    return EMPTY_SEARCH_INDEX;
  }
}

export interface StorefrontPageSummary {
  title: string;
  slug: string;
}

/**
 * Store > Pages nav list (title+slug, PUBLISHED only) — powers
 * StoreFooter's "INFORMATION" column with whatever pages the vendor has
 * actually published, instead of a fixed guess at well-known slugs.
 * Falls back to an empty list rather than throwing: a footer with no
 * page links is a fine degraded state, not worth blocking the page over.
 */
export async function getStorePages(subdomain: string): Promise<StorefrontPageSummary[]> {
  try {
    const origin = await apiOrigin();
    const res = await fetch(`${origin}/v1/store/${subdomain}/pages`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
