import Link from 'next/link';
import type { StorefrontProduct, StorefrontCardProduct } from '@/lib/storefrontApi';
import { StoreHeader } from '../components/StoreHeader';
import { StoreFooter } from '../components/StoreFooter';
import { ProductCard } from '../components/ProductCard';
import { ProductPurchasePanel } from '../components/ProductPurchasePanel';
import { ProductTabs } from '../components/ProductTabs';

interface ProductViewProps {
  subdomain: string;
  storeName: string;
  product: StorefrontProduct;
  categories: string[];
  related: StorefrontCardProduct[];
}

export function ProductView({ subdomain, storeName, product, categories, related }: ProductViewProps) {
  return (
    <div className="min-h-screen bg-canvas text-ink pb-[70px] sm:pb-0">
      <StoreHeader subdomain={subdomain} storeName={storeName} categories={categories} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 text-[12px] text-muted">
        <Link href={`/store/${subdomain}`} className="hover:text-accent transition-colors">
          Home
        </Link>
        {product.category && (
          <>
            {' / '}
            <Link href={`/store/${subdomain}?category=${encodeURIComponent(product.category)}`} className="hover:text-accent transition-colors">
              {product.category}
            </Link>
          </>
        )}
        {' / '}
        <span className="text-ink">{product.name}</span>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-5">
        <div className="bg-surface border border-line rounded grid gap-8 p-4 sm:p-6 lg:[grid-template-columns:1.1fr_1fr]">
          <ProductPurchasePanel subdomain={subdomain} storeName={storeName} product={product} />
        </div>
      </main>

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-surface border border-line rounded mb-5">
          <div className="p-4 sm:p-6">
            <ProductTabs subdomain={subdomain} slug={product.slug} description={product.description} />
          </div>
        </div>

        {related.length > 0 && (
          <section className="bg-surface border border-line rounded p-4 sm:p-6 mb-8">
            <h3 className="text-[15px] font-bold text-ink mb-4">Related Products</h3>
            <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(150px,1fr))]">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} subdomain={subdomain} />
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="hidden sm:block">
        <StoreFooter subdomain={subdomain} storeName={storeName} />
      </div>
    </div>
  );
}
