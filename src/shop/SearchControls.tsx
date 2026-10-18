import Link from 'next/link';
import { shopSearchQuery, type ShopSearchInput } from '@/lib/shopApi';

const SORTS: Array<[string, string]> = [
  ['best', 'Best match'],
  ['newest', 'Newest'],
  ['price_asc', 'Price: low to high'],
  ['price_desc', 'Price: high to low'],
];

/**
 * Sort, price range and "in stock only" as a plain GET form (SHOP-plan.md Step 7): it works without JavaScript and keeps the query and the
 * category. `action` is the page's own path (/shop/search or /shop/c/<slug>).
 */
export function SearchFilters({ action, input, withQuery = false }: { action: string; input: ShopSearchInput; withQuery?: boolean }) {
  return (
    <form action={action} method="get" className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm">
      {withQuery ? (
        <label className="flex min-w-48 flex-1 flex-col gap-1">
          <span className="text-xs text-slate-500">Search</span>
          <input type="search" name="q" defaultValue={input.q} maxLength={200} className="rounded-lg border border-slate-300 px-2 py-1.5" />
        </label>
      ) : input.q ? (
        <input type="hidden" name="q" value={input.q} />
      ) : null}
      <label className="flex flex-col gap-1">
        <span className="text-xs text-slate-500">Sort</span>
        <select name="sort" defaultValue={input.sort ?? 'best'} className="rounded-lg border border-slate-300 px-2 py-1.5">
          {SORTS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-slate-500">Min ৳</span>
        <input type="number" name="minPrice" min={0} defaultValue={input.minPrice} className="w-24 rounded-lg border border-slate-300 px-2 py-1.5" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-slate-500">Max ৳</span>
        <input type="number" name="maxPrice" min={0} defaultValue={input.maxPrice} className="w-24 rounded-lg border border-slate-300 px-2 py-1.5" />
      </label>
      <label className="flex items-center gap-2 pb-1.5">
        <input type="checkbox" name="inStock" value="true" defaultChecked={input.inStock} />
        <span>In stock only</span>
      </label>
      <button type="submit" className="rounded-lg bg-emerald-700 px-4 py-1.5 font-medium text-white hover:bg-emerald-800">
        Apply
      </button>
    </form>
  );
}

/** Previous / next page links that keep every other parameter. */
export function Pagination({ path, input, hasMore }: { path: string; input: ShopSearchInput; hasMore: boolean }) {
  const page = input.page ?? 1;
  if (page <= 1 && !hasMore) return null;
  // A category page has the category in its path already; the search page keeps it as a parameter.
  const link = (p: number) => `${path}${shopSearchQuery({ ...input, category: path.startsWith('/shop/c/') ? undefined : input.category, page: p })}`;
  return (
    <nav aria-label="Pages" className="mt-6 flex items-center justify-center gap-3 text-sm">
      {page > 1 ? (
        <Link href={link(page - 1)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 hover:border-emerald-600">
          Previous
        </Link>
      ) : null}
      <span className="text-slate-500">Page {page}</span>
      {hasMore ? (
        <Link href={link(page + 1)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 hover:border-emerald-600">
          Next
        </Link>
      ) : null}
    </nav>
  );
}
