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

export function middleware(request: NextRequest) {
  if (!ROOT_DOMAIN) return NextResponse.next();

  const host = request.headers.get('host')?.toLowerCase().split(':')[0] ?? '';

  // Not a subdomain of our root domain at all (e.g. someone hit the bare
  // root domain, or a request came in on an unrelated host) — leave it
  // alone, let normal routing (including /store/:subdomain) handle it.
  if (!host.endsWith(`.${ROOT_DOMAIN}`)) return NextResponse.next();

  const subdomain = host.slice(0, -(ROOT_DOMAIN.length + 1));

  // "www" (and the root domain itself) is never a vendor store.
  if (!subdomain || subdomain === 'www') return NextResponse.next();

  const url = request.nextUrl.clone();

  // Someone already hit /store/:subdomain on a subdomain host directly —
  // don't double-rewrite.
  if (url.pathname.startsWith('/store/')) return NextResponse.next();

  url.pathname = `/store/${subdomain}${url.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Skip Next.js internals and static assets — only rewrite page requests.
  matcher: ['/((?!_next|favicon.ico|robots.txt|sitemap.xml).*)'],
};
