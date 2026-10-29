'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Where the account dialog's × goes back to: the last store page the shopper was on that is not an account page
 * (kept per tab in sessionStorage by StoreHeader, which every StorePal page mounts). Falls back to the store's home.
 */
const KEY = (subdomain: string) => `storepal-account-return:${subdomain}`;

const SCROLL_KEY = (subdomain: string) => `storepal-account-scroll:${subdomain}`;

const isAccountPath = (path: string) => /\/account(\/|$)/.test(path);

/** Remembers the current page as the account dialog's return address (skips account pages themselves). */
export function useRememberStorePage(subdomain: string) {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname || isAccountPath(pathname)) return;
    const path = pathname + window.location.search;
    try {
      sessionStorage.setItem(KEY(subdomain), path);
    } catch {
      // Storage blocked: × goes to the store's home.
    }
    // The scroll spot is taken on the click that opens the dialog, before the navigation scrolls the page to the top.
    const onClick = () => {
      if (isAccountPath(window.location.pathname)) return;
      try {
        sessionStorage.setItem(SCROLL_KEY(subdomain), JSON.stringify({ path, y: window.scrollY }));
      } catch {
        // Storage blocked: the page opens at the top.
      }
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [pathname, subdomain]);
}

/**
 * Closes the account dialog: back to the remembered store page at the spot the shopper had scrolled to, instead of
 * the top. The page is drawn again after the dialog, so the spot is set once it is tall enough (or after 3 seconds).
 */
export function closeAccountDialog(router: { push: (href: string, options?: { scroll?: boolean }) => void }, subdomain: string) {
  const path = accountReturnPath(subdomain);
  let y = 0;
  try {
    const saved = JSON.parse(sessionStorage.getItem(SCROLL_KEY(subdomain)) ?? 'null') as { path?: string; y?: number } | null;
    if (saved?.path === path && typeof saved.y === 'number') y = saved.y;
  } catch {
    // Nothing saved: the top.
  }
  if (y <= 0) {
    router.push(path);
    return;
  }
  router.push(path, { scroll: false });
  const started = Date.now();
  const tryScroll = () => {
    const onPage = !isAccountPath(window.location.pathname);
    const tallEnough = document.documentElement.scrollHeight >= y + window.innerHeight;
    const timedOut = Date.now() - started > 3000;
    if (onPage && (tallEnough || timedOut)) {
      window.scrollTo(0, y);
      return;
    }
    if (!timedOut) requestAnimationFrame(tryScroll);
  };
  requestAnimationFrame(tryScroll);
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
