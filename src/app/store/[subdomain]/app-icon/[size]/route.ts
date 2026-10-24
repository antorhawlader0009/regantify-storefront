import { NextResponse } from 'next/server';
import { decodeStoreSegment } from '@/lib/storeAddress';

const API_URL = process.env.API_URL ?? 'http://localhost:4000';
// Passed through on every request (the server keeps the PNG in memory); never a kept page.
export const dynamic = 'force-dynamic';
const SIZES = new Set(['180', '192', '512']);

/**
 * The store's home-screen icon, served from the store's own address (an iPhone's apple-touch-icon and the manifest's icons
 * then never depend on the API's address). The PNG is made by the server (store-app-icon.ts); this only passes it on.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ subdomain: string; size: string }> }) {
  const { subdomain: raw, size } = await params;
  const { subdomain } = decodeStoreSegment(raw);
  if (!SIZES.has(size)) return new NextResponse('Not found', { status: 404 });
  const res = await fetch(`${API_URL}/v1/store/${encodeURIComponent(subdomain)}/app-icon/${size}`, { cache: 'no-store', signal: AbortSignal.timeout(15_000) }).catch(() => null);
  if (!res?.ok) return new NextResponse('Not found', { status: 404 });
  return new NextResponse(await res.arrayBuffer(), {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400' },
  });
}
