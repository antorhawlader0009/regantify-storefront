'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useQueryState } from 'nuqs';
import type { StorefrontCategoryDetail, StorefrontProduct } from '@/lib/storefrontApi';
import { isOutOfStock } from '@/lib/productDisplay';
import { CoverFloating } from '@/lib/floatingCover';
import { ProductCard } from '../storepal/components/ProductCard';
import { AskAssistantButton } from '../storepal/components/AskAssistantButton';
import { searchProducts } from '../storepal/lib/searchMatch';
import { bnDigits, useStoreText, useFormatPrice } from '../storepal/lib/storeText';
import { formatPrice as plainPrice } from '../storepal/lib/formatPrice';
import { useStorePalDesign } from '../storepal/lib/designSettings';
import { PlaymateBreadcrumb } from './PlaymateBreadcrumb';
import { CloseIcon } from './icons';

const PAGE = 12;

type Sort = 'featured' | 'price-asc' | 'price-desc' | 'best' | 'rating' | 'discount' | 'name';
type Show = '' | 'best' | 'new' | 'sale' | 'stock';

const payPrice = (p: StorefrontProduct) => Number(p.discountPrice ?? p.price);
const savePct = (p: StorefrontProduct) => {
  const price = Number(p.price);
  return p.discountPrice && price > 0 ? (price - Number(p.discountPrice)) / price : 0;
};
const NEW_DAYS = 30;

interface Props {
  subdomain: string;
  storeName: string;
  products: StorefrontProduct[];
  categories: string[];
  categoryDetails?: StorefrontCategoryDetail[];
  activeCategory?: string;
  activeBrand?: string;
  search?: string;
  /** The voice call's picks, in the assistant's order (numbered so the shopper can say "number 2"). */
  picks?: string[];
}

/**
 * PlayMate's product list, the template's ProductsView (templete/playmate ProductsView.tsx) on the store's real products:
 * breadcrumb, title and count, Show / Category / Brand / Price filters (a side column on a computer, a bottom sheet on a
 * phone), sort, filter chips, Load More. Category, brand and search are addresses (`?category=`, `?brand=`, `?q=`, the same
 * ones StorePal and the header use, so links and search engines keep working); Show, price and sort are this page's
 * own choices. Search uses the store's Bangla / Banglish / typo-tolerant match (lib/searchMatch.ts).
 */
