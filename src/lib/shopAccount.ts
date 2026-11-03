/**
 * The Regantify Shop's one sign-in (2026-11-03): the cookie that holds the shopper's app token on the Shop's own address (httpOnly, set
 * and read only by app/shop/api), and the types of the app routes the Shop website uses. The types are copied by hand from the server
 * (server/src/app-market/app-cart.service.ts, app-checkout.service.ts, app-orders.service.ts); change both together.
 */

export const SHOP_SESSION_COOKIE = 'rgf_shop_session';

/** A Google sign-in on its way (10 minutes): the nonce, the state and the page to go back to, set and read only by app/shop/api. */
export const SHOP_GOOGLE_COOKIE = 'rgf_shop_google';

export type ShopCartLine = { subdomain: string; slug: string; options?: Record<string, string>; quantity: number };

export type ShopImage = { src: string; card: string; large: string };

export type ShopPreviewLine = {
  index: number;
  status: 'OK' | 'REDUCED' | 'SOLD_OUT' | 'UNAVAILABLE' | 'WEBSITE_ONLY';
  subdomain: string;
  slug: string;
  productId: string | null;
  name: string;
  image: ShopImage | null;
  selectedOptions: Record<string, string>;
  quantity: number;
  requestedQuantity: number;
  unitPrice: number;
  originalUnitPrice: number | null;
  lineTotal: number;
  isPreOrder: boolean;
  minQuantity: number;
  step: number;
  maxQuantity: number | null;
  stockLeft: number | null;
};

export type ShopStoreCard = { name: string; subdomain: string; logo: ShopImage | null; verified: boolean; listed: boolean; sinceYear: number };

export type ShopCheckoutStore = {
  store: ShopStoreCard;
  lines: ShopPreviewLine[];
  subtotal: number;
  discount: { name: string; amount: number } | null;
  coupon: { code: string; ok: boolean; amount: number; message: string | null } | null;
  delivery: { zone: string; charge: number; estimatedDate: string | null; freeShipping: boolean };
  vat: number;
  estimatedTotal: number;
  payments: Array<{ id: string; label: string }>;
  payment: string;
  advance: { amount: number; for: 'DELIVERY' | 'PREORDER' } | null;
  gifts: Array<{ name: string; productName: string; quantity: number }>;
  blockers: string[];
};

export type ShopCheckoutPreview = {
  stores: ShopCheckoutStore[];
  grandTotal: number;
  canPlace: boolean;
  phone: { value: string; verified: boolean };
};

export type ShopPlacedOrder = {
  orderId: string;
  invoiceNumber: number;
  publicCode: string | null;
  store: { name: string; subdomain: string };
  total: number;
  status: string;
  trackUrl: string | null;
  advanceDue: number | null;
  payNow: { amount: number } | null;
};

export type ShopAddress = {
  id: string;
  label: string | null;
  receiver: string;
  phone: string;
  district: string;
  thana: string | null;
  area: string | null;
  address: string;
  isDefault: boolean;
};

export type ShopMe = { name: string | null; phone: string | null; email: string | null };
