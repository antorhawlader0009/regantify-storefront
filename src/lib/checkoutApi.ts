import type { CourierTracking } from './courierTracking';
import type { StorefrontStoreAway } from './storeAway';

// Client-side (browser) fetch helper — used only by the checkout page,
// which is a Client Component (needs cart state from localStorage) and
// so can't use the server-only API_URL from storefrontApi.ts (that one
// runs during SSR, where "localhost" means the server machine; here it
// must mean the machine the API is actually reachable at from the
// visitor's own browser).
//
// Same auto-detect-from-current-host pattern used throughout this
// project (client/src/lib/api.ts, client/src/lib/storefrontUrl.ts): if
// NEXT_PUBLIC_API_URL is set, always use it; otherwise assume the API
// runs on port 4000 on whatever host served this page. This is what
// lets the SAME build work from http://localhost:3000,
// http://192.168.x.x:3000 (a tester's LAN PC), or a real deployed
// domain without per-environment config.
export function apiOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL;
  if (configured) return configured.replace(/\/$/, '');
  if (typeof window === 'undefined') return 'http://localhost:4000';
  return `${window.location.protocol}//${window.location.hostname}:4000`;
}

export interface CheckoutResponse {
  orderId: string;
  invoiceNumber: number;
  // Public order number ("FAS-261003-7K3M9QD") the shopper sees; null only on a server that predates it.
  publicCode?: string | null;
  total: string;
  status: string;
  // Store > COD Guard — PENDING means the order was placed On Hold and
  // the thank-you page must collect the SMS code (StorePal only).
  codVerificationStatus?: 'PENDING' | 'VERIFIED' | 'EXPIRED' | null;
  // Store > COD Guard > "Delivery charge in advance": a COD order whose delivery charge still has to be
  // paid online. The checkout then calls initiateOrderPayment for it (the server charges just this amount).
  advanceDue?: number | null;
}

/**
 * A failed API call's message plus the machine-readable `code` some
 * endpoints add (e.g. checkout's COD_VERIFICATION_REQUIRED), so a caller
 * can branch on it without string-matching the message.
 */
export class CheckoutApiError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
  }
}

async function apiError(res: Response, fallback: string): Promise<CheckoutApiError> {
  const body = await res.json().catch(() => null);
  const message = Array.isArray(body?.message) ? body.message[0] : body?.message;
  return new CheckoutApiError(message || fallback, typeof body?.code === 'string' ? body.code : undefined);
}

// Store > Payment Gateway — one entry per gateway this vendor's checkout
// currently offers (already filtered server-side for enabled/connected
// AND the admin's platform-wide switch — see PaymentGatewaysService.
// listActiveForStorefront). `id` is exactly the value to send back as
// CreateOrderDto.paymentMethod at checkout: "COD"/"ONLINE_PAYMENT" for
// the two built-ins, or this row's own VendorPaymentGateway id for a
// custom gateway (e.g. SSLCommerz).
export interface StorePaymentGateway {
  id: string;
  type: 'COD' | 'ONLINE_PAYMENT' | 'SSLCOMMERZ' | 'BKASH_MERCHANT' | 'VENDOR_PAYSTATION';
  displayLabel: string | null;
  // A flat BDT part PLUS a percentage (0-100) of the order total
  // (subtotal + delivery + VAT - coupon + the flat part),
  // both charged together; useCheckout resolves them into one BDT amount
  // the same way OrdersService.create does server-side (see
  // VendorPaymentGateway.platformChargePercent's own schema comment on
  // the server).
  platformChargeBdt: string;
  platformChargePercent: string;
  // Display-only — Plan.codFeeHidden/onlinePaymentFeeHidden (COD/
  // ONLINE_PAYMENT only, always false for a custom gateway). The fee
  // itself is still charged server-side regardless — OrdersService
  // .create resolves it independently, never trusts anything the client
  // sends. When true, useCheckout folds platformChargeAmount into the
  // total silently instead of exposing it as its own line item.
  feeHidden: boolean;
}

