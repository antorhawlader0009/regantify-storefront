'use client';

import { startTransition, useCallback, useMemo, useOptimistic, useSyncExternalStore } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { renderQueryString, unstable_createAdapterProvider as createAdapterProvider } from 'nuqs/adapters/custom';

/**
 * The nuqs adapter for store pages (PERFORMANCE-PLAN.md Step 8, turned on again 2026-10-24).
 *
 * Store pages are now rendered once and kept (the store layout's `revalidate`). Next renders a kept page ahead of the
 * visit, where there is no address bar, so `useSearchParams()` with no `<Suspense>` above it fails, and nuqs' own Next
 * adapter calls exactly that: every theme's StoreHeader (`useQueryState('q' | 'category')`) gave product pages a 500 on
 * 2026-10-16. This adapter is the same as nuqs' `next/app` one except that it reads the query with
 * `useSyncExternalStore`: the server (and the first browser render, so hydration matches) sees an empty query, then the
 * browser's real one. Nothing is client-rendered that wasn't before, so the kept HTML is complete for search engines.
 *
 * A store page with a query in its address is a query view (`?q`, `?category`... go to `browse/`, rendered every time),
 * and the header's own changes go through `updateUrl` below, so the empty first render only lasts until hydration.
 * The root layout's `NuqsAdapter` stays mounted and keeps patching history; this provider only replaces the hook.
 */

const URL_CHANGE = 'rgf:urlchange';
let historyPatched = false;

/** Tells the hook when Next (or nuqs) changes the address with pushState/replaceState, which fire no event. */
function patchHistoryOnce(): void {
  if (historyPatched || typeof window === 'undefined') return;
  historyPatched = true;
  for (const method of ['pushState', 'replaceState'] as const) {
    const original = history[method];
    history[method] = function (this: History, ...args: Parameters<History['pushState']>) {
      const result = original.apply(this, args);
      // Later, not during the caller's render or effect.
      queueMicrotask(() => window.dispatchEvent(new Event(URL_CHANGE)));
      return result;
    };
  }
}

function subscribe(onChange: () => void): () => void {
  patchHistoryOnce();
  window.addEventListener('popstate', onChange);
  window.addEventListener(URL_CHANGE, onChange);
  return () => {
    window.removeEventListener('popstate', onChange);
    window.removeEventListener(URL_CHANGE, onChange);
  };
}

const browserSearch = () => window.location.search;
const serverSearch = () => '';

function renderURL(search: URLSearchParams): string {
  const { origin, pathname, hash } = window.location;
  return origin + pathname + renderQueryString(search) + hash;
}

function useStoreQueryAdapter() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSyncExternalStore(subscribe, browserSearch, serverSearch);
  const current = useMemo(() => new URLSearchParams(search), [search]);
  const [searchParams, setOptimisticSearchParams] = useOptimistic(current);
  return {
    searchParams,
    pathname,
    updateUrl: useCallback(
      (next: URLSearchParams, options: { history: 'push' | 'replace'; scroll: boolean; shallow: boolean }) => {
        startTransition(() => {
          if (!options.shallow) setOptimisticSearchParams(next);
          const url = renderURL(next);
          // "__nuqs__" is nuqs' own marker: its history patch (from the root NuqsAdapter) strips it and knows the update
          // came from nuqs.
          (options.history === 'push' ? history.pushState : history.replaceState).call(history, null, '__nuqs__', url);
          if (options.scroll) window.scrollTo(0, 0);
          if (!options.shallow) router.replace(url, { scroll: false });
        });
      },
      [router, setOptimisticSearchParams],
    ),
    rateLimitFactor: 3,
    autoResetQueueOnUpdate: false,
  };
}

export const StoreQueryAdapter = createAdapterProvider(useStoreQueryAdapter);
