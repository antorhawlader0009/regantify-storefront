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

export interface Customer {
  id: string;
  phone: string;
  fullName: string;
  email?: string | null;
  address?: string | null;
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
  return post<AuthResult>('/v1/customer-auth/signup/verify-otp', { phone, code });
}

/** "Email Login" — identifier can be either an email or a phone number (see CustomerLoginDto). */
export function customerLogin(identifier: string, password: string) {
  return post<AuthResult>('/v1/customer-auth/login', { identifier, password });
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
  return post<AuthResult>('/v1/customer-auth/otp-login/verify', { phone, code });
}

/** "Change Password" (forgot-password) — step 1: sends a reset code to the given email. */
export function forgotPasswordSendOtp(email: string) {
  return post<{ message: string; expiresInSeconds: number }>('/v1/customer-auth/forgot-password/send-otp', {
    email,
  });
}

/** Step 2: verifies the code, returning a short-lived resetToken. */
export function forgotPasswordVerifyOtp(email: string, code: string) {
  return post<{ resetToken: string; expiresInSeconds: number }>(
    '/v1/customer-auth/forgot-password/verify-otp',
    { email, code },
  );
}

/** Step 3: exchanges the resetToken for a new password. */
export function resetPassword(resetToken: string, password: string) {
  return post<{ message: string }>('/v1/customer-auth/forgot-password/reset', { resetToken, password });
}

export async function refreshCustomerSession(): Promise<AuthResult> {
  const res = await fetch(`${apiOrigin()}/v1/customer-auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error('Session expired.');
  }
  return res.json();
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
  deliveryZone?: 'DHAKA' | 'OUTSIDE_DHAKA';
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
