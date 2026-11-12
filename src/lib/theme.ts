import type { StoreTheme } from './storefrontApi';

export type { StoreTheme };

/** Narrow whatever the API returns to a known theme, defaulting to
 * MEDIUM - so an older cached response or an unrecognized value never
 * crashes a route, it just falls back to the original design. */
export function resolveTheme(theme: string | null | undefined): StoreTheme {
  if (theme === 'MINIMAL') return 'MINIMAL';
  // PlayMate runs on StorePal's pages and features (2026-11-03, the owner's rule: a new template has every StorePal
  // feature); only its look differs, which storeSkin() below tells the StorePal components.
  // Solevo (2026-11-04) is the same: StorePal's pages and features with its own look.
  if (theme === 'STOREPAL' || theme === 'PLAYMATE' || theme === 'SOLEVO' || theme === 'CHICWOVE' || theme === 'CHRONICS' || theme === 'MAHABESH') return 'STOREPAL';
  return 'MEDIUM';
}

/** The look a StorePal-family store draws with. Every page and feature is StorePal's; the skin changes colours, fonts
 * and a few parts (header, hero, cards, footer). A new template on StorePal's code adds a value here. */
export type StoreSkin = 'storepal' | 'playmate' | 'solevo' | 'chicwove' | 'chronics' | 'mahabesh';

export function storeSkin(theme: string | null | undefined): StoreSkin {
  if (theme === 'PLAYMATE') return 'playmate';
  if (theme === 'SOLEVO') return 'solevo';
  if (theme === 'CHRONICS') return 'chronics';
  if (theme === 'MAHABESH') return 'mahabesh';
  if (theme === 'CHICWOVE') return 'chicwove';
  return 'storepal';
}

/** A skin that draws the pages the template's own way: ordinary pages instead of StorePal's dialogs (checkout, account,
 * thank-you, tracking), the template's cart, wishlist, product list and product page. Every template skin is one. */
export function isPageSkin(skin: StoreSkin | null | undefined): boolean {
  return skin === 'playmate' || skin === 'solevo' || skin === 'chicwove' || skin === 'chronics' || skin === 'mahabesh';
}
