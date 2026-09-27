// Store > Integrations > Google Analytics 4 — the browser side. Browser-
// only module: everything here is called from client components
// (components/GoogleAnalytics.tsx sets it up, theme views fire events
// through lib/ecommerceEvents.ts).
//
// StorePal only: <GoogleAnalytics> is only mounted for StorePal stores,
// same as the Meta pixel, so nothing here runs on other themes.
//
// Page views: gtag's own config call sends the first one, and GA4's
// Enhanced measurement ("page changes based on browser history events",
// on by default) sends one per client-side navigation. We deliberately
// don't send our own on route changes too: Enhanced measurement sends its
// history-based page_view even with send_page_view off, so that would
// count every navigation twice.
//
// Consent (only while the vendor's GDPR Prompt is on):
// - BASIC: gtag.js isn't loaded at all until the shopper accepts.
// - ADVANCED (Google's "advanced consent mode"): gtag.js loads right away
//   with every consent type denied, so Google only gets cookieless pings,
//   and accepting switches them to granted.
// With the prompt off, the tag loads for everyone with no consent calls.

import type { StorefrontGoogleAnalytics } from './storefrontApi';
import { hasGdprConsent } from './gdprConsent';
import { ensureGoogleConsentDefault, grantGoogleConsent, gtagCommand } from './googleTag';

interface StoreSetup {
  subdomain: string;
  googleAnalytics: StorefrontGoogleAnalytics | null;
  // The vendor's GDPR Prompt is on, so consent has to be asked for.
  consentRequired: boolean;
}

let store: StoreSetup | null = null;
let consent = false;
// The measurement ID gtag.js was loaded and configured for, if any.
let loadedFor: string | null = null;

/** Called by <GoogleAnalytics> while rendering, so it's in place before any page effect fires an event. */
export function setupGoogleAnalytics(setup: StoreSetup) {
  const subdomainChanged = store?.subdomain !== setup.subdomain;
  store = setup;
  if (subdomainChanged || !consent) {
    consent = !setup.consentRequired || hasGdprConsent(setup.subdomain);
  }
  ensureLoaded();
}

/** The store <GoogleAnalytics> last set up, if any. */
export function currentGoogleAnalyticsSubdomain(): string | null {
  return store?.subdomain ?? null;
}

/** The shopper accepted the GDPR Prompt. */
export function grantGoogleAnalyticsConsent() {
  if (consent) return;
  consent = true;
  // Basic consent mode: this is the first moment the tag may load, and its
  // config call sends the page view for the page they accepted on.
  ensureLoaded();
  // Switches an earlier "denied" default (this tag's advanced mode, or
  // Google Tag Manager's) to granted; a no-op otherwise.
  grantGoogleConsent();
}

/** Whether the store's settings say the browser should send purchase itself (false when the server sends it). */
export function browserSendsGaPurchase(): boolean {
  return !store?.googleAnalytics?.serverPurchase;
}

/** Whether events may go out now: consent given, or advanced consent mode's cookieless pings. */
function canSend(): boolean {
  const ga = store?.googleAnalytics;
  if (!ga) return false;
  return consent || (store!.consentRequired && ga.consentMode === 'ADVANCED');
}

/**
 * Sends a GA4 event to every configured property (gtag sends an event to
 * each ID it was configured with). Ecommerce-type events are skipped when
 * the vendor turned "Ecommerce Events" off. No-op without GA4 on this
 * store or before consent (basic mode).
 */
export function trackGaEvent(name: string, params: Record<string, unknown>): boolean {
  if (typeof window === 'undefined' || !store?.googleAnalytics?.ecommerceEvents || !canSend()) return false;
  ensureLoaded();
  gtagCommand('event', name, params);
  return true;
}

/**
 * What checkout sends along with the order, so a purchase the server
 * sends later (Measurement Protocol) joins the shopper's GA4 user and
 * session. Empty without GA4 or consent.
 */
export async function gaAdContext(): Promise<{ gaClientId?: string; gaSessionId?: string }> {
  const measurementId = store?.googleAnalytics?.measurementId;
  if (typeof window === 'undefined' || !measurementId || !consent) return {};
  const [clientId, sessionId] = await Promise.all([
    gtagGet(measurementId, 'client_id'),
    gtagGet(measurementId, 'session_id'),
  ]);
  const gaClientId = (clientId && /^\d{1,20}\.\d{1,20}$/.test(clientId) ? clientId : null) ?? clientIdFromCookie();
  const gaSessionId = (sessionId && /^\d{1,20}$/.test(sessionId) ? sessionId : null) ?? sessionIdFromCookie(measurementId);
  return {
    ...(gaClientId && { gaClientId }),
    ...(gaSessionId && { gaSessionId }),
  };
}

/** Google's standard gtag.js snippet, run once per page load when this store's settings and consent allow it. */
function ensureLoaded() {
  if (typeof window === 'undefined' || loadedFor || !canSend()) return;
  const ga = store!.googleAnalytics!;
  // Consent defaults must come before the config calls (a no-op when
  // Google Tag Manager already set them up on this page).
  if (store!.consentRequired) ensureGoogleConsentDefault(consent);
  const gtag = gtagCommand;
  gtag('js', new Date());
  // debug_mode must be left out entirely to turn it off (false still
  // counts as on for DebugView).
  const config = ga.debugMode ? { debug_mode: true } : {};
  gtag('config', ga.measurementId, config);
  if (ga.secondaryMeasurementId) gtag('config', ga.secondaryMeasurementId, config);
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga.measurementId)}`;
  document.head.appendChild(script);
  loadedFor = ga.measurementId;
}

/** gtag('get') with a timeout, for when gtag.js is blocked or slow. */
function gtagGet(measurementId: string, field: string): Promise<string | null> {
  return new Promise((resolve) => {
    if (!window.gtag || loadedFor !== measurementId) return resolve(null);
    const timer = setTimeout(() => resolve(null), 800);
    window.gtag('get', measurementId, field, (value: unknown) => {
      clearTimeout(timer);
      resolve(value === undefined || value === null ? null : String(value));
    });
  });
}

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/[.$?*|{}()[\]\\/+^]/g, '\\$&')}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/** _ga is "GA1.1.<random>.<timestamp>"; the client id is the last two parts. */
function clientIdFromCookie(): string | null {
  const parts = readCookie('_ga')?.split('.') ?? [];
  if (parts.length < 4) return null;
  const id = `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
  return /^\d{1,20}\.\d{1,20}$/.test(id) ? id : null;
}

/**
 * _ga_<ID without "G-"> holds the session: "GS1.1.<session id>.<n>..." in
 * the older format, "GS2.1.s<session id>$o<n>$..." in the newer one.
 */
function sessionIdFromCookie(measurementId: string): string | null {
  const value = readCookie(`_ga_${measurementId.replace(/^G-/, '')}`);
  if (!value) return null;
  const gs2 = /(?:^|[.$])s(\d{1,20})(?:\$|$)/.exec(value);
  if (value.startsWith('GS2') && gs2) return gs2[1];
  const parts = value.split('.');
  return parts.length >= 3 && /^\d{1,20}$/.test(parts[2]) ? parts[2] : null;
}
