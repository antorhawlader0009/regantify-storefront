/**
 * Checkout form auto-save — StorePal-only (see
 * [[theme-scope-storepal-only]]: Medium/Minimal never read/write this;
 * useCheckout.ts itself, shared by every theme, is untouched).
 *
 * A guest (not logged in — a logged-in Customer already gets their
 * saved name/phone/address from their account, see useCheckout's own
 * customer-prefill effect) has to retype their name/phone/address/etc
 * every single checkout, on every visit, since nothing about the form
 * persists across page loads otherwise. This mirrors that into
 * localStorage (not sessionStorage — deliberately meant to survive
 * closing the tab/browser and coming back another day, same "remembers
 * you like a browser autofill would" convenience the user asked for),
 * keyed per-vendor subdomain so filling in checkout on one store never
 * leaks into another vendor's form.
 *
 * Used by CheckoutView.tsx alongside useCheckout — this file only reads
 * useCheckout's own exported CheckoutFormState shape and never touches
 * useCheckout.ts, so this stays a StorePal-only addition.
 */
import type { CheckoutFormState } from '@/lib/useCheckout';

const KEY_PREFIX = 'regantify-checkout-form:';

// Only the free-text/selection fields are worth remembering — phone is
// included (a guest still has to retype it; only a logged-in Customer's
// phone comes from their account) since retyping an 11-digit number is
// exactly the kind of friction this feature exists to remove.
type SavedFields = Omit<CheckoutFormState, 'note'>;

export function loadSavedCheckoutForm(subdomain: string): Partial<SavedFields> | null {
  try {
    const raw = localStorage.getItem(`${KEY_PREFIX}${subdomain}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedFields>;
    return typeof parsed === 'object' && parsed !== null ? parsed : null;
  } catch {
    // Private-browsing/storage-blocked, or malformed JSON from an older
    // version of this format — treat exactly like "nothing saved yet".
    return null;
  }
}

// Deliberately never cleared after a successful order — the address/
// phone that just worked is exactly what a repeat shopper wants
// pre-filled again next time, same reasoning a browser's own address
// autofill keeps an entry after you use it once, not just once.
export function saveCheckoutForm(subdomain: string, form: CheckoutFormState): void {
  try {
    const { fullName, phone, address, city, district, zone } = form;
    const toSave: SavedFields = { fullName, phone, address, city, district, zone };
    localStorage.setItem(`${KEY_PREFIX}${subdomain}`, JSON.stringify(toSave));
  } catch {
    // Storage blocked/full — auto-save silently doesn't happen, checkout
    // itself still works fine, the shopper just retypes next time.
  }
}
