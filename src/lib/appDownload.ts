/**
 * Getting the Regantify app (STORE-APP-plan.md Step 9): where to download it, read from the server (GET /v1/app/download, which takes it
 * from the server's environment), and the per-store Play link. Server-side helpers; the client side is lib/appAvailable.tsx.
 */
const API_URL = process.env.API_URL ?? 'http://localhost:4000';

export interface AppDownload {
  packageName: string;
  playUrl: string | null;
  apkUrl: string | null;
  version: string | null;
  sizeMb: number | null;
}

/** The app's download details, or null when the server cannot say. Cached for 5 minutes, so a store page never waits on it. */
export async function getAppDownload(): Promise<AppDownload | null> {
  try {
    const res = await fetch(`${API_URL}/v1/app/download`, { next: { revalidate: 300 }, signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    return (await res.json()) as AppDownload;
  } catch {
    return null;
  }
}

/** True when there is something to download (a Play page or an APK): only then are "Get the app" links shown. */
export function appOffered(info: AppDownload | null): boolean {
  return !!info && (!!info.playUrl || !!info.apkUrl);
}

/**
 * The Play link with the store's name in `referrer`, which Play hands to the app on its first launch (Install Referrer), so the app opens
 * this store. Form: referrer=rgf_store%3D<subdomain> (the app reads `rgf_store=` from it). A link that cannot take a referrer is returned as it is.
 */
export function playUrlFor(playUrl: string, subdomain: string): string {
  try {
    const url = new URL(playUrl);
    url.searchParams.set('referrer', `rgf_store=${subdomain}`);
    return url.toString();
  } catch {
    return playUrl;
  }
}

/** assetlinks.json as the server builds it (an empty list while no fingerprint is set). */
export async function getAssetLinks(): Promise<unknown[]> {
  try {
    const res = await fetch(`${API_URL}/v1/app/assetlinks`, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(4000) });
    return res.ok ? ((await res.json()) as unknown[]) : [];
  } catch {
    return [];
  }
}
