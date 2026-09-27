// The storefront's ecommerce events, built once in Google Analytics 4's
// recommended format and sent to:
// - Store > Integrations > Google Analytics 4 (gtag, lib/googleAnalytics.ts)
// - Store > Integrations > Google Tag Manager's dataLayer (lib/googleTagManager.ts)
// - Store > Integrations > TikTok Pixel, converted to TikTok's standard
//   events (lib/tiktokPixel.ts; see TIKTOK_EVENTS below)
// Browser-only, and a no-op for each destination that isn't mounted
// (non-StorePal stores, no ID set) or has its ecommerce events turned off.
// The Meta pixel has its own module (lib/metaPixelEvents.ts), since its
// content ids follow the Facebook catalog feed.
//
// item_id is always the product id, with the chosen options in
// item_variant, so one product adds up to one row in GA4's item reports.
// The server's Measurement Protocol purchase builds its items the same
// way (server/src/store-settings/ga-measurement-protocol.service.ts).

import type { StorefrontProduct } from './storefrontApi';
import type { TrackedOrder } from './checkoutApi';
import { CART_ADD_EVENT, CART_REMOVE_EVENT, type CartLine, type CartRemoveDetail } from '@/stores/cart-store';
import { browserSendsGaPurchase, trackGaEvent } from './googleAnalytics';
import { gtmCustomerDataEnabled, pushGtmEvent } from './googleTagManager';
import {
  browserFiresTiktokPurchase,
  identifyTiktokUser,
  trackTiktokCheckoutEvent,
  trackTiktokEvent,
} from './tiktokPixel';
import { normalizeBdPhone } from './metaPixel';

const CURRENCY = 'BDT';

const round = (n: number) => Math.round(n * 100) / 100;

// GA4 event name -> TikTok standard event. view_cart / remove_from_cart
// have no TikTok equivalent and aren't sent there.
const TIKTOK_EVENTS: Record<string, string> = {
  view_item: 'ViewContent',
  add_to_cart: 'AddToCart',
  add_to_wishlist: 'AddToWishlist',
  search: 'Search',
  begin_checkout: 'InitiateCheckout',
  add_payment_info: 'AddPaymentInfo',
  purchase: 'Purchase',
  sign_up: 'CompleteRegistration',
  generate_lead: 'Lead',
};

type GaItem = { item_id: string; item_name: string; price: number; quantity: number };

/** GA4 parameters -> TikTok's: items become contents (content_id = the same product id). */
function tiktokProperties(params: Record<string, unknown>): Record<string, unknown> {
  const items = Array.isArray(params.items) ? (params.items as GaItem[]) : null;
  return {
    ...(items && {
      content_type: 'product',
      contents: items.map((i) => ({ content_id: i.item_id, content_name: i.item_name, quantity: i.quantity, price: i.price })),
    }),
    ...(typeof params.value === 'number' && { value: params.value, currency: params.currency ?? CURRENCY }),
    ...(typeof params.search_term === 'string' && { query: params.search_term }),
  };
}

/** One event to every destination; each decides for itself whether it's on. */
function emit(name: string, params: Record<string, unknown>, ecommerce = true) {
  trackGaEvent(name, params);
  pushGtmEvent(name, params, { ecommerce });
  const tiktokEvent = TIKTOK_EVENTS[name];
  if (tiktokEvent) trackTiktokEvent(tiktokEvent, tiktokProperties(params));
}

function variantLabel(options: Record<string, string> | null | undefined): string | undefined {
  const values = Object.values(options ?? {}).filter(Boolean);
  return values.length > 0 ? values.join(' / ') : undefined;
}

function lineItem(line: CartLine, index: number, quantity = line.quantity) {
  const discount = line.originalUnitPrice && line.originalUnitPrice > line.unitPrice ? line.originalUnitPrice - line.unitPrice : 0;
  return {
    // Carts saved before CartLine had productId fall back to the slug.
    item_id: line.productId ?? line.productSlug,
    item_name: line.name,
    ...(variantLabel(line.selectedOptions) && { item_variant: variantLabel(line.selectedOptions) }),
    price: line.unitPrice,
    ...(discount > 0 && { discount: round(discount) }),
    quantity,
    index,
  };
}

