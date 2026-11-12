'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useQueryState } from 'nuqs';
import type { StorefrontCategoryDetail, StorefrontProduct } from '@/lib/storefrontApi';
import { isOutOfStock } from '@/lib/productDisplay';
import { ProductCard } from '../storepal/components/ProductCard';
import { AskAssistantButton } from '../storepal/components/AskAssistantButton';
import { searchProducts } from '../storepal/lib/searchMatch';
import { bnDigits, useStoreText, useFormatPrice } from '../storepal/lib/storeText';
import { formatPrice as plainPrice } from '../storepal/lib/formatPrice';
import { useStorePalDesign } from '../storepal/lib/designSettings';
import { TechzonePageHeader } from './TechzoneBreadcrumb';
import { CoverFloating } from '@/lib/floatingCover';
import { CloseIcon, SlidersIcon } from './icons';

const PAGE = 15;

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

const selectCls = 'tz-select h-10 min-w-[10rem] pl-3.5 pr-9 text-sm font-semibold';
const inputCls = 'h-[42px] w-full rounded-lg border border-[var(--tz-line)] bg-white px-3 text-[15px] outline-none placeholder:text-slate-400 focus:border-[var(--tz-brand)]';

/**
 * Techzone's product list (resources/views/shop.blade.php) on the store's real products: the breadcrumb, a heavy title with
 * the count and a pill sort box on the right, then the filter column on the left (Category, Brand, Show, Price as checkboxes and
 * boxes; a slide-in panel behind a "Filters" button on a phone) and the product grid, with "Filtered by" chips above it. Category,
 * brand and search are addresses (`?category=`, `?brand=`, `?q=`, the same ones StorePal and the header use); Show, price and
 * sort are this page's own choices. Search uses the store's Bangla / Banglish / typo-tolerant match (lib/searchMatch.ts).
 */
