import { NextRequest, NextResponse } from 'next/server';
import { encodeStoreSegment, storeSubdomain, type StoreAddress } from './lib/storeAddress';

// Production: {subdomain}.yourdomain.com  →  internally rewritten to
//             /store/:subdomain (same page, just a friendlier public URL).
// Local dev / LAN testing: ROOT_DOMAIN is unset, so this middleware does
//             nothing and everyone keeps using /store/:subdomain directly
//             — exactly like today, and exactly what the tester team on
//             the LAN should keep doing (IP addresses have no subdomains).
//
// Set ROOT_DOMAIN once you have a real domain and this switches on with
// no code changes — see .env.local.example.
const ROOT_DOMAIN = process.env.ROOT_DOMAIN?.toLowerCase().trim();

// Same API this app's server-side data layer talks to (see
// src/lib/storefrontApi.ts) — used here to resolve a vendor's Store >
// Domain custom domain (e.g. gadgetdepobd.com, A-recorded at this
// platform's IP) to their subdomain, so the request can be rewritten
// to /store/:subdomain the same way a {subdomain}.ROOT_DOMAIN host is.
const API_URL = process.env.API_URL ?? 'http://localhost:4000';

// Header that tells the pages "this request came in on the store's own address" (a {sub}.ROOT_DOMAIN host or a custom
// domain), so siteUrl() in lib/storefrontApi.ts can give every page its clean public URL (/product/x, not
// /store/{sub}/product/x) for canonical links, Open Graph, JSON-LD and the sitemap. Always set here, never trusted from outside.
const CLEAN_HEADER = 'x-store-clean';

// Pages that belong to one shopper or to the buying flow and have no business in a search engine. They are marked
// `noindex` in the response header (rather than only blocked in robots.txt) so a crawler that reaches one is told to drop it.
const PRIVATE_SEGMENTS = new Set(['cart', 'checkout', 'thank-you', 'account', 'orders', 'wishlist', 't', 'pay', 'r', 'cart-link', 'i', 'payment-callback', 'confirm']);

/** The request's headers with the clean-address mark set or cleared. */
function withCleanMark(request: NextRequest, clean: boolean): Headers {
  const headers = new Headers(request.headers);
  if (clean) headers.set(CLEAN_HEADER, '1');
  else headers.delete(CLEAN_HEADER);
  return headers;
}

// PERFORMANCE-PLAN.md Step 8: every store request is rewritten to /store/<segment>/..., where the segment carries the
// subdomain AND the address the shopper used (lib/storeAddress.ts). Pages build their absolute links from it instead of
// reading the request's headers, so Next.js can keep a rendered page and serve it again (one copy per address form).
// The segment is always built here from the request; whatever segment a visitor typed is reduced to its subdomain first.

// Hosts whose pages may be kept per host: the platform's own domain and local/LAN addresses. Any other host that is not
// a store's own address gets pages rendered fresh each time (the old behaviour), so a made-up Host header can't fill the
// page cache with copies.
function isKnownPlatformHost(host: string): boolean {
  if (ROOT_DOMAIN && (host === ROOT_DOMAIN || host === `www.${ROOT_DOMAIN}`)) return true;
  return /^(localhost|127\.0\.0\.1|\d+\.\d+\.\d+\.\d+)$/.test(host) || host.endsWith('.local');
}

// The home page with one of these in its query (category or brand listings, search results, coupon links) is rendered by
// its own route (store/[subdomain]/browse), which reads the query and is never kept. The plain home page is kept.
const HOME_QUERY_KEYS = ['category', 'brand', 'q', 'coupon', 'picks'];

/** Same origin siteUrl() used to build from the request: the Host header (with its port) and the proxy's protocol. */
function originOf(request: NextRequest): string {
  return `${request.headers.get('x-forwarded-proto') ?? 'http'}://${request.headers.get('host') ?? ''}`;
}

/** The internal URL /store/<segment><rest> for this store, with a home-page query view sent to the browse route. */
function storeUrl(request: NextRequest, subdomain: string, address: StoreAddress | null, rest: string): URL {
  const url = request.nextUrl.clone();
  let tail = rest;
  if ((tail === '' || tail === '/') && HOME_QUERY_KEYS.some((key) => url.searchParams.has(key))) tail = '/browse';
  url.pathname = `/store/${encodeStoreSegment(subdomain, address)}${tail}`;
  return url;
}

