// Store > Integrations > TikTok Pixel — the browser side. Browser-only
// module: components/TiktokPixel.tsx sets it up, and the storefront's
// ecommerce events reach it through lib/ecommerceEvents.ts.
//
// StorePal only: <TiktokPixel> is only mounted for StorePal stores.
//
// Which pixel an event goes to: a landing page uses its own
// LandingPage.tiktokPixelId, else the store's pixel; every other page uses
// the store's pixel. Events go to one pixel instance (ttq.instance), so a
// landing page's pixel never also gets the store's events.
//
// Page views: one ttq.page() per page load for the active pixel. After
// that, TikTok's pixel counts in-store navigations itself (it measures
// URL changes in single-page apps by default), so we don't send more.
//
// Nothing is loaded or sent until the shopper has accepted the vendor's
// GDPR Prompt (when the vendor turned it on).

import type { StorefrontTiktokPixel } from './storefrontApi';
import { hasGdprConsent } from './gdprConsent';
import { normalizeBdPhone } from './metaPixel';

type TtqInstance = {
  page: (...args: unknown[]) => void;
  track: (...args: unknown[]) => void;
  identify: (...args: unknown[]) => void;
};
type Ttq = unknown[] &
  TtqInstance & {
    methods: string[];
    setAndDefer: (target: Record<string, unknown>, method: string) => void;
    instance: (pixelId: string) => TtqInstance;
    load: (pixelId: string, options?: Record<string, unknown>) => void;
    _i?: Record<string, unknown[] & Record<string, unknown>>;
    _t?: Record<string, number>;
    _o?: Record<string, unknown>;
  };

declare global {
  interface Window {
    ttq?: Ttq;
    TiktokAnalyticsObject?: string;
  }
}

interface StoreSetup {
  subdomain: string;
  tiktokPixel: StorefrontTiktokPixel | null;
  // The vendor's GDPR Prompt is on, so wait for the shopper's Accept.
  consentRequired: boolean;
}

// Same shape the server accepts (TIKTOK_PIXEL_ID in tiktok-pixel.service.ts);
// anything else (e.g. an old landing page value) is ignored, never loaded.
const PIXEL_ID = /^[A-Z0-9]{12,32}$/;
const TTCLID_COOKIE = 'storepal_ttclid';
// TikTok's default click-through attribution window.
const TTCLID_MAX_AGE_DAYS = 7;

let store: StoreSetup | null = null;
// Non-null while a landing page is mounted; pixelId is its own override.
let landing: { pixelId: string | null } | null = null;
let consent = false;
const loaded = new Set<string>();
const pageViewSent = new Set<string>();
let identified = false;

/** Called by <TiktokPixel> while rendering, so it's in place before any page effect fires an event. */
export function setupTiktokPixel(setup: StoreSetup) {
  const subdomainChanged = store?.subdomain !== setup.subdomain;
  store = setup;
  if (subdomainChanged || !consent) {
    consent = !setup.consentRequired || hasGdprConsent(setup.subdomain);
  }
  if (consent) captureTtclid();
}

/** The shopper accepted the GDPR Prompt; also sends the page view that was held back. */
export function grantTiktokPixelConsent() {
  if (consent) return;
  consent = true;
  captureTtclid();
  trackTiktokPageView();
}

export function setLandingTiktokPixel(pixelId: string | null) {
  const id = pixelId?.trim().toUpperCase() || null;
  landing = { pixelId: id && PIXEL_ID.test(id) ? id : null };
}

export function clearLandingTiktokPixel() {
  landing = null;
}

function activePixelId(): string | null {
  if (!store) return null;
  if (landing?.pixelId) return landing.pixelId;
  return store.tiktokPixel?.pixelId ?? null;
}

/** Whether the browser should fire Purchase itself (false when the server sends it later). */
export function browserFiresTiktokPurchase(): boolean {
  return !store?.tiktokPixel?.deferredPurchase;
}

/** The first page's view for the active pixel, once per page load (see the header). */
export function trackTiktokPageView() {
  if (typeof window === 'undefined' || !consent) return;
  const id = activePixelId();
  if (!id || pageViewSent.has(id)) return;
  pageViewSent.add(id);
  loadPixel(id).instance(id).page();
}

/**
 * Fires a standard event to the active pixel. Ecommerce events are
 * skipped when the vendor turned them off (a landing page's own pixel
 * follows the store's setting, or sends them when the store has no
 * TikTok settings). Returns whether it was sent.
 */
export function trackTiktokEvent(event: string, properties: Record<string, unknown>, eventId?: string): boolean {
  if (typeof window === 'undefined' || !consent) return false;
  if (store?.tiktokPixel && !store.tiktokPixel.ecommerceEvents) return false;
  const id = activePixelId();
  if (!id) return false;
  if (event === 'AddPaymentInfo') rememberCheckoutPixel();
  loadPixel(id).instance(id).track(event, properties, eventId ? { event_id: eventId } : undefined);
  return true;
}

// A landing page's order form ends on the store's thank-you page, which
// isn't a landing page, so its own pixel would miss the Purchase. The
// pixel in use at "Place Order" is kept for the thank-you page instead.
const CHECKOUT_PIXEL_KEY = 'storepal:tiktok-checkout-pixel';

