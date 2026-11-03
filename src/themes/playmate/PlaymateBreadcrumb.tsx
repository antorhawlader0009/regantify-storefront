import Link from 'next/link';

/** The template's breadcrumb (templete/playmate Breadcrumb.tsx): Home / ... / current page. */
export function PlaymateBreadcrumb({ subdomain, homeLabel, items }: { subdomain: string; homeLabel: string; items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-[12px] text-muted" data-rg="breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link href={`/store/${subdomain}`} className="rounded hover:text-accent">
            {homeLabel}
          </Link>
        </li>
        {items.map((it) => (
          <li key={it.label} className="flex items-center gap-1.5">
            <span aria-hidden="true">/</span>
            {it.href ? (
              <Link href={it.href} className="rounded hover:text-accent">
                {it.label}
              </Link>
            ) : (
              <span className="font-semibold text-ink" aria-current="page">
                {it.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
