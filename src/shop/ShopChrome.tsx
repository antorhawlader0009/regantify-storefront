import Link from 'next/link';
import { SlidersHorizontal } from 'lucide-react';
import { SHOP_NAME, type ShopCategory } from '@/lib/shopApi';
import { CategoryIcon } from './CategoryIcon';
import { SearchBox } from './SearchBox';
import { ShopAccountLinks, ShopBottomNavLinks } from './ShopAccountLinks';
import { ui } from './ui';

/** Faint line-art swirls in the header block, like the reference picture. Decoration only. */
function Swirls() {
  return (
    <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.12]" viewBox="0 0 400 200" preserveAspectRatio="xMaxYMid slice">
      <g fill="none" stroke="white" strokeWidth="1.5">
        <circle cx="330" cy="60" r="50" />
        <circle cx="330" cy="60" r="80" />
        <path d="M200 190c40-60 120-80 200-40" />
        <path d="M240 200c30-40 90-55 160-25" />
      </g>
    </svg>
  );
}

/**
 * The Shop's header (2026-11-03 redesign): one solid accent block with big rounded bottom corners, the Shop's name, account and cart on the
 * right, then a white rounded search box with a filter button (it opens the full search with sort and price filters).
 */
export function ShopHeader({ query }: { query?: string }) {
  return (
    <header className="relative z-20 overflow-visible rounded-b-[28px] bg-[var(--shop-accent)] text-white shadow-[0_8px_24px_rgba(242,72,75,0.25)]">
      <div className="absolute inset-0 overflow-hidden rounded-b-[28px]">
        <Swirls />
      </div>
      <div className="relative mx-auto max-w-7xl px-4 pb-5 pt-4">
        <div className="flex items-center justify-between gap-4">
          <Link href="/shop" className="text-xl font-extrabold tracking-tight">
            {SHOP_NAME}
          </Link>
          <ShopAccountLinks />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <SearchBox initial={query} />
          <Link
            href={query ? `/shop/search?q=${encodeURIComponent(query)}` : '/shop/search'}
            aria-label="Filters"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-white text-[var(--shop-accent)] shadow-sm transition hover:bg-[var(--shop-soft)]"
          >
            <SlidersHorizontal size={20} aria-hidden />
          </Link>
        </div>
      </div>
    </header>
  );
}

export function ShopFooter() {
  return (
    <footer className="mt-12 bg-white">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 text-sm text-slate-600 sm:grid-cols-3">
        <div>
          <p className="text-base font-extrabold text-[var(--shop-accent)]">{SHOP_NAME}</p>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            Products from many independent Bangladeshi stores. Sign in once and buy from any of them: each store gets its own order and sends its own
            parcel, with its own prices, delivery, payment and returns.
          </p>
        </div>
        <nav aria-label="Shop" className="flex flex-col gap-2">
          <Link href="/shop/search" className="hover:text-[var(--shop-accent)]">
            All products
          </Link>
          <Link href="/shop/search?sort=newest" className="hover:text-[var(--shop-accent)]">
            New arrivals
          </Link>
          <Link href="/shop/cart" className="hover:text-[var(--shop-accent)]">
            Cart
          </Link>
          <Link href="/shop/orders" className="hover:text-[var(--shop-accent)]">
            My orders
          </Link>
        </nav>
        <p className="text-xs text-slate-500 sm:text-right">Prices are in taka and set by each store.</p>
      </div>
    </footer>
  );
}

/** Phones only: the floating white bar of the app (Home, Categories, Cart, Account). */
export function ShopBottomNav() {
  return (
    <nav aria-label="Shop menu" className="fixed inset-x-3 bottom-3 z-30 rounded-3xl bg-white px-2 py-2 shadow-[0_8px_30px_rgba(16,24,40,0.15)] md:hidden">
      <ShopBottomNavLinks />
    </nav>
  );
}

/** "Category": round buttons with the category's icon in the accent on a light accent circle, the name under each. */
export function CategoryLinks({ categories, active, title }: { categories: ShopCategory[]; active?: string; title?: string }) {
  const shown = categories.filter((c) => c.productCount > 0);
  if (shown.length === 0) return null;
  return (
    <section id="categories" className="scroll-mt-4">
      {title ? (
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className={ui.sectionTitle}>{title}</h2>
          <Link href="/shop/search" className={ui.seeAll}>
            See all
          </Link>
        </div>
      ) : null}
      <nav aria-label="Categories" className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {shown.map((c) => {
          const on = c.slug === active;
          return (
            <Link key={c.slug} href={`/shop/c/${c.slug}`} className="group flex w-[72px] shrink-0 flex-col items-center gap-1.5 text-center">
              <span
                className={`flex h-16 w-16 items-center justify-center rounded-full transition ${
                  on ? 'bg-[var(--shop-accent)] text-white' : 'bg-[var(--shop-soft)] text-[var(--shop-accent)] group-hover:bg-[var(--shop-accent)] group-hover:text-white'
                }`}
              >
                <CategoryIcon slug={c.slug} name={c.nameEn} />
              </span>
              <span className={`line-clamp-2 text-xs leading-tight ${on ? 'font-semibold text-[var(--shop-accent)]' : 'text-slate-700'}`}>{c.nameEn}</span>
            </Link>
          );
        })}
      </nav>
    </section>
  );
}

/** What the Shop says when it has nothing to show: paused by Super Admin, not open yet, or the API could not be reached. */
export function ShopNotice({ title, text }: { title: string; text: string }) {
  return (
    <div className={`mx-auto my-16 max-w-lg p-8 text-center ${ui.card}`}>
      <h1 className="text-lg font-bold text-slate-900">{title}</h1>
      <p className="mt-2 text-sm text-slate-600">{text}</p>
    </div>
  );
}

export function noticeFor(paused: boolean) {
  return paused
    ? { title: `${SHOP_NAME} is paused`, text: 'Please come back a little later. The stores themselves are open as usual.' }
    : { title: 'Something went wrong', text: 'We could not load the Shop just now. Please try again in a moment.' };
}