function linesParams(lines: CartLine[]) {
  return {
    currency: CURRENCY,
    value: round(lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0)),
    items: lines.map((line, index) => lineItem(line, index)),
  };
}

// Full product (product page) or a product card's leaner shape.
type ProductLike = Pick<StorefrontProduct, 'id' | 'name' | 'price' | 'discountPrice'> & {
  category?: string | null;
  brand?: string | null;
};

function productParams(product: ProductLike) {
  const price = Number(product.price);
  const payPrice = Number(product.discountPrice ?? product.price);
  return {
    currency: CURRENCY,
    value: payPrice,
    items: [
      {
        item_id: product.id,
        item_name: product.name,
        ...(product.category && { item_category: product.category }),
        ...(product.brand && { item_brand: product.brand }),
        price: payPrice,
        ...(price > payPrice && { discount: round(price - payPrice) }),
        quantity: 1,
      },
    ],
  };
}

// -- Cart changes --

let cartListenersAdded = false;
let cartSubdomain: string | null = null;

/**
 * add_to_cart / remove_from_cart for every cart change, whichever button
 * did it (the cart store's CART_ADD_EVENT / CART_REMOVE_EVENT). Called by
 * <GoogleAnalytics> and <GoogleTagManager> while rendering; the listeners
 * are added once per page load and never need removing.
 */
export function listenForCartChanges(subdomain: string) {
  cartSubdomain = subdomain;
  if (cartListenersAdded || typeof window === 'undefined') return;
  cartListenersAdded = true;
  window.addEventListener(CART_ADD_EVENT, (e) => {
    const line = (e as CustomEvent<CartLine>).detail;
    if (line?.subdomain === cartSubdomain) emit('add_to_cart', linesParams([line]));
  });
  window.addEventListener(CART_REMOVE_EVENT, (e) => {
    const { line, quantity } = (e as CustomEvent<CartRemoveDetail>).detail ?? {};
    if (!line || line.subdomain !== cartSubdomain || !(quantity > 0)) return;
    emit('remove_from_cart', {
      currency: CURRENCY,
      value: round(line.unitPrice * quantity),
      items: [lineItem(line, 0, quantity)],
    });
  });
}

// -- Events --

/** Product page, once per product. */
export function trackViewItem(product: StorefrontProduct) {
  emit('view_item', productParams(product));
}

/** Cart page with items in it, once per visit to the page. */
export function trackViewCart(lines: CartLine[]) {
  if (lines.length === 0) return;
  emit('view_cart', linesParams(lines));
}

/** Wishlist heart, only when adding (not removing). */
export function trackAddToWishlist(product: ProductLike) {
  emit('add_to_wishlist', productParams(product));
}

/** Search results page, once per query. */
export function trackSearch(query: string) {
  emit('search', { search_term: query.slice(0, 100) }, false);
}

/** Checkout page with items in the cart, or a landing page's order form once the shopper starts filling it. */
export function trackBeginCheckout(lines: CartLine[], coupon?: string) {
  if (lines.length === 0) return;
  emit('begin_checkout', { ...linesParams(lines), ...(coupon && { coupon }) });
}

/** "Place Order" clicked with a payment method chosen, right before the order is sent. */
export function trackAddPaymentInfo(lines: CartLine[], paymentType: string, coupon?: string) {
  if (lines.length === 0) return;
  emit('add_payment_info', { ...linesParams(lines), payment_type: paymentType, ...(coupon && { coupon }) });
}

// Per destination, so one being blocked (no consent yet) doesn't stop the others.
const purchaseSentKey = (destination: 'ga' | 'gtm' | 'tiktok', orderId: string) =>
  `storepal:${destination}-purchase:${orderId}`;

function alreadySent(key: string): boolean {
  try {
    return !!sessionStorage.getItem(key);
  } catch {
    // Storage blocked: the thank-you handoff is one-time anyway.
    return false;
  }
}

function markSent(key: string) {
  try {
    sessionStorage.setItem(key, '1');
  } catch {
    // See alreadySent.
  }
}

