'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { listenForCartChanges } from '@/lib/ecommerceEvents';
import {
  CUSTOM_CODE_EVENT as STORE_EVENT_NAME,
  recentCustomCodeEvents,
  sendCustomCodeEvent,
  type CustomCodeEventDetail as StoreEventDetail,
} from '@/lib/customCodeEvents';

/**
 * The stable things Store > Design > Custom Code can rely on (documented for sellers and their AI helper in
 * client/src/lib/customCodeGuide.ts; **keep the two in step**, and never rename a hook a store may already use):
 * - `<html data-rg-store="<subdomain>" data-rg-page="home|product|cart|...">`, updated on every page change;
 * - `window.Regantify`: { version, store, page, on(eventName | "*", handler) -> unsubscribe };
 * - every shop event (view_item, add_to_cart, begin_checkout, purchase, ...) as a `regantify:event` window event
 *   (lib/customCodeEvents.ts), sent whether or not Google / TikTok is connected.
 * The `data-rg="..."` names on the page parts live in the StorePal components themselves.
 */

/** The page type from the path, with or without the /store/<subdomain> prefix. */
export function storePageType(pathname: string, subdomain: string, search: URLSearchParams | null): string {
  let path = pathname;
  const prefix = `/store/${subdomain}`;
  if (path === prefix || path.startsWith(`${prefix}/`)) path = path.slice(prefix.length);
  const parts = path.split('/').filter(Boolean);
  const first = parts[0] ?? '';
  // The wishlist opens inside the account dialog since 2026-10-29; it is still the "wishlist" page for sellers' code.
  if (first === 'account' && parts[1] === 'wishlist') return 'wishlist';
  if (!first || first === 'browse') {
    if (search?.get('q')) return 'search';
    if (search?.get('category') || search?.get('brand')) return 'category';
    return 'home';
  }
  const map: Record<string, string> = {
    p: 'product',
    product: 'product',
    cart: 'cart',
    checkout: 'checkout',
    'thank-you': 'thank-you',
    'payment-callback': 'payment',
    pay: 'payment',
    collection: 'collection',
    campaigns: 'campaign',
    page: 'page',
    blog: 'blog',
    faq: 'faq',
    contact: 'contact',
    locations: 'locations',
    wishlist: 'wishlist',
    compare: 'compare',
    account: 'account',
    orders: 'order-tracking',
    t: 'order-tracking',
    l: 'landing',
    'gift-card': 'gift-card',
  };
  return map[first] ?? 'other';
}

type Handler = (detail: StoreEventDetail) => void;

interface RegantifyApi {
  version: 1;
  store: string;
  page: string;
  on: (name: string, handler: Handler) => () => void;
}

export function StoreCodeHooks({ subdomain }: { subdomain: string }) {
  const pathname = usePathname();

  useEffect(() => {
    // Cart changes become add_to_cart / remove_from_cart events even with no analytics connected.
    listenForCartChanges(subdomain);
    const w = window as Window & { Regantify?: RegantifyApi };
    if (!w.Regantify) {
      w.Regantify = {
        version: 1,
        store: subdomain,
        page: 'other',
        on(name, handler) {
          const call = (detail: StoreEventDetail | undefined) => {
            if (!detail || (name !== '*' && detail.name !== name)) return;
            try {
              handler(detail);
            } catch (err) {
              console.warn('[Store custom code] An event handler failed:', err);
            }
          };
          // Custom code starts after the page has loaded, so first the events this page already had.
          for (const past of recentCustomCodeEvents().slice()) call(past);
          const listener = (e: Event) => call((e as CustomEvent<StoreEventDetail>).detail);
          window.addEventListener(STORE_EVENT_NAME, listener);
          return () => window.removeEventListener(STORE_EVENT_NAME, listener);
        },
      };
    }
    w.Regantify.store = subdomain;

    // The page type follows the address. Read from window, never useSearchParams: store pages are kept (cached) and
    // useSearchParams there gave 500s (see components/StoreQueryAdapter.tsx, which also fires rgf:urlchange).
    let last = '';
    const update = () => {
      const page = storePageType(window.location.pathname, subdomain, new URLSearchParams(window.location.search));
      const key = page + window.location.pathname + window.location.search;
      if (key === last) return;
      last = key;
      const html = document.documentElement;
      html.dataset.rgStore = subdomain;
      html.dataset.rgPage = page;
      if (w.Regantify) w.Regantify.page = page;
      sendCustomCodeEvent('page_view', { page, path: window.location.pathname });
    };
    update();
    window.addEventListener('popstate', update);
    window.addEventListener('rgf:urlchange', update);
    return () => {
      window.removeEventListener('popstate', update);
      window.removeEventListener('rgf:urlchange', update);
    };
  }, [subdomain, pathname]);

  return null;
}
