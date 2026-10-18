import type { CourierTracking } from './courierTracking';
import type { CartLine } from '@/stores/cart-store';

// Client-side (browser) fetch helper for the storefront's customer
// account system (signup/login/OTP/refresh/logout) — see
// server/src/customer-auth/. Same host-detection pattern as
// checkoutApi.ts; see that file's header comment for why this can't use
// the server-only API_URL from storefrontApi.ts.
function apiOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL;
  if (configured) return configured.replace(/\/$/, '');
  if (typeof window === 'undefined') return 'http://localhost:4000';
  return `${window.location.protocol}//${window.location.hostname}:4000`;
}

// The store this page belongs to (set by ShopperStoreScope in the store layout). A shopper account is platform-wide,
// but every sign-in is for ONE store (server security F-46): sign-in and refresh say which store, and the server checks
// it is the store whose page is asking. A sign-in at one store never works at another.
let shopperStore: string | null = null;

export function setShopperStore(subdomain: string | null): void {
  shopperStore = subdomain ? subdomain.toLowerCase() : null;
}

export function getShopperStore(): string | null {
  return shopperStore;
}

function storeOrThrow(): string {
  if (!shopperStore) throw new Error('Please open the store to sign in.');
  return shopperStore;
}

export interface Customer {
  id: string;
  // Null for an account made with "Login with Google by Regantify": Google gives no phone; the shopper types one at checkout.
  phone: string | null;
  fullName: string;
  email?: string | null;
  address?: string | null;
  // Typed with the two zones every theme knows. A StorePal order can also save 'AROUND_DHAKA' here (Store > Delivery
  // Charge > Around Dhaka), which only StorePal's checkout and profile read; the other themes' zone selects ignore it.
  deliveryZone?: 'DHAKA' | 'OUTSIDE_DHAKA' | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResult {
  customer: Customer;
  accessToken: string;
  refreshToken: string;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${apiOrigin()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // Required so the httpOnly refresh-token cookie (set on the
    // /v1/customer-auth/* path — see CustomerAuthController) is sent
    // and stored despite the storefront (port 3000) and API (port 4000)
    // being different origins. The API's CORS config already allows
    // credentialed requests from this app — see server/src/main.ts.
    credentials: 'include',
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const responseBody = await res.json().catch(() => null);
    const message = Array.isArray(responseBody?.message) ? responseBody.message[0] : responseBody?.message;
    throw new Error(message || 'Something went wrong. Please try again.');
  }

  return res.json();
}

// Same shape as post() above but for authenticated GET/PATCH calls that
// carry a bearer access token instead of (or in addition to) a JSON
// body — used by the Account > Edit Profile page.
async function authFetch<T>(path: string, accessToken: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(`${apiOrigin()}${path}`, {
    method: init?.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    credentials: 'include',
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
  });

  if (!res.ok) {
    const responseBody = await res.json().catch(() => null);
    const message = Array.isArray(responseBody?.message) ? responseBody.message[0] : responseBody?.message;
    throw new Error(message || 'Something went wrong. Please try again.');
  }

  return res.json();
}

/** The account's saved cart (see CustomerCart on the server) — lines are the storefront's CartLine shape. */
export async function getMyCart(accessToken: string): Promise<CartLine[]> {
  const result = await authFetch<{ lines: CartLine[] }>('/v1/customer-auth/me/cart', accessToken);
  return result.lines;
}

export function saveMyCart(accessToken: string, lines: CartLine[]): Promise<unknown> {
  return authFetch('/v1/customer-auth/me/cart', accessToken, { method: 'PUT', body: { lines } });
}

/** Step 1 of signup — sends an OTP to the given phone. `subdomain` puts that vendor's store name in the SMS text instead of "Regantify". */
export function customerSignup(
  phone: string,
  fullName: string,
  password: string,
  email?: string,
  subdomain?: string,
) {
  return post<{ message: string; expiresInSeconds: number }>('/v1/customer-auth/signup', {
    phone,
    fullName,
    email,
    password,
    subdomain,
  });
}

export function resendSignupOtp(
  phone: string,
  fullName: string,
  password: string,
  email?: string,
  subdomain?: string,
) {
  return post<{ message: string; expiresInSeconds: number }>('/v1/customer-auth/signup/resend-otp', {
    phone,
    fullName,
    email,
    password,
    subdomain,
  });
}

/** Step 2 of signup — verifies the code and creates the account, returning a full session. */
export function verifyCustomerSignup(phone: string, code: string) {
  return post<AuthResult>('/v1/customer-auth/signup/verify-otp', { phone, code, subdomain: storeOrThrow() });
}

/** "Email Login" — identifier can be either an email or a phone number (see CustomerLoginDto). */
export function customerLogin(identifier: string, password: string) {
  return post<AuthResult>('/v1/customer-auth/login', { identifier, password, subdomain: storeOrThrow() });
}

/** "OTP Login" — step 1: sends a login code to an existing account's phone. `subdomain` puts that vendor's store name in the SMS text instead of "Regantify". */
export function otpLoginSend(phone: string, subdomain?: string) {
  return post<{ message: string; expiresInSeconds: number }>('/v1/customer-auth/otp-login/send', {
    phone,
    subdomain,
  });
}

/** "OTP Login" — step 2: verifies the code and returns a full session. */
export function otpLoginVerify(phone: string, code: string) {
  return post<AuthResult>('/v1/customer-auth/otp-login/verify', { phone, code, subdomain: storeOrThrow() });
}

/** "Change Password" (forgot-password) — step 1: texts a reset code to the account's phone. */
export function forgotPasswordSendOtp(phone: string, subdomain?: string) {
  return post<{ message: string; expiresInSeconds: number }>('/v1/customer-auth/forgot-password/send-otp', {
    phone,
    subdomain,
  });
}

/** Step 2: verifies the code, returning a short-lived resetToken. */
export function forgotPasswordVerifyOtp(phone: string, code: string) {
  return post<{ resetToken: string; expiresInSeconds: number }>(
    '/v1/customer-auth/forgot-password/verify-otp',
    { phone, code },
  );
}

/** Step 3: exchanges the resetToken for a new password. */
export function resetPassword(resetToken: string, password: string) {
  return post<{ message: string }>('/v1/customer-auth/forgot-password/reset', { resetToken, password });
}

/** Renews this store's sign-in from this store's own refresh cookie (one per store). */
export async function refreshCustomerSession(): Promise<AuthResult> {
  if (!shopperStore) throw new Error('Session expired.');
  const res = await fetch(`${apiOrigin()}/v1/customer-auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ subdomain: shopperStore }),
  });
  if (!res.ok) {
    throw new Error('Session expired.');
  }
  return res.json();
}

export interface RegantifyConnectConfig {
  /** The central Regantify sign-in page is set up on the server. */
  enabled: boolean;
  /** Its Google sign-in is set up too. */
  google: boolean;
  /** The central page's base address, e.g. https://accounts.example.com. */
  url: string | null;
}

let connectConfig: Promise<RegantifyConnectConfig> | null = null;

/** Whether the store shows "Login with Google by Regantify" (asked once per page load). */
export function getRegantifyConnectConfig(): Promise<RegantifyConnectConfig> {
  connectConfig ??= fetch(`${apiOrigin()}/v1/shopper-connect/config`)
    .then((r) => (r.ok ? r.json() : { enabled: false, google: false, url: null }))
    .catch(() => ({ enabled: false, google: false, url: null }));
  return connectConfig;
}

/** The address of the central Regantify sign-in page for this store, coming back to `returnTo` (this page) afterwards. */
export function regantifyConnectUrl(base: string, subdomain: string, returnTo: string): string {
  const params = new URLSearchParams({ store: subdomain, return: returnTo });
  return `${base.replace(/\/$/, '')}/login?${params.toString()}`;
}

/** Swaps the central page's one-time code (?rgf_login=...) for this store's sign-in. */
export function connectLogin(code: string): Promise<AuthResult> {
  return post<AuthResult>('/v1/customer-auth/connect-login', { subdomain: storeOrThrow(), code });
}

export async function customerLogout(accessToken: string): Promise<void> {
  await fetch(`${apiOrigin()}/v1/customer-auth/logout`, {
    method: 'POST',
    credentials: 'include',
    headers: { Authorization: `Bearer ${accessToken}` },
  }).catch(() => {
    // Best-effort — even if this fails (e.g. token already expired),
    // the caller always clears local state right after calling this.
  });
}

// -----------------------------------------------------------------
// Profile (Account > Edit Profile)
// -----------------------------------------------------------------

export interface UpdateProfileInput {
  fullName: string;
  email?: string;
  address?: string;
  deliveryZone?: 'DHAKA' | 'OUTSIDE_DHAKA' | 'AROUND_DHAKA';
}

export function getMyProfile(accessToken: string): Promise<Customer> {
  return authFetch<Customer>('/v1/customer-auth/me', accessToken);
}

export function updateMyProfile(accessToken: string, input: UpdateProfileInput): Promise<Customer> {
  return authFetch<Customer>('/v1/customer-auth/me', accessToken, { method: 'PATCH', body: input });
}

// -----------------------------------------------------------------
// Change Address / Change Password (already logged in)
// -----------------------------------------------------------------

export interface UpdateAddressInput {
  streetAddress: string;
  city?: string;
  district?: string;
  zipCode?: string;
}

/** Account > Change Address — see UpdateCustomerAddressDto's own comment on why these four fields join into one. */
export function updateMyAddress(accessToken: string, input: UpdateAddressInput): Promise<Customer> {
  return authFetch<Customer>('/v1/customer-auth/me/address', accessToken, { method: 'PATCH', body: input });
}

/** The account's saved wishlist for one store (TellMe idea 62). notifyDrop = "tell me when the price falls or it is back". */
export interface ServerWishlist {
  items: Array<{ slug: string; notifyDrop: boolean }>;
}

export function getServerWishlist(accessToken: string, subdomain: string): Promise<ServerWishlist> {
  return authFetch<ServerWishlist>(`/v1/customer-auth/me/wishlist?subdomain=${encodeURIComponent(subdomain)}`, accessToken);
}

/** Makes the account's list exactly these slugs (alert choices stay on the ones kept). */
export function syncServerWishlist(accessToken: string, subdomain: string, slugs: string[]): Promise<ServerWishlist> {
  return authFetch<ServerWishlist>('/v1/customer-auth/me/wishlist', accessToken, { method: 'PUT', body: { subdomain, slugs } });
}

export function setWishlistNotify(accessToken: string, subdomain: string, slug: string, notify: boolean): Promise<ServerWishlist> {
  return authFetch<ServerWishlist>('/v1/customer-auth/me/wishlist/notify', accessToken, { method: 'PATCH', body: { subdomain, slug, notify } });
}

/** A saved delivery address in the shopper's account (TellMe idea 53): up to 5, one of them the default. */
export interface SavedAddress {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  district: string | null;
  city: string | null;
  address: string;
  deliveryZone: 'DHAKA' | 'AROUND_DHAKA' | 'OUTSIDE_DHAKA';
  isDefault: boolean;
}

export type SavedAddressInput = Omit<SavedAddress, 'id' | 'district' | 'city' | 'isDefault'> & {
  district?: string;
  city?: string;
  isDefault?: boolean;
};

export interface SavedAddressList {
  addresses: SavedAddress[];
  /** Most addresses a shopper may keep. */
  max: number;
}

export function listMyAddresses(accessToken: string): Promise<SavedAddressList> {
  return authFetch<SavedAddressList>('/v1/customer-auth/me/addresses', accessToken);
}

export function createMyAddress(accessToken: string, input: SavedAddressInput): Promise<SavedAddressList> {
  return authFetch<SavedAddressList>('/v1/customer-auth/me/addresses', accessToken, { method: 'POST', body: input });
}

export function updateMyAddressById(accessToken: string, id: string, input: Partial<SavedAddressInput>): Promise<SavedAddressList> {
  return authFetch<SavedAddressList>(`/v1/customer-auth/me/addresses/${encodeURIComponent(id)}`, accessToken, { method: 'PATCH', body: input });
}

export function deleteMyAddress(accessToken: string, id: string): Promise<SavedAddressList> {
  return authFetch<SavedAddressList>(`/v1/customer-auth/me/addresses/${encodeURIComponent(id)}`, accessToken, { method: 'DELETE' });
}

/** Account > Change Password (requires the current password). */
export function changeMyPassword(accessToken: string, currentPassword: string, newPassword: string) {
  return authFetch<{ message: string }>('/v1/customer-auth/me/password', accessToken, {
    method: 'PATCH',
    body: { currentPassword, newPassword },
  });
}

// -----------------------------------------------------------------
// Order history (see StorefrontController's customer/orders route)
// -----------------------------------------------------------------

export interface CustomerOrderItem {
  id: string;
  productName: string;
  productImage?: string | null;
  quantity: number;
  lineTotal: string;
}

export interface CustomerOrder {
  id: string;
  invoiceNumber: number;
  status: string;
  total: string;
  createdAt: string;
  items: CustomerOrderItem[];
  // See TrackedOrder.courierTracking (pathao-plan.md Step 13).
  courierTracking?: CourierTracking | null;
}

export async function listCustomerOrders(subdomain: string, accessToken: string): Promise<CustomerOrder[]> {
  const res = await fetch(`${apiOrigin()}/v1/store/${subdomain}/customer/orders`, {
    credentials: 'include',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error('Could not load your orders.');
  }
  return res.json();
}

/** Reward points: the store's rules and the logged-in shopper's balance (server StorefrontService.getCustomerRewards). */
export interface CustomerRewards {
  enabled: boolean;
  earnPerBdt: number;
  maxRedeemPercent: number;
  balance: number;
  entries: Array<{ id: string; type: 'EARN' | 'SPEND' | 'REFUND_SPEND' | 'REVERSE_EARN'; points: number; note: string | null; createdAt: string }>;
}

export async function fetchCustomerRewards(subdomain: string, accessToken: string): Promise<CustomerRewards> {
  const res = await fetch(`${apiOrigin()}/v1/store/${subdomain}/customer/rewards`, {
    credentials: 'include',
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Could not load your reward points.');
  return res.json();
}

/** One earlier order's lines at today's price and stock (server StorefrontService.getBuyAgainLines). */
export interface BuyAgainResult {
  lines: Array<{
    productSlug: string;
    name: string;
    image: string | null;
    unitPrice: number;
    originalUnitPrice: number | null;
    quantity: number;
    selectedOptions: Record<string, string>;
    isPreOrder: boolean;
    minOrderQuantity: number | null;
    quantityStep?: number;
    productId: string;
    variantId: string | null;
  }>;
  notices: Array<{ name: string; reason: 'UNAVAILABLE' | 'SOLD_OUT' | 'REDUCED'; available?: number }>;
}

export async function fetchBuyAgain(subdomain: string, accessToken: string, orderId: string): Promise<BuyAgainResult> {
  const res = await fetch(`${apiOrigin()}/v1/store/${subdomain}/customer/orders/${encodeURIComponent(orderId)}/buy-again`, {
    credentials: 'include',
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Could not load that order.');
  return res.json();
}

// -----------------------------------------------------------------
// "Your Coupons" (see StorefrontController's customer/coupons route)
// -----------------------------------------------------------------

export interface CustomerCoupon {
  id: string;
  code: string;
  discountType: 'FIXED' | 'PERCENT' | 'FREE_SHIPPING';
  amount: string | null;
  maxDiscount: string | null;
  validTill: string | null;
  usageLimit: number | null;
  usageCount: number;
}

export async function listCustomerCoupons(subdomain: string, accessToken: string): Promise<CustomerCoupon[]> {
  const res = await fetch(`${apiOrigin()}/v1/store/${subdomain}/customer/coupons`, {
    credentials: 'include',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error('Could not load your coupons.');
  }
  return res.json();
}

/** Wholesale prices for the logged-in shopper (server StorefrontService.getCustomerWholesale); empty unless their phone has the store's tag. */
export interface CustomerWholesale {
  active: boolean;
  prices: Record<string, number>;
}

export async function fetchCustomerWholesale(subdomain: string, accessToken: string): Promise<CustomerWholesale> {
  const res = await fetch(`${apiOrigin()}/v1/store/${subdomain}/customer/wholesale`, {
    credentials: 'include',
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  if (!res.ok) return { active: false, prices: {} };
  return res.json();
}
