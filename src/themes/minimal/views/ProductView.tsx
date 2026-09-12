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

      <div className="max-w-5xl mx-auto px-5 sm:px-8 pt-6 text-[11.5px] text-muted">
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

      <main className="max-w-5xl mx-auto px-5 sm:px-8 py-8 sm:py-12">
        <div className="grid gap-10 sm:gap-16 lg:[grid-template-columns:1.1fr_1fr]">
          <ProductPurchasePanel subdomain={subdomain} storeName={storeName} product={product} />
        </div>
      </main>

      <div className="max-w-5xl mx-auto px-5 sm:px-8">
        <div className="mb-12 pt-8 border-t border-line">
          <ProductTabs subdomain={subdomain} slug={product.slug} description={product.description} />
        </div>

        {related.length > 0 && (
          <section className="mb-16 pt-8 border-t border-line">
            <h3 className="font-display italic text-[19px] text-ink mb-7">You may also like</h3>
            <div className="grid gap-x-6 gap-y-10 [grid-template-columns:repeat(auto-fill,minmax(180px,1fr))]">
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
