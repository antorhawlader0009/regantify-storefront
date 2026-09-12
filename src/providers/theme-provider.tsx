'use client';

import { createContext, useContext } from 'react';
import type { StoreTheme } from '@/lib/theme';

const ThemeContext = createContext<StoreTheme>('MEDIUM');

/**
 * Carries the theme resolved server-side (see store/[subdomain]/layout.tsx)
 * down into client-component routes — checkout, order tracking, and every
 * account/* page are all 'use client' (they need cart/customer-auth state
 * from localStorage), so they can't call the server-only storefrontApi.ts
 * functions themselves (see checkoutApi.ts's own comment on why
 * API_URL isn't available in the browser bundle). Rather than have each
 * of those pages re-fetch the vendor row just to learn its theme, the
 * layout resolves it once and provides it here.
 */
export function ThemeProvider({ theme, children }: { theme: StoreTheme; children: React.ReactNode }) {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useStoreTheme(): StoreTheme {
  return useContext(ThemeContext);
}