// Settings > Courier Integration > Delivery Charge / Settings > VAT —
// read client-side (same apiOrigin() reasoning as the rest of this file)
// by useCheckout, which needs these before the shopper submits anything,
// to price the order the same way OrdersService.create will. Picked out
// of the full public /v1/store/:subdomain response (StorefrontInfo in
// storefrontApi.ts has the rest, but that fetcher is server-only).
export interface StoreDeliveryCharges {
  insideDhakaCharge: string;
  outsideDhakaCharge: string;
  vatChargeBdt: string;
  paymentGateways: StorePaymentGateway[];
  // Store > COD Guard — when StorePal's checkout should ask for an SMS
  // code on COD orders. Always null on other themes (see the backend's
  // StorefrontService.findVendorBySubdomainOrThrow).
  codSmsVerification?: 'BEFORE_CHECKOUT' | 'AFTER_CHECKOUT' | null;
  // Store > COD Guard > "Delivery charge in advance" — set only when StorePal's checkout should make a COD
  // shopper pay the delivery charge online first (the server also needs Online Payment on).
  // minOrder: only for carts of at least this much; null = every order.
  // delivery: the delivery-charge advance is on (minOrder applies to it); preOrderPercent: the share of pre-order
  // products to pay up front (null = off). Older servers sent only minOrder, which meant delivery.
  codAdvance?: { minOrder: number | null; delivery?: boolean; preOrderPercent?: number | null } | null;
  // Store > Delivery Charge > Delivery time (tracking-plan.md Step 7): the date a parcel ordered now
  // is expected, per zone, as YYYY-MM-DD; null for a zone the store set no days for. Worked out by the
  // server, so the storefront never repeats the rule.
  deliveryEstimate?: { DHAKA: string | null; OUTSIDE_DHAKA: string | null; AROUND_DHAKA?: string | null } | null;
  // Store > Delivery Charge > Around Dhaka: the optional third zone with its charge; null while off (and on
  // Medium/Minimal, which keep two zones).
  aroundDhaka?: { charge: number } | null;
  // Store > Store Away (holiday mode), StorePal only; null while open. See lib/storeAway.ts.
  storeAway?: StorefrontStoreAway | null;
}

export async function getStoreDeliveryCharges(subdomain: string): Promise<StoreDeliveryCharges | null> {
  const res = await fetch(`${apiOrigin()}/v1/store/${subdomain}`);
  if (!res.ok) return null;
  return res.json();
}

// `accessToken` is the logged-in shopper's token, if any: the server then saves the order to that
// account. Without it the order is a guest order, whatever phone number was typed.
export async function placeOrder(subdomain: string, payload: unknown, accessToken?: string): Promise<CheckoutResponse> {
  const res = await fetch(`${apiOrigin()}/v1/store/${subdomain}/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw await apiError(res, 'Could not place the order. Please try again.');

  return res.json();
}

// StorePal theme's "Online Payment" option — called right after
// placeOrder() when the shopper picked Online Payment, using the
// orderId placeOrder just returned. Public, no auth (see
// StorefrontPaymentsController on the backend) — a shopper is never
// logged in during checkout.
export interface InitiateOrderPaymentResponse {
  invoiceNumber: string;
  paymentUrl: string;
  amount: number;
}

export async function initiateOrderPayment(orderId: string): Promise<InitiateOrderPaymentResponse> {
  const res = await fetch(`${apiOrigin()}/v1/store-payments/orders/${orderId}/initiate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = Array.isArray(body?.message) ? body.message[0] : body?.message;
    throw new Error(message || 'Could not start the payment. Please try again.');
  }

  return res.json();
}

export type OrderPaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';

export interface OrderPaymentStatusResponse {
  status: OrderPaymentStatus;
  order: { invoiceNumber: number; status: string; customerPhone: string } | null;
}

