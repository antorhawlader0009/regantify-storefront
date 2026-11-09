import Link from 'next/link';
import type { ReactNode } from 'react';

type Crumb = { label: string; href?: string };

/** The template's breadcrumb line (chronics-store ProductView.tsx): "Home / Category / Name" in small grey text, the last one in ink. */
export function ChronicsBreadcrumb({ subdomain, homeLabel, items }: { subdomain: string; homeLabel: ReactNode; items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-[13px] text-ink/60" data-rg="breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link href={`/store/${subdomain}`} className="hover:text-[var(--cr-brand)]">
            {homeLabel}
          </Link>
        </li>
        {items.map((it) => (
          <li key={it.label} className="flex items-center gap-1.5">
            <span aria-hidden="true">/</span>
            {it.href ? (
              <Link href={it.href} className="hover:text-[var(--cr-brand)]">
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
 * The page head: the template has no tinted band, its pages start with a small grey breadcrumb and a bold title on plain
 * white (chronics-store ProductView.tsx, CartView.tsx), so this is just those two lines, a thin line under them, a small
 * grey line (the count) and room on the right for a control (the sort box, a button).
 */
export function ChronicsPageHeader({
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
    <div className="border-b border-gray-100">
      <div className="cr-wrap flex flex-wrap items-end justify-between gap-x-6 gap-y-3 pb-5 pt-5">
        <div>
          <ChronicsBreadcrumb subdomain={subdomain} homeLabel={homeLabel} items={crumbs} />
          {title && <h1 className="mt-3 text-2xl font-bold sm:text-[28px]">{title}</h1>}
          {subtitle && (
            <p className="mt-1 text-[12px] text-ink/60" aria-live="polite">
              {subtitle}
            </p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
