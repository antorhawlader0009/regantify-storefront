import Link from 'next/link';
import type { ReactNode } from 'react';

type Crumb = { label: string; href?: string };

/** The template's breadcrumb line (templete/tastehouse PageHeader.tsx): "HOME / SHOP" in small uppercase, the last one in black. */
export function TastehouseBreadcrumb({ subdomain, homeLabel, items }: { subdomain: string; homeLabel: ReactNode; items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs uppercase tracking-wider text-neutral-500" data-rg="breadcrumb">
      <ol className="flex flex-wrap items-center gap-2">
        <li>
          <Link href={`/store/${subdomain}`} className="hover:text-[var(--th-brand)]">
            {homeLabel}
          </Link>
        </li>
        {items.map((it) => (
          <li key={it.label} className="flex items-center gap-2">
            <span aria-hidden="true">/</span>
            {it.href ? (
              <Link href={it.href} className="hover:text-[var(--th-brand)]">
                {it.label}
              </Link>
            ) : (
              <span className="font-medium text-ink" aria-current="page">
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
 * The template's page head (templete/tastehouse PageHeader.tsx): a sand band under the header with the breadcrumb, a bold serif
 * title and a small grey line (the count), and room on the right for a control (the sort box, a button).
 */
export function TastehousePageHeader({
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
    <div className="border-b border-[var(--th-brand)]/10 bg-[var(--th-sand)]">
      <div className="th-wrap flex flex-wrap items-end justify-between gap-x-6 gap-y-3 py-8">
        <div>
          <TastehouseBreadcrumb subdomain={subdomain} homeLabel={homeLabel} items={crumbs} />
          {title && <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{title}</h1>}
          {subtitle && (
            <p className="mt-2 text-sm text-neutral-500" aria-live="polite">
              {subtitle}
            </p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
