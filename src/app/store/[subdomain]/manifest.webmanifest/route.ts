import { NextResponse } from 'next/server';
import { getStoreInfo } from '@/lib/storefrontApi';
import { decodeStoreSegment } from '@/lib/storeAddress';

/**
 * "Install as app": this store's web manifest, for every template. On a store's own address the middleware rewrites
 * /manifest.webmanifest here; in path form it is /store/{sub}/manifest.webmanifest. Every address in it is relative, so it
 * resolves against wherever the manifest was loaded: start_url and scope become "/" on the store's own address and
 * "/store/{sub}/" in path form, always the same origin as the page (a browser refuses a start_url on another origin).
 * Chrome's install rules (web.dev, 2024): a name, 192 and 512 px icons, start_url and a display mode, over HTTPS; no service
 * worker is needed. The icons come from the server (store-app-icon.ts), through app-icon/[size] on the same address.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = decodeStoreSegment((await params).subdomain);
  const store = await getStoreInfo(subdomain).catch(() => null);
  if (!store) return new NextResponse('Not found', { status: 404 });

  const name = store.designSettings?.appName?.trim() || store.storeName;
  const color = store.accentColor && /^#[0-9a-f]{6}$/i.test(store.accentColor) ? store.accentColor : '#111827';
  // A changed logo or colour gives the icons a new address, so phones fetch them again.
  const v = encodeURIComponent(`${store.logoUrl ?? ''}|${color}`.slice(-60));
  const manifest = {
    id: './',
    name,
    short_name: name.length > 12 ? name.slice(0, 12).trim() : name,
    start_url: './?source=app',
    scope: './',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: color,
    icons: [
      { src: `./app-icon/192?v=${v}`, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: `./app-icon/512?v=${v}`, sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: `./app-icon/512?v=${v}`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
  return new NextResponse(JSON.stringify(manifest), {
    headers: { 'Content-Type': 'application/manifest+json; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
}
