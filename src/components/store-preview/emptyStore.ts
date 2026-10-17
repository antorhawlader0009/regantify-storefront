import type { ProductArtName } from './PlaceholderArt';

/**
 * The shared rule and sample data for the empty-store preview (store-empty-preview.md). Every template asks
 * `isEmptyStorePreview` and builds its own layout from `SAMPLE_PRODUCTS` + `PlaceholderArt`.
 */

/**
 * Show the drawn sample shop instead of an empty one. Only on the plain home view (a search or a category that
 * finds nothing keeps its own "No matches" message), and only while the server says the store has no public
 * product at all (`setup` is sent only then). A store whose products are all hidden for being sold out has
 * products, so `setup` is null and it is not a "new store".
 */
export function isEmptyStorePreview({
  productCount,
  isFiltered,
  setup,
}: {
  productCount: number;
  isFiltered: boolean;
  setup: unknown;
}): boolean {
  return !isFiltered && productCount === 0 && setup != null;
}

/** Page anchors a template's preview can use: its sample grid (the hero's "Shop all") and the owner's setup steps. */
export const SAMPLE_PRODUCTS_ID = 'sample-products';
export const STORE_SETUP_ID = 'store-setup';

export interface SampleProduct {
  art: ProductArtName;
  /** A believable taka price for the sample card. Never a real price: the cards are not links. */
  price: number;
}

/** Mixed goods on purpose: the preview has to look right for a clothing, gadget, home or beauty store alike. */
export const SAMPLE_PRODUCTS: SampleProduct[] = [
  { art: 'product-1', price: 850 },
  { art: 'product-2', price: 450 },
  { art: 'product-3', price: 2850 },
  { art: 'product-4', price: 1990 },
  { art: 'product-5', price: 3400 },
  { art: 'product-6', price: 2200 },
  { art: 'product-7', price: 650 },
  { art: 'product-8', price: 890 },
];