function rememberCheckoutPixel() {
  try {
    if (landing?.pixelId) sessionStorage.setItem(CHECKOUT_PIXEL_KEY, landing.pixelId);
    else sessionStorage.removeItem(CHECKOUT_PIXEL_KEY);
  } catch {
    // Storage blocked: Purchase goes to the store's pixel.
  }
}

/** Like trackTiktokEvent, but to the pixel remembered at "Place Order" when there is one. */
export function trackTiktokCheckoutEvent(event: string, properties: Record<string, unknown>, eventId?: string): boolean {
  let saved: string | null = null;
  try {
    saved = sessionStorage.getItem(CHECKOUT_PIXEL_KEY);
    sessionStorage.removeItem(CHECKOUT_PIXEL_KEY);
  } catch {
    // Storage blocked: fall through to the store's pixel.
  }
  if (!saved || !PIXEL_ID.test(saved)) return trackTiktokEvent(event, properties, eventId);
  const previous = landing;
  landing = { pixelId: saved };
  try {
    return trackTiktokEvent(event, properties, eventId);
  } finally {
    landing = previous;
  }
}

async function sha256Hex(value: string): Promise<string | null> {
  try {
    const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
    return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // crypto.subtle is missing outside secure contexts (plain-http LAN testing).
    return null;
  }
}

/**
 * Advanced matching: the buyer's email and phone, SHA-256 hashed after
 * TikTok's normalization (trimmed, lowercased; phone in E.164), plus
 * external_id, the same hash of the phone the server's Events API
 * Purchase sends. Only when the vendor left Advanced Matching on.
 */
export async function identifyTiktokUser(input: { email?: string | null; phone?: string | null }) {
  if (typeof window === 'undefined' || !consent || identified) return;
  if (store?.tiktokPixel && !store.tiktokPixel.advancedMatching) return;
  const id = activePixelId();
  if (!id) return;
  const email = input.email?.trim().toLowerCase();
  const phone = normalizeBdPhone(input.phone);
  const [emailHash, phoneHash, externalId] = await Promise.all([
    email ? sha256Hex(email) : null,
    phone ? sha256Hex(`+${phone}`) : null,
    phone ? sha256Hex(phone) : null,
  ]);
  if (!emailHash && !phoneHash) return;
  identified = true;
  loadPixel(id).identify({
    ...(emailHash && { email: emailHash }),
    ...(phoneHash && { phone_number: phoneHash }),
    ...(externalId && { external_id: externalId }),
  });
}

/** What checkout sends along with the order, for the server's Events API Purchase (OrderAdTracking). */
export function tiktokAdContext(): { ttp?: string; ttclid?: string } {
  if (typeof document === 'undefined' || !consent || !activePixelId()) return {};
  const ttp = readCookie('_ttp');
  const ttclid = readCookie(TTCLID_COOKIE);
  return { ...(ttp && { ttp }), ...(ttclid && { ttclid }) };
}

/** A visit from a TikTok ad carries ?ttclid=; keep it for the order, which may come a few pages later. */
function captureTtclid() {
  if (typeof window === 'undefined') return;
  const ttclid = new URLSearchParams(window.location.search).get('ttclid');
  if (!ttclid || ttclid.length > 500) return;
  const maxAge = TTCLID_MAX_AGE_DAYS * 24 * 60 * 60;
  document.cookie = `${TTCLID_COOKIE}=${encodeURIComponent(ttclid)}; max-age=${maxAge}; path=/; SameSite=Lax`;
}

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * TikTok's standard pixel base code (the ttq command queue plus the
 * events.js loader), minus its ttq.page(): we send that ourselves for the
 * right pixel. Each pixel ID is loaded once.
 */
function loadPixel(pixelId: string): Ttq {
  if (!window.ttq) {
    window.TiktokAnalyticsObject = 'ttq';
    const ttq = [] as unknown as Ttq;
    ttq.methods = [
      'page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group',
      'enableCookie', 'disableCookie', 'holdConsent', 'revokeConsent', 'grantConsent',
    ];
    ttq.setAndDefer = (target, method) => {
      target[method] = (...args: unknown[]) => (target as unknown as unknown[]).push([method, ...args]);
    };
    for (const method of ttq.methods) ttq.setAndDefer(ttq as unknown as Record<string, unknown>, method);
    ttq.instance = (id: string) => {
      const target = (ttq._i?.[id] ?? []) as unknown as Record<string, unknown>;
      for (const method of ttq.methods) ttq.setAndDefer(target, method);
      return target as unknown as TtqInstance;
    };
    ttq.load = (id: string, options?: Record<string, unknown>) => {
      const src = 'https://analytics.tiktok.com/i18n/pixel/events.js';
      ttq._i = ttq._i || {};
      ttq._i[id] = [] as unknown as unknown[] & Record<string, unknown>;
      ttq._i[id]._u = src;
      ttq._t = ttq._t || {};
      ttq._t[id] = Date.now();
      ttq._o = ttq._o || {};
      ttq._o[id] = options || {};
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.async = true;
      script.src = `${src}?sdkid=${encodeURIComponent(id)}&lib=ttq`;
      document.head.appendChild(script);
    };
    window.ttq = ttq;
  }
  if (!loaded.has(pixelId)) {
    loaded.add(pixelId);
    window.ttq.load(pixelId);
  }
  return window.ttq;
}
