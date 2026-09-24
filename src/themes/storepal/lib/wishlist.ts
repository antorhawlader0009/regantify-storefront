'use client';

import { useCallback, useSyncExternalStore } from 'react';

// Store > Design > Product Card's "Show Wishlist Button". The wishlist is
// a list of product slugs kept in the shopper's own browser, per store —
// nothing is stored server-side, so it works without logging in.
const KEY_PREFIX = 'storepal-wishlist:';
const EMPTY: string[] = [];
const listeners = new Set<() => void>();
// useSyncExternalStore needs a stable snapshot per key between changes.
const cache = new Map<string, { raw: string | null; slugs: string[] }>();

function read(subdomain: string): string[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY_PREFIX + subdomain);
  } catch {
    return EMPTY;
  }
  const cached = cache.get(subdomain);
  if (cached && cached.raw === raw) return cached.slugs;
  let slugs = EMPTY;
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) slugs = parsed.filter((s): s is string => typeof s === 'string');
  } catch {
    // Corrupt value — treat as empty; the next toggle overwrites it.
  }
  cache.set(subdomain, { raw, slugs });
  return slugs;
}

function write(subdomain: string, slugs: string[]) {
  try {
    localStorage.setItem(KEY_PREFIX + subdomain, JSON.stringify(slugs));
  } catch {
    // Storage full or blocked (private mode) — the heart just won't stick.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Other tabs of the same store.
  const onStorage = (e: StorageEvent) => {
    if (e.key?.startsWith(KEY_PREFIX)) listener();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function useWishlist(subdomain: string) {
  const slugs = useSyncExternalStore(
    subscribe,
    () => read(subdomain),
    () => EMPTY,
  );
  const toggle = useCallback(
    (slug: string) => {
      const current = read(subdomain);
      write(subdomain, current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug]);
    },
    [subdomain],
  );
  return { slugs, has: (slug: string) => slugs.includes(slug), toggle };
}
