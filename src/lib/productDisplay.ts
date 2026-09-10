import type { StorefrontProduct } from './storefrontApi';

export function formatPrice(value: string | number) {
  return `৳${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

/**
 * Whether a product (no variants) is out of stock. `stockQuantity: null`
 * means the vendor never set a stock count on Add/Edit Product (the field
 * was left blank) — that's "unlimited / not tracked," not zero, and must
 * never be treated as out of stock. Only an explicit non-positive number
 * counts as out of stock. Pre-order items are never "out of stock"
 * either way.
 */
export function isOutOfStock(product: StorefrontProduct) {
  if (product.isPreOrder) return false;
  if (product.variants.length > 0) {
    return product.variants.every((v) => v.stock <= 0);
  }
  if (product.stockQuantity === null || product.stockQuantity === undefined) return false;
  return product.stockQuantity <= 0;
}
