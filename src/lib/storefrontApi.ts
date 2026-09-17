// Server-side data fetching for the public storefront. Every function here
// runs on the server (called from Server Components / generateMetadata),
// never in the browser — so there's no auth token, no axios interceptor,
// just plain fetch() against the NestJS API. Field shapes are kept in
// lockstep with client/src/lib/storefrontApi.ts (the vendor-dashboard
// app's copy of the same public endpoints) since both read the same
// backend response.

const API_URL = process.env.API_URL ?? 'http://localhost:4000';

export type StoreTheme = 'MEDIUM' | 'MINIMAL' | 'STOREPAL';

export interface StorefrontInfo {
  id: string;
  storeName: string;
  subdomain: string;
  theme: StoreTheme;
  // Store > Logo — replaces the plain-text storeName wordmark wherever
  // a theme's header/footer shows it, when set. Nullable: a vendor who
  // hasn't uploaded one yet keeps the existing text-wordmark fallback.
  logoUrl?: string | null;
  // Store > Social — see StorefrontController's socialLinks selection
  // on the backend. Every field is independently nullable; a vendor who
  // hasn't set a given platform simply omits that icon in the footer.
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  twitterUrl?: string | null;
  youtubeUrl?: string | null;
  tiktokUrl?: string | null;
  linkedinUrl?: string | null;
  whatsappUrl?: string | null;
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

export interface StorefrontCategoryDetail {
  name: string;
  coverPhotoUrl: string | null;
  squarePhotoUrl: string | null;
  /** Real subcategories (Category.parentId) — powers StorePal's header dropdown (see StoreHeader.tsx). Optional: older cached responses may omit it. */
  children?: { name: string }[];
}

export interface StorefrontListData {
  store: StorefrontInfo;
  products: StorefrontProduct[];
  categories: string[];
  /** Store > Categories' own photos for the names in `categories`, when set — see StorePal's HomeView shortcut cards. */
  categoryDetails?: StorefrontCategoryDetail[];
}

export interface StorefrontDetailData {
  store: StorefrontInfo;
  product: StorefrontProduct;
}

// Lean shape for the product detail page's sidebar — see
// getStoreSidebar/productCardSelect on the backend for why this is
// deliberately NOT the same as StorefrontProduct (no description,
// variationOptions, variationPhotos, etc — only what ProductCard reads).
export interface StorefrontCardProduct {
  id: string;
  name: string;
  slug: string;
  category?: string | null;
  brand?: string | null;
  photoSize: string;
  photoUrls: string[];
  price: string;
  discountPrice?: string | null;
  isPreOrder: boolean;
  stockQuantity?: number | null;
  variants: { stock: number }[];
  createdAt: string;
}

export interface StorefrontSidebarData {
  categories: string[];
  /** Real subcategories per category name — see StorefrontCategoryDetail; powers StorePal's header dropdown on the product page too. */
  categoryDetails?: StorefrontCategoryDetail[];
  related: StorefrontCardProduct[];
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

class CampaignNotFoundError extends Error {
  constructor(slug: string) {
    super(`No campaign found for slug "${slug}"`);
    this.name = 'CampaignNotFoundError';
  }
}

class StorePageNotFoundError extends Error {
  constructor(slug: string) {
    super(`No page found for slug "${slug}"`);
    this.name = 'StorePageNotFoundError';
  }
}

export { StoreNotFoundError, ProductNotFoundError, CampaignNotFoundError, StorePageNotFoundError };

// Canonical absolute URL for a storefront path — used in generateMetadata
// (alternates.canonical, Open Graph og:url) and JSON-LD. A relative or
// wrong-host og:url makes link-preview crawlers (Facebook Messenger,
// WhatsApp, etc) silently drop the whole preview, including the image —
// so this must resolve to whatever host actually served the request:
// the vendor's Store > Domain custom domain, a {subdomain}.ROOT_DOMAIN
// host, or the bare IP path (/store/:subdomain) in local/LAN dev. Reads
// the real request Host header (see next/headers) rather than assuming
// ROOT_DOMAIN, since a custom domain never matches ROOT_DOMAIN at all
// (see middleware.ts's separate resolve-domain path for those).
export async function siteUrl(path: string): Promise<string> {
  const { headers } = await import('next/headers');
  const h = await headers();
  const host = h.get('host');
  if (!host) return path;
  const proto = h.get('x-forwarded-proto') ?? 'http';
  return `${proto}://${host}${path}`;
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

// Lean vendor-only lookup (id/storeName/subdomain/theme) — no products,
// no categories. Used wherever a route only needs to know which theme
// to render with (see the store/[subdomain] layout) rather than the
// full catalog getStoreProducts fetches. Next.js's fetch cache
// deduplicates this against any other call to the same URL within the
// same render pass, so a page that also calls getStoreProducts (which
// hits a different URL) still only pays for one extra lightweight
// request, not a duplicate of its own full-catalog fetch.
export async function getStoreInfo(subdomain: string): Promise<StorefrontInfo> {
  const data = await fetchJson<StorefrontInfo>(`/api/v1/store/${subdomain}`, [`store:${subdomain}`]);
  if (!data) throw new StoreNotFoundError(subdomain);
  return data;
}

export interface StorefrontReview {
  id: string;
  title: string;
  content: string | null;
  rating: number;
  photos: string[];
  customerName: string | null;
  featured: boolean;
  createdAt: string;
}

// Homepage "Customer Reviews" section — falls back to an empty array
// rather than throwing, same reasoning as getStoreSidebar below: this
// is decorative content, a hiccup here shouldn't ever break the whole
// homepage from rendering.
export async function getStoreReviews(subdomain: string): Promise<StorefrontReview[]> {
  try {
    const data = await fetchJson<StorefrontReview[]>(`/api/v1/store/${subdomain}/reviews`, [`store:${subdomain}`]);
    return data ?? [];
  } catch {
    return [];
  }
}

export async function getStoreProduct(subdomain: string, slug: string): Promise<StorefrontDetailData> {
  const data = await fetchJson<StorefrontDetailData>(`/api/v1/store/${subdomain}/products/${slug}`, [
    `store:${subdomain}`,
    `store:${subdomain}:product:${slug}`,
  ]);
  if (!data) throw new ProductNotFoundError(slug);
  return data;
}

export interface StorefrontCampaignData {
  store: StorefrontInfo;
  campaign: { id: string; name: string; coverPhotoUrl: string | null };
  products: StorefrontProduct[];
  categories: string[];
}

// Marketing > Campaigns' public landing page (Medium theme only — see
// themes/medium/views/CampaignView.tsx). Same tag shape as
// getStoreProduct so a product/campaign change still revalidates
// correctly (see StorefrontRevalidateService on the backend).
export async function getStoreCampaign(subdomain: string, slug: string): Promise<StorefrontCampaignData> {
  const data = await fetchJson<StorefrontCampaignData>(`/api/v1/store/${subdomain}/campaigns/${slug}`, [
    `store:${subdomain}`,
  ]);
  if (!data) throw new CampaignNotFoundError(slug);
  return data;
}

export interface StorefrontCampaignSummary {
  id: string;
  name: string;
  slug: string;
  coverPhotoUrl: string | null;
}

// Campaign list with cover photos — powers the StorePal theme's
// homepage hero banner (see themes/storepal/views/HomeView.tsx). Falls
// back to an empty array rather than throwing — a store with no
// campaigns yet (or a hiccup fetching them) just means no hero banner,
// not a broken homepage.
export async function getStoreCampaigns(subdomain: string): Promise<StorefrontCampaignSummary[]> {
  try {
    const data = await fetchJson<StorefrontCampaignSummary[]>(`/api/v1/store/${subdomain}/campaigns`, [
      `store:${subdomain}`,
    ]);
    return data ?? [];
  } catch {
    return [];
  }
}

// Category strip + related products for the product detail page's
// sidebar — deliberately lean (see StorefrontSidebarData/
// productCardSelect on the backend) instead of reusing getStoreProducts,
// which would fetch the vendor's ENTIRE catalog with every relation just
// to show 4 cards. Falls back to an empty result rather than throwing —
// this is decorative sidebar content, so a hiccup here shouldn't ever
// take down the whole product page (see the product page's .catch()).
export async function getStoreSidebar(
  subdomain: string,
  slug: string,
  category?: string | null,
): Promise<StorefrontSidebarData> {
  const query = category ? `?category=${encodeURIComponent(category)}` : '';
  const data = await fetchJson<StorefrontSidebarData>(
    `/api/v1/store/${subdomain}/products/${slug}/sidebar${query}`,
    [`store:${subdomain}`],
  );
  return data ?? { categories: [], related: [] };
}

export interface StorefrontPage {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  updatedAt: string;
}

export interface StorefrontPageData {
  store: StorefrontInfo;
  page: StorefrontPage;
}

// Store > Pages' public rendering (About Us, Contact Us, Privacy
// Policy, etc — see reference screenshot at
// storepal.com.bd/page/about-us). Only ever a PUBLISHED page — see
// StorefrontService.getStorePage on the backend.
export async function getStorePage(subdomain: string, slug: string): Promise<StorefrontPageData> {
  const data = await fetchJson<StorefrontPageData>(`/api/v1/store/${subdomain}/pages/${slug}`, [
    `store:${subdomain}`,
  ]);
  if (!data) throw new StorePageNotFoundError(slug);
  return data;
}
