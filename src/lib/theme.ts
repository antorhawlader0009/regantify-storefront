import type { StoreTheme } from './storefrontApi';

export type { StoreTheme };

/** Narrow whatever the API returns to a known theme, defaulting to
 * MEDIUM - so an older cached response or an unrecognized value never
 * crashes a route, it just falls back to the original design. */
export function resolveTheme(theme: string | null | undefined): StoreTheme {
  if (theme === 'MINIMAL') return 'MINIMAL';
  // PlayMate runs on StorePal's pages and features (2026-11-03, the owner's rule: a new template has every StorePal
  // feature); only its look differs, which storeSkin() below tells the StorePal components.
  if (theme === 'STOREPAL' || theme === 'PLAYMATE') return 'STOREPAL';
  return 'MEDIUM';
}

/** The look a StorePal-family store draws with. Every page and feature is StorePal's; the skin changes colours, fonts
 * and a few parts (header, hero, cards, footer). A new template on StorePal's code adds a value here. */
export type StoreSkin = 'storepal' | 'playmate';

export function storeSkin(theme: string | null | undefined): StoreSkin {
  return theme === 'PLAYMATE' ? 'playmate' : 'storepal';
}
