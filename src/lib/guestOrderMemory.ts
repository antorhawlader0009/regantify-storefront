/**
 * "Your recent orders" for a guest shopper (never logged into a
 * Customer account — a logged-in Customer's order history comes from
 * the server instead, see StorefrontController's customer/orders route
 * / listOrdersForCustomer) — shared by every theme via useTrackOrder.ts
 * and OrdersView.tsx, same as those two files already are.
 *
 * Remembers every invoice number + phone the shopper has successfully
 * looked up or just placed, in localStorage (survives closing the
 * tab/browser — this is meant to work like a lightweight order-history
 * cache, not a one-session convenience), keyed per-vendor subdomain so
 * one store's order list never leaks into another's. The actual order
 * data itself is NEVER cached here, only the invoice+phone pair needed
 * to re-look it up — trackOrder() always re-fetches fresh from the
 * server (status, items, everything can change after the fact), this
 * just saves the shopper from re-typing/re-finding the invoice number.
 */
export interface RememberedOrder {
  invoiceNumber: number;
  phone: string;
}

const KEY_PREFIX = 'regantify-guest-orders:';
const MAX_REMEMBERED = 20; // generous cap — this is a convenience list, not meant to grow unbounded forever

export function rememberGuestOrder(subdomain: string, invoiceNumber: number, phone: string): void {
  try {
    const key = `${KEY_PREFIX}${subdomain}`;
    const existing = loadRememberedOrders(subdomain);
    // De-duplicate by invoiceNumber (a re-lookup of the same order
    // shouldn't create a second entry) and move it to the front — most
    // recently looked-up/placed first, same ordering a shopper expects.
    const next = [
      { invoiceNumber, phone },
      ...existing.filter((o) => o.invoiceNumber !== invoiceNumber),
    ].slice(0, MAX_REMEMBERED);
    localStorage.setItem(key, JSON.stringify(next));
  } catch {
    // Storage blocked/full — tracking itself still works, the shopper
    // just won't see this order in their remembered list next visit.
  }
}

export function loadRememberedOrders(subdomain: string): RememberedOrder[] {
  try {
    const raw = localStorage.getItem(`${KEY_PREFIX}${subdomain}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (o): o is RememberedOrder => typeof o?.invoiceNumber === 'number' && typeof o?.phone === 'string',
    );
  } catch {
    return [];
  }
}
