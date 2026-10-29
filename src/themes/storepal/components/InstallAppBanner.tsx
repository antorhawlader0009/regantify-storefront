'use client';

import { usePathname } from 'next/navigation';
import { Share, SquarePlus, X } from 'lucide-react';
import { useInstallApp } from '@/lib/installApp';
import { useFloatingCovered } from '@/lib/floatingCover';
import { useStorePalDesign } from '../lib/designSettings';
import { useStoreText } from '../lib/storeText';
import { trackFeature } from '@/lib/featureUse';

/**
 * "Add the store to your home screen" (Store > Branding > Install as app). Shown once in a while to a returning shopper on a phone
 * (lib/installApp.ts decides when). Android gets an Install button that opens the phone's own dialog; an iPhone gets the two steps.
 */
export function InstallAppBanner({ subdomain, storeName }: { subdomain: string; storeName: string }) {
  const design = useStorePalDesign();
  const t = useStoreText();
  const pathname = usePathname() ?? '';
  const { mode, install, dismiss } = useInstallApp(subdomain, !!design.appInstallEnabled, pathname);
  // Steps aside while something covers the page (the AI chat, checkout, sign-in...: lib/floatingCover.tsx).
  const covered = useFloatingCovered();
  if (!mode || covered) return null;

  const name = design.appName?.trim() || storeName;
  // The icon is on the address the shopper is using: path form in development, the store's own address in production.
  const base = pathname.startsWith(`/store/${subdomain}`) ? `/store/${subdomain}` : '';
  return (
    <div role="dialog" aria-label={t('Add to your home screen')} className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-md rounded-2xl border border-line bg-surface p-4 shadow-2xl">
      <button type="button" onClick={dismiss} aria-label={t('Not now')} className="absolute right-2.5 top-2.5 rounded-full p-1 text-muted hover:text-ink">
        <X size={16} />
      </button>
      <div className="flex items-center gap-3 pr-6">
        {/* eslint-disable-next-line @next/next/no-img-element -- the store's own small icon */}
        <img src={`${base}/app-icon/192`} alt="" width={48} height={48} className="h-12 w-12 shrink-0 rounded-xl border border-line" />
        <div className="min-w-0">
          <p className="truncate text-[14.5px] font-semibold text-ink">
            {t('Add to your home screen')}: {name}
          </p>
          <p className="text-[12.5px] leading-snug text-muted">{t('Open the shop like an app, one tap from your home screen.')}</p>
        </div>
      </div>
      {mode === 'PROMPT' ? (
        <div className="mt-3 flex justify-end gap-2">
          <button type="button" onClick={dismiss} className="rounded-lg px-3.5 py-2 text-[13px] font-medium text-muted hover:text-ink">
            {t('Not now')}
          </button>
          <button type="button" onClick={() => {
              trackFeature('INSTALL_APP_CLICK');
              void install();
            }} className="rounded-lg bg-ink px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90">
            {t('Install')}
          </button>
        </div>
      ) : (
        <p className="mt-3 flex flex-wrap items-center gap-1 rounded-lg bg-canvas px-3 py-2 text-[12.5px] text-ink">
          {t('Tap')} <Share size={14} aria-label="Share" className="inline" /> {t('Share, then')} <SquarePlus size={14} aria-hidden className="inline" /> “{t('Add to Home Screen')}”.
        </p>
      )}
    </div>
  );
}
