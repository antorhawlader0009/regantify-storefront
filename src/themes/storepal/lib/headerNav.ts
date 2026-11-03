'use client';

import { useEffect, useState } from 'react';
import type { StorefrontCategoryDetail } from '@/lib/storefrontApi';
import { getStoreNavData, type StoreNavData } from './storeNavApi';

// The store's categories for this visit, per store: a page that has them fills it, a page that hasn't reads it.
const headerNavCache = new Map<string, StoreNavData>();

/**
 * The categories a store header shows. Pages rendered in the browser (account dialog, checkout, thank-you, tracking...)
 * give the header none, so it loads them itself and keeps them for the visit; otherwise the category row came and went
 * between pages and the page behind a dialog jumped. Shared by every StorePal-family header (StorePal, PlayMate).
 */
export function useHeaderNav(subdomain: string, categoriesProp: string[], categoryDetailsProp: StorefrontCategoryDetail[]) {
  const [loadedNav, setLoadedNav] = useState<StoreNavData | null>(() => headerNavCache.get(subdomain) ?? null);
  const pageGaveCategories = categoriesProp.length > 0;
  useEffect(() => {
    if (pageGaveCategories) {
      headerNavCache.set(subdomain, { categories: categoriesProp, categoryDetails: categoryDetailsProp });
      return;
    }
    let cancelled = false;
    getStoreNavData(subdomain).then((nav) => {
      if (cancelled) return;
      headerNavCache.set(subdomain, nav);
      setLoadedNav(nav);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subdomain, pageGaveCategories]);
  return {
    categories: pageGaveCategories ? categoriesProp : (loadedNav?.categories ?? []),
    categoryDetails: pageGaveCategories ? categoryDetailsProp : (loadedNav?.categoryDetails ?? []),
  };
}
