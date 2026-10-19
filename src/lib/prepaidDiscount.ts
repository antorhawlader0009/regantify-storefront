/**
 * Discount for paying online: the storefront copy of server/src/orders/prepaid-discount.ts `prepaidDiscountFor`
 * (keep the two the same). The checkout uses it to show the saving before the shopper picks Cash on Delivery;
 * the server works the real amount out again when the order is placed. Shared by every template.
 */
export interface PrepaidRule {
  kind: 'FLAT' | 'PERCENT';
  value: number;
  minOrder: number;
  maxDiscount: number | null;
}

/** The saving on goods worth `goods` (after the other discounts), whole taka, 0 under the minimum. */
export function prepaidDiscountFor(rule: PrepaidRule | null | undefined, goods: number): number {
  if (!rule || goods <= 0 || goods < rule.minOrder) return 0;
  let amount = rule.kind === 'FLAT' ? rule.value : (goods * rule.value) / 100;
  if (rule.maxDiscount !== null) amount = Math.min(amount, rule.maxDiscount);
  return Math.max(0, Math.floor(Math.min(amount, goods)));
}
