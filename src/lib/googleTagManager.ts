// Store > Integrations > Google Tag Manager - the browser side. Browser-
// only module: components/GoogleTagManager.tsx sets it up, and the
// storefront's ecommerce events (lib/ecommerceEvents.ts) are pushed to the
// dataLayer from here in GA4's format, so vendors can trigger their own
// tags (GA4, Meta, TikTok, Google Ads...) on them without writing code.
//
// The container itself loads only on StorePal stores that set a container ID (<GoogleTagManager>). The dataLayer
// (2026-11-03, the owner's rule) is filled on EVERY store, every template, with or without our integration
// (<StoreDataLayer>): page data, virtual_page_view, the GA4 ecommerce events and order_place, so a store that adds
// its own GTM / Meta / anything through Custom Code reads the same events (`dataLayer.map(e => e.event)`).
//
// Page views: gtm.js fires its own "Container Loaded" (gtm.js) event on
// the first page; every client-side navigation after that pushes
// `virtual_page_view` with the new page's URL and title (the reliable way
// to track a single-page app in GTM; the History Change trigger also
// works, but can fire before the title is updated).
//
// Consent (only while the vendor's GDPR Prompt is on), same as GA4:
// - BASIC: the container isn't loaded until the shopper accepts.
// - ADVANCED: it loads right away with every Google consent type denied,
//   and accepting switches them to granted.
// Either way, accepting also pushes `cookie_consent_granted`, for tags
// that should only start after consent (e.g. a Meta pixel in the container).

import type { StorefrontGoogleTagManager } from './storefrontApi';
import { hasGdprConsent } from './gdprConsent';
import { dataLayerPush, ensureGoogleConsentDefault, grantGoogleConsent } from './googleTag';
import { storePageType } from '@/components/StoreCodeHooks';

const GOOGLE_ORIGIN = 'https://www.googletagmanager.com';

interface StoreSetup {
  subdomain: string;
  storeName: string | null;
  googleTagManager: StorefrontGoogleTagManager | null;
  // The vendor's GDPR Prompt is on, so consent has to be asked for.
  consentRequired: boolean;
}

let store: StoreSetup | null = null;
let consent = false;
let loaded = false;
// The URL of the last page a page view was counted for, as the next
// virtual_page_view's referrer.
let lastPageUrl: string | null = null;

/**
 * The page-level variables every page pushes (same names on every page and every store, so one container setup works for
 * all of them): which store, what kind of page (the same page types as Custom Code's data-rg-page), and the currency.
 */
function pageData(): Record<string, unknown> {
  return {
    store_subdomain: store!.subdomain,
    ...(store!.storeName && { store_name: store!.storeName }),
    page_type: storePageType(window.location.pathname, store!.subdomain, new URLSearchParams(window.location.search)),
    currency: 'BDT',
  };
}

let pageDataPushedFor: string | null = null;

/**
 * Called by <StoreDataLayer> on every store (any template) while rendering: the dataLayer works even when the store
 * has no Google Tag Manager set up here. Keeps an integration <GoogleTagManager> already set up for this store.
 */
export function setupStoreDataLayer(setup: Omit<StoreSetup, 'googleTagManager'>) {
  if (typeof window === 'undefined') return;
  if (store?.subdomain === setup.subdomain) return;
  store = { ...setup, googleTagManager: null };
  consent = !setup.consentRequired || hasGdprConsent(setup.subdomain);
  pushPageDataOnce();
}

/** The page data once per store per page load (with our container it goes on before gtm.js instead). */
function pushPageDataOnce() {
  if (!store || pageDataPushedFor === store.subdomain || !dataLayerOpen()) return;
  pageDataPushedFor = store.subdomain;
  dataLayerPush(pageData());
  if (!store.googleTagManager) lastPageUrl = window.location.href;
}

/**
 * May events go on the dataLayer now? With our container: only when its ecommerce events are on and it may run
 * (consent rules). Without it: unless the GDPR Prompt is on and the shopper hasn't accepted yet.
 */
function dataLayerOpen(): boolean {
  if (!store) return false;
  const gtm = store.googleTagManager;
  if (gtm) return gtm.ecommerceEvents && canRun();
  return consent;
}

