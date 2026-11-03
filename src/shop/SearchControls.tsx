import Link from 'next/link';
import { shopSearchQuery, type ShopSearchInput } from '@/lib/shopApi';
import { ui } from './ui';

const SORTS: Array<[string, string]> = [
  ['best', 'Popular'],
  ['newest', 'Newest'],
  ['price_asc', 'Lowest price'],
  ['price_desc', 'Highest price'],
];

/**
 * Sort as chips, then price range and "in stock only" as a plain GET form (SHOP-plan.md Step 7; redesigned 2026-11-03). Everything works
 * without JavaScript and keeps the query and the category. `action` is the page's own path (/shop/search or /shop/c/<slug>).
 */
export function SearchFilters({ action, input, withQuery = false }: { action: string; input: ShopSearchInput; withQuery?: boolean }) {
  const sort = input.sort ?? 'best';
  // A category page has the category in its path already; the search page keeps it as a parameter.
  const sortLink = (s: string) => `${action}${shopSearchQuery({ ...input, category: action.startsWith('/shop/c/') ? undefined : input.category, sort: s, page: 1 })}`;
  return (
    <div className="space-y-3">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
        {SORTS.map(([value, label]) => (
          <Link key={value} href={sortLink(value)} className={ui.chip(sort === value)} aria-current={sort === value ? 'true' : undefined}>
            {label}
          </Link>
        ))}
      </div>
      <form action={action} method="get" className={`flex flex-wrap items-end gap-3 p-3 text-sm ${ui.card}`}>
        {withQuery ? (
          <label className="flex min-w-48 flex-1 flex-col gap-1">
            <span className="text-xs text-slate-500">Search</span>
            <input type="search" name="q" defaultValue={input.q} maxLength={200} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-[var(--shop-accent)]" />
          </label>
        ) : input.q ? (
          <input type="hidden" name="q" value={input.q} />
        ) : null}
        <input type="hidden" name="sort" value={sort} />
        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-500">Min ৳</span>
          <input type="number" name="minPrice" min={0} defaultValue={input.minPrice} className="w-24 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-[var(--shop-accent)]" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-500">Max ৳</span>
          <input type="number" name="maxPrice" min={0} defaultValue={input.maxPrice} className="w-24 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-[var(--shop-accent)]" />
        </label>
        <label className="flex items-center gap-2 pb-2">
          <input type="checkbox" name="inStock" value="true" defaultChecked={input.inStock} className="h-4 w-4 accent-[var(--shop-accent)]" />
          <span>In stock only</span>
        </label>
        <button type="submit" className={`${ui.primary} py-2`}>
          Apply
        </button>
      </form>
    </div>
  );
}

/** Previous / next page links that keep every other parameter. */
export function Pagination({ path, input, hasMore }: { path: string; input: ShopSearchInput; hasMore: boolean }) {
  const page = input.page ?? 1;
  if (page <= 1 && !hasMore) return null;
  const link = (p: number) => `${path}${shopSearchQuery({ ...input, category: path.startsWith('/shop/c/') ? undefined : input.category, page: p })}`;
  return (
    <nav aria-label="Pages" className="mt-8 flex items-center justify-center gap-3 text-sm">
      {page > 1 ? (
        <Link href={link(page - 1)} className={ui.quiet}>
          Previous
        </Link>
      ) : null}
      <span className="rounded-full bg-[var(--shop-soft)] px-3 py-1 font-semibold text-[var(--shop-accent)]">Page {page}</span>
      {hasMore ? (
        <Link href={link(page + 1)} className={ui.quiet}>
          Next
        </Link>
      ) : null}
    </nav>
  );
}