/** payment-callback page's own re-verification — never trusts the redirect's own query params, always re-checks with PayStation server-to-server. */
export async function reconcileOrderPayment(invoiceNumber: string): Promise<{ status: OrderPaymentStatus; alreadyFulfilled: boolean }> {
  const res = await fetch(`${apiOrigin()}/v1/store-payments/reconcile/${invoiceNumber}`, { method: 'POST' });
  if (!res.ok) throw new Error('Could not verify this payment.');
  return res.json();
}

export async function getOrderPaymentStatus(invoiceNumber: string): Promise<OrderPaymentStatusResponse> {
  const res = await fetch(`${apiOrigin()}/v1/store-payments/status/${invoiceNumber}`);
  if (!res.ok) throw new Error('Could not find this payment.');
  return res.json();
}

// The CUSTOM:<gatewayId> analog of initiateOrderPayment/
// reconcileOrderPayment/getOrderPaymentStatus above — called instead of
// those three when the shopper picked a vendor-connected custom gateway
// (e.g. SSLCommerz) rather than "Online Payment". Same
// response shapes, same public/no-auth trust model — see
// StorefrontGatewayPaymentsController on the backend.
export async function initiateGatewayOrderPayment(orderId: string): Promise<InitiateOrderPaymentResponse> {
  const res = await fetch(`${apiOrigin()}/v1/store-gateway-payments/orders/${orderId}/initiate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = Array.isArray(body?.message) ? body.message[0] : body?.message;
    throw new Error(message || 'Could not start the payment. Please try again.');
  }

  return res.json();
}

export async function reconcileGatewayOrderPayment(invoiceNumber: string): Promise<{ status: OrderPaymentStatus; alreadyFulfilled: boolean }> {
  const res = await fetch(`${apiOrigin()}/v1/store-gateway-payments/reconcile/${invoiceNumber}`, { method: 'POST' });
  if (!res.ok) throw new Error('Could not verify this payment.');
  return res.json();
}

export async function getGatewayOrderPaymentStatus(invoiceNumber: string): Promise<OrderPaymentStatusResponse> {
  const res = await fetch(`${apiOrigin()}/v1/store-gateway-payments/status/${invoiceNumber}`);
  if (!res.ok) throw new Error('Could not find this payment.');
  return res.json();
}

export interface ValidatedCoupon {
  code: string;
  discountType: 'FIXED' | 'PERCENT' | 'FREE_SHIPPING';
  discountAmount: number;
  // When true, this coupon replaces the automatic discount instead of
  // stacking with it (see OrdersService.create).
  resetOtherDiscounts: boolean;
}

export interface CouponPreviewLine {
  productSlug: string;
  quantity: number;
}

/**
 * Checkout's "Have Coupon?" preview (see reference screenshot) — see
 * StorefrontService.validateCoupon on the backend for why this never
 * sends prices, only product/variant ids and quantities.
 */
export async function validateCoupon(
  subdomain: string,
  code: string,
  customerPhone: string,
  items: CouponPreviewLine[],
): Promise<ValidatedCoupon> {
  const res = await fetch(`${apiOrigin()}/v1/store/${subdomain}/coupons/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, customerPhone, items }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = Array.isArray(body?.message) ? body.message[0] : body?.message;
    throw new Error(message || 'This coupon code is not valid.');
  }

  return res.json();
}

/** Marketing > Gift Cards — a code the shopper can use, and what is left on it. */
export interface ValidatedGiftCard {
  code: string;
  balance: number;
}

/**
 * Checkout's "Have a gift card?" preview (StorefrontService.validateGiftCard).
 * Never redeems: the server takes the balance when the order is placed and
 * works out how much of the total the card pays.
 */
