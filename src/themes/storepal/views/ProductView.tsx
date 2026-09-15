import Link from 'next/link';
import type { StorefrontProduct, StorefrontCardProduct, StorefrontCategoryDetail } from '@/lib/storefrontApi';
import type { SocialLinks } from '@/lib/socialLinksApi';
import { StoreHeader } from '../components/StoreHeader';
import { StoreFooter } from '../components/StoreFooter';
import { ProductCard } from '../components/ProductCard';
// The purchase panel and tabs are theme-agnostic (built entirely from
// the shared CSS-variable design tokens — bg-surface, text-ink, etc —
// see globals.css's [data-theme='storepal'] block), so StorePal reuses
// Medium's own components rather than a near-duplicate rebuild. Only
// the surrounding page chrome (header/footer/breadcrumb/layout) is
// StorePal's own.
import { ProductPurchasePanel } from '../../medium/components/ProductPurchasePanel';
import { ProductTabs } from '../../medium/components/ProductTabs';

interface ProductViewProps {
  subdomain: string;
  storeName: string;
  product: StorefrontProduct;
  categories: string[];
  // Real subcategories per category name — same prop StoreHeader takes
  // on the homepage (see HomeView), so the header's dropdown shows up
  // here too instead of only on the homepage. Optional/defaulted since
  // getStoreSidebar's fetch is non-fatal (see the product page's
  // .catch()) and can come back without it.
  categoryDetails?: StorefrontCategoryDetail[];
  related: StorefrontCardProduct[];
  socialLinks?: SocialLinks;
  logoUrl?: string | null;
}

export function ProductView({ subdomain, storeName, product, categories, categoryDetails, related, socialLinks, logoUrl }: ProductViewProps) {
  return (
    <div className="min-h-screen bg-canvas text-ink pb-[70px] sm:pb-0">
      <StoreHeader
        subdomain={subdomain}
        storeName={storeName}
        categories={categories}
        categoryDetails={categoryDetails}
        logoUrl={logoUrl}
        socialLinks={socialLinks}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 text-[12px] text-muted">
        <Link href={`/store/${subdomain}`} className="hover:text-accent transition-colors">
          Shop
        </Link>
        {product.category && (
          <>
            {' / '}
            <Link
              href={`/store/${subdomain}?category=${encodeURIComponent(product.category)}`}
              className="hover:text-accent transition-colors"
            >
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
          <ProductTabs subdomain={subdomain} slug={product.slug} description={product.description} />
        </div>

        {related.length > 0 && (
          <section className="bg-surface border border-line rounded p-4 sm:p-6 mb-8">
            <h3 className="text-[15px] font-bold text-ink mb-4">Related Products</h3>
            <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:[grid-template-columns:repeat(auto-fill,minmax(200px,1fr))]">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} subdomain={subdomain} />
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="hidden sm:block">
        <StoreFooter subdomain={subdomain} storeName={storeName} logoUrl={logoUrl} socialLinks={socialLinks} />
      </div>
    </div>
  );
}
