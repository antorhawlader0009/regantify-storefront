'use client';

import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { CoverFloating } from '@/lib/floatingCover';
import { useStoreText } from '../lib/storeText';
import { useStoreSkin } from '../lib/designSettings';
import { useStoreDisplayName } from '../lib/useStoreDisplayName';
import { StoreFooter } from './StoreFooter';
import { PlaymateBreadcrumb } from '../../playmate/PlaymateBreadcrumb';
import { SolevoPageHeader } from '../../solevo/SolevoBreadcrumb';
import { ChronicsPageHeader } from '../../chronics/ChronicsBreadcrumb';
import { ChicwovePageHeader } from '../../chicwove/ChicwoveBreadcrumb';
import { isPageSkin } from '@/lib/theme';

/**
 * A store page shown as a dialog over the store (2026-10-29, the owner's request): the thank-you page and Track your order. The
 * page renders the store header itself; this draws the dimmed backdrop, a centred box (the whole screen on a phone) whose content
 * scrolls inside, and the ×. × / Esc / a click outside go to the store's home. The page behind doesn't scroll while it is open.
 * PlayMate has no dialogs: there the same content is an ordinary page in the template's layout (breadcrumb, content, footer).
 */
export function StoreDialogFrame({ subdomain, label, maxWidth = 'sm:max-w-3xl', children }: { subdomain: string; label: string; maxWidth?: string; children: ReactNode }) {
  const t = useStoreText();
  const router = useRouter();
  const skin = useStoreSkin();
  const pm = isPageSkin(skin);
  const storeName = useStoreDisplayName(subdomain);
  const boxRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => router.push(`/store/${subdomain}`), [router, subdomain]);

  useEffect(() => {
    if (pm) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    boxRef.current?.focus({ preventScroll: true });
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [close, pm]);

  if (skin === 'chronics') {
    return (
      <>
        <ChronicsPageHeader subdomain={subdomain} homeLabel={t('Home')} crumbs={[{ label }]} />
        <main className="cr-wrap w-full py-8 sm:py-10">
          <div className={`mx-auto w-full max-w-3xl overflow-hidden rounded-xl border border-gray-100 bg-white ${maxWidth}`}>{children}</div>
        </main>
        <StoreFooter subdomain={subdomain} storeName={storeName} />
      </>
    );
  }
  if (skin === 'chicwove') {
    return (
      <>
        <ChicwovePageHeader subdomain={subdomain} homeLabel={t('Home')} crumbs={[{ label }]} />
        <main className="cw-wrap w-full py-8 sm:py-10">
          <div className={`mx-auto w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-card ${maxWidth}`}>{children}</div>
        </main>
        <StoreFooter subdomain={subdomain} storeName={storeName} />
      </>
    );
  }
  if (skin === 'solevo') {
    return (
      <>
        <SolevoPageHeader subdomain={subdomain} homeLabel={t('Home')} crumbs={[{ label }]} />
        <main className="sv-wrap w-full py-8 sm:py-10">
          <div className={`mx-auto w-full max-w-3xl overflow-hidden rounded-lg border border-black/10 bg-white shadow-card ${maxWidth}`}>{children}</div>
        </main>
        <StoreFooter subdomain={subdomain} storeName={storeName} />
      </>
    );
  }
  if (pm) {
    return (
      <>
        <main className="pm-wrap w-full py-6 sm:py-8">
          <PlaymateBreadcrumb subdomain={subdomain} homeLabel={t('Home')} items={[{ label }]} />
          <div className={`mx-auto mt-4 w-full max-w-3xl overflow-hidden rounded-xl bg-[var(--pm-card)] ${maxWidth}`}>{children}</div>
        </main>
        <StoreFooter subdomain={subdomain} storeName={storeName} />
      </>
    );
  }

  return (
    <>
      <CoverFloating />
      <div className="fixed inset-0 z-50 flex items-stretch justify-center sm:items-center sm:p-6">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={close} aria-hidden />
        <div
          ref={boxRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label={label}
          className={`relative flex h-full w-full flex-col overflow-hidden bg-canvas shadow-[0_24px_80px_-12px_rgba(16,24,40,0.45)] outline-none sm:h-auto sm:max-h-[min(92vh,940px)] sm:rounded-2xl ${maxWidth}`}
        >
          <button
            type="button"
            onClick={close}
            aria-label={t('Close')}
            className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-surface/90 text-ink shadow-sm transition-colors hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <X size={20} strokeWidth={2.25} />
          </button>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
        </div>
      </div>
    </>
  );
}
