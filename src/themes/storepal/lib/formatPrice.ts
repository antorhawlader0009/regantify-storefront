/** Whole-number ৳ price, matching the storepal.com.bd reference screenshots
 * (e.g. "৳3990", "৳ 10,080") — no decimals, unlike Medium/Minimal's
 * formatPrice (see lib/productDisplay.ts), which always shows two. */
export function formatPrice(value: string | number): string {
  return `৳${Math.round(Number(value)).toLocaleString('en-US')}`;
}