function rewriteToStore(request: NextRequest, subdomain: string) {
  const headers = withCleanMark(request, true);
  const path = request.nextUrl.pathname;

  // Someone already hit /store/:subdomain directly (the store's own links are written that way): drop the prefix, it is
  // still the store's own address, so its canonical link must be the clean form. Only THIS store's path: a store's
  // address must never serve another store's pages (that store's Custom Code would run on this store's origin, with its
  // localStorage and its shoppers). /store/<other>/... is put under this store, where it 404s.
  let rest = path;
  if (path.startsWith('/store/')) {
    const segment = path.split('/')[2] ?? '';
    if (storeSubdomain(segment).toLowerCase() === subdomain.toLowerCase()) rest = path.slice(`/store/${segment}`.length);
  }

  // Short public addresses (2026-10-16): on the store's own address the browser always shows /p/<slug> and no
  // /store/{sub} prefix. The store's links are still written in the long form, so those (and old shared /product/
  // links) are sent on with a permanent redirect; the address bar, bookmarks and search engines get the short form.
  const short = rest.replace(/^\/product\//, '/p/');
  if ((rest !== path || short !== rest) && (request.method === 'GET' || request.method === 'HEAD')) {
    return NextResponse.redirect(new URL(`${short || '/'}${request.nextUrl.search}`, originOf(request)), 308);
  }

  return NextResponse.rewrite(storeUrl(request, subdomain, { clean: true, origin: originOf(request) }, rest), { request: { headers } });
}

// The Regantify Shop (SHOP-plan.md Step 7): shop.ROOT_DOMAIN is the platform's marketplace, not a store. "shop" is a reserved store
// address (BUILT_IN_RESERVED_SUBDOMAINS on the server), so no store can ever be called that.
const SHOP_SUBDOMAIN = 'shop';

/**
 * shop.ROOT_DOMAIN serves app/shop: "/" is the Shop home, "/search" its search and so on. The Shop's own links are written as /shop/...
 * (so the same pages work at /shop on a local or LAN address, where there are no subdomains); a path already under /shop is kept as it is.
 * Anything else on this host, a /store/... path included, lands under /shop and 404s: the Shop's address must never serve a store's pages.
 */
function rewriteToShop(request: NextRequest) {
  const headers = withCleanMark(request, false);
  const url = request.nextUrl.clone();
  const path = url.pathname;
  if (path !== '/shop' && !path.startsWith('/shop/')) url.pathname = `/shop${path === '/' ? '' : path}`;
  return NextResponse.rewrite(url, { request: { headers } });
}

// The central Regantify sign-in page for shoppers (server customer-auth/shopper-connect): accounts.ROOT_DOMAIN serves app/regantify, the same
// pages as /regantify on a local address. "accounts" is a reserved store address on the server. Nothing else is served on that host.
const ACCOUNTS_SUBDOMAIN = 'accounts';

function rewriteToAccounts(request: NextRequest) {
  const headers = withCleanMark(request, false);
  const url = request.nextUrl.clone();
  const path = url.pathname;
  if (path !== '/regantify' && !path.startsWith('/regantify/')) url.pathname = `/regantify${path === '/' ? '' : path}`;
  return NextResponse.rewrite(url, { request: { headers } });
}

/** Any other host: a /store/:subdomain path gets its address segment (kept per host only for known hosts). */
function passThrough(request: NextRequest, host: string) {
  const headers = withCleanMark(request, false);
  const m = /^\/store\/([^/]+)(\/.*)?$/.exec(request.nextUrl.pathname);
  const subdomain = m ? storeSubdomain(m[1]) : '';
  if (!m || !subdomain) return NextResponse.next({ request: { headers } });
  const address = host && isKnownPlatformHost(host) ? { clean: false, origin: originOf(request) } : null;
  return NextResponse.rewrite(storeUrl(request, subdomain, address, m[2] ?? ''), { request: { headers } });
}

// A custom domain's store, remembered per process (Step 8): this lookup ran before every page of such a store. A found
// store is kept 5 minutes, "not a store" 1 minute, so a domain just connected in Store > Domain shows within a minute.
const domainCache = new Map<string, { subdomain: string | null; until: number }>();
const DOMAIN_HIT_MS = 5 * 60_000;
const DOMAIN_MISS_MS = 60_000;

async function resolveCustomDomain(host: string): Promise<string | null> {
  const hit = domainCache.get(host);
  if (hit && hit.until > Date.now()) return hit.subdomain;
  const res = await fetch(`${API_URL}/v1/store/resolve-domain?host=${encodeURIComponent(host)}`);
  if (!res.ok) return null; // not kept: an API hiccup must not hide a store for a minute
  const { subdomain } = (await res.json()) as { subdomain: string | null };
  if (domainCache.size >= 1_000) domainCache.delete(domainCache.keys().next().value as string);
  domainCache.set(host, { subdomain, until: Date.now() + (subdomain ? DOMAIN_HIT_MS : DOMAIN_MISS_MS) });
  return subdomain;
}

async function route(request: NextRequest): Promise<NextResponse> {
  const host = request.headers.get('host')?.toLowerCase().split(':')[0] ?? '';
  if (!host) return passThrough(request, host);

  if (ROOT_DOMAIN && host.endsWith(`.${ROOT_DOMAIN}`)) {
    const subdomain = host.slice(0, -(ROOT_DOMAIN.length + 1));
    // "www" (and the root domain itself) is never a vendor store.
    if (!subdomain || subdomain === 'www') return passThrough(request, host);
    if (subdomain === SHOP_SUBDOMAIN) return rewriteToShop(request);
    if (subdomain === ACCOUNTS_SUBDOMAIN) return rewriteToAccounts(request);
    return rewriteToStore(request, subdomain);
  }

  // Not a subdomain of our own root domain (or ROOT_DOMAIN isn't set at
  // all yet) — could still be a vendor's own custom domain pointed at us
  // via an A record. Skip the lookup for local/LAN hosts, where this is
  // never applicable and would just add a failed fetch to every request.
  const isLocalHost = /^(localhost|127\.0\.0\.1|\d+\.\d+\.\d+\.\d+)$/.test(host) || host.endsWith('.local');
  if (isLocalHost) return passThrough(request, host);

  try {
    const subdomain = await resolveCustomDomain(host);
    if (subdomain) return rewriteToStore(request, subdomain);
  } catch {
    // API unreachable — fall through to normal routing rather than
    // failing the request over a lookup that's purely an enhancement.
  }

  return passThrough(request, host);
}

export async function middleware(request: NextRequest) {
  const response = await route(request);

  // noindex for the private pages, in both address forms (/cart and /store/{sub}/cart), and for search and coupon-link
  // results (?q=, ?coupon=), which are not pages worth listing. `follow` stays on for those so product links are still read.
  const relative = request.nextUrl.pathname.replace(/^\/store\/[^/]+/, '') || '/';
  const first = relative.split('/')[1] ?? '';
  const params = request.nextUrl.searchParams;
  if (PRIVATE_SEGMENTS.has(first)) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  } else if (params.has('q') || params.has('coupon') || params.has('picks')) {
    response.headers.set('X-Robots-Tag', 'noindex, follow');
  }

  // The central sign-in page shows a shopper's saved addresses: it may never be shown inside another site's frame, nor listed.
  const host0 = request.headers.get('host')?.toLowerCase().split(':')[0] ?? '';
  if (request.nextUrl.pathname.startsWith('/regantify') || (!!ROOT_DOMAIN && host0 === `${ACCOUNTS_SUBDOMAIN}.${ROOT_DOMAIN}`)) {
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Content-Security-Policy', "frame-ancestors 'none'");
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    response.headers.set('Referrer-Policy', 'no-referrer');
  }

  // Regantify Shop, Step 15: a link into the Shop from a store (?from=<subdomain>) is remembered for a day, so that store's products come first
  // in the Shop's search (app/shop/search reads it). Only a valid store address is kept; anything else is ignored.
  const from = params.get('from')?.trim().toLowerCase();
  const host = request.headers.get('host')?.toLowerCase().split(':')[0] ?? '';
  const onShop = request.nextUrl.pathname === '/shop' || request.nextUrl.pathname.startsWith('/shop/') || (!!ROOT_DOMAIN && host === `${SHOP_SUBDOMAIN}.${ROOT_DOMAIN}`);
  if (onShop && from && /^[a-z0-9-]{1,63}$/.test(from)) {
    response.cookies.set(SHOP_FROM_COOKIE, from, { maxAge: 86_400, path: '/', sameSite: 'lax', httpOnly: true });
  }
  return response;
}

const SHOP_FROM_COOKIE = 'shop_from';

export const config = {
  // Skip Next.js internals and the favicon — only rewrite page requests. robots.txt and sitemap.xml go through too:
  // on a store's own address they are that store's (app/store/[subdomain]/robots.txt and sitemap.xml), on any other
  // host they fall through to the platform's own (app/robots.ts).
  matcher: ['/((?!_next|favicon.ico).*)'],
};
