'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Where the account dialog's × goes back to: the last store page the shopper was on that is not an account page
 * (kept per tab in sessionStorage by StoreHeader, which every StorePal page mounts). Falls back to the store's home.
 */
const KEY = (subdomain: string) => `storepal-account-return:${subdomain}`;

const isAccountPath = (path: string) => /\/account(\/|$)/.test(path);

/** Remembers the current page as the account dialog's return address (skips account pages themselves). */
export function useRememberStorePage(subdomain: string) {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname || isAccountPath(pathname)) return;
    try {
      sessionStorage.setItem(KEY(subdomain), pathname + window.location.search);
    } catch {
      // Storage blocked: × goes to the store's home.
    }
  }, [pathname, subdomain]);
}

/** The page the account dialog returns to. */
export function accountReturnPath(subdomain: string): string {
  try {
    const saved = sessionStorage.getItem(KEY(subdomain));
    if (saved && !isAccountPath(saved)) return saved;
  } catch {
    // fall through
  }
  return `/store/${subdomain}`;
}
