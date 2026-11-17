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
import { MahabeshPageHeader } from '../../mahabesh/MahabeshBreadcrumb';
import { TechzonePageHeader } from '../../techzone/TechzoneBreadcrumb';
import { StridePageHeader } from '../../stride/StrideBreadcrumb';
import { VaeloraPageHeader } from '../../vaelora/VaeloraBreadcrumb';
import { ChicwovePageHeader } from '../../chicwove/ChicwoveBreadcrumb';
import { TechnovaPageHeader } from '../../technova/TechnovaBreadcrumb';
import { TastehousePageHeader } from '../../tastehouse/TastehouseBreadcrumb';
import { SporteqPageHeader } from '../../sporteq/SporteqBreadcrumb';
import { ShopeasePageHeader } from '../../shopease/ShopeaseBreadcrumb';
import { QuickbitePageHeader } from '../../quickbite/QuickbiteBreadcrumb';
import { PetmartPageHeader } from '../../petmart/PetmartBreadcrumb';
import { PapernestPageHeader } from '../../papernest/PapernestBreadcrumb';
import { NovellaPageHeader } from '../../novella/NovellaBreadcrumb';
import { NovatrendPageHeader } from '../../novatrend/NovatrendBreadcrumb';
import { MinimogPageHeader } from '../../minimog/MinimogBreadcrumb';
import { MenauraPageHeader } from '../../menaura/MenauraBreadcrumb';
import { MallonPageHeader } from '../../mallon/MallonBreadcrumb';
import { GroceryantoPageHeader } from '../../groceryanto/GroceryantoBreadcrumb';
import { GreenmartPageHeader } from '../../greenmart/GreenmartBreadcrumb';
import { GlowerivePageHeader } from '../../glowerive/GloweriveBreadcrumb';
import { GadgetstorePageHeader } from '../../gadgetstore/GadgetstoreBreadcrumb';
import { FurniluxPageHeader } from '../../furnilux/FurniluxBreadcrumb';
import { EstateproPageHeader } from '../../estatepro/EstateproBreadcrumb';
import { DrivecraftPageHeader } from '../../drivecraft/DrivecraftBreadcrumb';
import { BeloraPageHeader } from '../../belora/BeloraBreadcrumb';
import { ElevatePageHeader } from '../../elevate/ElevateBreadcrumb';
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

  if (skin === 'stride') {
    return (
      <>
        <StridePageHeader subdomain={subdomain} homeLabel={t('Home')} crumbs={[{ label }]} />
        <main className="st-wrap w-full py-8 sm:py-10">
          <div className={`mx-auto w-full max-w-3xl overflow-hidden rounded-xl border border-slate-200 bg-white ${maxWidth}`}>{children}</div>
        </main>
        <StoreFooter subdomain={subdomain} storeName={storeName} />
      </>
    );
  }
  if (skin === 'vaelora') {
    return (
      <>
        <VaeloraPageHeader subdomain={subdomain} homeLabel={t('Home')} crumbs={[{ label }]} />
        <main className="va-wrap w-full py-8 sm:py-10">
          <div className={`mx-auto w-full max-w-3xl overflow-hidden rounded-xl border border-slate-200 bg-white ${maxWidth}`}>{children}</div>
        </main>
        <StoreFooter subdomain={subdomain} storeName={storeName} />
      </>
    );
  }
  if (skin === 'techzone') {
    return (
      <>
        <TechzonePageHeader subdomain={subdomain} homeLabel={t('Home')} crumbs={[{ label }]} />
        <main className="tz-wrap w-full py-8 sm:py-10">
          <div className={`mx-auto w-full max-w-3xl overflow-hidden rounded-xl border border-slate-200 bg-white ${maxWidth}`}>{children}</div>
        </main>
        <StoreFooter subdomain={subdomain} storeName={storeName} />
      </>
    );
  }
  if (skin === 'mahabesh') {
    return (
      <>
        <MahabeshPageHeader subdomain={subdomain} homeLabel={t('Home')} crumbs={[{ label }]} />
        <main className="mh-wrap w-full py-8 sm:py-10">
          <div className={`mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-[var(--mh-line)] bg-white ${maxWidth}`}>{children}</div>
        </main>
        <StoreFooter subdomain={subdomain} storeName={storeName} />
      </>
    );
  }
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
  if (skin === 'technova') {
    return (
      <>
        <TechnovaPageHeader subdomain={subdomain} homeLabel={t('Home')} crumbs={[{ label }]} />
        <main className="tn-wrap w-full py-8 sm:py-10">
          <div className={`mx-auto w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-card ${maxWidth}`}>{children}</div>
        </main>
        <StoreFooter subdomain={subdomain} storeName={storeName} />
      </>
    );
  }
  if (skin === 'tastehouse') {
    return (
      <>
        <TastehousePageHeader subdomain={subdomain} homeLabel={t('Home')} crumbs={[{ label }]} />
        <main className="th-wrap w-full py-8 sm:py-10">
          <div className={`mx-auto w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-card ${maxWidth}`}>{children}</div>
        </main>
        <StoreFooter subdomain={subdomain} storeName={storeName} />
      </>
    );
  }
  if (skin === 'sporteq') {
    return (
      <>
        <SporteqPageHeader subdomain={subdomain} homeLabel={t('Home')} crumbs={[{ label }]} />
        <main className="eq-wrap w-full py-8 sm:py-10">
          <div className={`mx-auto w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-card ${maxWidth}`}>{children}</div>
        </main>
        <StoreFooter subdomain={subdomain} storeName={storeName} />
      </>
    );
  }
  if (skin === 'shopease') {
    return (
      <>
        <ShopeasePageHeader subdomain={subdomain} homeLabel={t('Home')} crumbs={[{ label }]} />
        <main className="se-wrap w-full py-8 sm:py-10">
          <div className={`mx-auto w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-card ${maxWidth}`}>{children}</div>
        </main>
        <StoreFooter subdomain={subdomain} storeName={storeName} />
      </>
    );
  }
  if (skin === 'quickbite') {
    return (
      <>
        <QuickbitePageHeader subdomain={subdomain} homeLabel={t('Home')} crumbs={[{ label }]} />
        <main className="qb-wrap w-full py-8 sm:py-10">
          <div className={`mx-auto w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-card ${maxWidth}`}>{children}</div>
        </main>
        <StoreFooter subdomain={subdomain} storeName={storeName} />
      </>
    );
  }
  if (skin === 'petmart') {
    return (
      <>
        <PetmartPageHeader subdomain={subdomain} homeLabel={t('Home')} crumbs={[{ label }]} />
        <main className="pk-wrap w-full py-8 sm:py-10">
          <div className={`mx-auto w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-card ${maxWidth}`}>{children}</div>
        </main>
        <StoreFooter subdomain={subdomain} storeName={storeName} />
      </>
    );
  }
  if (skin === 'papernest') {
    return (
      <>
        <PapernestPageHeader subdomain={subdomain} homeLabel={t('Home')} crumbs={[{ label }]} />
        <main className="pn-wrap w-full py-8 sm:py-10">
          <div className={`mx-auto w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-card ${maxWidth}`}>{children}</div>
        </main>
        <StoreFooter subdomain={subdomain} storeName={storeName} />
      </>
    );
  }
  if (skin === 'novella') {
    return (
      <>
        <NovellaPageHeader subdomain={subdomain} homeLabel={t('Home')} crumbs={[{ label }]} />
        <main className="nv-wrap w-full py-8 sm:py-10">
          <div className={`mx-auto w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-card ${maxWidth}`}>{children}</div>
        </main>
        <StoreFooter subdomain={subdomain} storeName={storeName} />
      </>
    );
  }
  if (skin === 'novatrend') {
    return (
      <>
        <NovatrendPageHeader subdomain={subdomain} homeLabel={t('Home')} crumbs={[{ label }]} />
        <main className="nt-wrap w-full py-8 sm:py-10">
          <div className={`mx-auto w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-card ${maxWidth}`}>{children}</div>
        </main>
        <StoreFooter subdomain={subdomain} storeName={storeName} />
      </>
    );
  }
  if (skin === 'minimog') {
    return (
      <>
        <MinimogPageHeader subdomain={subdomain} homeLabel={t('Home')} crumbs={[{ label }]} />
        <main className="mg-wrap w-full py-8 sm:py-10">
          <div className={`mx-auto w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-card ${maxWidth}`}>{children}</div>
        </main>
        <StoreFooter subdomain={subdomain} storeName={storeName} />
      </>
    );
  }
  if (skin === 'menaura') {
    return (
      <>
        <MenauraPageHeader subdomain={subdomain} homeLabel={t('Home')} crumbs={[{ label }]} />
        <main className="mn-wrap w-full py-8 sm:py-10">
          <div className={`mx-auto w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-card ${maxWidth}`}>{children}</div>
        </main>
        <StoreFooter subdomain={subdomain} storeName={storeName} />
      </>
    );
  }
  if (skin === 'mallon') {
    return (
      <>
        <MallonPageHeader subdomain={subdomain} homeLabel={t('Home')} crumbs={[{ label }]} />
        <main className="ml-wrap w-full py-8 sm:py-10">
          <div className={`mx-auto w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-card ${maxWidth}`}>{children}</div>
        </main>
        <StoreFooter subdomain={subdomain} storeName={storeName} />
      </>
    );
  }
  if (skin === 'groceryanto') {
    return (
      <>
        <GroceryantoPageHeader subdomain={subdomain} homeLabel={t('Home')} crumbs={[{ label }]} />
        <main className="ga-wrap w-full py-8 sm:py-10">
          <div className={`mx-auto w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-card ${maxWidth}`}>{children}</div>
        </main>
        <StoreFooter subdomain={subdomain} storeName={storeName} />
      </>
    );
  }
  if (skin === 'greenmart') {
    return (
      <>
        <GreenmartPageHeader subdomain={subdomain} homeLabel={t('Home')} crumbs={[{ label }]} />
        <main className="gm-wrap w-full py-8 sm:py-10">
          <div className={`mx-auto w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-card ${maxWidth}`}>{children}</div>
        </main>
        <StoreFooter subdomain={subdomain} storeName={storeName} />
      </>
    );
  }
  if (skin === 'glowerive') {
    return (
      <>
        <GlowerivePageHeader subdomain={subdomain} homeLabel={t('Home')} crumbs={[{ label }]} />
        <main className="gw-wrap w-full py-8 sm:py-10">
          <div className={`mx-auto w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-card ${maxWidth}`}>{children}</div>
        </main>
        <StoreFooter subdomain={subdomain} storeName={storeName} />
      </>
    );
  }
  if (skin === 'gadgetstore') {
    return (
      <>
        <GadgetstorePageHeader subdomain={subdomain} homeLabel={t('Home')} crumbs={[{ label }]} />
        <main className="gs-wrap w-full py-8 sm:py-10">
          <div className={`mx-auto w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-card ${maxWidth}`}>{children}</div>
        </main>
        <StoreFooter subdomain={subdomain} storeName={storeName} />
      </>
    );
  }
  if (skin === 'furnilux') {
    return (
      <>
        <FurniluxPageHeader subdomain={subdomain} homeLabel={t('Home')} crumbs={[{ label }]} />
        <main className="fu-wrap w-full py-8 sm:py-10">
          <div className={`mx-auto w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-card ${maxWidth}`}>{children}</div>
        </main>
        <StoreFooter subdomain={subdomain} storeName={storeName} />
      </>
    );
  }
  if (skin === 'estatepro') {
    return (
      <>
        <EstateproPageHeader subdomain={subdomain} homeLabel={t('Home')} crumbs={[{ label }]} />
        <main className="ep-wrap w-full py-8 sm:py-10">
          <div className={`mx-auto w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-card ${maxWidth}`}>{children}</div>
        </main>
        <StoreFooter subdomain={subdomain} storeName={storeName} />
      </>
    );
  }
  if (skin === 'drivecraft') {
    return (
      <>
        <DrivecraftPageHeader subdomain={subdomain} homeLabel={t('Home')} crumbs={[{ label }]} />
        <main className="dc-wrap w-full py-8 sm:py-10">
          <div className={`mx-auto w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-card ${maxWidth}`}>{children}</div>
        </main>
        <StoreFooter subdomain={subdomain} storeName={storeName} />
      </>
    );
  }
  if (skin === 'belora') {
    return (
      <>
        <BeloraPageHeader subdomain={subdomain} homeLabel={t('Home')} crumbs={[{ label }]} />
        <main className="be-wrap w-full py-8 sm:py-10">
          <div className={`mx-auto w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-card ${maxWidth}`}>{children}</div>
        </main>
        <StoreFooter subdomain={subdomain} storeName={storeName} />
      </>
    );
  }
  if (skin === 'elevate') {
    return (
      <>
        <ElevatePageHeader subdomain={subdomain} homeLabel={t('Home')} crumbs={[{ label }]} />
        <main className="el-wrap w-full py-8 sm:py-10">
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
