import type { StorefrontProduct, StorefrontReview } from '@/lib/storefrontApi';
import { StoreHeader } from '../components/StoreHeader';
import { StoreFooter } from '../components/StoreFooter';
import { ProductCard } from '../components/ProductCard';
import { FeaturedBanner } from '../components/FeaturedBanner';
import { CategoryTiles } from '../components/CategoryTiles';
import { TRUST_BADGES } from '@/lib/placeholderContent';
import { Stars } from '../components/Stars';

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

/**
 * Minimal's homepage flattens Medium's per-category boxed sections into
 * a single continuous grid — an editorial catalog reads as one
 * considered collection, not a stack of merchandising modules. Same
 * underlying data and filtering rules as Medium's HomeView, only the
 * layout differs.
 */
export function HomeView({ subdomain, storeName, products, categories, reviews, activeCategory, search }: HomeViewProps) {
  const filtered = products.filter((p) => {
    const matchesSearch = search?.trim() ? p.name.toLowerCase().includes(search.trim().toLowerCase()) : true;
    const matchesCategory = activeCategory ? p.category === activeCategory : true;
    return matchesSearch && matchesCategory;
  });

  const isFiltered = Boolean(search?.trim() || activeCategory);
  const list = isFiltered ? filtered : products;

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

      <main className="max-w-5xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
        {isFiltered && (
          <div className="flex items-baseline justify-between mb-8">
            <h1 className="font-display italic text-[22px] text-ink">
              {search?.trim() ? `Results for "${search}"` : activeCategory}
            </h1>
            <span className="text-[12px] text-muted">{list.length} products</span>
          </div>
        )}

        {products.length === 0 ? (
          <div className="text-center py-24">
            <p className="font-display italic text-[19px] text-ink mb-1.5">Nothing here yet</p>
            <p className="text-[13px] text-muted">This store hasn&apos;t added any products. Check back soon.</p>
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-24">
            <p className="font-display italic text-[19px] text-ink mb-1.5">No matches</p>
            <p className="text-[13px] text-muted">Try a different search or browse another category.</p>
          </div>
        ) : (
          <div className="grid gap-x-6 gap-y-10 [grid-template-columns:repeat(auto-fill,minmax(180px,1fr))]">
            {list.map((product) => (
              <ProductCard key={product.id} product={product} subdomain={subdomain} />
            ))}
          </div>
        )}
      </main>

      <section className="border-t border-line">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-12 grid gap-8 sm:grid-cols-3">
          {TRUST_BADGES.map((badge) => (
            <div key={badge.title}>
              <p className="text-[13.5px] text-ink mb-1">{badge.title}</p>
              <p className="text-[12.5px] text-muted leading-relaxed">{badge.text}</p>
            </div>
          ))}
        </div>
      </section>

      {reviews.length > 0 && (
        <section className="max-w-5xl mx-auto px-5 sm:px-8 py-12 border-t border-line">
          <h2 className="font-display italic text-[20px] text-ink mb-7">What customers say</h2>
          <div className="grid gap-x-8 gap-y-8 sm:grid-cols-3">
            {reviews.map((r) => (
              <div key={r.id}>
                <Stars count={r.rating} />
                <p className="mt-2.5 text-[13.5px] text-ink">{r.title}</p>
                {r.content && <p className="mt-1 text-[12.5px] text-muted leading-relaxed">{r.content}</p>}
                <p className="mt-2.5 text-[11.5px] text-muted">{r.customerName ?? 'Anonymous'}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <StoreFooter subdomain={subdomain} storeName={storeName} />
    </div>
  );
}
