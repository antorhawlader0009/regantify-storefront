import type { StoreTheme } from './storefrontApi';

export type { StoreTheme };

/** Narrow whatever the API returns to a known theme, defaulting to
 * MEDIUM — so an older cached response or an unrecognized value never
 * crashes a route, it just falls back to the original design. */
export function resolveTheme(theme: string | null | undefined): StoreTheme {
  if (theme === 'MINIMAL') return 'MINIMAL';
  if (theme === 'STOREPAL') return 'STOREPAL';
  return 'MEDIUM';
}
