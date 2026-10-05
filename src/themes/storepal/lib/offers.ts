import type { DiscountOffer } from '@/lib/checkoutApi';
import { formatPrice } from '@/lib/productDisplay';

/** True when the offer covers the whole store (no product or category limit). */
export function isStoreWide(offer: DiscountOffer): boolean {
  return offer.productIds.length === 0 && offer.categoryNames.length === 0;
}

/** Whether a product can get this offer: store-wide, or listed by id, or in one of its categories. */
export function offerCoversProduct(offer: DiscountOffer, product: { id: string; category?: string | null; secondaryCategories?: string[] }): boolean {
  if (isStoreWide(offer)) return true;
  if (offer.productIds.includes(product.id)) return true;
  const names = [product.category, ...(product.secondaryCategories ?? [])];
  return names.some((n) => !!n && offer.categoryNames.includes(n));
}

/** "10% off (up to ৳200)", "৳100 off" or "Free delivery". */
export function offerBenefit(offer: DiscountOffer): string {
  if (offer.discountType === 'FREE_SHIPPING') return 'Free delivery';
  const amount = offer.amount ?? 0;
  if (offer.discountType === 'PERCENT') {
    return offer.maxDiscount ? `${amount}% off (up to ${formatPrice(offer.maxDiscount)})` : `${amount}% off`;
  }
  return `${formatPrice(amount)} off`;
}

/** The conditions as one short phrase, "" when there are none: "on orders over ৳1000 · buy 2 or more". */
export function offerConditions(offer: DiscountOffer): string {
  const parts: string[] = [];
  if (offer.minCartAmount) parts.push(`on orders over ${formatPrice(offer.minCartAmount)}`);
  if (offer.minQuantity && offer.minQuantity > 1) parts.push(`buy ${offer.minQuantity} or more`);
  return parts.join(' · ');
}
