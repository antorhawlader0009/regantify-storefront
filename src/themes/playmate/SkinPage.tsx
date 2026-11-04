'use client';

import type { ReactNode } from 'react';
import { useStoreSkin } from '../storepal/lib/designSettings';
import { useStoreText } from '../storepal/lib/storeText';
import { PlaymateBreadcrumb } from './PlaymateBreadcrumb';
import { SolevoPageHeader } from '../solevo/SolevoBreadcrumb';

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
