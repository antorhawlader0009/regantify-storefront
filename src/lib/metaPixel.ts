// Store > Integrations > Facebook Pixel (Meta) — the browser side. Browser-
// only module: everything here is called from client components
// (components/MetaPixel.tsx sets it up, theme views fire events). See
// facebook-pixel.md in the workspace root for the full design.
//
// StorePal only: <MetaPixel> is only mounted for StorePal stores, same as
// GDPR Prompt / custom code, so nothing here runs on other themes.
//
// Which pixel(s) an event goes to: a landing page uses its own
// LandingPage.metaPixelId, else the store's pixels; every other page uses
// the store's pixels. Events go out per pixel (fbq 'trackSingle'), so a
// landing page's own pixel never also receives the store's events and
// vice versa.
//
// Nothing is loaded or sent until the shopper has accepted the vendor's
// GDPR Prompt (when the vendor turned it on).

import type { StorefrontMetaPixel } from './storefrontApi';
import { hasGdprConsent } from './gdprConsent';
import { relayMetaEvent } from './checkoutApi';

type EventData = Record<string, unknown>;
type Fbq = (...args: unknown[]) => void;

declare global {
  interface Window {
    fbq?: Fbq & {
      callMethod?: Fbq;
      queue?: unknown[];
      push?: Fbq;
      loaded?: boolean;
      version?: string;
      disablePushState?: boolean;
    };
    _fbq?: unknown;
  }
}

interface StoreSetup {
  subdomain: string;
  metaPixel: StorefrontMetaPixel | null;
  // The vendor's GDPR Prompt is on, so wait for the shopper's Accept.
  consentRequired: boolean;
}

// In Automatic mode the storefront only fires these; Meta's own automatic
// event setup detects the rest.
const AUTOMATIC_MODE_EVENTS = new Set(['PageView', 'Purchase']);

let store: StoreSetup | null = null;
// Non-null while a landing page is mounted; pixelId is its own override.
let landing: { pixelId: string | null } | null = null;
let consent = false;
const initialized = new Set<string>();
let paramsReady: Promise<void> | null = null;
// Advanced matching (see setMetaUserData), and which pixels already got it.
let userData: Record<string, string> | null = null;
const userDataApplied = new Set<string>();

/** Called by <MetaPixel> while rendering, so it's in place before any page effect fires an event. */
export function setupMetaPixel(setup: StoreSetup) {
  const subdomainChanged = store?.subdomain !== setup.subdomain;
  store = setup;
  if (subdomainChanged || !consent) {
    consent = !setup.consentRequired || hasGdprConsent(setup.subdomain);
  }
}

/** The store <MetaPixel> last set up, if any. */
export function currentMetaPixelSubdomain(): string | null {
  return store?.subdomain ?? null;
}

export function grantMetaPixelConsent() {
  consent = true;
}

export function setLandingPixel(pixelId: string | null) {
  landing = { pixelId: pixelId?.trim() || null };
}

export function clearLandingPixel() {
  landing = null;
}

function storePixelIds(): string[] {
  const mp = store?.metaPixel;
  if (!mp?.pixelId) return [];
  return mp.secondaryPixelId ? [mp.pixelId, mp.secondaryPixelId] : [mp.pixelId];
}

function activePixelIds(): string[] {
  if (!store) return [];
  if (landing?.pixelId) return [landing.pixelId];
  return storePixelIds();
}

const eventMode = () => store?.metaPixel?.eventMode ?? 'STOREPAL_DEFINED';
const imgTagTracking = () => store?.metaPixel?.imgTagTracking ?? false;

/** Whether the store's settings say the browser should fire Purchase itself (false when the server sends it later). */
export function browserFiresPurchase(): boolean {
  return !store?.metaPixel?.deferredPurchase;
}

function newEventId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/**
 * Fires a standard event to the active pixel(s). Returns the event id
 * (for matching Conversions API copies, see facebook-pixel.md §5.4), or
 * null when nothing was sent: no pixel on this page, no consent yet, or
 * an event Automatic mode leaves to Meta.
 */
