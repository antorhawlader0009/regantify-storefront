import Link from 'next/link';
import type { StorefrontProduct, StorefrontReview } from '@/lib/storefrontApi';
import { StoreHeader } from '../components/StoreHeader';
import { StoreFooter } from '../components/StoreFooter';
import { ProductCard } from '../components/ProductCard';
import { FeaturedBanner } from '../components/FeaturedBanner';
import { CategoryTiles } from '../components/CategoryTiles';
import { TRUST_BADGES } from '@/lib/placeholderContent';
import { Stars } from '../components/Stars';

function groupByCategory(products: StorefrontProduct[]) {
  const groups = new Map<string, StorefrontProduct[]>();
  const uncategorized: StorefrontProduct[] = [];
  for (const p of products) {
    if (p.category) {
      if (!groups.has(p.category)) groups.set(p.category, []);
      groups.get(p.category)!.push(p);
    } else {
      uncategorized.push(p);
    }
  }
  const sections = Array.from(groups.entries()).map(([name, items]) => ({ name, items }));
  if (uncategorized.length > 0) sections.push({ name: 'More Products', items: uncategorized });
  return sections;
}

function discountRank(p: StorefrontProduct): number {
  if (!p.discountPrice) return -1;
  return (Number(p.price) - Number(p.discountPrice)) / Number(p.price);
}

interface HomeViewProps {
  subdomain: string;
  storeName: string;
  products: StorefrontProduct[];
  categories: string[];
  reviews: StorefrontReview[];
  activeCategory?: string;
  search?: string;
}

export function HomeView({ subdomain, storeName, products, categories, reviews, activeCategory, search }: HomeViewProps) {
  const filtered = products.filter((p) => {
    const matchesSearch = search?.trim() ? p.name.toLowerCase().includes(search.trim().toLowerCase()) : true;
    const matchesCategory = activeCategory ? p.category === activeCategory : true;
    return matchesSearch && matchesCategory;
  });

  const grouped = !search?.trim() && !activeCategory ? groupByCategory(products) : null;
  const isFiltered = Boolean(search?.trim() || activeCategory);

  const dealProducts = [...products]
    .filter((p) => discountRank(p) > 0)
    .sort((a, b) => discountRank(b) - discountRank(a))
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <StoreHeader subdomain={subdomain} storeName={storeName} categories={categories} />

      {!isFiltered && (
        <>
          {dealProducts.length > 0 && <FeaturedBanner subdomain={subdomain} products={dealProducts} />}
          <CategoryTiles subdomain={subdomain} categories={categories} products={products} />
        </>
      )}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {isFiltered && (
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-[15px] font-semibold text-ink">
              {search?.trim() ? `Results for "${search}"` : activeCategory}
            </h1>
            <span className="text-[12.5px] text-muted">{filtered.length} products</span>
          </div>
        )}

        {products.length === 0 ? (
          <div className="text-center py-20 bg-surface border border-line rounded-lg shadow-card">
            <p className="text-lg font-semibold text-ink mb-1.5">Nothing here yet</p>
            <p className="text-[13.5px] text-muted">This store hasn&apos;t added any products. Check back soon.</p>
          </div>
        ) : grouped ? (
          <div className="flex flex-col gap-8">
            {grouped.map((section) => (
              <div key={section.name} className="bg-surface border border-line rounded-lg p-4 shadow-card">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-line">
                  <h2 className="text-[15px] font-bold text-ink">{section.name}</h2>
                  {section.name !== 'More Products' && (
                    <Link
                      href={`/store/${subdomain}?category=${encodeURIComponent(section.name)}`}
                      className="text-[12.5px] font-medium text-accent hover:text-accent-dark"
                    >
                      View all →
                    </Link>
                  )}
                </div>
                <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(150px,1fr))]">
                  {section.items.slice(0, 12).map((product) => (
                    <ProductCard key={product.id} product={product} subdomain={subdomain} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-surface border border-line rounded-lg shadow-card">
            <p className="text-lg font-semibold text-ink mb-1.5">No matches</p>
            <p className="text-[13.5px] text-muted">Try a different search or browse another category.</p>
          </div>
        ) : (
          <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(150px,1fr))]">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} subdomain={subdomain} />
            ))}
          </div>
        )}
      </main>

      <section className="bg-surface border-y border-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid gap-7 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
          {TRUST_BADGES.map((badge) => (
            <div key={badge.title} className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-full bg-accent-light flex items-center justify-center shrink-0">
                <div className="w-2 h-2 rounded-full bg-accent" />
              </div>
              <div>
                <p className="font-bold text-[13.5px] text-ink mb-0.5">{badge.title}</p>
                <p className="text-[12.5px] text-muted leading-relaxed">{badge.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {reviews.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <h2 className="text-[15px] font-bold text-ink mb-4">Customer Reviews</h2>
          <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(230px,1fr))]">
            {reviews.map((r) => (
              <div key={r.id} className="bg-surface border border-line rounded-lg p-3.5 shadow-card">
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

      <StoreFooter subdomain={subdomain} storeName={storeName} />
    </div>
  );
}
