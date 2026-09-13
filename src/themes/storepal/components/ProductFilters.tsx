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
}

interface ProductFiltersProps {
  products: StorefrontProduct[];
  value: ProductFilterState;
  onChange: (next: ProductFilterState) => void;
  /** Absolute floor/ceiling derived from the full product set — the slider's own range never narrows as filters are applied, only `value` does. */
  bounds: { min: number; max: number };
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
export function ProductFilters({ products, value, onChange, bounds }: ProductFiltersProps) {
  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category).filter((c): c is string => Boolean(c)))).sort(),
    [products],
  );
  const brands = useMemo(
    () => Array.from(new Set(products.map((p) => p.brand).filter((b): b is string => Boolean(b)))).sort(),
    [products],
  );

  const toggle = (list: string[], item: string) =>
    list.includes(item) ? list.filter((x) => x !== item) : [...list, item];

  const activeCount =
    value.categories.length +
    value.brands.length +
    (value.minPrice > bounds.min || value.maxPrice < bounds.max ? 1 : 0);

  const reset = () => onChange({ minPrice: bounds.min, maxPrice: bounds.max, categories: [], brands: [] });

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
        <FilterSection title="Category">
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
    </div>
  );
}
