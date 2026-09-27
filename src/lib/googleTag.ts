// What Google Analytics 4 (lib/googleAnalytics.ts) and Google Tag Manager
// (lib/googleTagManager.ts) share on the page: the one window.dataLayer,
// the gtag() command function that writes to it, and Google consent mode.
// Both read the same queue, so consent must be set up once, before
// whichever of them loads first, or tags could fire without a consent
// state (Google requires the default before the container/tag loads).

type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

let consentDefaultSet = false;
let consentGranted = false;

/** Google's standard gtag() stub (gtag.js and gtm.js both read these `arguments` objects off dataLayer). */
export function gtagCommand(...args: unknown[]) {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function gtag() {
      // Must push the `arguments` object itself, not an array copy.
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
  }
  window.gtag(...args);
}

/** A plain object push, the way GTM expects events (`{ event: 'add_to_cart', ... }`). */
export function dataLayerPush(entry: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(entry);
}

const GRANTED = { ad_storage: 'granted', analytics_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted' };
const DENIED = { ad_storage: 'denied', analytics_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' };

/**
 * Consent mode default, once per page load, before any Google tag loads.
 * Only called while the store's GDPR Prompt is on; with it off there are
 * no consent calls at all (Google treats everything as granted).
 */
export function ensureGoogleConsentDefault(granted: boolean) {
  if (consentDefaultSet) return;
  consentDefaultSet = true;
  consentGranted = granted;
  gtagCommand('consent', 'default', granted ? GRANTED : DENIED);
}

/** The shopper accepted the GDPR Prompt: switch an earlier "denied" default to granted, once. */
export function grantGoogleConsent() {
  if (!consentDefaultSet || consentGranted) return;
  consentGranted = true;
  gtagCommand('consent', 'update', GRANTED);
}
