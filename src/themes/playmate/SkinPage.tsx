'use client';

import type { ReactNode } from 'react';
import { useStoreSkin } from '../storepal/lib/designSettings';
import { useStoreText } from '../storepal/lib/storeText';
import { PlaymateBreadcrumb } from './PlaymateBreadcrumb';
import { SolevoPageHeader } from '../solevo/SolevoBreadcrumb';
import { ChronicsPageHeader } from '../chronics/ChronicsBreadcrumb';
import { MahabeshPageHeader } from '../mahabesh/MahabeshBreadcrumb';
import { TechzonePageHeader } from '../techzone/TechzoneBreadcrumb';
import { StridePageHeader } from '../stride/StrideBreadcrumb';
import { VaeloraPageHeader } from '../vaelora/VaeloraBreadcrumb';
import { ChicwovePageHeader } from '../chicwove/ChicwoveBreadcrumb';

/**
 * The body of a simple store page (FAQ, contact, locations, CMS pages, magazine, report, gift card...). StorePal keeps its
 * own narrow centred column and title (`className`, `titleClassName`); PlayMate draws the template's page head instead
 * (breadcrumb, big left-aligned title) on its wide `pm-wrap` column. `crumbs` sit between Home and the title.
 */
export function SkinPage({
  subdomain,
  title,
  className,
  titleClassName,
  crumbs = [],
  hideTitle = false,
  children,
}: {
  subdomain: string;
  title: string;
  className: string;
  titleClassName?: string;
  crumbs?: { label: string; href?: string }[];
  /** The page draws its own title (a cover banner, a form heading): PlayMate still shows the breadcrumb. */
  hideTitle?: boolean;
  children: ReactNode;
}) {
  const skin = useStoreSkin();
  const t = useStoreText();
  if (skin === 'stride') {
    return (
      <main className="w-full flex-1">
        <StridePageHeader subdomain={subdomain} homeLabel={t('Home')} crumbs={[...crumbs, { label: t(title) }]} title={hideTitle ? undefined : t(title)} />
        <div className="st-wrap py-8 sm:py-10">
          <div className="st-page">{children}</div>
        </div>
      </main>
    );
  }
  if (skin === 'vaelora') {
    return (
      <main className="w-full flex-1">
        <VaeloraPageHeader subdomain={subdomain} homeLabel={t('Home')} crumbs={[...crumbs, { label: t(title) }]} title={hideTitle ? undefined : t(title)} />
        <div className="va-wrap py-8 sm:py-10">
          <div className="va-page">{children}</div>
        </div>
      </main>
    );
  }
  if (skin === 'techzone') {
    return (
      <main className="w-full flex-1">
        <TechzonePageHeader subdomain={subdomain} homeLabel={t('Home')} crumbs={[...crumbs, { label: t(title) }]} title={hideTitle ? undefined : t(title)} />
        <div className="tz-wrap py-8 sm:py-10">
          <div className="tz-page">{children}</div>
        </div>
      </main>
    );
  }
  if (skin === 'mahabesh') {
    return (
      <main className="w-full flex-1">
        <MahabeshPageHeader subdomain={subdomain} homeLabel={t('Home')} crumbs={[...crumbs, { label: t(title) }]} title={hideTitle ? undefined : t(title)} />
        <div className="mh-wrap py-8 sm:py-10">
          <div className="mh-page">{children}</div>
        </div>
      </main>
    );
  }
  if (skin === 'chronics') {
    return (
      <main className="w-full flex-1">
        <ChronicsPageHeader subdomain={subdomain} homeLabel={t('Home')} crumbs={[...crumbs, { label: t(title) }]} title={hideTitle ? undefined : t(title)} />
        <div className="cr-wrap py-8 sm:py-10">
          <div className="cr-page">{children}</div>
        </div>
      </main>
    );
  }
  if (skin === 'chicwove') {
    return (
      <main className="w-full flex-1">
        <ChicwovePageHeader subdomain={subdomain} homeLabel={t('Home')} crumbs={[...crumbs, { label: t(title) }]} title={hideTitle ? undefined : t(title)} />
        <div className="cw-wrap py-8 sm:py-10">
          <div className="cw-page">{children}</div>
        </div>
      </main>
    );
  }
  if (skin === 'solevo') {
    return (
      <main className="w-full flex-1">
        <SolevoPageHeader subdomain={subdomain} homeLabel={t('Home')} crumbs={[...crumbs, { label: t(title) }]} title={hideTitle ? undefined : t(title)} />
        <div className="sv-wrap py-8 sm:py-10">
          <div className="sv-page">{children}</div>
        </div>
      </main>
    );
  }
  if (skin === 'playmate') {
    return (
      <main className="pm-wrap w-full flex-1 py-6 sm:py-8">
        <PlaymateBreadcrumb subdomain={subdomain} homeLabel={t('Home')} items={[...crumbs, { label: t(title) }]} />
        {!hideTitle && <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">{t(title)}</h1>}
        <div className="pm-page mt-6">{children}</div>
      </main>
    );
  }
  return (
    <main className={className}>
      {!hideTitle && titleClassName && <h1 className={titleClassName}>{title}</h1>}
      {children}
    </main>
  );
}
