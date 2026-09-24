// Store > Integrations > Facebook Pixel — the standard e-commerce events
// StorePal fires (facebook-pixel.md §4). Browser-only, like lib/metaPixel.ts,
// and a no-op wherever <MetaPixel> isn't mounted (non-StorePal stores).
//
// content_ids must match the Facebook catalog feed's ids: the variant id
// once a variant is chosen (content_type "product"), the product id before
// that (content_type "product_group", matched against item_group_id), and
// the product id for products without variants.

import type { StorefrontProduct } from './storefrontApi';
import type { TrackedOrder } from './checkoutApi';
import type { CartLine } from '@/stores/cart-store';
import {
  browserFiresPurchase,
  rememberCheckoutPixel,
  setMetaUserData,
  trackMetaCheckoutEvent,
  trackMetaEvent,
} from './metaPixel';

// fbevents.js's own currency list lacks BDT, so it logs "Parameter
// 'currency' is invalid for event 'Purchase'" in the console, but still
// sends the event (trackSingle only logs validation results). BDT itself
// is a supported Meta currency (Marketing API currencies list).
const CURRENCY = 'BDT';

// Carts saved before CartLine had productId still work, just without
// content_ids for those lines.
const lineContentId = (line: CartLine) => line.variantId ?? line.productId ?? null;

function linesData(lines: CartLine[]) {
  const contents = lines.flatMap((line) => {
    const id = lineContentId(line);
    return id ? [{ id, quantity: line.quantity, item_price: line.unitPrice }] : [];
  });
  return {
    ...(contents.length > 0 && { content_ids: contents.map((c) => c.id), contents, content_type: 'product' }),
    num_items: lines.reduce((sum, l) => sum + l.quantity, 0),
    value: lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0),
    currency: CURRENCY,
  };
}

// Full product (product page) or a product card's leaner shape.
type ProductLike = Pick<StorefrontProduct, 'id' | 'name' | 'price' | 'discountPrice'> & {
  variants: unknown[];
  category?: string | null;
};

function productData(product: ProductLike) {
  return {
    content_ids: [product.id],
    content_type: product.variants.length > 0 ? 'product_group' : 'product',
    content_name: product.name,
    ...(product.category && { content_category: product.category }),
    value: Number(product.discountPrice ?? product.price),
    currency: CURRENCY,
  };
}

/** Product page, once per product. */
export function trackMetaViewContent(product: StorefrontProduct) {
  trackMetaEvent('ViewContent', productData(product));
}

/** Every cart add (fired from the cart store's CART_ADD_EVENT, see <MetaPixel>). */
export function trackMetaAddToCart(line: CartLine) {
  trackMetaEvent('AddToCart', { ...linesData([line]), content_type: 'product', content_name: line.name });
}

/** Wishlist heart, only when adding (not removing). */
export function trackMetaAddToWishlist(product: ProductLike) {
  trackMetaEvent('AddToWishlist', productData(product));
}

/** Search results page, once per query. */
export function trackMetaSearch(query: string, productIds: string[]) {
  trackMetaEvent('Search', {
    search_string: query,
    ...(productIds.length > 0 && { content_ids: productIds.slice(0, 10), content_type: 'product_group' }),
    currency: CURRENCY,
  });
}

/** Checkout page with items in the cart, or a landing page's order form once the shopper starts filling it. */
export function trackMetaInitiateCheckout(lines: CartLine[]) {
  if (lines.length === 0) return;
  trackMetaEvent('InitiateCheckout', linesData(lines));
}

/** "Place Order" clicked with a payment method chosen, right before the order is sent. */
export function trackMetaAddPaymentInfo(lines: CartLine[]) {
  if (lines.length === 0) return;
  rememberCheckoutPixel();
  trackMetaEvent('AddPaymentInfo', linesData(lines));
}

const purchaseSentKey = (orderId: string) => `storepal:meta-purchase:${orderId}`;

/**
 * Thank-you page, right after checkout (or after online payment succeeded).
 * eventID order_<orderId> is what the server's Conversions API copy uses
 * too, so Meta keeps one. Skipped when the vendor defers Purchase to the
 * server (sent later at the chosen order status), and never sent twice
 * for the same order from this browser.
 */
export async function trackMetaPurchase(order: TrackedOrder) {
  if (!browserFiresPurchase()) return;
  try {
    if (sessionStorage.getItem(purchaseSentKey(order.id))) return;
    sessionStorage.setItem(purchaseSentKey(order.id), '1');
  } catch {
    // Storage blocked: the thank-you handoff is one-time anyway.
  }
  await setMetaUserData({
    phone: order.customerPhone,
    email: order.customerEmail,
    name: order.customerName,
    city: order.shippingDistrict || order.shippingCity,
  });
  const contents = order.items.flatMap((item) => {
    const id = item.variantId ?? item.productId;
    return id ? [{ id, quantity: item.quantity, item_price: Number(item.unitPrice) }] : [];
  });
  // To the landing page's own pixel when the order came from its form.
  trackMetaCheckoutEvent(
    'Purchase',
    {
      ...(contents.length > 0 && { content_ids: contents.map((c) => c.id), contents, content_type: 'product' }),
      num_items: order.items.reduce((sum, item) => sum + item.quantity, 0),
      value: Number(order.total),
      currency: CURRENCY,
    },
    `order_${order.id}`,
  );
}

/** Shopper account created. */
export function trackMetaCompleteRegistration() {
  trackMetaEvent('CompleteRegistration', { status: true });
}

/** Landing page Lead Form submitted. */
export function trackMetaLead() {
  trackMetaEvent('Lead', {});
}
