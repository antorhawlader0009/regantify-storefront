/**
 * "Create custom link for this coupon" hand-off — StorePal-only (see
 * [[theme-scope-storepal-only]]: Medium/Minimal never read this).
 *
 * A shopper who opens /store/:subdomain?coupon=<link> lands on the
 * HomeView, which resolves the link to a real coupon code (see
 * resolveCouponLink in lib/checkoutApi.ts) and stashes it here so it
 * survives the navigation to /checkout — CheckoutView then reads it
 * back to pre-fill (and, once a phone number is on hand, auto-apply)
 * the "Have Coupon?" box, without either page needing a shared
 * server/global store. sessionStorage, not localStorage: a shared link
 * should only pre-fill for the browsing session it was opened in, same
 * lifetime as useCheckout's own per-tab checkout `sessionKey`, not
 * follow the shopper around forever.
 */
const KEY_PREFIX = 'regantify-pending-coupon:';

export function setPendingCoupon(subdomain: string, code: string): void {
  try {
    sessionStorage.setItem(`${KEY_PREFIX}${subdomain}`, code);
  } catch {
    // Private-browsing/storage-blocked — auto-apply silently doesn't
    // happen; the shopper can still type the code in by hand.
  }
}

export function takePendingCoupon(subdomain: string): string | null {
  try {
    const key = `${KEY_PREFIX}${subdomain}`;
    const code = sessionStorage.getItem(key);
    if (code) sessionStorage.removeItem(key);
    return code;
  } catch {
    return null;
  }
}
