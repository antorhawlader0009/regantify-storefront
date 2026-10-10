'use client';

import { useCallback, useSyncExternalStore } from 'react';

// StorePal's "Recently viewed" row. The shopper's browser keeps only the slugs of the last products they opened, per
// store, newest first: nothing is stored on the server and nobody has to log in. What the row shows (name, picture,
// today's price) is fetched fresh from the store by those slugs, so a changed price is current and a deleted or hidden
// product just drops out.
const KEY_PREFIX = 'storepal-recent:';
export const RECENT_MAX = 12;
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
    if (Array.isArray(parsed)) slugs = parsed.filter((s): s is string => typeof s === 'string').slice(0, RECENT_MAX);
  } catch {
    // Corrupt value: treated as empty, the next view overwrites it.
  }
  cache.set(subdomain, { raw, slugs });
  return slugs;
}

function write(subdomain: string, slugs: string[]) {
  try {
    localStorage.setItem(KEY_PREFIX + subdomain, JSON.stringify(slugs));
  } catch {
    // Storage full or blocked (private mode): the row just isn't remembered.
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

/** Puts a product at the front of the list (moving it there if it was already in it). */
export function recordView(subdomain: string, slug: string) {
  if (!slug) return;
  const current = read(subdomain);
  if (current[0] === slug) return;
  write(subdomain, [slug, ...current.filter((s) => s !== slug)].slice(0, RECENT_MAX));
}

export function useRecentlyViewed(subdomain: string) {
  const slugs = useSyncExternalStore(
    subscribe,
    () => read(subdomain),
    () => EMPTY,
  );
  const clear = useCallback(() => write(subdomain, []), [subdomain]);
  return { slugs, clear };
}
