'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import { formatPrice } from '../lib/formatPrice';
import type { StorefrontProduct } from '@/lib/storefrontApi';

export interface ProductFilterState {
  minPrice: number;
  maxPrice: number;
  categories: string[];
  brands: string[];
  /** Selected values per variation-option name (e.g. `{ Color: ['Red'], Storage: ['128GB'] }`) — see the variant-facet section below. */
  variantOptions: Record<string, string[]>;
}

interface ProductFiltersProps {
  products: StorefrontProduct[];
  value: ProductFilterState;
  onChange: (next: ProductFilterState) => void;
  /** Absolute floor/ceiling derived from the full product set — the slider's own range never narrows as filters are applied, only `value` does. */
  bounds: { min: number; max: number };
  /**
   * Override for the Category section's checkbox options. HomeView passes
   * this when the listing is already scoped to one category (activeCategory)
   * — that category's own subcategories (Category.parentId, same data as
   * the header nav dropdown) are far more useful here than the store's full
   * top-level category list, which just duplicates the header nav and
   * can't narrow anything within the current page. Pass an empty array to
   * hide the Category section entirely (a leaf category with no
   * subcategories has nothing left to filter by). Omit to fall back to
   * deriving options from `products` — the un-scoped browse/search view.
   */
  categoryOptions?: string[];
}

