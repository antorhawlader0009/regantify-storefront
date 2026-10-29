'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * The shopper's own language on a store (Bangla or English). The store sets the default (Store > Design > Layout
 * Settings, `storeLanguage`); a shopper who switches keeps their pick in this browser's localStorage, per store, so
 * they don't have to switch on every visit. Shared by every template: a template only draws its own switch.
 *
 * Store pages are cached, so the server always renders the store's default and the pick is applied after the page
 * loads (a returning shopper may see the default for a moment).
 */
export type ShopperLanguage = 'en' | 'bn';

const EVENT = 'regantify:shopper-language';
const key = (subdomain: string) => `regantify-lang:${subdomain}`;

export function readShopperLanguage(subdomain: string): ShopperLanguage | null {
  try {
    const v = localStorage.getItem(key(subdomain));
    return v === 'en' || v === 'bn' ? v : null;
  } catch {
    return null;
  }
}

/** Saves the pick and tells every open part of the page (and other tabs, via the storage event). */
export function saveShopperLanguage(subdomain: string, language: ShopperLanguage): void {
  try {
    localStorage.setItem(key(subdomain), language);
  } catch {
    // Private mode or blocked storage: the switch still works for this page.
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { subdomain, language } }));
}

/**
 * The language in use: the shopper's saved pick, else the store's default. `setLanguage` switches and remembers it.
 * Before the page has loaded in the browser it is always the store's default (no hydration mismatch).
 */
export function useShopperLanguage(subdomain: string | undefined, storeDefault: ShopperLanguage) {
  const [picked, setPicked] = useState<ShopperLanguage | null>(null);

  useEffect(() => {
    if (!subdomain) return;
    setPicked(readShopperLanguage(subdomain));
    const onPick = (e: Event) => {
      const d = (e as CustomEvent<{ subdomain: string; language: ShopperLanguage }>).detail;
      if (d?.subdomain === subdomain) setPicked(d.language);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === key(subdomain)) setPicked(readShopperLanguage(subdomain));
    };
    window.addEventListener(EVENT, onPick);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(EVENT, onPick);
      window.removeEventListener('storage', onStorage);
    };
  }, [subdomain]);

  const language = picked ?? storeDefault;

  // Screen readers and the browser's own translate offer follow the language on screen.
  useEffect(() => {
    if (subdomain) document.documentElement.lang = language === 'bn' ? 'bn' : 'en';
  }, [language, subdomain]);

  const setLanguage = useCallback((next: ShopperLanguage) => subdomain && saveShopperLanguage(subdomain, next), [subdomain]);
  return { language, storeDefault, setLanguage };
}
