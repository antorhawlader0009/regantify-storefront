import Link from 'next/link';
import type { ReactNode } from 'react';
import { ChevronRight } from './icons';

type Crumb = { label: string; href?: string };

/** The template's breadcrumb (.s-crumbs): "Home > Shop > Name" in 13.5px grey with tiny chevrons, the last one in black. */
export function MahabeshBreadcrumb({ subdomain, homeLabel, items }: { subdomain: string; homeLabel: ReactNode; items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-[13.5px] text-[#62646b]" data-rg="breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link href={`/store/${subdomain}`} className="hover:text-black">
            {homeLabel}
          </Link>
        </li>
        {items.map((it) => (
          <li key={it.label} className="flex items-center gap-1.5">
            <ChevronRight className="h-[9px] w-[9px] text-[#9a9ca3]" aria-hidden="true" />
            {it.href ? (
              <Link href={it.href} className="hover:text-black">
                {it.label}
              </Link>
            ) : (
              <span className="font-semibold text-black" aria-current="page">
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
export function MahabeshPageHeader({
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
      <div className="mh-wrap flex flex-wrap items-end justify-between gap-x-6 gap-y-3 pb-5 pt-[18px] lg:pb-6">
        <div className="min-w-0">
          <MahabeshBreadcrumb subdomain={subdomain} homeLabel={homeLabel} items={crumbs} />
          {title && <h1 className="mt-4 text-[clamp(28px,4vw,44px)] font-extrabold leading-[1.08] tracking-[-0.025em] text-black">{title}</h1>}
          {subtitle && (
            <p className="mt-1.5 text-[15px] text-[#62646b]" aria-live="polite">
              {subtitle}
            </p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
