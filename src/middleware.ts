import { NextRequest, NextResponse } from 'next/server';

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
const PRIVATE_SEGMENTS = new Set(['cart', 'checkout', 'thank-you', 'account', 'orders', 'wishlist', 'compare', 't', 'pay', 'r', 'cart-link', 'payment-callback']);

/** The request's headers with the clean-address mark set or cleared. */
function withCleanMark(request: NextRequest, clean: boolean): Headers {
  const headers = new Headers(request.headers);
  if (clean) headers.set(CLEAN_HEADER, '1');
  else headers.delete(CLEAN_HEADER);
  return headers;
}

function rewriteToStore(request: NextRequest, subdomain: string) {
  const headers = withCleanMark(request, true);
  const url = request.nextUrl.clone();

  // Someone already hit /store/:subdomain directly (the store's own links are written that way) — don't double-rewrite,
  // but it is still the store's own address, so its canonical link must be the clean form. Only THIS store's path: a
  // store's address must never serve another store's pages (that store's Custom Code would run on this store's origin,
  // with its localStorage and its shoppers). /store/<other>/... is rewritten under this store, where it 404s.
  if (url.pathname.startsWith('/store/')) {
    const segment = url.pathname.split('/')[2]?.toLowerCase() ?? '';
    if (segment === subdomain.toLowerCase()) return NextResponse.next({ request: { headers } });
  }

  url.pathname = `/store/${subdomain}${url.pathname}`;
  return NextResponse.rewrite(url, { request: { headers } });
}

async function route(request: NextRequest): Promise<NextResponse> {
  const host = request.headers.get('host')?.toLowerCase().split(':')[0] ?? '';
  if (!host) return NextResponse.next({ request: { headers: withCleanMark(request, false) } });

  if (ROOT_DOMAIN && host.endsWith(`.${ROOT_DOMAIN}`)) {
    const subdomain = host.slice(0, -(ROOT_DOMAIN.length + 1));
    // "www" (and the root domain itself) is never a vendor store.
    if (!subdomain || subdomain === 'www') return NextResponse.next({ request: { headers: withCleanMark(request, false) } });
    return rewriteToStore(request, subdomain);
  }

  // Not a subdomain of our own root domain (or ROOT_DOMAIN isn't set at
  // all yet) — could still be a vendor's own custom domain pointed at us
  // via an A record. Skip the lookup for local/LAN hosts, where this is
  // never applicable and would just add a failed fetch to every request.
  const isLocalHost = /^(localhost|127\.0\.0\.1|\d+\.\d+\.\d+\.\d+)$/.test(host) || host.endsWith('.local');
  if (isLocalHost) return NextResponse.next({ request: { headers: withCleanMark(request, false) } });

  try {
    const res = await fetch(`${API_URL}/v1/store/resolve-domain?host=${encodeURIComponent(host)}`);
    if (res.ok) {
      const { subdomain } = (await res.json()) as { subdomain: string | null };
      if (subdomain) return rewriteToStore(request, subdomain);
    }
  } catch {
    // API unreachable — fall through to normal routing rather than
    // failing the request over a lookup that's purely an enhancement.
  }

  return NextResponse.next({ request: { headers: withCleanMark(request, false) } });
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
  } else if (params.has('q') || params.has('coupon')) {
    response.headers.set('X-Robots-Tag', 'noindex, follow');
  }
  return response;
}

export const config = {
  // Skip Next.js internals and the favicon — only rewrite page requests. robots.txt and sitemap.xml go through too:
  // on a store's own address they are that store's (app/store/[subdomain]/robots.txt and sitemap.xml), on any other
  // host they fall through to the platform's own (app/robots.ts).
  matcher: ['/((?!_next|favicon.ico).*)'],
};
