'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { StorefrontProduct, StorefrontReview, StorefrontCampaignSummary, StorefrontCategoryDetail } from '@/lib/storefrontApi';
import type { SocialLinks } from '@/lib/socialLinksApi';
import { StoreHeader } from '../components/StoreHeader';
import { StoreFooter } from '../components/StoreFooter';
import { ProductCard } from '../components/ProductCard';
import { HeroBanner } from '../components/HeroBanner';
import { ProductFilters, type ProductFilterState } from '../components/ProductFilters';
import { TRUST_BADGES } from '@/lib/placeholderContent';
import { Stars } from '../../medium/components/Stars';
import { Truck, ShieldCheck, HandCoins, SlidersHorizontal, X } from 'lucide-react';

function groupByCategory(products: StorefrontProduct[]) {
  const groups = new Map<string, StorefrontProduct[]>();
  for (const p of products) {
    if (!p.category) continue;
    if (!groups.has(p.category)) groups.set(p.category, []);
    groups.get(p.category)!.push(p);
  }
  return Array.from(groups.entries()).map(([name, items]) => ({ name, items }));
}

interface HomeViewProps {
  subdomain: string;
  storeName: string;
  products: StorefrontProduct[];
  categories: string[];
  /** Store > Categories' own photos, when the category is PUBLIC — powers the shortcut row below and the cover banner on a filtered category view. */
  categoryDetails?: StorefrontCategoryDetail[];
  reviews: StorefrontReview[];
  activeCategory?: string;
  search?: string;
  socialLinks?: SocialLinks;
  /** Accepted for callers that still fetch it (e.g. for Marketing > Campaigns pages elsewhere) — the homepage hero itself now uses categoryDetails instead, see HeroBanner. */
  campaigns?: StorefrontCampaignSummary[];
  logoUrl?: string | null;
}

const TRUST_ICONS = [Truck, ShieldCheck, HandCoins];

// Below "Top Selling", the reference site shows a row of small
// image-backed shortcuts into a handful of its own top-level
// categories (see storepal.com.bd: "men shoes", "watch", "belts",
// "wallets", each with its own square photo) — a fast way back into
// the header's own nav without scrolling up. Built from whatever
// categories this vendor actually has (up to 4). Prefers that
// category's own Store > Categories square/cover photo (categoryDetails,
// PUBLIC categories only — see StorefrontService.getStoreProducts) and
// falls back to that category's first product's photo when the category
// has no photo set (or isn't a real Category row at all — Category is a
// plain-text field on Product, see CategoryCombobox's doc comment, so a
// typed-in name with no matching row is possible).
const MAX_SHORTCUTS = 4;

// Matches the reference site's second info block — plain three-column
// text (no icons), sitting between the category sections and "Why we
// are best?" (see storepal.com.bd: "HASSLE FREE SHIPPING", "100%
// GENUINE PRODUCTS", "PLACE YOUR INQUIRY"). Generic assurance copy,
// same "decorative until a real feature exists" status as TRUST_BADGES
// below it — there's no shipping-policy or inquiry-routing feature
// backing these lines yet.
const SERVICE_BLOCKS = [
  {
    title: 'HASSLE FREE SHIPPING',
    text: 'Get hassle free quickest shipping near your doorstep. We deliver nationwide with cash on delivery — no pre-payment required.',
  },
  {
    title: '100% GENUINE PRODUCTS',
    text: 'Every item is quality-checked before it ships, so what you see is exactly what arrives.',
  },
  {
    title: 'PLACE YOUR INQUIRY',
    text: "Get hassle free customer support. Track your order anytime — don't hesitate to reach out.",
  },
];