export async function validateGiftCard(subdomain: string, code: string): Promise<ValidatedGiftCard> {
  const res = await fetch(`${apiOrigin()}/v1/store/${subdomain}/gift-cards/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  if (!res.ok) throw await apiError(res, 'This gift card code is not valid.');
  return res.json();
}

/** Marketing > Discounts — what an automatic-discount preview returns. */
export interface AutomaticDiscounts {
  discount: { id: string; name: string; discountType: 'FIXED' | 'PERCENT'; discountAmount: number } | null;
  freeShipping: { id: string; name: string } | null;
}

/**
 * Checkout's automatic-discount preview (StorefrontService.previewDiscounts
 * on the backend). Display only; the order is priced again server-side.
 * Returns null on any error so checkout just shows no discount.
 */
export async function previewDiscounts(
  subdomain: string,
  items: CouponPreviewLine[],
): Promise<AutomaticDiscounts | null> {
  try {
    const res = await fetch(`${apiOrigin()}/v1/store/${subdomain}/discounts/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/** One running automatic discount (Marketing > Discounts), as listed for the product page "Offers" box and the cart nudge. */
export interface DiscountOffer {
  id: string;
  name: string;
  discountType: 'FIXED' | 'PERCENT' | 'FREE_SHIPPING';
  amount: number | null;
  maxDiscount: number | null;
  minCartAmount: number | null;
  minQuantity: number | null;
  /** Empty productIds and categoryNames = the offer covers the whole store. */
  productIds: string[];
  categoryNames: string[];
  endsAt: string | null;
}

/** The running automatic discounts (StorefrontService.listDiscountOffers). Returns [] on any error so the page just shows no offers. */
export async function fetchDiscountOffers(subdomain: string): Promise<DiscountOffer[]> {
  try {
    const res = await fetch(`${apiOrigin()}/v1/store/${subdomain}/discounts`);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

/**
 * "Create custom link for this coupon" — resolves the `?coupon=` link a
 * shopper landed on back to the coupon's real code (see
 * StorefrontService.resolveCouponLink on the backend). Returns `null`
 * on no match/network error rather than throwing — a stale or bad
 * shared link should never block the page it's attached to, it should
 * just fail to pre-fill a coupon.
 */
export async function resolveCouponLink(subdomain: string, link: string): Promise<string | null> {
  try {
    const res = await fetch(`${apiOrigin()}/v1/store/${subdomain}/coupons/by-link?link=${encodeURIComponent(link)}`);
    if (!res.ok) return null;
    const body = await res.json().catch(() => null);
    return body?.code ?? null;
  } catch {
    return null;
  }
}

// Debounced sync of an in-progress checkout to the vendor's "Incomplete
// Orders" list (see server/src/incomplete-orders/) — called from
// checkout/page.tsx a couple of seconds after the shopper stops typing,
// not on every keystroke. Deliberately fire-and-forget: this is
// background bookkeeping the shopper never sees, so a failure here
// (network hiccup, store momentarily unreachable) must never interrupt
// or show an error on the checkout page they're actively filling in —
// unlike placeOrder above, which is a deliberate action and does surface
// errors.
export function syncIncompleteOrder(subdomain: string, payload: unknown): void {
  fetch(`${apiOrigin()}/v1/store/${subdomain}/incomplete-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {
    // Silently ignored — see comment above.
  });
}

/**
 * Store > Integrations > Facebook Pixel — sends a pixel event's details
 * to the server for its Conversions API copy (same event id, so Meta
 * keeps one). Fire-and-forget like syncIncompleteOrder: tracking must
 * never surface an error to the shopper. keepalive lets it finish even
 * when the event was fired right before a navigation (Buy Now, Place Order).
 */
export function relayMetaEvent(subdomain: string, payload: unknown): void {
  fetch(`${apiOrigin()}/v1/store/${subdomain}/meta-events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    // Silently ignored — see comment above.
  });
}

export interface TrackedOrderItem {
  id: string;
  // Null once the product was deleted; variantId only for variant products.
  // Used for the Meta pixel's Purchase content_ids.
  productId?: string | null;
  variantId?: string | null;
  productName: string;
  productImage?: string | null;
  selectedOptions: Record<string, string>;
  unitPrice: string;
  quantity: number;
  lineTotal: string;
}

export interface TrackedOrderStatusHistoryEntry {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  // No longer sent (staff notes stay private); kept optional so older readers still type-check.
  note?: string | null;
  createdAt: string;
}

/**
 * One line of the shopper's order timeline (tracking-plan.md Step 3), built by the server in fixed
 * wording from our status moves and the courier's events. Newest first, at most 30.
 */
export interface TrackedTimelineEntry {
  at: string;
  title: string;
  detail: string | null;
  kind: 'progress' | 'done' | 'problem';
}

export interface TrackedOrder {
  id: string;
  invoiceNumber: number;
  // Public order number (tracking-plan.md Step 2); null on an order the backfill has not reached.
  publicCode?: string | null;
  // Private tracking link token (tracking-plan.md Step 1): /store/{sub}/t/{token}. Null on
  // an order older than the link until the one-off backfill has run.
  trackingToken?: string | null;
  // The date promised when the order was placed (ISO, midnight UTC of the Bangladesh date); null when the store had no estimate.
  estimatedDeliveryDate?: string | null;
  // True once that date has passed and the order is still on its way.
  deliveryLate?: boolean;
  // Delivery charge (or any part) paid before delivery on a COD order: the courier collects only
  // total - advanceAmount. advancePaidAt null means it is still awaiting the shopper's online payment.
  advanceAmount?: string;
  advanceMethod?: 'ONLINE' | 'MANUAL' | null;
  advancePaidAt?: string | null;
  /** What the advance was for: DELIVERY, PREORDER, or LINK (a payment link the store sent); null = none. */
  advanceFor?: 'DELIVERY' | 'PREORDER' | 'LINK' | null;
  status: string;
  customerName: string;
  // The shopper's own contact details (the lookup already required the
  // phone). Used for the Meta pixel's advanced matching on the thank-you page.
  customerPhone?: string;
  customerEmail?: string | null;
  /** The second phone; masked to null on the tracking-link answer. */
  customerPhoneAlt?: string | null;
  shippingAddress: string;
  shippingCity?: string | null;
  shippingDistrict?: string | null;
  subtotal: string;
  deliveryCharge: string;
  // Flat VAT fee — applied to every order regardless of paymentMethod.
  // Shown by StorePal's ThankYouView/orderMemoPdf as "VAT". See
  // Vendor.vatChargeBdt/Order.vatAmount in schema.prisma.
  vatAmount: string;
  // Store > Payment Gateway's per-gateway Platform Charge — the gateway
  // actually used for this order's own configured surcharge, independent
  // of vatAmount above. Shown as "Platform Charge". Always the REAL
  // amount the shopper was charged, regardless of platformChargeHidden.
  platformChargeAmount: string;
  // Snapshotted at order time from Plan.codFeeHidden/onlinePaymentFeeHidden
  // — only suppresses the line item on checkout's own pre-payment cart
  // summary (CheckoutView.tsx/useCheckout). StorePal's ThankYouView and
  // order memo PDF deliberately IGNORE this flag and always show Platform
  // Charge once the order exists — the shopper already paid it as part
  // of `total`, so hiding it post-payment would just make their own
  // receipt look unexplained, not save the vendor anything.
  platformChargeHidden: boolean;
  discountAmount: string;
  total: string;
  paymentMethod: string;
  // Store > COD Guard — PENDING while an after-checkout order waits On
  // Hold for the shopper's SMS code (see StorePal's ThankYouView).
  codVerificationStatus?: 'PENDING' | 'VERIFIED' | 'EXPIRED' | null;
  items: TrackedOrderItem[];
  statusHistory: TrackedOrderStatusHistoryEntry[];
  // Only on the track-order and tracking-link answers, not on the "My orders" list.
  timeline?: TrackedTimelineEntry[];
  createdAt: string;
  // Courier name + tracking ID + stage once the parcel is booked with a
  // courier (pathao-plan.md Step 13); null before that.
  courierTracking?: CourierTracking | null;
  // What the discount was (coupon, gift card, a counter discount); null when none.
  discountLabel?: string | null;
  // POS-system-plan.md Step 5: POS = sold at the shop counter; its page is an in-store receipt.
  source?: 'STOREFRONT' | 'MANUAL' | 'POS';
  // true on a counter sale whose prices already include vatAmount (shown, never added).
  vatIncluded?: boolean;
  // Counter sales on the tracking-link answer only: how it was paid (CASH, CARD, BKASH...).
  paidWith?: string[];
  // Whether the shopper may cancel this order themselves right now (server: orders/customer-cancel.ts).
  // Absent on the "My orders" list and on older answers.
  customerCancel?: { allowed: boolean };
  // Whether the shopper may correct their delivery details right now ("Fix my address").
  customerEdit?: { allowed: boolean };
}

/** The reasons the "Cancel my order" button offers; the server accepts exactly these. */
export type CustomerCancelReason = 'CHANGED_MIND' | 'ORDERED_BY_MISTAKE' | 'BOUGHT_ELSEWHERE';

/**
 * The same order by its private tracking-link token, from the browser: the tracking page uses it
 * to refresh itself (the first paint is fetched on the server, see storefrontApi.getTrackedOrderByLink).
 */
export async function fetchTrackedOrderByLink(subdomain: string, token: string): Promise<TrackedOrder> {
  const res = await fetch(`${apiOrigin()}/v1/store/${subdomain}/track/${encodeURIComponent(token)}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Could not refresh the order.');
  return res.json() as Promise<TrackedOrder>;
}

/** The shopper cancels their own order (tracking token as proof). Returns the order as it is now. */
export async function cancelOrderByLink(subdomain: string, token: string, reason: CustomerCancelReason): Promise<TrackedOrder> {
  const res = await fetch(`${apiOrigin()}/v1/store/${subdomain}/track/${encodeURIComponent(token)}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw await apiError(res, 'Could not cancel the order. Please try again.');
  return res.json() as Promise<TrackedOrder>;
}

/** The shopper corrects their street address, thana/area and second phone (tracking token as proof). Returns the order as it is now. */
export async function editOrderAddressByLink(
  subdomain: string,
  token: string,
  body: { shippingAddress: string; shippingCity?: string; customerPhoneAlt?: string },
): Promise<TrackedOrder> {
  const res = await fetch(`${apiOrigin()}/v1/store/${subdomain}/track/${encodeURIComponent(token)}/contact`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await apiError(res, 'Could not save the address. Please try again.');
  return res.json() as Promise<TrackedOrder>;
}

/**
 * What the page behind a payment link shows (the vendor made it on an order they entered, TellMe idea 19). READY =
 * waiting for the customer to pay; PAID / EXPIRED / UNAVAILABLE carry no amounts.
 */
export interface PaymentLinkInfo {
  state: 'READY' | 'PAID' | 'EXPIRED' | 'UNAVAILABLE';
  orderId?: string;
  orderRef?: string;
  /** First name only. */
  customerName?: string;
  total?: number;
  /** The advance asked for. */
  amount?: number;
  /** The platform's fee, added on the payment page. */
  fee?: number;
  /** What the customer pays now (amount plus fee). */
  payable?: number;
  dueOnDelivery?: number;
  expiresAt?: string | null;
}

export async function fetchPaymentLink(subdomain: string, token: string): Promise<PaymentLinkInfo> {
  const res = await fetch(`${apiOrigin()}/v1/store/${subdomain}/pay/${encodeURIComponent(token)}`, { cache: 'no-store' });
  if (!res.ok) throw await apiError(res, 'This payment link is not valid.');
  return res.json() as Promise<PaymentLinkInfo>;
}

/** `reference` is the public order number (a string) or the old numeric serial. */
export async function trackOrder(subdomain: string, reference: number | string, phone: string): Promise<TrackedOrder> {
  const res = await fetch(`${apiOrigin()}/v1/store/${subdomain}/track-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(typeof reference === 'number' ? { invoiceNumber: reference, phone } : { orderCode: reference, phone }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = Array.isArray(body?.message) ? body.message[0] : body?.message;
    throw new Error(message || 'Could not find that order.');
  }

  return res.json();
}

// -- Landing Page sections (landing-plan.md §6, §8, §9) -------------------
// Both of these are called from Client Components inside the landing/
// render tree (storefront/src/landing/sections/CheckoutForm.tsx,
// LeadForm.tsx) — same reasoning as placeOrder/trackOrder above: a
// landing page's Checkout Form / Lead Form are filled in the browser, so
// they need this file's client-side apiOrigin(), not storefrontApi.ts's
// server-only API_URL.

export interface SubmitLeadPayload {
  name: string;
  phone: string;
  email?: string;
}

/**
 * Lead/Contact Form section, `destination: "vendor-dashboard"`
 * (landing-page-sections.md §6.2). See StorefrontService.submitLandingPageLead
 * on the backend — this is intentionally NOT placeOrder/CreateOrderDto,
 * since a lead never has a cart or a price.
 */
export async function submitLandingPageLead(
  subdomain: string,
  slug: string,
  payload: SubmitLeadPayload,
): Promise<{ success: true }> {
  const res = await fetch(`${apiOrigin()}/v1/store/${subdomain}/landing-pages/${encodeURIComponent(slug)}/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = Array.isArray(body?.message) ? body.message[0] : body?.message;
    throw new Error(message || 'Could not submit your information. Please try again.');
  }

  return res.json();
}

export interface RecordLandingPageVisitPayload {
  sessionKey: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

/**
 * Landing page visit beacon (landing-plan.md §6, §8) — fire-and-forget,
 * same contract as VisitBeacon.tsx's store-wide beacon (never throws,
 * never blocks/delays the page). See
 * StorefrontService.recordLandingPageVisit on the backend.
 */
export function recordLandingPageVisit(subdomain: string, slug: string, payload: RecordLandingPageVisitPayload): void {
  fetch(`${apiOrigin()}/v1/store/${subdomain}/landing-pages/${encodeURIComponent(slug)}/visit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    // Silently ignored — see VisitBeacon.tsx's own comment on why a
    // dropped beacon must never surface to the shopper.
  });
}

// Store > COD Guard — StorePal checkout's SMS verification (see
// CodVerificationService on the backend). The "before checkout" send is
// safe to call for every COD order: it returns required: false, and texts
// nothing, when this phone doesn't need a code.
export async function sendCodVerificationOtp(
  subdomain: string,
  phone: string,
): Promise<{ required: boolean; expiresInSeconds?: number }> {
  const res = await fetch(`${apiOrigin()}/v1/store/${subdomain}/cod-verification/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
  if (!res.ok) throw await apiError(res, 'Could not send the verification code. Please try again.');
  return res.json();
}

// "After checkout" — the thank-you page's code for an order placed On Hold.
export async function verifyCodOrder(
  subdomain: string,
  orderId: string,
  code: string,
): Promise<{ status: string; codVerificationStatus: 'PENDING' | 'VERIFIED' | 'EXPIRED' | null }> {
  const res = await fetch(`${apiOrigin()}/v1/store/${subdomain}/orders/${orderId}/cod-verification/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  if (!res.ok) throw await apiError(res, 'Could not verify the code. Please try again.');
  return res.json();
}

export async function resendCodOrderOtp(subdomain: string, orderId: string): Promise<{ expiresInSeconds: number }> {
  const res = await fetch(`${apiOrigin()}/v1/store/${subdomain}/orders/${orderId}/cod-verification/resend`, {
    method: 'POST',
  });
  if (!res.ok) throw await apiError(res, 'Could not resend the code. Please try again.');
  return res.json();
}
