import type { StorefrontStockSettings } from '@/lib/storefrontApi';
import { isOutOfStock } from '@/lib/productDisplay';

// StorePal's fallback wording when the vendor enabled backorder but left
// a message blank — keep in sync with client's
// pages/vendor/store/StockSettings.tsx placeholders.
const DEFAULT_POPUP_MESSAGE_HTML =
  '<p>This product is currently out of stock. If you order this product, delivery time will be 2-3 weeks.</p>';
const DEFAULT_SHORT_MESSAGE = 'Backorder. Delivery time 2-3 Weeks.';

export interface BackorderConfig {
  popupMessageHtml: string;
  shortMessage: string;
}

/**
 * Store > Stock Settings' backorder, resolved for ProductPurchasePanel's
 * `backorder` prop: null when the vendor doesn't allow backorders (the
 * default), so the panel keeps its usual out-of-stock block.
 */
export function resolveBackorder(settings: StorefrontStockSettings | undefined): BackorderConfig | null {
  if (!settings?.allowBackorder) return null;
  return {
    popupMessageHtml: settings.backorderPopupMessage || DEFAULT_POPUP_MESSAGE_HTML,
    shortMessage: settings.backorderShortMessage || DEFAULT_SHORT_MESSAGE,
  };
}

/**
 * Store > Stock Settings' "Show out-of-stock products in shop pages" —
 * drops sold-out products from a StorePal listing when the vendor turned
 * it off. A product page reached by direct link still renders.
 */
export function visibleInListings<T extends Parameters<typeof isOutOfStock>[0]>(
  products: T[],
  settings: StorefrontStockSettings | undefined,
): T[] {
  if (settings?.showOutOfStockProducts !== false) return products;
  return products.filter((p) => !isOutOfStock(p));
}
