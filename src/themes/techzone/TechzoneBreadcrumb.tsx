import Link from 'next/link';
import type { ReactNode } from 'react';
import { ChevronRight } from './icons';

type Crumb = { label: string; href?: string };

/** The template's breadcrumb (.s-crumbs): "Home > Shop > Name" in 13.5px grey with tiny chevrons, the last one in black. */
export function TechzoneBreadcrumb({ subdomain, homeLabel, items }: { subdomain: string; homeLabel: ReactNode; items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs text-slate-500" data-rg="breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link href={`/store/${subdomain}`} className="hover:text-[var(--tz-brand)]">
            {homeLabel}
          </Link>
        </li>
        {items.map((it) => (
          <li key={it.label} className="flex items-center gap-1.5">
            <span className="text-slate-400" aria-hidden="true">/</span>
            {it.href ? (
              <Link href={it.href} className="hover:text-[var(--tz-brand)]">
                {it.label}
              </Link>
            ) : (
              <span className="font-semibold text-[var(--tz-navy)]" aria-current="page">
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
 * The page head (.s-crumbs + .s-shop__head): the template's pages start with the grey breadcrumb, then a heavy title (28 to
 * 44px) with a grey line under it (the count) and room on the right for a control (the sort box, a button). No tinted band.
 */
export function TechzonePageHeader({
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
    <div>
      <div className="tz-wrap flex flex-wrap items-end justify-between gap-x-6 gap-y-3 pb-6 pt-8">
        <div className="min-w-0">
          <TechzoneBreadcrumb subdomain={subdomain} homeLabel={homeLabel} items={crumbs} />
          {title && <h1 className="mt-3 text-2xl font-extrabold text-[var(--tz-navy)] sm:text-3xl">{title}</h1>}
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500" aria-live="polite">
              {subtitle}
            </p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