export function HomeView({
  subdomain,
  storeName,
  products,
  categories,
  categoryDetails = [],
  reviews,
  activeCategory,
  search,
  socialLinks,
  campaigns = [],
  logoUrl,
}: HomeViewProps) {
  // Price bounds derived from the vendor's actual catalog (discounted
  // price when set, since that's what a shopper actually pays) — the
  // filter panel's slider/min-max inputs are scoped to this range
  // rather than an arbitrary fixed ceiling, matching the reference
  // site's own Price Filter (see screenshot 2/3: max reflects the real
  // catalog, e.g. "20770").
  const priceBounds = useMemo(() => {
    if (products.length === 0) return { min: 0, max: 0 };
    const prices = products.map((p) => Number(p.discountPrice ?? p.price));
    return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
  }, [products]);

  const [filters, setFilters] = useState<ProductFilterState>({
    minPrice: priceBounds.min,
    maxPrice: priceBounds.max,
    categories: [],
    brands: [],
    variantOptions: {},
  });
  // Keep the slider's working range in sync if the catalog itself
  // changes (e.g. navigating between stores in dev) without clobbering
  // a shopper's still-valid narrower selection.
  const effectiveFilters: ProductFilterState = {
    ...filters,
    minPrice: filters.minPrice === 0 && filters.maxPrice === 0 ? priceBounds.min : filters.minPrice,
    maxPrice: filters.minPrice === 0 && filters.maxPrice === 0 ? priceBounds.max : filters.maxPrice,
  };
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const filtered = products.filter((p) => {
    const matchesSearch = search?.trim() ? p.name.toLowerCase().includes(search.trim().toLowerCase()) : true;
    // Matches on secondaryCategories too — a promo bucket like "50% OFF"
    // (see the header nav) is typically tagged onto products from many
    // different primary categories purely via Secondary Categories, never
    // set as any product's own `category`.
    const matchesCategory = activeCategory
      ? p.category === activeCategory || p.secondaryCategories.includes(activeCategory)
      : true;
    const price = Number(p.discountPrice ?? p.price);
    const matchesPrice = price >= effectiveFilters.minPrice && price <= effectiveFilters.maxPrice;
    const matchesFilterCategory =
      effectiveFilters.categories.length === 0 || (p.category ? effectiveFilters.categories.includes(p.category) : false);
    const matchesBrand =
      effectiveFilters.brands.length === 0 || (p.brand ? effectiveFilters.brands.includes(p.brand) : false);
    // A product matches a variant facet when at least one of its in-stock
    // variants carries a selected value for that option (OR within an
    // option, AND across different options — standard faceted-filter
    // semantics: e.g. Color=Red AND Storage=128GB must both be satisfiable,
    // by the same or different variants).
    const matchesVariantOptions = Object.entries(effectiveFilters.variantOptions).every(
      ([optionName, selectedValues]) =>
        selectedValues.length === 0 ||
        p.variants.some((v) => v.stock > 0 && selectedValues.includes(v.optionValues[optionName])),
    );
    return matchesSearch && matchesCategory && matchesPrice && matchesFilterCategory && matchesBrand && matchesVariantOptions;
  });

  const isFiltered = Boolean(search?.trim() || activeCategory);
  const grouped = !isFiltered ? groupByCategory(products) : null;

  const topSelling = [...products]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  const activeCategoryDetail = activeCategory ? categoryDetails.find((c) => c.name === activeCategory) : undefined;

  // When browsing inside one category, the sidebar's Category filter
  // should offer that category's own subcategories (matching the header
  // nav's dropdown) instead of the store's full top-level category list —
  // see ProductFilters' categoryOptions doc comment. undefined (no
  // activeCategory, e.g. a search) keeps the old store-wide behavior.
  const activeCategorySubcategories = activeCategory
    ? (activeCategoryDetail?.children ?? []).map((c) => c.name)
    : undefined;

  // ProductFilters derives its Brand list (and, absent categoryOptions
  // above, its Category list) from whatever product array it's given —
  // pass it only this category's own products so Brand doesn't mix in
  // brands from every other category in the store (e.g. Organic Food
  // brands showing up while browsing Phone).
  const categoryScopedProducts = activeCategory
    ? products.filter((p) => p.category === activeCategory || p.secondaryCategories.includes(activeCategory))
    : products;

  const shortcutCategories = categories.slice(0, MAX_SHORTCUTS).map((name) => {
    const detail = categoryDetails.find((c) => c.name === name);
    const image =
      detail?.squarePhotoUrl ||
      detail?.coverPhotoUrl ||
      products.find((p) => p.category === name || p.secondaryCategories.includes(name))?.photoUrls[0];
    return { name, image };
  });

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <StoreHeader
        subdomain={subdomain}
        storeName={storeName}
        categories={categories}
        logoUrl={logoUrl}
        socialLinks={socialLinks}
        categoryDetails={categoryDetails}
      />

      {!isFiltered && <HeroBanner subdomain={subdomain} categoryDetails={categoryDetails} />}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {isFiltered && (
          <div className="mb-4">
            {activeCategoryDetail?.coverPhotoUrl && (
              <div className="relative w-full aspect-[21/9] rounded-lg overflow-hidden mb-4 bg-surface">
                <Image
                  src={activeCategoryDetail.coverPhotoUrl}
                  alt={activeCategory ?? ''}
                  fill
                  sizes="100vw"
                  className="object-cover"
                  priority
                />
              </div>
            )}
            <div className="flex items-center justify-between">
              <h1 className="text-[16px] font-bold text-ink">
                {search?.trim() ? `Results for "${search}"` : activeCategory}
              </h1>
              <div className="flex items-center gap-3">
                <span className="text-[12.5px] text-muted">{filtered.length} products</span>
                <button
                  onClick={() => setMobileFiltersOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 text-[12.5px] font-semibold text-ink border border-line-strong rounded-md px-2.5 py-1.5"
                >
                  <SlidersHorizontal size={13} />
                  Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {products.length === 0 ? (
          <div className="text-center py-20 bg-surface border border-line rounded-lg">
            <p className="text-lg font-semibold text-ink mb-1.5">Nothing here yet</p>
            <p className="text-[13.5px] text-muted">This store hasn&apos;t added any products. Check back soon.</p>
          </div>
        ) : isFiltered ? (
          <div className="grid gap-6 lg:[grid-template-columns:240px_1fr] items-start">
            {/* Filter sidebar — desktop: static column; mobile: slide-over panel opened via the "Filters" button above. */}
            <aside className="hidden lg:block lg:sticky lg:top-24">
              <ProductFilters
                products={categoryScopedProducts}
                value={effectiveFilters}
                onChange={setFilters}
                bounds={priceBounds}
                categoryOptions={activeCategorySubcategories}
              />
            </aside>

            {mobileFiltersOpen && (
              <div className="fixed inset-0 z-40 lg:hidden">
                <div className="absolute inset-0 bg-ink/40" onClick={() => setMobileFiltersOpen(false)} />
                <div className="absolute inset-y-0 left-0 w-[85%] max-w-[320px] bg-canvas overflow-y-auto p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[15px] font-bold text-ink">Filters</span>
                    <button onClick={() => setMobileFiltersOpen(false)} aria-label="Close filters">
                      <X size={18} />
                    </button>
                  </div>
                  <ProductFilters
                    products={categoryScopedProducts}
                    value={effectiveFilters}
                    onChange={setFilters}
                    bounds={priceBounds}
                    categoryOptions={activeCategorySubcategories}
                  />
                  <button
                    onClick={() => setMobileFiltersOpen(false)}
                    className="w-full mt-4 py-2.5 rounded-md bg-ink text-white text-[13px] font-bold"
                  >
                    Show {filtered.length} results
                  </button>
                </div>
              </div>
            )}

            {filtered.length === 0 ? (
              <div className="text-center py-20 bg-surface border border-line rounded-lg">
                <p className="text-lg font-semibold text-ink mb-1.5">No matches</p>
                <p className="text-[13.5px] text-muted">Try adjusting your filters or browsing another category.</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:[grid-template-columns:repeat(auto-fill,minmax(200px,1fr))]">
                {filtered.map((product) => (
                  <ProductCard key={product.id} product={product} subdomain={subdomain} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {topSelling.length > 0 && (
              <section className="mb-6">
                <h2 className="text-[18px] font-bold text-ink mb-4 text-center">🔥 Top Selling 🔥</h2>
                <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:[grid-template-columns:repeat(auto-fill,minmax(200px,1fr))]">
                  {topSelling.map((product) => (
                    <ProductCard key={product.id} product={product} subdomain={subdomain} />
                  ))}
                </div>
              </section>
            )}

            {shortcutCategories.length > 0 && (
              <div className="flex flex-wrap items-start justify-center gap-4 sm:gap-6 mb-10">
                {shortcutCategories.map((cat) => (
                  <Link
                    key={cat.name}
                    href={`/store/${subdomain}?category=${encodeURIComponent(cat.name)}`}
                    className="flex flex-col items-center gap-2 w-24"
                  >
                    <div className="relative w-20 h-20 rounded-md overflow-hidden bg-surface border border-line">
                      {cat.image ? (
                        <Image src={cat.image} alt={cat.name} fill sizes="80px" className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted text-[10px]">
                          {cat.name.slice(0, 1)}
                        </div>
                      )}
                    </div>
                    <span className="text-[12.5px] font-medium text-ink text-center leading-tight lowercase">
                      {cat.name}
                    </span>
                  </Link>
                ))}
              </div>
            )}

            {grouped?.map((section) => (
              <section key={section.name} className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[16px] font-bold text-ink uppercase">{section.name}</h2>
                  <Link
                    href={`/store/${subdomain}?category=${encodeURIComponent(section.name)}`}
                    className="text-[12.5px] font-medium text-accent hover:text-accent-dark"
                  >
                    View all →
                  </Link>
                </div>
                <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:[grid-template-columns:repeat(auto-fill,minmax(200px,1fr))]">
                  {section.items.slice(0, 8).map((product) => (
                    <ProductCard key={product.id} product={product} subdomain={subdomain} />
                  ))}
                </div>
              </section>
            ))}
          </>
        )}
      </main>

      {!isFiltered && (
        <>
          <section className="border-t border-line">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid gap-7 sm:grid-cols-3">
              {SERVICE_BLOCKS.map((block) => (
                <div key={block.title}>
                  <p className="text-[13.5px] font-bold text-ink uppercase mb-2">{block.title}</p>
                  <p className="text-[12.5px] text-muted leading-relaxed">{block.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-surface border-y border-line">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 text-center">
              <p className="text-[15px] font-bold text-ink">Why we are best?</p>
            </div>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-8 grid gap-7 sm:grid-cols-3">
              {TRUST_BADGES.map((badge, i) => {
                const Icon = TRUST_ICONS[i] ?? Truck;
                return (
                  <div key={badge.title} className="flex flex-col items-center text-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-accent-light flex items-center justify-center">
                      <Icon size={22} className="text-accent" />
                    </div>
                    <p className="font-bold text-[13.5px] text-ink">{badge.title}</p>
                    <p className="text-[12.5px] text-muted leading-relaxed max-w-[220px]">{badge.text}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {reviews.length > 0 && (
            <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
              <h2 className="text-[16px] font-bold text-ink mb-4 text-center">Our Customer Review</h2>
              <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(230px,1fr))]">
                {reviews.map((r) => (
                  <div key={r.id} className="bg-surface border border-line rounded-lg p-3.5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-semibold text-[13px] text-ink">{r.customerName ?? 'Anonymous'}</span>
                      <Stars count={r.rating} />
                    </div>
                    <p className="m-0 text-[13px] font-semibold text-ink mb-0.5">{r.title}</p>
                    {r.content && <p className="m-0 text-[12.5px] text-muted leading-relaxed">{r.content}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <StoreFooter subdomain={subdomain} storeName={storeName} logoUrl={logoUrl} socialLinks={socialLinks} />
    </div>
  );
}
