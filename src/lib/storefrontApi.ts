// Server-side data fetching for the public storefront. Every function here
// runs on the server (called from Server Components / generateMetadata),
// never in the browser — so there's no auth token, no axios interceptor,
// just plain fetch() against the NestJS API. Field shapes are kept in
// lockstep with client/src/lib/storefrontApi.ts (the vendor-dashboard
// app's copy of the same public endpoints) since both read the same
// backend response.

const API_URL = process.env.API_URL ?? 'http://localhost:4000';

export interface StorefrontInfo {
  id: string;
  storeName: string;
  subdomain: string;
}

export interface StorefrontVariationOption {
  id: string;
  name: string;
  values: string[];
  position: number;
}

export interface StorefrontVariant {
  id: string;
  optionValues: Record<string, string>;
  stock: number;
  listPrice?: string | null;
  discountPrice?: string | null;
}

// Per-value photo set for ONE variation option (e.g. every "Color" value
// gets its own photos) — set on Add/Edit Product's "Variation Photos"
// section. Not necessarily present for every option; only the option the
// vendor picked as "Photos by" has entries here.
export interface StorefrontVariationValuePhoto {
  optionName: string;
  optionValue: string;
  photoUrls: string[];
}

export interface StorefrontProduct {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  category?: string | null;
  secondaryCategories: string[];
  brand?: string | null;
  summary?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  photoSize: string;
  photoUrls: string[];
  videoUrl?: string | null;
  price: string;
  discountPrice?: string | null;
  isPreOrder: boolean;
  stockQuantity?: number | null;
  weight?: string | null;
  weightUnit: string;
  variationOptions: StorefrontVariationOption[];
  variants: StorefrontVariant[];
  // Optional: only present once the backend has the VariationValuePhoto
  // migration deployed. Older cached responses (Next.js ISR) or an
  // in-flight deploy can still omit this field — every consumer must
  // treat it as possibly undefined, not assume it's always an array.
  variationPhotos?: StorefrontVariationValuePhoto[];
  createdAt: string;
}

export interface StorefrontListData {
  store: StorefrontInfo;
  products: StorefrontProduct[];
  categories: string[];
}

export interface StorefrontDetailData {
  store: StorefrontInfo;
  product: StorefrontProduct;
}

// Store data changes whenever a vendor adds/edits a product, so a short
// time-based revalidation window keeps pages fast (served from cache most
// of the time) without going stale for long. Tune this per environment if
// needed — it's not meant to be a hard architectural constant.
const REVALIDATE_SECONDS = 60;

class StoreNotFoundError extends Error {
  constructor(subdomain: string) {
    super(`No store found for subdomain "${subdomain}"`);
    this.name = 'StoreNotFoundError';
  }
}

class ProductNotFoundError extends Error {
  constructor(slug: string) {
    super(`No product found for slug "${slug}"`);
    this.name = 'ProductNotFoundError';
  }
}

export { StoreNotFoundError, ProductNotFoundError };

// Canonical absolute URL for a storefront path — used in generateMetadata
// (alternates.canonical, Open Graph og:url) and JSON-LD. Built from
// ROOT_DOMAIN (see middleware.ts) when set; without a production domain
// yet, falls back to a path-only relative reference so nothing crashes
// or hardcodes a fake domain in local/LAN dev.
export function siteUrl(path: string): string {
  const rootDomain = process.env.ROOT_DOMAIN?.trim();
  return rootDomain ? `https://${rootDomain}${path}` : path;
}


async function fetchJson<T>(path: string, tags: string[]): Promise<T | null> {
  const res = await fetch(`${API_URL}${path}`, {
    next: { revalidate: REVALIDATE_SECONDS, tags },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Storefront API request failed: ${res.status} ${res.statusText} (${path})`);
  }
  return res.json() as Promise<T>;
}

export async function getStoreProducts(subdomain: string): Promise<StorefrontListData> {
  const data = await fetchJson<StorefrontListData>(`/api/v1/store/${subdomain}/products`, [`store:${subdomain}`]);
  if (!data) throw new StoreNotFoundError(subdomain);
  return data;
}

export async function getStoreProduct(subdomain: string, slug: string): Promise<StorefrontDetailData> {
  const data = await fetchJson<StorefrontDetailData>(`/api/v1/store/${subdomain}/products/${slug}`, [
    `store:${subdomain}`,
    `store:${subdomain}:product:${slug}`,
  ]);
  if (!data) throw new ProductNotFoundError(slug);
  return data;
}
