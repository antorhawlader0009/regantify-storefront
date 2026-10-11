'use client';

import { useCallback, useSyncExternalStore } from 'react';

// Compare products (TellMe idea 74): up to 3 product slugs kept in this browser, per store, like "recently viewed". Nothing goes to the
// server; the compare page fetches the products fresh by slug.
export const MAX_COMPARE = 3;
const KEY_PREFIX = 'storepal-compare:';
const EMPTY: string[] = [];
const listeners = new Set<() => void>();
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
    if (Array.isArray(parsed)) slugs = parsed.filter((s): s is string => typeof s === 'string').slice(0, MAX_COMPARE);
  } catch {
    // Corrupt value: treat as empty; the next change overwrites it.
  }
  cache.set(subdomain, { raw, slugs });
  return slugs;
}

function write(subdomain: string, slugs: string[]) {
  try {
    localStorage.setItem(KEY_PREFIX + subdomain, JSON.stringify(slugs));
  } catch {
    // Storage blocked: the tick just will not stick.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key?.startsWith(KEY_PREFIX)) listener();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function useCompare(subdomain: string) {
  const slugs = useSyncExternalStore(subscribe, () => read(subdomain), () => EMPTY);
  /** Adds or removes; returns false when the list is already full (3) and the slug is not on it. */
  const toggle = useCallback(
    (slug: string): boolean => {
      const current = read(subdomain);
      if (current.includes(slug)) {
        write(subdomain, current.filter((s) => s !== slug));
        return true;
      }
      if (current.length >= MAX_COMPARE) return false;
      write(subdomain, [...current, slug]);
      return true;
    },
    [subdomain],
  );
  const clear = useCallback(() => write(subdomain, []), [subdomain]);
  return { slugs, has: (slug: string) => slugs.includes(slug), toggle, clear };
}
