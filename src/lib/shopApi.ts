/**
 * The Regantify Shop's data layer (SHOP-plan.md Step 7): the public `/v1/shop/*` routes of the API, read by the app/shop pages on the server
 * (and the suggestions box in the browser). The types are copied by hand from the server (server/src/marketplace/shop-item.ts,
 * shop-search.service.ts, shop-home.service.ts, shop-categories.service.ts); change both together.
 */

const API_URL = process.env.API_URL ?? 'http://localhost:4000';
const ROOT_DOMAIN = process.env.ROOT_DOMAIN?.toLowerCase().trim();

/** The Shop's name in titles and the header. One place to change it (the user has not picked the final name yet: SHOP-plan.md section 8). */
export const SHOP_NAME = process.env.NEXT_PUBLIC_SHOP_NAME?.trim() || 'Regantify Shop';

export type ShopItem = {
  productId: string;
  name: string;
  price: number;
  listPrice: number;
  inStock: boolean;
  hasOptions: boolean;
  photoUrl: string;
  /** Other stores selling the same barcode. */
  alsoSoldBy: number;
  store: { name: string; subdomain: string };
  /** The product on its store's own page, with utm_source=shop. */
  url: string;
  /** Only in the Reseller tab: the offer, the supplier's public badge and the link into the dashboard (never what a reseller earns). */
  resale?: { offerId: string; supplierBadge: 'NEW' | 'RELIABLE' | null; resellUrl: string | null };
};

export type ShopCategory = { slug: string; nameEn: string; nameBn: string | null; productCount: number; children: ShopCategory[] };

/** Super Admin's home banners and curated collections (SHOP-plan.md Step 9). */
export type ShopBanner = { id: string; title: string; text: string | null; linkUrl: string | null; tone: 'GREEN' | 'DARK' | 'AMBER' | string };
export type ShopCollectionData = { slug: string; title: string; description: string | null; items: ShopItem[] };
export type ShopHomeData = {
  banners: ShopBanner[];
  featured: ShopItem[];
  top: ShopItem[];
  newArrivals: ShopItem[];
  collections: ShopCollectionData[];
  categories: ShopCategory[];
};

export type ShopSearchData = {
  query: string;
  page: number;
  perPage: number;
  sort: string;
  mode: 'words' | 'typo' | 'mixed' | 'browse' | 'partial' | 'none';
  hasMore: boolean;
  items: ShopItem[];
  /** Step 15: a corrected query, when this one found nothing or only close spellings. */
  didYouMean?: string;
};

export type ShopSuggestData = { queries: string[]; products: ShopItem[] };

/** An answer, or why there is none: `paused` = Super Admin switched the Shop off (503); otherwise the API could not be reached. */
export type ShopAnswer<T> = { ok: true; data: T } | { ok: false; paused: boolean };

async function shopFetch<T>(path: string, revalidate: number): Promise<ShopAnswer<T>> {
  try {
    const res = await fetch(`${API_URL}/v1/shop${path}`, { next: { revalidate, tags: ['shop'] } });
    if (res.status === 503) return { ok: false, paused: true };
    if (!res.ok) return { ok: false, paused: false };
    return { ok: true, data: (await res.json()) as T };
  } catch {
    return { ok: false, paused: false };
  }
}

export function getShopHome(): Promise<ShopAnswer<ShopHomeData>> {
  return shopFetch<ShopHomeData>('/home', 60);
}

/** One curated collection; null when it doesn't exist, ended or was switched off (404). */
export async function getShopCollection(slug: string): Promise<ShopAnswer<ShopCollectionData | null>> {
  try {
    const res = await fetch(`${API_URL}/v1/shop/collections/${encodeURIComponent(slug)}`, { next: { revalidate: 60, tags: ['shop'] } });
    if (res.status === 404) return { ok: true, data: null };
    if (res.status === 503) return { ok: false, paused: true };
    if (!res.ok) return { ok: false, paused: false };
    return { ok: true, data: (await res.json()) as ShopCollectionData };
  } catch {
    return { ok: false, paused: false };
  }
}

export function getShopCategories(): Promise<ShopAnswer<ShopCategory[]>> {
  return shopFetch<ShopCategory[]>('/categories', 300);
}

export type ShopSearchInput = { q?: string; page?: number; sort?: string; minPrice?: number; maxPrice?: number; inStock?: boolean; category?: string; scope?: 'all' | 'reseller'; from?: string };

/** Only the parameters the API accepts, so an unknown one in the page address can never make the API refuse the request. */
export function shopSearchQuery(input: ShopSearchInput): string {
  const qs = new URLSearchParams();
  if (input.q) qs.set('q', input.q.slice(0, 200));
  if (input.page && input.page > 1) qs.set('page', String(input.page));
  if (input.sort && input.sort !== 'best') qs.set('sort', input.sort);
  if (input.minPrice !== undefined) qs.set('minPrice', String(input.minPrice));
  if (input.maxPrice !== undefined) qs.set('maxPrice', String(input.maxPrice));
  if (input.inStock) qs.set('inStock', 'true');
  if (input.category) qs.set('category', input.category);
  if (input.scope === 'reseller') qs.set('scope', 'reseller');
  if (input.from) qs.set('from', input.from);
  const s = qs.toString();
  return s ? `?${s}` : '';
}

export function searchShop(input: ShopSearchInput): Promise<ShopAnswer<ShopSearchData>> {
  return shopFetch<ShopSearchData>(`/search${shopSearchQuery(input)}`, 30);
}

/** The browser's way to the API (the suggestions box), the same rule as the store's own client calls. */
export function shopApiOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '');
  if (configured) return configured;
  return typeof window === 'undefined' ? API_URL : `${window.location.protocol}//${window.location.hostname}:4000`;
}

/**
 * The public address of a Shop page, for canonical links, the sitemap and robots.txt: https://shop.ROOT_DOMAIN/... when the platform has its
 * domain, else the local /shop/... path. `path` is the Shop path without the /shop prefix ("/", "/c/fashion").
 */
export function shopUrl(path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (ROOT_DOMAIN) return `https://shop.${ROOT_DOMAIN}${clean === '/' ? '' : clean}`;
  return `/shop${clean === '/' ? '' : clean}`;
}

/** Taka with Bangladeshi digit grouping (1,25,000). */
export function formatTaka(n: number): string {
  return `৳${Math.round(n).toLocaleString('en-IN')}`;
}

/** A query-string value as one string (the first one when it is repeated). */
export function firstParam(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/** A query-string number, or undefined when missing or not a number 0 or more. */
export function numberParam(v: string | string[] | undefined): number | undefined {
  const s = firstParam(v);
  if (s === undefined || s.trim() === '') return undefined;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}
