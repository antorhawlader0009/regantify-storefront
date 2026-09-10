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
function apiOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL;
  if (configured) return configured.replace(/\/$/, '');
  if (typeof window === 'undefined') return 'http://localhost:4000';
  return `${window.location.protocol}//${window.location.hostname}:4000`;
}

export interface CheckoutResponse {
  invoiceNumber: number;
  total: string;
}

export async function placeOrder(subdomain: string, payload: unknown): Promise<CheckoutResponse> {
  const res = await fetch(`${apiOrigin()}/api/v1/store/${subdomain}/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = Array.isArray(body?.message) ? body.message[0] : body?.message;
    throw new Error(message || 'Could not place the order. Please try again.');
  }

  return res.json();
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
  fetch(`${apiOrigin()}/api/v1/store/${subdomain}/incomplete-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {
    // Silently ignored — see comment above.
  });
}

export interface TrackedOrderItem {
  id: string;
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
  note?: string | null;
  createdAt: string;
}

export interface TrackedOrder {
  id: string;
  invoiceNumber: number;
  status: string;
  customerName: string;
  shippingAddress: string;
  shippingCity?: string | null;
  shippingDistrict?: string | null;
  subtotal: string;
  deliveryCharge: string;
  discountAmount: string;
  total: string;
  paymentMethod: string;
  items: TrackedOrderItem[];
  statusHistory: TrackedOrderStatusHistoryEntry[];
  createdAt: string;
}

export async function trackOrder(subdomain: string, invoiceNumber: number, phone: string): Promise<TrackedOrder> {
  const res = await fetch(`${apiOrigin()}/api/v1/store/${subdomain}/track-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ invoiceNumber, phone }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = Array.isArray(body?.message) ? body.message[0] : body?.message;
    throw new Error(message || 'Could not find that order.');
  }

  return res.json();
}
