import type { StorefrontCategoryDetail } from '@/lib/storefrontApi';

// Same host-detection pattern as checkoutApi.ts/socialLinksApi.ts - see
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
 * StorefrontListData) for StoreHeader's category strip + dropdowns -
 * checkout/thank-you don't need the actual product list, only the
 * category names/children, so this skips returning `products` entirely
 * rather than have those pages fetch (and discard) the whole catalog.
 * Falls back to an empty nav rather than throwing: a checkout page with
 * no category strip is a fine degraded state, not worth blocking
 * "Place Order" over.
 */
export async function getStoreNavData(subdomain: string): Promise<StoreNavData> {
  try {
    const res = await fetch(`${apiOrigin()}/v1/store/${subdomain}/products`);
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

/** Whether the store has a FAQ question switched on (TellMe idea 122), for the footer's "FAQ" link. */
export async function getStoreHasFaq(subdomain: string): Promise<boolean> {
  try {
    const res = await fetch(`${apiOrigin()}/v1/store/${subdomain}/faq`);
    if (!res.ok) return false;
    const data = await res.json();
    return Array.isArray(data.items) && data.items.length > 0;
  } catch {
    return false;
  }
}

/** Whether the store has added a shop location, for the footer's "Our shops" link. */
export async function getStoreHasLocations(subdomain: string): Promise<boolean> {
  try {
    const res = await fetch(`${apiOrigin()}/v1/store/${subdomain}/locations`);
    if (!res.ok) return false;
    const data = await res.json();
    return Array.isArray(data.items) && data.items.length > 0;
  } catch {
    return false;
  }
}

/** Whether the store's contact page is on, for the footer's "Contact us" link. */
/**
 * The Contact page's public answer, null while the page is off. The footer uses it for its "Contact us" link and, when the
 * store never saved a footer, for a phone/address block (the same owner phone and Settings > Address the page falls back to).
 */
export interface StoreContactInfo {
  enabled: boolean;
  phone: { label: string; url: string } | null;
  whatsapp: { label: string; url: string } | null;
  basedIn: string | null;
}

export async function getStoreContactInfo(subdomain: string): Promise<StoreContactInfo | null> {
  try {
    const res = await fetch(`${apiOrigin()}/v1/store/${subdomain}/contact`);
    if (!res.ok) return null;
    const data = (await res.json()) as StoreContactInfo;
    return data.enabled === true ? data : null;
  } catch {
    return null;
  }
}

/** Whether the store has a published Magazine post (TellMe idea 106), for the footer's "Magazine" link. */
export async function getStoreHasBlog(subdomain: string): Promise<boolean> {
  try {
    const res = await fetch(`${apiOrigin()}/v1/store/${subdomain}/blog?limit=1`);
    if (!res.ok) return false;
    const data = await res.json();
    return Array.isArray(data.posts) && data.posts.length > 0;
  } catch {
    return false;
  }
}

/**
 * The payment methods the store's checkout really offers right now (already filtered server-side for enabled,
 * connected and the platform switch), as short labels for the footer's "We accept" row. Read from the public store
 * answer's paymentGateways, so the footer can never show a method the shopper can't use. Empty on any failure.
 */
export async function getStorePaymentMethods(subdomain: string): Promise<string[]> {
  try {
    const res = await fetch(`${apiOrigin()}/v1/store/${encodeURIComponent(subdomain)}`);
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data.paymentGateways)) return [];
    const DEFAULT_LABEL: Record<string, string> = {
      COD: 'Cash on Delivery',
      ONLINE_PAYMENT: 'Online Payment',
      SSLCOMMERZ: 'SSLCommerz',
      BKASH_MERCHANT: 'bKash',
      VENDOR_PAYSTATION: 'PayStation',
      SHURJOPAY: 'shurjoPay',
      EPS: 'EPS',
      AAMARPAY: 'aamarPay',
      PORTWALLET: 'PortWallet',
    };
    const labels: string[] = data.paymentGateways
      .map((g: { type: string; displayLabel?: string | null }) => g.displayLabel?.trim() || DEFAULT_LABEL[g.type])
      .filter((l: string | undefined): l is string => !!l);
    return Array.from(new Set(labels));
  } catch {
    return [];
  }
}

export interface StoreSearchProduct {
  slug: string;
  name: string;
  photoUrls: string[];
  price: string;
  discountPrice?: string | null;
  /** The product's hidden search words (Product.searchKeywords), matched by the dropdown too. */
  searchKeywords?: string[];
}

const EMPTY_SEARCH_INDEX: StoreSearchProduct[] = [];

/**
 * Lean product list (name/slug/photo/price only) for StoreHeader's live
 * search-suggestions dropdown - same `/products` endpoint as
 * getStoreNavData above (and the same reasoning: header components
 * don't have a server-fetched product list in scope on every page), but
 * this one keeps the `products` array instead of discarding it. Falls
 * back to an empty list rather than throwing - no suggestions dropdown
 * is a fine degraded state, Enter-to-search still works either way.
 */
export async function getStoreSearchIndex(subdomain: string): Promise<StoreSearchProduct[]> {
  try {
    const res = await fetch(`${apiOrigin()}/v1/store/${subdomain}/products`);
    if (!res.ok) return EMPTY_SEARCH_INDEX;
    const data = await res.json();
    if (!Array.isArray(data.products)) return EMPTY_SEARCH_INDEX;
    return data.products.map((p: { slug: string; name: string; photoUrls?: string[]; price: string; discountPrice?: string | null; searchKeywords?: string[] }) => ({
      slug: p.slug,
      name: p.name,
      photoUrls: p.photoUrls ?? [],
      price: p.price,
      discountPrice: p.discountPrice ?? null,
      searchKeywords: p.searchKeywords ?? [],
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
 * Store > Pages nav list (title+slug, PUBLISHED only) - powers
 * StoreFooter's "INFORMATION" column with whatever pages the vendor has
 * actually published, instead of a fixed guess at well-known slugs.
 * Falls back to an empty list rather than throwing: a footer with no
 * page links is a fine degraded state, not worth blocking the page over.
 */
export async function getStorePages(subdomain: string): Promise<StorefrontPageSummary[]> {
  try {
    const res = await fetch(`${apiOrigin()}/v1/store/${subdomain}/pages`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/** Gift cards sold on the store (TellMe idea 135): what the store offers; amounts is empty while the sale is off. */
export interface GiftCardSaleConfig {
  storeName: string;
  enabled: boolean;
  amounts: number[];
  expiryDays: number | null;
}
export async function getGiftCardSale(subdomain: string): Promise<GiftCardSaleConfig | null> {
  try {
    const res = await fetch(`${apiOrigin()}/v1/store-gift-cards/store/${encodeURIComponent(subdomain)}`);
    return res.ok ? ((await res.json()) as GiftCardSaleConfig) : null;
  } catch {
    return null;
  }
}

export interface GiftCardPurchaseResult {
  status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';
  amount: number;
  recipientName: string;
  recipientPhone: string;
  smsSent: boolean;
  code: string | null;
  expiresAt: string | null;
}