/** Collapsible section — matches the reference site's "Color"/"Size" accordions (see screenshot 2). */
function FilterSection({ title, defaultOpen = true, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-line py-4 first:pt-0 last:border-b-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between text-[14px] font-semibold text-ink"
      >
        {title}
        <ChevronDown size={15} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

/**
 * Price range / category / brand filter panel for the shop listing —
 * matches the reference site's own Price Filter slider plus checkbox
 * accordions (see storepal.com.bd's "Branded Shoes"/"Mega Deal"
 * screenshots). Purely client-side: HomeView already has every product
 * loaded up front (see StorefrontListData), so filtering narrows that
 * in-memory list rather than round-tripping to the API.
 */
export function ProductFilters({ products, value, onChange, bounds, categoryOptions }: ProductFiltersProps) {
  const derivedCategories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category).filter((c): c is string => Boolean(c)))).sort(),
    [products],
  );
  const categories = categoryOptions ?? derivedCategories;
  // Only a real "Category" list (the store-wide fallback, no activeCategory)
  // when categoryOptions wasn't passed — once HomeView scopes this to one
  // category's own subcategories, the heading should say so.
  const categoryFilterLabel = categoryOptions ? 'Sub Category' : 'Category';
  const brands = useMemo(
    () => Array.from(new Set(products.map((p) => p.brand).filter((b): b is string => Boolean(b)))).sort(),
    [products],
  );

  // Variant facets (Color, Storage, Size, ...) — built from real variant
  // data rather than the products' own variationOptions lists, since a
  // product can declare an option value (e.g. "Storage: 256GB") with no
  // in-stock variant actually offering it; only in-stock combinations are
  // worth letting a shopper filter down to (see faceted-search best
  // practice: surface only what's actually purchasable).
  const variantFacets = useMemo(() => {
    const facets = new Map<string, Set<string>>();
    for (const p of products) {
      for (const v of p.variants) {
        if (v.stock <= 0) continue;
        for (const [optionName, optionValue] of Object.entries(v.optionValues)) {
          if (!optionValue) continue;
          if (!facets.has(optionName)) facets.set(optionName, new Set());
          facets.get(optionName)!.add(optionValue);
        }
      }
    }
    return Array.from(facets.entries())
      .map(([name, values]) => ({ name, values: Array.from(values).sort() }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const toggle = (list: string[], item: string) =>
    list.includes(item) ? list.filter((x) => x !== item) : [...list, item];

  const activeCount =
    value.categories.length +
    value.brands.length +
    Object.values(value.variantOptions).reduce((sum, list) => sum + list.length, 0) +
    (value.minPrice > bounds.min || value.maxPrice < bounds.max ? 1 : 0);

  const reset = () =>
    onChange({ minPrice: bounds.min, maxPrice: bounds.max, categories: [], brands: [], variantOptions: {} });

  const toggleVariantValue = (optionName: string, val: string) =>
    onChange({
      ...value,
      variantOptions: {
        ...value.variantOptions,
        [optionName]: toggle(value.variantOptions[optionName] ?? [], val),
      },
    });

  return (
    <div className="bg-surface border border-line rounded-md p-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className="flex items-center gap-1.5 text-[15px] font-bold text-ink">
          <SlidersHorizontal size={15} />
          Filters
        </h3>
        {activeCount > 0 && (
          <button onClick={reset} className="flex items-center gap-1 text-[12px] font-medium text-accent hover:text-accent-dark">
            <X size={12} />
            Clear
          </button>
        )}
      </div>

      <FilterSection title="Price Filter">
        <div className="px-0.5">
          <input
            type="range"
            min={bounds.min}
            max={bounds.max}
            value={value.maxPrice}
            onChange={(e) => {
              const max = Number(e.target.value);
              onChange({ ...value, maxPrice: Math.max(max, value.minPrice) });
            }}
            className="w-full accent-accent"
          />
          <div className="flex items-center gap-2 mt-3">
            <input
              type="number"
              min={bounds.min}
              max={value.maxPrice}
              value={value.minPrice}
              onChange={(e) => {
                const min = Number(e.target.value);
                onChange({ ...value, minPrice: Math.min(Math.max(min, bounds.min), value.maxPrice) });
              }}
              className="w-full min-w-0 px-2.5 py-1.5 rounded border border-line-strong text-[12.5px] bg-canvas outline-none focus:border-ink"
            />
            <span className="text-muted text-[12px] shrink-0">to</span>
            <input
              type="number"
              min={value.minPrice}
              max={bounds.max}
              value={value.maxPrice}
              onChange={(e) => {
                const max = Number(e.target.value);
                onChange({ ...value, maxPrice: Math.max(Math.min(max, bounds.max), value.minPrice) });
              }}
              className="w-full min-w-0 px-2.5 py-1.5 rounded border border-line-strong text-[12.5px] bg-canvas outline-none focus:border-ink"
            />
          </div>
          <p className="mt-2 text-[12px] text-muted">
            {formatPrice(value.minPrice)} — {formatPrice(value.maxPrice)}
          </p>
        </div>
      </FilterSection>

      {categories.length > 0 && (
        <FilterSection title={categoryFilterLabel}>
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
            {categories.map((cat) => (
              <label key={cat} className="flex items-center gap-2 text-[13px] text-ink cursor-pointer">
                <input
                  type="checkbox"
                  checked={value.categories.includes(cat)}
                  onChange={() => onChange({ ...value, categories: toggle(value.categories, cat) })}
                  className="accent-accent w-3.5 h-3.5"
                />
                {cat}
              </label>
            ))}
          </div>
        </FilterSection>
      )}

      {brands.length > 0 && (
        <FilterSection title="Brand">
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
            {brands.map((brand) => (
              <label key={brand} className="flex items-center gap-2 text-[13px] text-ink cursor-pointer">
                <input
                  type="checkbox"
                  checked={value.brands.includes(brand)}
                  onChange={() => onChange({ ...value, brands: toggle(value.brands, brand) })}
                  className="accent-accent w-3.5 h-3.5"
                />
                {brand}
              </label>
            ))}
          </div>
        </FilterSection>
      )}

      {variantFacets.map((facet) => (
        <FilterSection key={facet.name} title={facet.name} defaultOpen={false}>
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
            {facet.values.map((val) => (
              <label key={val} className="flex items-center gap-2 text-[13px] text-ink cursor-pointer">
                <input
                  type="checkbox"
                  checked={(value.variantOptions[facet.name] ?? []).includes(val)}
                  onChange={() => toggleVariantValue(facet.name, val)}
                  className="accent-accent w-3.5 h-3.5"
                />
                {val}
              </label>
            ))}
          </div>
        </FilterSection>
      ))}
    </div>
  );
}
