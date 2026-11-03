import { NextResponse, type NextRequest } from 'next/server';
import { SHOP_SESSION_COOKIE } from '@/lib/shopAccount';

/*
 * The Regantify Shop's own small proxy (2026-11-03): one sign-in buys from every shop on the Shop website, like the Regantify app.
 *
 * The browser calls /shop/api/<path>; this route forwards it to the API's app routes (/v1/app/...) with the shopper's app token, which
 * lives ONLY in an httpOnly cookie on the Shop's own address. Page script never sees the token, and no store page (where a store's own
 * Custom Code runs) ever gets it: the Shop is the platform's own site. Only the paths listed here are forwarded.
 */

const API_URL = process.env.API_URL ?? 'http://localhost:4000';
const MAX_BODY = 200_000;

/** What the browser may reach, and where it goes. `market/...` keeps the rest of its path. */
function target(path: string[], method: string): string | null {
  const p = path.join('/');
  if (p === 'auth/send' && method === 'POST') return '/v1/app/phone/send';
  if (p === 'auth/verify' && method === 'POST') return '/v1/app/phone/verify';
  if (p === 'auth/sign-out' && method === 'POST') return '/v1/app/sign-out';
  if (p === 'me' && method === 'GET') return '/v1/app/me';
  if (path[0] === 'market' && path.length > 1 && path.every((s) => /^[A-Za-z0-9._~-]{1,200}$/.test(s))) return `/v1/app/${p}`;
  return null;
}

/** The shopper's own address, so the API's per-address limits count each shopper, not this server (it trusts private-network proxies). */
function clientIp(req: NextRequest): string | null {
  const fwd = req.headers.get('x-forwarded-for');
  const last = fwd?.split(',').map((s) => s.trim()).filter(Boolean).pop();
  return last || req.headers.get('x-real-ip') || null;
}

async function forward(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const method = req.method.toUpperCase();
  const to = target(path, method);
  if (!to) return NextResponse.json({ message: 'Not found.' }, { status: 404 });

  // Same-site requests only: a page on another site can't make the shopper's browser use this.
  const origin = req.headers.get('origin');
  if (method !== 'GET' && origin && new URL(origin).host !== req.headers.get('host')) {
    return NextResponse.json({ message: 'Not allowed.' }, { status: 403 });
  }

  let body: string | undefined;
  if (method !== 'GET' && method !== 'HEAD') {
    body = await req.text();
    if (body.length > MAX_BODY) return NextResponse.json({ message: 'Too much data.' }, { status: 413 });
    // Sign-in on the Shop website may make a new account (the server keeps the plain app sign-in for existing accounts only).
    if (to === '/v1/app/phone/send' || to === '/v1/app/phone/verify') {
      let sent: { phone?: unknown; code?: unknown; name?: unknown };
      try {
        sent = JSON.parse(body || '{}') as typeof sent;
      } catch {
        return NextResponse.json({ message: 'Bad request.' }, { status: 400 });
      }
      body =
        to === '/v1/app/phone/send'
          ? JSON.stringify({ phone: sent.phone, signUp: true })
          : JSON.stringify({ phone: sent.phone, code: sent.code, name: typeof sent.name === 'string' ? sent.name : '', signUp: true, device: 'Regantify Shop website' });
    }
  }

  const token = req.cookies.get(SHOP_SESSION_COOKIE)?.value;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  const ip = clientIp(req);
  if (ip) headers['X-Forwarded-For'] = ip;

  const search = req.nextUrl.search;
  let upstream: Response;
  try {
    upstream = await fetch(`${API_URL}${to}${search}`, { method, headers, body, cache: 'no-store', signal: AbortSignal.timeout(30_000) });
  } catch {
    return NextResponse.json({ message: 'Could not reach Regantify. Please try again.' }, { status: 502 });
  }
  const text = await upstream.text();

  // A successful sign-in: keep the token in the cookie and give the page only who signed in.
  if (to === '/v1/app/phone/verify' && upstream.ok) {
    const data = JSON.parse(text) as { token: string; expiresAt: string; customer: unknown };
    const res = NextResponse.json({ customer: data.customer });
    res.cookies.set(SHOP_SESSION_COOKIE, data.token, {
      httpOnly: true,
      secure: req.nextUrl.protocol === 'https:',
      sameSite: 'lax',
      path: '/',
      expires: new Date(data.expiresAt),
    });
    return res;
  }

  const res = new NextResponse(text, { status: upstream.status, headers: { 'Content-Type': upstream.headers.get('content-type') ?? 'application/json', 'Cache-Control': 'no-store' } });
  // Signed out, or the token is no longer good: drop the cookie.
  if (to === '/v1/app/sign-out' || upstream.status === 401) res.cookies.delete(SHOP_SESSION_COOKIE);
  return res;
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
export const dynamic = 'force-dynamic';