export function trackMetaEvent(event: string, data?: EventData, eventId?: string): string | null {
  if (typeof window === 'undefined' || !consent) return null;
  const ids = activePixelIds();
  if (ids.length === 0) return null;
  if (eventMode() === 'AUTOMATIC' && !AUTOMATIC_MODE_EVENTS.has(event)) return null;
  const id = eventId ?? newEventId();
  // Conversions API copy through our server: only for the store's own
  // pixel (the server only has its token, not a landing page's), only
  // when the vendor set a working token, and never for Purchase (the
  // server builds that one from the order itself).
  const storePixelId = store?.metaPixel?.pixelId;
  const relay =
    !!store?.metaPixel?.serverEvents && RELAYED_EVENTS.has(event) && !!storePixelId && ids.includes(storePixelId);
  void send(ids, event, data ?? {}, id, relay);
  return id;
}

// Must match the server's RELAYABLE_EVENTS (store-settings/meta-capi.service.ts).
const RELAYED_EVENTS = new Set([
  'ViewContent',
  'AddToCart',
  'AddToWishlist',
  'InitiateCheckout',
  'AddPaymentInfo',
  'Search',
  'CompleteRegistration',
  'Lead',
]);

/**
 * What checkout sends along with the order, for the server's Conversions
 * API Purchase (saved on OrderAdTracking).
 */
export function metaAdContext() {
  if (typeof window === 'undefined') return {};
  return {
    fbp: getFbp() ?? undefined,
    fbc: getFbc() ?? undefined,
    eventSourceUrl: window.location.href.slice(0, 2000),
    adConsent: consent,
  };
}

export function trackMetaPageView() {
  trackMetaEvent('PageView');
}

// A landing page's order form ends on the store's thank-you page, which
// isn't a landing page, so its own pixel would miss the Purchase. The
// pixel in use at "Place Order" is kept for the thank-you page instead.
const CHECKOUT_PIXEL_KEY = 'storepal:meta-checkout-pixel';

/** Called when an order is about to be placed. */
export function rememberCheckoutPixel() {
  try {
    if (landing?.pixelId) sessionStorage.setItem(CHECKOUT_PIXEL_KEY, landing.pixelId);
    else sessionStorage.removeItem(CHECKOUT_PIXEL_KEY);
  } catch {
    // Storage blocked: Purchase goes to the store's pixel.
  }
}

/** Like trackMetaEvent, but to the pixel remembered at "Place Order" when there is one. */
export function trackMetaCheckoutEvent(event: string, data: EventData, eventId?: string): string | null {
  let saved: string | null = null;
  try {
    saved = sessionStorage.getItem(CHECKOUT_PIXEL_KEY);
    sessionStorage.removeItem(CHECKOUT_PIXEL_KEY);
  } catch {
    // Storage blocked: fall through to the store's pixel.
  }
  if (!saved) return trackMetaEvent(event, data, eventId);
  const previous = landing;
  landing = { pixelId: saved };
  try {
    return trackMetaEvent(event, data, eventId);
  } finally {
    landing = previous;
  }
}

async function send(ids: string[], event: string, data: EventData, eventId: string, relay = false) {
  // _fbp/_fbc first, so even the first image-mode request carries them.
  await collectParams();
  if (relay && store) {
    relayMetaEvent(store.subdomain, {
      eventName: event,
      eventId,
      eventSourceUrl: window.location.href.slice(0, 2000),
      fbp: getFbp() ?? undefined,
      fbc: getFbc() ?? undefined,
      customData: data,
    });
  }
  if (imgTagTracking()) {
    for (const id of ids) sendImage(id, event, data, eventId);
    return;
  }
  const fbq = loadSdk();
  for (const id of ids) {
    if (!initialized.has(id)) {
      // Our own events cover what Meta's automatic button/page detection
      // would guess, so turn it off rather than count things twice.
      if (eventMode() === 'STOREPAL_DEFINED') fbq('set', 'autoConfig', false, id);
      fbq('init', id, ...(userData ? [userData] : []));
      initialized.add(id);
      if (userData) userDataApplied.add(id);
    } else if (userData && !userDataApplied.has(id)) {
      // Re-running init with user data is how the pixel takes advanced
      // matching after the page has loaded.
      fbq('init', id, userData);
      userDataApplied.add(id);
    }
    fbq('trackSingle', id, event, data, { eventID: eventId });
  }
}

