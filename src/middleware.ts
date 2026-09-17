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

function rewriteToStore(request: NextRequest, subdomain: string) {
  const url = request.nextUrl.clone();

  // Someone already hit /store/:subdomain directly — don't double-rewrite.
  if (url.pathname.startsWith('/store/')) return NextResponse.next();

  url.pathname = `/store/${subdomain}${url.pathname}`;
  return NextResponse.rewrite(url);
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host')?.toLowerCase().split(':')[0] ?? '';
  if (!host) return NextResponse.next();

  if (ROOT_DOMAIN && host.endsWith(`.${ROOT_DOMAIN}`)) {
    const subdomain = host.slice(0, -(ROOT_DOMAIN.length + 1));
    // "www" (and the root domain itself) is never a vendor store.
    if (!subdomain || subdomain === 'www') return NextResponse.next();
    return rewriteToStore(request, subdomain);
  }

  // Not a subdomain of our own root domain (or ROOT_DOMAIN isn't set at
  // all yet) — could still be a vendor's own custom domain pointed at us
  // via an A record. Skip the lookup for local/LAN hosts, where this is
  // never applicable and would just add a failed fetch to every request.
  const isLocalHost = /^(localhost|127\.0\.0\.1|\d+\.\d+\.\d+\.\d+)$/.test(host) || host.endsWith('.local');
  if (isLocalHost) return NextResponse.next();

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

  return NextResponse.next();
}

export const config = {
  // Skip Next.js internals and static assets — only rewrite page requests.
  matcher: ['/((?!_next|favicon.ico|robots.txt|sitemap.xml).*)'],
};