export function PlaymateProductsView({ subdomain, storeName, products, categories, categoryDetails = [], activeCategory, activeBrand, search, picks }: Props) {
  const t = useStoreText();
  const formatPrice = useFormatPrice(plainPrice);
  const router = useRouter();
  const design = useStorePalDesign();
  const num = (n: number) => (design.storeLanguage === 'bn' ? bnDigits(n) : String(n));
  const q = search?.trim() ?? '';
  const base = `/store/${subdomain}`;

  // `?show=best|new|sale|stock` (the header's Best Sellers / New Arrivals / Sale links); kept in the address.
  const [showParam, setShowParam] = useQueryState('show', { defaultValue: '' });
  const show: Show = (['best', 'new', 'sale', 'stock'] as const).includes(showParam as Exclude<Show, ''>) ? (showParam as Show) : '';
  const setShow = (value: Show) => void setShowParam(value || null);
  const [sort, setSort] = useState<Sort>('featured');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [visible, setVisible] = useState(PAGE);
  const [panel, setPanel] = useState(false);
  const [allBrands, setAllBrands] = useState(false);

  const filterKey = `${activeCategory}|${activeBrand}|${q}|${picks?.join(',')}|${show}|${minPrice}|${maxPrice}|${sort}`;
  useEffect(() => setVisible(PAGE), [filterKey]);
  useEffect(() => {
    if (!panel) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPanel(false);
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [panel]);

  // Address-based filters: category, brand and search are links, so the page can be shared and reloaded.
  const go = (changes: { category?: string | null; brand?: string | null; q?: string | null }) => {
    const next = new URLSearchParams();
    const category = changes.category !== undefined ? changes.category : activeCategory;
    const brand = changes.brand !== undefined ? changes.brand : activeBrand;
    const words = changes.q !== undefined ? changes.q : q;
    if (category) next.set('category', category);
    if (brand) next.set('brand', brand);
    if (words) next.set('q', words);
    const qs = next.toString();
    router.push(qs ? `${base}?${qs}` : `${base}/products`, { scroll: false });
  };

  // A main category also holds its sub categories' products (the same rule as StorePal's list).
  const categoryNames = useMemo(
    () => (activeCategory ? new Set([activeCategory, ...(categoryDetails.find((c) => c.name === activeCategory)?.children ?? []).map((c) => c.name)]) : null),
    [activeCategory, categoryDetails],
  );
  const searchHits = useMemo(() => (q ? searchProducts(products, q) : null), [products, q]);
  const searchRank = useMemo(() => new Map((searchHits ?? []).map((p, i) => [p, i] as const)), [searchHits]);
  const pickRank = useMemo(() => (picks?.length ? new Map(picks.map((s, i) => [s, i] as const)) : null), [picks]);

  // Products for the address filters; the Brand list is made before the brand filter, so other brands stay offered.
  const beforeBrand = useMemo(
    () =>
      products.filter(
        (p) =>
          (!categoryNames || (p.category ? categoryNames.has(p.category) : false) || p.secondaryCategories.some((c) => categoryNames.has(c))) &&
          (!searchHits || searchRank.has(p)) &&
          (!pickRank || pickRank.has(p.slug)),
      ),
    [products, categoryNames, searchHits, searchRank, pickRank],
  );
  const scoped = useMemo(() => (activeBrand ? beforeBrand.filter((p) => p.brand === activeBrand) : beforeBrand), [beforeBrand, activeBrand]);

  const now = Date.now();
  const isNew = (p: StorefrontProduct) => !!p.createdAt && now - new Date(p.createdAt).getTime() < NEW_DAYS * 86_400_000;
  const anyBest = scoped.some((p) => (p.soldRecent ?? 0) > 0);
  const anyNew = scoped.some(isNew);
  const anySale = scoped.some((p) => savePct(p) > 0);
  const quick: { value: Show; label: string }[] = [
    { value: '', label: t('All') },
    ...(anyBest || show === 'best' ? [{ value: 'best' as Show, label: t('Best Sellers') }] : []),
    ...(anyNew || show === 'new' ? [{ value: 'new' as Show, label: t('New Arrivals') }] : []),
    ...(anySale || show === 'sale' ? [{ value: 'sale' as Show, label: t('Sale') }] : []),
    { value: 'stock', label: t('In stock') },
  ];

  const min = minPrice === '' ? null : Number(minPrice);
  const max = maxPrice === '' ? null : Number(maxPrice);
  const list = useMemo(() => {
    const out = scoped.filter((p) => {
      if (show === 'best' && !((p.soldRecent ?? 0) > 0)) return false;
      if (show === 'new' && !isNew(p)) return false;
      if (show === 'sale' && savePct(p) <= 0) return false;
      if (show === 'stock' && isOutOfStock(p)) return false;
      const price = payPrice(p);
      if (min !== null && price < min) return false;
      if (max !== null && price > max) return false;
      return true;
    });
    return out.sort((a, b) =>
      sort === 'price-asc'
        ? payPrice(a) - payPrice(b)
        : sort === 'price-desc'
          ? payPrice(b) - payPrice(a)
          : sort === 'best'
            ? (b.soldRecent ?? 0) - (a.soldRecent ?? 0)
            : sort === 'rating'
              ? (b.rating?.average ?? 0) - (a.rating?.average ?? 0) || (b.rating?.count ?? 0) - (a.rating?.count ?? 0)
              : sort === 'discount'
                ? savePct(b) - savePct(a)
                : sort === 'name'
                  ? a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true })
                  : pickRank
                    ? (pickRank.get(a.slug) ?? 0) - (pickRank.get(b.slug) ?? 0)
                    : searchHits
                      ? (searchRank.get(a) ?? 0) - (searchRank.get(b) ?? 0)
                      : 0,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scoped, show, min, max, sort, pickRank, searchHits, searchRank]);

  const sorts: { value: Sort; label: string; on: boolean }[] = [
    { value: 'featured', label: t('Featured'), on: true },
    { value: 'best', label: t('Best selling'), on: anyBest },
    { value: 'rating', label: t('Top rated'), on: scoped.some((p) => (p.rating?.count ?? 0) > 0) },
    { value: 'price-asc', label: t('Price: low to high'), on: true },
    { value: 'price-desc', label: t('Price: high to low'), on: true },
    { value: 'discount', label: t('Biggest discount'), on: anySale },
    { value: 'name', label: t('Name: A to Z'), on: true },
  ];

  // Brands of the products in view (and the one chosen), the store's top-level categories (and the chosen one's sub ones).
  const brands = Array.from(
    new Set([...(activeBrand ? [activeBrand] : []), ...beforeBrand.map((p) => p.brand?.trim()).filter((b): b is string => !!b)]),
  );
  const subCategories = activeCategory ? (categoryDetails.find((c) => c.name === activeCategory)?.children ?? []).map((c) => c.name) : [];
  const activeDetail = activeCategory ? categoryDetails.find((c) => c.name === activeCategory) : undefined;

  const chips: { label: string; clear: () => void }[] = [];
  if (activeCategory) chips.push({ label: activeCategory, clear: () => go({ category: null }) });
  if (activeBrand) chips.push({ label: activeBrand, clear: () => go({ brand: null }) });
  if (q) chips.push({ label: `“${q}”`, clear: () => go({ q: null }) });
  if (show) chips.push({ label: quick.find((x) => x.value === show)?.label ?? show, clear: () => setShow('') });
  if (min !== null || max !== null)
    chips.push({
      label: `${min !== null ? formatPrice(min) : ''} - ${max !== null ? formatPrice(max) : ''}`.trim(),
      clear: () => {
        setMinPrice('');
        setMaxPrice('');
      },
    });
  const clearAll = () => {
    setShow('');
    setMinPrice('');
    setMaxPrice('');
    if (activeCategory || activeBrand || q) router.push(`${base}/products`, { scroll: false });
  };

  const title = picks?.length
    ? t('Shown by our assistant')
    : activeCategory || activeBrand || (q ? t('Results for "{q}"').replace('{q}', q) : t('All products'));
  const crumbs = picks?.length || activeCategory || activeBrand || q ? [{ label: t('All products'), href: `${base}/products` }, { label: title }] : [{ label: title }];

  const radio = 'flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-[13px] transition';
  const on = 'bg-accent font-semibold text-white';
  const off = 'text-ink/80 hover:bg-accent-light';
  const pill = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-[12px] font-medium transition ${active ? 'border-accent bg-accent text-white' : 'border-line-strong hover:border-accent hover:text-accent'}`;

  const filters = (
    <div className="space-y-7">
      <div>
        <h3 className="mb-2 text-[12px] font-bold uppercase tracking-wide">{t('Show')}</h3>
        <div className="space-y-0.5">
          {quick.map((o) => (
            <button key={o.value || 'all'} type="button" className={`${radio} ${show === o.value ? on : off}`} onClick={() => setShow(o.value)}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {categories.length > 0 && (
        <div>
          <h3 className="mb-2 text-[12px] font-bold uppercase tracking-wide">{t('Category')}</h3>
          <div className="space-y-0.5">
            <button type="button" className={`${radio} ${!activeCategory ? on : off}`} onClick={() => go({ category: null })}>
              {t('All categories')}
            </button>
            {categories.map((c) => (
              <div key={c}>
                <button type="button" className={`${radio} ${activeCategory === c ? on : off}`} onClick={() => go({ category: c })}>
                  {c}
                </button>
                {/* The chosen category's own sub categories, one step in. */}
                {(activeCategory === c ? subCategories : []).map((s) => (
                  <button key={s} type="button" className={`${radio} pl-6 ${off}`} onClick={() => go({ category: s })}>
                    {s}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {brands.length > 0 && (
        <div>
          <h3 className="mb-2 text-[12px] font-bold uppercase tracking-wide">{t('Brand')}</h3>
          <div className="flex flex-wrap gap-2">
            {(allBrands ? brands : brands.slice(0, 12)).map((b) => (
              <button key={b} type="button" aria-pressed={activeBrand === b} onClick={() => go({ brand: activeBrand === b ? null : b })} className={pill(activeBrand === b)}>
                {b}
              </button>
            ))}
          </div>
          {brands.length > 12 && (
            <button type="button" onClick={() => setAllBrands((v) => !v)} className="mt-2 text-[12px] font-semibold text-accent hover:underline">
              {allBrands ? t('Show less') : t('Show all ({n})').replace('{n}', num(brands.length))}
            </button>
          )}
        </div>
      )}

      <div>
        <h3 className="mb-2 text-[12px] font-bold uppercase tracking-wide">{t('Price')}</h3>
        <div className="flex items-center gap-2">
          <input
            inputMode="numeric"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder={t('Min')}
            aria-label={t('Lowest price')}
            className="w-full min-w-0 rounded-md border border-line-strong px-3 py-2 text-[13px] outline-none focus:border-accent"
          />
          <span className="text-muted">-</span>
          <input
            inputMode="numeric"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder={t('Max')}
            aria-label={t('Highest price')}
            className="w-full min-w-0 rounded-md border border-line-strong px-3 py-2 text-[13px] outline-none focus:border-accent"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="pm-wrap py-6 sm:py-8">
      <PlaymateBreadcrumb subdomain={subdomain} homeLabel={t('Home')} items={crumbs} />

      {activeDetail?.coverPhotoUrl && (
        <div className="relative mt-4 aspect-[3/1] w-full sm:aspect-[5/1] overflow-hidden rounded-xl bg-[var(--pm-card)]">
          <Image src={activeDetail.coverPhotoUrl} alt={activeCategory ?? ''} fill sizes="100vw" className="object-cover" priority />
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-muted" aria-live="polite">
            {t('{n} products found').replace('{n}', num(list.length))}
          </p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <button
            type="button"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-md border border-line-strong px-4 py-2.5 text-[12px] font-semibold uppercase tracking-wide lg:hidden"
            onClick={() => setPanel(true)}
          >
            {t('Filters')}
            {chips.length > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[10px] text-white">{num(chips.length)}</span>}
          </button>
          <label className="flex flex-1 items-center gap-2 text-[12px] font-semibold uppercase tracking-wide sm:flex-none">
            <span className="sr-only sm:not-sr-only">{t('Sort')}</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="w-full rounded-md border border-line-strong bg-white px-3 py-2.5 text-[13px] font-medium normal-case tracking-normal sm:w-auto"
            >
              {sorts
                .filter((s) => s.on || s.value === sort)
                .map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
            </select>
          </label>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {chips.map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={c.clear}
              className="inline-flex items-center gap-1.5 rounded-full bg-accent-light px-3 py-1.5 text-[12px] font-semibold text-accent"
              aria-label={`${t('Remove filter')} ${c.label}`}
            >
              {c.label}
              <CloseIcon className="h-3.5 w-3.5" />
            </button>
          ))}
          <button type="button" onClick={clearAll} className="ml-1 text-[12px] font-semibold text-muted underline hover:text-accent">
            {t('Clear all')}
          </button>
        </div>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-[230px_1fr] xl:grid-cols-[250px_1fr]">
        <aside className="hidden lg:block" aria-label={t('Filters')}>
          <div className="sticky top-24">{filters}</div>
        </aside>

        <div>
          {list.length === 0 ? (
            <div className="rounded-xl bg-[var(--pm-card)] px-6 py-16 text-center">
              <p className="text-lg font-bold">{t('No products match these filters')}</p>
              <p className="mt-1 text-sm text-muted">{t('Try removing a filter or searching for something else.')}</p>
              {q && (
                <div className="mt-5 flex justify-center">
                  <AskAssistantButton words={q} />
                </div>
              )}
              <Link href={`${base}/products`} className="pm-btn-primary mt-6">
                {t('Show all products')}
              </Link>
            </div>
          ) : (
            <>
              <ul className="grid grid-cols-2 gap-3 min-[560px]:grid-cols-3 sm:gap-4 xl:grid-cols-4">
                {list.slice(0, visible).map((p, i) => (
                  <li key={p.id} className="relative">
                    <ProductCard product={p} subdomain={subdomain} storeName={storeName} />
                    {pickRank && (
                      <span className="pointer-events-none absolute left-2 top-2 z-10 grid h-7 min-w-7 place-items-center rounded-full bg-ink px-1.5 text-[13px] font-bold text-white shadow" aria-hidden>
                        {num(i + 1)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              {visible < list.length && (
                <div className="mt-8 text-center">
                  <button type="button" className="pm-btn-outline" onClick={() => setVisible((v) => v + PAGE)}>
                    {t('Load More ({n} left)').replace('{n}', num(list.length - visible))}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {panel && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-label={t('Filters')}>
          <CoverFloating />
          <div className="absolute inset-0 bg-black/40" onClick={() => setPanel(false)} />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col rounded-t-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="text-base font-bold">{t('Filters')}</h2>
              <button type="button" className="rounded p-1" aria-label={t('Close filters')} onClick={() => setPanel(false)}>
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5">{filters}</div>
            <div className="grid grid-cols-2 gap-3 border-t border-line px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
              <button
                type="button"
                className="pm-btn-outline"
                onClick={() => {
                  setPanel(false);
                  clearAll();
                }}
              >
                {t('Clear all')}
              </button>
              <button type="button" className="pm-btn-primary" onClick={() => setPanel(false)}>
                {t('Show {n}').replace('{n}', num(list.length))}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
