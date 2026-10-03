/**
 * Wipes what this browser remembers about the shopper who just logged out (or whose session ended):
 * the auto-saved checkout form (name / phone / address), remembered guest orders, the wishlist and
 * the "order just placed" / incomplete-order session keys. Without this the next person on the same
 * browser, logged in as someone else or not, would see the previous shopper's address and orders.
 * The cart is emptied separately, by CartStoreProvider, when the account changes.
 */
const LOCAL_PREFIXES = ['regantify-checkout-form:', 'regantify-guest-orders:', 'storepal-wishlist:'];
const SESSION_PREFIXES = ['regantify-last-order', 'regantify-checkout-session:'];

function removeByPrefix(storage: Storage, prefixes: string[]) {
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key && prefixes.some((p) => key.startsWith(p))) keys.push(key);
  }
  keys.forEach((key) => storage.removeItem(key));
}

export function clearShopperData(): void {
  if (typeof window === 'undefined') return;
  // Storage can be blocked (private modes); there is nothing to wipe then.
  try {
    removeByPrefix(localStorage, LOCAL_PREFIXES);
  } catch {}
  try {
    removeByPrefix(sessionStorage, SESSION_PREFIXES);
  } catch {}
}