/**
 * BD mobile number in Meta's format: digits only, with the 880 country
 * code and no leading 0 (01712345678 -> 8801712345678). The server's
 * Conversions API code must normalize the same way, since external_id is
 * a hash of this value on both sides.
 */
export function normalizeBdPhone(raw: string | null | undefined): string | null {
  const digits = (raw ?? '').replace(/\D/g, '');
  if (/^8801\d{9}$/.test(digits)) return digits;
  if (/^01\d{9}$/.test(digits)) return `88${digits}`;
  if (/^1\d{9}$/.test(digits)) return `880${digits}`;
  return null;
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
 * Advanced matching: the shopper's own details (from the order they just
 * placed), so Meta can match the event to their account. Plain values;
 * the pixel hashes them itself, except external_id, which is hashed here
 * so it equals what the server sends. JS SDK mode only: image requests
 * can't carry it.
 */
export async function setMetaUserData(input: {
  phone?: string | null;
  email?: string | null;
  name?: string | null;
  city?: string | null;
}) {
  if (typeof window === 'undefined' || imgTagTracking()) return;
  const data: Record<string, string> = { country: 'bd' };
  const phone = normalizeBdPhone(input.phone);
  if (phone) {
    data.ph = phone;
    const externalId = await sha256Hex(phone);
    if (externalId) data.external_id = externalId;
  }
  const email = input.email?.trim().toLowerCase();
  if (email) data.em = email;
  const [first, ...rest] = (input.name ?? '').trim().toLowerCase().split(/\s+/);
  if (first) data.fn = first;
  if (rest.length > 0) data.ln = rest.join(' ');
  const city = (input.city ?? '').toLowerCase().replace(/[^a-z]/g, '');
  if (city) data.ct = city;
  userData = data;
  userDataApplied.clear();
}

/**
 * Meta's parameter builder writes the _fbp cookie and, when the visit
 * came from an ad (?fbclid=, or the Facebook/Instagram in-app browser),
 * the _fbc click-id cookie. Runs once per page load; a failure only
 * means weaker matching, never a blocked event.
 */
function collectParams(): Promise<void> {
  paramsReady ??= import('meta-capi-param-builder-clientjs')
    .then((builder) => builder.processAndCollectAllParams(window.location.href))
    .then(() => undefined)
    .catch(() => undefined);
  return paramsReady;
}

/** Meta's standard pixel base code, minus its PageView (we fire that per route). */
function loadSdk(): Fbq {
  if (!window.fbq) {
    const n = function (...args: unknown[]) {
      if (n.callMethod) n.callMethod(...args);
      else n.queue!.push(args);
    } as NonNullable<Window['fbq']>;
    if (!window._fbq) window._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];
    // fbevents.js fires its own PageView (without our event id) on every
    // history.pushState, i.e. every client-side navigation; <MetaPixel>
    // already fires one per route, so that would count every page twice.
    n.disablePushState = true;
    window.fbq = n;
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(script);
  }
  return window.fbq;
}

/** "Track without JS SDK": the same request fbevents.js would make, as an image. */
function sendImage(pixelId: string, event: string, data: EventData, eventId: string) {
  const params = new URLSearchParams({
    id: pixelId,
    ev: event,
    eid: eventId,
    dl: window.location.href,
    rl: document.referrer,
    if: 'false',
    ts: String(Date.now()),
  });
  const fbp = getFbp();
  const fbc = getFbc();
  if (fbp) params.set('fbp', fbp);
  if (fbc) params.set('fbc', fbc);
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;
    params.set(`cd[${key}]`, typeof value === 'object' ? JSON.stringify(value) : String(value));
  }
  new Image().src = `https://www.facebook.com/tr?${params.toString()}`;
}

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/** _fbp browser id, for sending alongside server-side events. */
export function getFbp(): string | null {
  return typeof document === 'undefined' ? null : readCookie('_fbp');
}

/** _fbc ad-click id, for sending alongside server-side events. */
export function getFbc(): string | null {
  return typeof document === 'undefined' ? null : readCookie('_fbc');
}
