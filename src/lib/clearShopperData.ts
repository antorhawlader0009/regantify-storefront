/**
 * Wipes what this browser remembers about the shopper who just logged out (or whose session ended):
 * the auto-saved checkout form (name / phone / address), remembered guest orders, the wishlist and
 * the "order just placed" / incomplete-order session keys. Without this the next person on the same
 * browser, logged in as someone else or not, would see the previous shopper's address and orders.
 * The cart is emptied separately, by CartStoreProvider, when the account changes.
 */
// Security audit step 29 (2026-11-14) added the rest: the AI chat history (it holds the name, phone and address typed into the chat),
// the second phone, the saved delivery place, the instant-checkout and payment-link hand-offs, recently viewed products. Each list is
// wiped from both storages, so a key that moves between them is still cleared. A new key that holds what a shopper typed or bought goes here.
const LOCAL_PREFIXES = [
  'regantify-checkout-form:',
  'regantify-checkout-alt:',
  'regantify-guest-orders:',
  'regantify-instant-checkout:',
  'storepal-wishlist:',
  'storepal-chats:',
  'storepal-delivery-place:',
  'storepal-delivery-district:',
  'storepal-recent:',
  'storepal-last-view:',
];
const SESSION_PREFIXES = [
  'regantify-last-order',
  'regantify-checkout-session:',
  'regantify-pay-link',
  'storepal-chat-current:',
  'storepal-chat-open:',
  'storepal-chat-on:',
];

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
  const all = [...LOCAL_PREFIXES, ...SESSION_PREFIXES];
  try {
    removeByPrefix(localStorage, all);
  } catch {}
  try {
    removeByPrefix(sessionStorage, all);
  } catch {}
}