/** Called by <GoogleTagManager> while rendering, so it's in place before any page effect pushes an event. */
export function setupGoogleTagManager(setup: StoreSetup) {
  const subdomainChanged = store?.subdomain !== setup.subdomain;
  store = setup;
  if (subdomainChanged || !consent) {
    consent = !setup.consentRequired || hasGdprConsent(setup.subdomain);
  }
  ensureLoaded();
}

/** The shopper accepted the GDPR Prompt. */
export function grantGoogleTagManagerConsent() {
  if (consent || !store) return;
  consent = true;
  if (!store.googleTagManager) {
    // No container of ours: the store's own tags (Custom Code) learn it here, then get the page data.
    dataLayerPush({ event: 'cookie_consent_granted' });
    pushPageDataOnce();
    return;
  }
  // Basic mode: the container loads now, and its own gtm.js event counts
  // the page they accepted on.
  ensureLoaded();
  grantGoogleConsent();
  dataLayerPush({ event: 'cookie_consent_granted' });
}

/** Whether the container may run now: consent given, or advanced consent mode. */
function canRun(): boolean {
  const gtm = store?.googleTagManager;
  if (!gtm) return false;
  return consent || (store!.consentRequired && gtm.consentMode === 'ADVANCED');
}

/** Google's standard container snippet, run once per page load when settings and consent allow it. */
function ensureLoaded() {
  if (typeof window === 'undefined' || loaded || !canRun()) return;
  const gtm = store!.googleTagManager!;
  // The consent default must be on the dataLayer before the container
  // starts (a no-op when Google Analytics already set it up).
  if (store!.consentRequired) ensureGoogleConsentDefault(consent);
  // Page information goes on the dataLayer BEFORE the container starts (Google's data layer guide), so tags and
  // triggers can use it from the very first event ("Page type equals product").
  if (pageDataPushedFor !== store!.subdomain) {
    pageDataPushedFor = store!.subdomain;
    dataLayerPush(pageData());
  }
  dataLayerPush({ 'gtm.start': Date.now(), event: 'gtm.js' });
  const script = document.createElement('script');
  script.async = true;
  script.src = `${gtm.serverContainerUrl || GOOGLE_ORIGIN}/gtm.js?id=${encodeURIComponent(gtm.containerId)}`;
  document.head.appendChild(script);
  loaded = true;
  lastPageUrl = window.location.href;
}

/**
 * Pushes one GA4-format event. Ecommerce events go under `ecommerce`,
 * after clearing the previous ecommerce object (otherwise GTM merges the
 * last event's items into this one); others (search, sign_up, ...) keep
 * their parameters at the top level. Skipped when the vendor turned
 * ecommerce events off, and before consent in basic mode.
 */
export function pushGtmEvent(
  event: string,
  params: Record<string, unknown>,
  options: { ecommerce: boolean; extra?: Record<string, unknown> },
): boolean {
  if (typeof window === 'undefined' || !dataLayerOpen()) return false;
  ensureLoaded();
  if (options.ecommerce) {
    dataLayerPush({ ecommerce: null });
    dataLayerPush({ event, ecommerce: params, ...options.extra });
  } else {
    dataLayerPush({ event, ...params, ...options.extra });
  }
  return true;
}

/** Whether the vendor wants the shopper's (hashed) details on the purchase event. */
export function gtmCustomerDataEnabled(): boolean {
  return !!store?.googleTagManager?.customerData;
}

/** A client-side navigation finished (see <GoogleTagManager>). Not sent for the first page, which gtm.js covers. */
export function pushGtmPageView() {
  if (typeof window === 'undefined' || !store) return;
  if (!store.googleTagManager) {
    // No container of ours: the first page has the page data (pushPageDataOnce), later ones a virtual_page_view.
    if (!dataLayerOpen()) return;
    if (lastPageUrl === null) {
      pushPageDataOnce();
      return;
    }
  } else if (!canRun()) {
    return;
  } else if (!loaded) {
    ensureLoaded();
    return;
  }
  const url = window.location.href;
  if (url === lastPageUrl) return;
  dataLayerPush({
    // The new page's type etc. (values only last for the page they were pushed on, so they are sent again here).
    ...pageData(),
    event: 'virtual_page_view',
    page_location: url,
    page_path: window.location.pathname + window.location.search,
    page_title: document.title,
    page_referrer: lastPageUrl ?? document.referrer,
  });
  lastPageUrl = url;
}
