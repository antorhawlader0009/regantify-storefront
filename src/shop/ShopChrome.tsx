import Link from 'next/link';
import { SHOP_NAME, type ShopCategory } from '@/lib/shopApi';
import { SearchBox } from './SearchBox';

/** The Shop's header (SHOP-plan.md Step 7): its name, the search box. Its own design; no store theme is used. */
export function ShopHeader({ query }: { query?: string }) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-6">
        <Link href="/shop" className="shrink-0 text-lg font-bold text-emerald-700">
          {SHOP_NAME}
        </Link>
        <SearchBox initial={query} />
        <Link href="/shop/reseller" className="shrink-0 text-sm font-medium text-slate-700 hover:text-emerald-700">
          Products to resell
        </Link>
      </div>
    </header>
  );
}

export function ShopFooter() {
  return (
    <footer className="mt-12 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 text-xs text-slate-500">
        <p>
          {SHOP_NAME} shows products from many independent stores. You buy on each store&apos;s own page: its prices, delivery, payment and
          returns apply.
        </p>
      </div>
    </footer>
  );
}

/** A row of category links (top-level categories with products). */
export function CategoryLinks({ categories, active }: { categories: ShopCategory[]; active?: string }) {
  const shown = categories.filter((c) => c.productCount > 0);
  if (shown.length === 0) return null;
  return (
    <nav aria-label="Categories" className="flex gap-2 overflow-x-auto pb-1">
      {shown.map((c) => (
        <Link
          key={c.slug}
          href={`/shop/c/${c.slug}`}
          className={`shrink-0 rounded-full border px-3 py-1.5 text-sm ${
            c.slug === active ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-600'
          }`}
        >
          {c.nameEn}
        </Link>
      ))}
    </nav>
  );
}

/** What the Shop says when it has nothing to show: paused by Super Admin, not open yet, or the API could not be reached. */
export function ShopNotice({ title, text }: { title: string; text: string }) {
  return (
    <div className="mx-auto my-16 max-w-lg rounded-xl border border-slate-200 bg-white p-8 text-center">
      <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
      <p className="mt-2 text-sm text-slate-600">{text}</p>
    </div>
  );
}

export function noticeFor(paused: boolean) {
  return paused
    ? { title: `${SHOP_NAME} is paused`, text: 'Please come back a little later. The stores themselves are open as usual.' }
    : { title: 'Something went wrong', text: 'We could not load the Shop just now. Please try again in a moment.' };
}
