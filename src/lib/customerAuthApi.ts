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
    // /api/v1/customer-auth/* path — see CustomerAuthController) is sent
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

/** Step 1 of signup — sends an OTP to the given phone. */
export function customerSignup(phone: string, fullName: string, password: string) {
  return post<{ message: string; expiresInSeconds: number }>('/api/v1/customer-auth/signup', {
    phone,
    fullName,
    password,
  });
}

export function resendSignupOtp(phone: string, fullName: string, password: string) {
  return post<{ message: string; expiresInSeconds: number }>('/api/v1/customer-auth/signup/resend-otp', {
    phone,
    fullName,
    password,
  });
}

/** Step 2 of signup — verifies the code and creates the account, returning a full session. */
export function verifyCustomerSignup(phone: string, code: string) {
  return post<AuthResult>('/api/v1/customer-auth/signup/verify-otp', { phone, code });
}

export function customerLogin(phone: string, password: string) {
  return post<AuthResult>('/api/v1/customer-auth/login', { phone, password });
}

export async function refreshCustomerSession(): Promise<AuthResult> {
  const res = await fetch(`${apiOrigin()}/api/v1/customer-auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error('Session expired.');
  }
  return res.json();
}

export async function customerLogout(accessToken: string): Promise<void> {
  await fetch(`${apiOrigin()}/api/v1/customer-auth/logout`, {
    method: 'POST',
    credentials: 'include',
    headers: { Authorization: `Bearer ${accessToken}` },
  }).catch(() => {
    // Best-effort — even if this fails (e.g. token already expired),
    // the caller always clears local state right after calling this.
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
  const res = await fetch(`${apiOrigin()}/api/v1/store/${subdomain}/customer/orders`, {
    credentials: 'include',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error('Could not load your orders.');
  }
  return res.json();
}
