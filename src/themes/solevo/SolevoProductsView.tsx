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
import { SolevoPageHeader } from './SolevoBreadcrumb';
import { CloseIcon } from './icons';

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

const chipCls = (on: boolean) =>
  `shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition ${on ? 'border-ink bg-ink text-white' : 'border-black/15 hover:border-ink'}`;
const selectCls = 'border border-black/15 bg-white px-3 py-2 text-[11px] font-medium normal-case tracking-normal outline-none focus:border-ink';

/**
 * Solevo's product list, the template's ProductsBrowser (templete/solevo ProductsBrowser.tsx) on the store's real products:
 * the sand page head with the title and count and the Sort box on the right, a row of category chips, "Filtered by"
 * chips with Clear all, the five-column grid. Brand, Show (best sellers, new, sale, in stock) and Price sit in a quiet row
 * under the chips. Category, brand and search are addresses (`?category=`, `?brand=`, `?q=`, the same ones StorePal and the
 * header use); Show, price and sort are this page's own choices. Search uses the store's Bangla / Banglish /
 * typo-tolerant match (lib/searchMatch.ts).
 */
export function SolevoProductsView({ subdomain, products, storeName, categories, categoryDetails = [], activeCategory, activeBrand, search, picks }: Props) {
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

  return (
    <>
      <SolevoPageHeader subdomain={subdomain} homeLabel={t('Home')} crumbs={crumbs} title={title} subtitle={t('{n} products found').replace('{n}', num(list.length))}>
        <label className="flex shrink-0 items-center gap-2 text-[11px] font-semibold uppercase tracking-wider">
          {t('Sort')}
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={`min-w-[10.5rem] ${selectCls}`}>
            {sorts
              .filter((s) => s.on || s.value === sort)
              .map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
          </select>
        </label>
      </SolevoPageHeader>

      <div className="sv-wrap py-8 sm:py-10">
        {activeDetail?.coverPhotoUrl && (
          <div className="relative mb-6 aspect-[3/1] w-full overflow-hidden rounded-lg bg-[var(--sv-card)] sm:aspect-[5/1]">
            <Image src={activeDetail.coverPhotoUrl} alt={activeCategory ?? ''} fill sizes="100vw" className="object-cover" priority />
          </div>
        )}

        {(categories.length > 0 || picks?.length) && (
          <div className="sv-no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4 sm:-mx-6 sm:px-6 md:mx-0 md:flex-wrap md:overflow-visible md:px-0" role="group" aria-label={t('Category')}>
            <button type="button" aria-current={!activeCategory ? 'true' : undefined} className={chipCls(!activeCategory)} onClick={() => go({ category: null })}>
              {t('All')}
            </button>
            {categories.map((c) => (
              <button key={c} type="button" aria-current={chipCategory === c ? 'true' : undefined} className={chipCls(chipCategory === c)} onClick={() => go({ category: c })}>
                {c}
              </button>
            ))}
          </div>
        )}
        {chipSubs.length > 0 && (
          <div className="sv-no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4 sm:-mx-6 sm:px-6 md:mx-0 md:flex-wrap md:overflow-visible md:px-0" role="group" aria-label={t('Category')}>
            {chipSubs.map((c) => (
              <button key={c} type="button" aria-current={activeCategory === c ? 'true' : undefined} className={chipCls(activeCategory === c)} onClick={() => go({ category: activeCategory === c ? chipCategory ?? null : c })}>
                {c}
              </button>
            ))}
          </div>
        )}

        <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-semibold uppercase tracking-wider">
          <label className="flex items-center gap-2">
            {t('Show')}
            <select value={show} onChange={(e) => setShow(e.target.value as Show)} className={selectCls}>
              {quick.map((o) => (
                <option key={o.value || 'all'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          {brands.length > 0 && (
            <label className="flex items-center gap-2">
              {t('Brand')}
              <select value={activeBrand ?? ''} onChange={(e) => go({ brand: e.target.value || null })} className={selectCls}>
                <option value="">{t('All')}</option>
                {brands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </label>
          )}
          <span className="flex items-center gap-2">
            {t('Price')}
            <input
              inputMode="numeric"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder={t('Min')}
              aria-label={t('Lowest price')}
              className={`w-20 ${selectCls}`}
            />
            <span className="text-ink/40">-</span>
            <input
              inputMode="numeric"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder={t('Max')}
              aria-label={t('Highest price')}
              className={`w-20 ${selectCls}`}
            />
          </span>
        </div>

        {chips.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="text-ink/60">{t('Filtered by')}:</span>
            {chips.map((c) => (
              <button
                key={c.label}
                type="button"
                onClick={c.clear}
                aria-label={`${t('Remove filter')} ${c.label}`}
                className="flex items-center gap-1.5 rounded-full bg-[var(--sv-sand)] px-3 py-1 font-semibold hover:bg-[var(--sv-tan)]"
              >
                {c.label} <CloseIcon className="h-3 w-3" />
              </button>
            ))}
            <button type="button" onClick={clearAll} className="font-semibold uppercase tracking-wider underline-offset-2 hover:text-[var(--sv-gold)] hover:underline">
              {t('Clear all')}
            </button>
          </div>
        )}

        {list.length === 0 ? (
          <div className="mx-auto max-w-md py-16 text-center">
            <p className="font-display text-xl font-semibold">{t('No products match these filters')}</p>
            <p className="mt-2 text-sm text-ink/60">{t('Try removing a filter or searching for something else.')}</p>
            {q && (
              <div className="mt-5 flex justify-center">
                <AskAssistantButton words={q} />
              </div>
            )}
            <Link href={`${base}/products`} className="sv-btn-dark mt-6">
              {t('Show all products')}
            </Link>
          </div>
        ) : (
          <>
            <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
              {list.slice(0, visible).map((p, i) => (
                <li key={p.id} className="relative min-w-0">
                  <ProductCard product={p} subdomain={subdomain} storeName={storeName} />
                  {pickRank && (
                    <span className="pointer-events-none absolute left-2 top-2 z-20 grid h-7 min-w-7 place-items-center rounded-full bg-ink px-1.5 text-[13px] font-bold text-white shadow" aria-hidden>
                      {num(i + 1)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
            {visible < list.length && (
              <div className="mt-8 flex justify-center">
                <button type="button" className="sv-btn-outline" onClick={() => setVisible((v) => v + PAGE)}>
                  {t('Load More ({n} left)').replace('{n}', num(list.length - visible))}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
