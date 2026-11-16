import Link from 'next/link';
import type { ReactNode } from 'react';
import { ChevronRight } from './icons';

type Crumb = { label: string; href?: string };

/** The template's breadcrumb (.s-crumbs): "Home > Shop > Name" in 13.5px grey with tiny chevrons, the last one in black. */
export function GloweriveBreadcrumb({ subdomain, homeLabel, items, dark = false }: { subdomain: string; homeLabel: ReactNode; items: Crumb[]; dark?: boolean }) {
  return (
    <nav aria-label="Breadcrumb" className={`text-[11px] ${dark ? 'text-white/60' : 'text-neutral-500'}`} data-rg="breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link href={`/store/${subdomain}`} className={dark ? 'hover:text-white' : 'hover:text-[var(--gw-brand)]'}>
            {homeLabel}
          </Link>
        </li>
        {items.map((it) => (
          <li key={it.label} className="flex items-center gap-1.5">
            <span className={dark ? 'text-white/40' : 'text-neutral-400'} aria-hidden="true">/</span>
            {it.href ? (
              <Link href={it.href} className={dark ? 'hover:text-white' : 'hover:text-[var(--gw-brand)]'}>
                {it.label}
              </Link>
            ) : (
              <span className={dark ? 'text-white/90' : 'font-semibold text-[var(--gw-navy)]'} aria-current="page">
                {it.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/**
 * The page head (components/PageHeader.tsx): a band running from ink to deep red, the white breadcrumb, a bold  capital
 * title, a grey line under it (the count) and room on the right for a control (the sort box, a button).
 */
export function GlowerivePageHeader({
  subdomain,
  homeLabel,
  crumbs = [],
  title,
  subtitle,
  children,
}: {
  subdomain: string;
  homeLabel: string;
  /** Everything after Home, the current page last. */
  crumbs?: Crumb[];
  title?: string;
  subtitle?: string | null;
  children?: ReactNode;
}) {
  return (
    <div className="gw-band">
      <div className="gw-wrap flex flex-wrap items-end justify-between gap-x-6 gap-y-3 py-8 sm:py-10">
        <div className="min-w-0">
          <GloweriveBreadcrumb subdomain={subdomain} homeLabel={homeLabel} items={crumbs} dark />
          {title && <h1 className="mt-2 text-3xl font-medium sm:text-4xl">{title}</h1>}
          {subtitle && (
            <p className="mt-1 text-sm text-white/70" aria-live="polite">
              {subtitle}
            </p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