export function TechzoneProductsView({ subdomain, products, storeName, categories, categoryDetails = [], activeCategory, activeBrand, search, picks }: Props) {
  const t = useStoreText();
  const formatPrice = useFormatPrice(plainPrice);
  const router = useRouter();
  const design = useStorePalDesign();
  const num = (n: number) => (design.storeLanguage === 'bn' ? bnDigits(n) : String(n));
  const q = search?.trim() ?? '';
  const base = `/store/${subdomain}`;

  // `?show=best|new|sale|stock` (the header's Sale link and others); kept in the address.
  const [showParam, setShowParam] = useQueryState('show', { defaultValue: '' });
  const show: Show = (['best', 'new', 'sale', 'stock'] as const).includes(showParam as Exclude<Show, ''>) ? (showParam as Show) : '';
  const setShow = (value: Show) => void setShowParam(value || null);
  const [sort, setSort] = useState<Sort>('featured');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [visible, setVisible] = useState(PAGE);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filterKey = `${activeCategory}|${activeBrand}|${q}|${picks?.join(',')}|${show}|${minPrice}|${maxPrice}|${sort}`;
  useEffect(() => setVisible(PAGE), [filterKey]);

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

  // Brands of the products in view (and the one chosen); the chosen category's own sub categories.
  const brands = Array.from(new Set([...(activeBrand ? [activeBrand] : []), ...beforeBrand.map((p) => p.brand?.trim()).filter((b): b is string => !!b)]));
  const subCategories = activeCategory ? (categoryDetails.find((c) => c.name === activeCategory)?.children ?? []).map((c) => c.name) : [];
  const parentOfActive = activeCategory ? categoryDetails.find((c) => c.children?.some((ch) => ch.name === activeCategory))?.name : undefined;
  const activeDetail = activeCategory ? categoryDetails.find((c) => c.name === activeCategory) : undefined;
  const chipCategory = parentOfActive ?? activeCategory;
  const chipSubs = chipCategory ? (categoryDetails.find((c) => c.name === chipCategory)?.children ?? []).map((c) => c.name) : subCategories;

  const chips: { label: string; clear: () => void }[] = [];
  if (activeBrand) chips.push({ label: `${t('Brand')}: ${activeBrand}`, clear: () => go({ brand: null }) });
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
    if (activeBrand || q) go({ brand: null, q: null });
  };

  const title = picks?.length ? t('Shown by our assistant') : activeCategory || activeBrand || (q ? t('Results for "{q}"').replace('{q}', q) : t('All products'));
  const crumbs = picks?.length || activeCategory || activeBrand || q ? [{ label: t('Shop'), href: `${base}/products` }, { label: title }] : [{ label: t('Shop') }];

  const filterCount = (activeCategory ? 1 : 0) + (activeBrand ? 1 : 0) + (show ? 1 : 0) + (min !== null || max !== null ? 1 : 0);
  const filterTitle = 'mb-2.5 text-sm font-bold text-[var(--tz-navy)]';
  const checkCls = 'flex cursor-pointer items-center gap-2.5 py-[5px] text-[14.5px]';
  const filterBox = 'border-b border-[var(--tz-line)] py-4 first:pt-0';

  const filters = (
    <div className="px-4 pb-4 lg:px-0 lg:pb-0 lg:pr-1">
      {categories.length > 0 && (
        <fieldset className={filterBox}>
          <legend className={filterTitle}>{t('Category')}</legend>
          {categories.map((c) => (
            <div key={c}>
              <label className={checkCls}>
                <input type="checkbox" checked={chipCategory === c} onChange={() => go({ category: chipCategory === c ? null : c })} className="h-[18px] w-[18px] shrink-0 accent-[var(--tz-brand)]" />
                <span className="min-w-0 flex-1 truncate">{c}</span>
              </label>
              {chipCategory === c &&
                chipSubs.map((sub) => (
                  <label key={sub} className={`${checkCls} pl-7`}>
                    <input type="checkbox" checked={activeCategory === sub} onChange={() => go({ category: activeCategory === sub ? c : sub })} className="h-[18px] w-[18px] shrink-0 accent-[var(--tz-brand)]" />
                    <span className="min-w-0 flex-1 truncate">{sub}</span>
                  </label>
                ))}
            </div>
          ))}
        </fieldset>
      )}
      {brands.length > 1 && (
        <fieldset className={filterBox}>
          <legend className={filterTitle}>{t('Brand')}</legend>
          {brands.map((b) => (
            <label key={b} className={checkCls}>
              <input type="checkbox" checked={activeBrand === b} onChange={() => go({ brand: activeBrand === b ? null : b })} className="h-[18px] w-[18px] shrink-0 accent-[var(--tz-brand)]" />
              <span className="min-w-0 flex-1 truncate">{b}</span>
            </label>
          ))}
        </fieldset>
      )}
      <fieldset className={filterBox}>
        <legend className={filterTitle}>{t('Show')}</legend>
        {quick
          .filter((o) => o.value !== '')
          .map((o) => (
            <label key={o.value} className={checkCls}>
              <input type="checkbox" checked={show === o.value} onChange={() => setShow(show === o.value ? '' : o.value)} className="h-[18px] w-[18px] shrink-0 accent-[var(--tz-brand)]" />
              <span className="min-w-0 flex-1 truncate">{o.label}</span>
            </label>
          ))}
      </fieldset>
      <div className={filterBox}>
        <p className={filterTitle}>{t('Price')}</p>
        <div className="grid grid-cols-2 gap-2">
          <input inputMode="numeric" value={minPrice} onChange={(e) => setMinPrice(e.target.value.replace(/[^0-9]/g, ''))} placeholder={t('Min')} aria-label={t('Lowest price')} className={inputCls} />
          <input inputMode="numeric" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value.replace(/[^0-9]/g, ''))} placeholder={t('Max')} aria-label={t('Highest price')} className={inputCls} />
        </div>
      </div>
      {filterCount > 0 && (
        <button type="button" onClick={clearAll} className="tz-btn tz-btn-sm mt-4 w-full">
          {t('Clear all')}
        </button>
      )}
    </div>
  );

  return (
    <>
      <TechzonePageHeader subdomain={subdomain} homeLabel={t('Home')} crumbs={crumbs} title={title} subtitle={t('{n} products found').replace('{n}', num(list.length))}>
        <div className="flex flex-wrap items-center gap-2.5">
          <button type="button" onClick={() => setFiltersOpen(true)} className="tz-btn tz-btn-line tz-btn-sm lg:hidden" aria-controls="tzFilters" aria-expanded={filtersOpen}>
            <SlidersIcon className="h-4 w-4" />
            {t('Filters')}
            {filterCount > 0 ? ` (${num(filterCount)})` : ''}
          </button>
          <label className="sr-only" htmlFor="tzSort">
            {t('Sort')}
          </label>
          <select id="tzSort" value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={selectCls}>
            {sorts
              .filter((s) => s.on || s.value === sort)
              .map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
          </select>
        </div>
      </TechzonePageHeader>

      <div className="tz-wrap grid items-start gap-8 pb-4 pt-2 lg:grid-cols-[250px_minmax(0,1fr)]">
        {filtersOpen && (
          <>
            <CoverFloating />
            <div className="fixed inset-0 z-[85] bg-black/45 lg:hidden" onClick={() => setFiltersOpen(false)} aria-hidden />
          </>
        )}
        <aside
          id="tzFilters"
          aria-label={t('Filters')}
          className={`fixed inset-y-0 right-0 z-[90] flex w-[min(88vw,360px)] flex-col overflow-hidden bg-white transition-transform duration-300 lg:sticky lg:top-[140px] lg:z-auto lg:block lg:max-h-[calc(100vh-160px)] lg:w-auto lg:translate-x-0 lg:overflow-y-auto lg:bg-transparent ${filtersOpen ? 'translate-x-0 shadow-[-24px_0_48px_-24px_rgba(0,0,0,0.35)]' : 'translate-x-[102%]'}`}
        >
          <div className="flex items-center justify-between border-b border-[var(--tz-line)] px-4 py-3.5 lg:hidden">
            <strong className="text-[17px]">{t('Filters')}</strong>
            <button type="button" className="tz-icon-btn" onClick={() => setFiltersOpen(false)} aria-label={t('Close')}>
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto pt-4 lg:overflow-visible lg:pt-0">{filters}</div>
        </aside>

        <div className="min-w-0">
          {activeDetail?.coverPhotoUrl && (
            <div className="relative mb-6 aspect-[3/1] w-full overflow-hidden rounded-xl bg-[var(--tz-well)] sm:aspect-[5/1]">
              <Image src={activeDetail.coverPhotoUrl} alt={activeCategory ?? ''} fill sizes="100vw" className="object-cover" priority />
            </div>
          )}

          {chips.length > 0 && (
            <div className="mb-[18px] flex flex-wrap items-center gap-1.5">
              {chips.map((c) => (
                <button
                  key={c.label}
                  type="button"
                  onClick={c.clear}
                  aria-label={`${t('Remove filter')} ${c.label}`}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[var(--tz-well)] px-3 text-[13.5px] font-semibold text-[var(--tz-navy)] transition hover:bg-[var(--tz-line)]"
                >
                  {c.label} <CloseIcon className="h-3 w-3" />
                </button>
              ))}
              <button type="button" onClick={clearAll} className="px-2 text-[13.5px] font-semibold text-slate-500 underline underline-offset-[3px] hover:text-[var(--tz-brand)]">
                {t('Clear all')}
              </button>
            </div>
          )}

          {list.length === 0 ? (
            <div className="mx-auto flex max-w-md flex-col items-center gap-2.5 px-4 py-16 text-center">
              <p className="text-xl font-extrabold tracking-[-0.015em]">{t('No products match these filters')}</p>
              <p className="text-slate-500">{t('Try removing a filter or searching for something else.')}</p>
              {q && (
                <div className="mt-2 flex justify-center">
                  <AskAssistantButton words={q} />
                </div>
              )}
              <Link href={`${base}/products`} className="tz-btn mt-3">
                {t('Show all products')}
              </Link>
            </div>
          ) : (
            <>
              <ul className="grid grid-cols-2 gap-4 min-[640px]:grid-cols-3 min-[1100px]:grid-cols-4">
                {list.slice(0, visible).map((p, i) => (
                  <li key={p.id} className="relative min-w-0">
                    <ProductCard product={p} subdomain={subdomain} storeName={storeName} />
                    {pickRank && (
                      <span className="pointer-events-none absolute left-2 top-2 z-20 grid h-7 min-w-7 place-items-center rounded-md bg-[var(--tz-navy)] px-1.5 text-[13px] font-bold text-white shadow" aria-hidden>
                        {num(i + 1)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              {visible < list.length && (
                <div className="mt-11 flex justify-center">
                  <button type="button" className="tz-btn tz-btn-line" onClick={() => setVisible((v) => v + PAGE)}>
                    {t('Load More ({n} left)').replace('{n}', num(list.length - visible))}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
