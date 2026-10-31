import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import QRCode from 'qrcode';
import { Download, Smartphone } from 'lucide-react';
import { getStoreInfo, StoreNotFoundError, siteUrl } from '@/lib/storefrontApi';
import { appOffered, getAppDownload, playUrlFor } from '@/lib/appDownload';
import { REGANTIFY_APP_ICON } from '@/lib/regantifyAppIcon';
import { storeParams } from '@/lib/storeRequest';

interface PageProps {
  params: Promise<{ subdomain: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  await storeParams(params);
  // A help page for shoppers; it is not a page to find through a search.
  return { title: 'Get the Regantify app', robots: { index: false, follow: true } };
}

/**
 * /app on every store (STORE-APP-plan.md Step 9), for every template: the Regantify app's icon, version and size, the Play button (its link
 * carries this store in `referrer`, so the app opens this store on first launch), the website APK while the Play page is not public, a QR code
 * for a computer, and install help. Hidden inside the app itself (`rg-hide-in-app`, set before the page runs). Kept like any store page:
 * it reads nothing from the request.
 */
export default async function AppPage({ params }: PageProps) {
  const { subdomain } = await storeParams(params);
  let storeName: string;
  try {
    storeName = (await getStoreInfo(subdomain)).storeName;
  } catch (err) {
    if (err instanceof StoreNotFoundError) notFound();
    throw err;
  }
  const info = await getAppDownload();
  const offered = appOffered(info);
  // The QR sends a phone to this same page, so it lands on the right buttons (and Play's referrer still carries this store).
  const qr = offered ? await QRCode.toString(await siteUrl(`/store/${subdomain}/app`), { type: 'svg', margin: 1, width: 168, errorCorrectionLevel: 'M' }) : null;
  const play = info?.playUrl ? playUrlFor(info.playUrl, subdomain) : null;

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 text-ink">
      <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- a 96 px data address, the app's own icon */}
          <img src={REGANTIFY_APP_ICON} alt="" width={72} height={72} className="h-[72px] w-[72px] rounded-2xl border border-line" />
          <div>
            <h1 className="text-xl font-semibold">Regantify app</h1>
            <p className="text-sm text-muted">The official app of Regantify. Shop at {storeName} and other shops in one place.</p>
          </div>
        </div>

        {/* Inside the app there is nothing to download. */}
        <p className="rg-show-in-app mt-6 rounded-xl bg-canvas px-4 py-3 text-sm">You are already using the Regantify app.</p>

        <div className="rg-hide-in-app">
          {!offered ? (
            <p className="mt-6 rounded-xl bg-canvas px-4 py-3 text-sm text-muted">The app is not available to download yet. Please check again soon.</p>
          ) : (
            <>
              <ul className="mt-5 space-y-1 text-sm text-muted">
                <li>Track your orders and get a notification when they move</li>
                <li>Talk to the shop&rsquo;s AI assistant by voice, in Bangla</li>
                <li>Keep your addresses and sign in once for every shop</li>
              </ul>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                {play && (
                  <a href={play} className="inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-white hover:opacity-90">
                    <Smartphone size={16} aria-hidden /> Get it on Google Play
                  </a>
                )}
                {info?.apkUrl && (
                  <a
                    href={info.apkUrl}
                    rel="noopener"
                    className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold ${play ? 'border border-line text-ink hover:bg-canvas' : 'bg-ink text-white hover:opacity-90'}`}
                  >
                    <Download size={16} aria-hidden /> Download the APK
                    {(info.version || info.sizeMb) && (
                      <span className="font-normal opacity-80">
                        ({[info.version && `v${info.version}`, info.sizeMb && `${info.sizeMb} MB`].filter(Boolean).join(', ')})
                      </span>
                    )}
                  </a>
                )}
              </div>

              {qr && (
                <div className="mt-8 hidden items-center gap-5 border-t border-line pt-6 md:flex">
                  <div className="rounded-xl border border-line bg-white p-2" dangerouslySetInnerHTML={{ __html: qr }} aria-label="QR code for this page" />
                  <p className="text-sm text-muted">On a computer? Scan this with your phone&rsquo;s camera to open this page on your phone.</p>
                </div>
              )}

              {info?.apkUrl && (
                <details className="mt-6 text-sm">
                  <summary className="cursor-pointer font-medium">Installing the APK</summary>
                  <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted">
                    <li>Open the downloaded file. If your phone asks, allow your browser to install apps from this source.</li>
                    <li>Tap Install, then Open.</li>
                    <li>Only download the app from this page or from Google Play.</li>
                  </ol>
                </details>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
