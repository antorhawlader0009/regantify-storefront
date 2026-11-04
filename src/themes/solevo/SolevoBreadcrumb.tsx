import Link from 'next/link';
import type { ReactNode } from 'react';

type Crumb = { label: string; href?: string };

/** The template's breadcrumb line (templete/solevo PageHeader.tsx): "HOME / SHOP" in small uppercase, the last one in black. */
export function SolevoBreadcrumb({ subdomain, homeLabel, items }: { subdomain: string; homeLabel: ReactNode; items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-[11px] uppercase tracking-wider text-ink/60" data-rg="breadcrumb">
      <ol className="flex flex-wrap items-center">
        <li>
          <Link href={`/store/${subdomain}`} className="hover:text-[var(--sv-gold)]">
            {homeLabel}
          </Link>
        </li>
        {items.map((it) => (
          <li key={it.label} className="flex items-center">
            <span aria-hidden="true" className="mx-2">
              /
            </span>
            {it.href ? (
              <Link href={it.href} className="hover:text-[var(--sv-gold)]">
                {it.label}
              </Link>
            ) : (
              <span className="text-ink" aria-current="page">
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
 * The template's page head (templete/solevo PageHeader.tsx): a pale sand band under the header with the breadcrumb, a
 * serif title and a small grey line (the count), and room on the right for a control (the sort box, a button).
 */
export function SolevoPageHeader({
  subdomain,
  homeLabel,
  crumbs = [],
  title,
  subtitle,
  children,
}: {
  subdomain: string;
  homeLabel: string;
  /** Everything after Home, the current page last (the template's "Shop", "Cart"...). */
  crumbs?: Crumb[];
  title?: string;
  subtitle?: string | null;
  children?: ReactNode;
}) {
  return (
    <div className="border-b border-black/5 bg-[var(--sv-sand)]/60">
      <div className="sv-wrap flex flex-wrap items-end justify-between gap-x-6 gap-y-3 py-7 sm:py-9">
        <div>
          <SolevoBreadcrumb subdomain={subdomain} homeLabel={homeLabel} items={crumbs} />
          {title && <h1 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">{title}</h1>}
          {subtitle && (
            <p className="mt-1 text-xs text-ink/60" aria-live="polite">
              {subtitle}
            </p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