/**
 * Thank-you page, right after checkout (or after online payment
 * succeeded), never twice for the same order from this browser.
 * - GA4: skipped when the vendor sends purchases from the server instead,
 *   so a sale is never counted twice.
 * - GTM: always pushed (the vendor's own tags decide what to do with it),
 *   with the shopper's hashed details when the vendor turned that on.
 * - TikTok: event_id order_<orderId> is what the server's Events API copy
 *   uses too, so TikTok keeps one; skipped when the vendor defers
 *   Purchase to the server. Goes to the landing page's own pixel when the
 *   order came from its form.
 */
export async function trackPurchase(order: TrackedOrder) {
  const params = {
    // The invoice number the vendor sees, also what the server uses.
    transaction_id: String(order.invoiceNumber),
    currency: CURRENCY,
    value: Number(order.total),
    shipping: Number(order.deliveryCharge),
    tax: Number(order.vatAmount),
    items: order.items.map((item, index) => ({
      item_id: item.productId ?? item.id,
      item_name: item.productName,
      ...(variantLabel(item.selectedOptions) && { item_variant: variantLabel(item.selectedOptions) }),
      price: Number(item.unitPrice),
      quantity: item.quantity,
      index,
    })),
  };

  const gaKey = purchaseSentKey('ga', order.id);
  if (browserSendsGaPurchase() && !alreadySent(gaKey) && trackGaEvent('purchase', params)) markSent(gaKey);

  const tiktokKey = purchaseSentKey('tiktok', order.id);
  if (browserFiresTiktokPurchase() && !alreadySent(tiktokKey)) {
    await identifyTiktokUser({ email: order.customerEmail, phone: order.customerPhone });
    if (trackTiktokCheckoutEvent('Purchase', { ...tiktokProperties(params), order_id: params.transaction_id }, `order_${order.id}`)) {
      markSent(tiktokKey);
    }
  }

  const gtmKey = purchaseSentKey('gtm', order.id);
  if (alreadySent(gtmKey)) return;
  const userData = gtmCustomerDataEnabled() ? await hashedUserData(order) : null;
  if (pushGtmEvent('purchase', params, { ecommerce: true, extra: userData ? { user_data: userData } : undefined })) {
    markSent(gtmKey);
  }
}

/** Shopper account created. */
export function trackSignUp() {
  emit('sign_up', { method: 'phone' }, false);
}

/** Landing page Lead Form submitted. */
export function trackGenerateLead() {
  emit('generate_lead', { currency: CURRENCY, value: 0 }, false);
}

// -- Customer details (GTM purchase only) --

async function sha256Hex(value: string): Promise<string | null> {
  try {
    const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
    return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // crypto.subtle is missing outside secure contexts (plain-http LAN testing).
    return null;
  }
}

/**
 * The shopper's details in Google's `user_data` format (what Google Ads
 * enhanced conversions and server-side GTM tags read), normalized the way
 * Google asks before hashing: trimmed and lowercased, phone in E.164
 * (+8801XXXXXXXXX). Only hashes ever go on the dataLayer.
 */
async function hashedUserData(order: TrackedOrder): Promise<Record<string, unknown> | null> {
  const email = order.customerEmail?.trim().toLowerCase();
  const phone = normalizeBdPhone(order.customerPhone);
  const [first, ...rest] = (order.customerName ?? '').trim().toLowerCase().split(/\s+/);
  const [emailHash, phoneHash, firstHash, lastHash] = await Promise.all([
    email ? sha256Hex(email) : null,
    phone ? sha256Hex(`+${phone}`) : null,
    first ? sha256Hex(first) : null,
    rest.length > 0 ? sha256Hex(rest.join(' ')) : null,
  ]);
  if (!emailHash && !phoneHash) return null;
  const city = (order.shippingDistrict || order.shippingCity || '').trim().toLowerCase();
  return {
    ...(emailHash && { sha256_email_address: emailHash }),
    ...(phoneHash && { sha256_phone_number: phoneHash }),
    address: {
      ...(firstHash && { sha256_first_name: firstHash }),
      ...(lastHash && { sha256_last_name: lastHash }),
      ...(city && { city }),
      country: 'BD',
    },
  };
}
