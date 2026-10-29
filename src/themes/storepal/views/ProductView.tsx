import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import type {
  StorefrontProduct,
  StorefrontCardProduct,
  StorefrontCategoryDetail,
  StorefrontStockSettings,
} from '@/lib/storefrontApi';
import type { SocialLinks, StoreFooterConfig } from '@/lib/socialLinksApi';
import { StoreHeader } from '../components/StoreHeader';
import { StoreFooter } from '../components/StoreFooter';
import { ProductCard } from '../components/ProductCard';
import { FlashSaleTimer } from '../components/FlashSaleTimer';
import { ProductOffers } from '../components/ProductOffers';
// The purchase panel (wrapped in StorePalPurchasePanel for Store > Design
// > Product Display Options) and tabs are theme-agnostic (built entirely from
// the shared CSS-variable design tokens — bg-surface, text-ink, etc —
// see globals.css's [data-theme='storepal'] block), so StorePal reuses
// Medium's own components rather than a near-duplicate rebuild. Only
// the surrounding page chrome (header/footer/breadcrumb/layout) is
// StorePal's own.
import { StorePalProductTabs } from '../components/StorePalProductTabs';
import { BoughtTogether } from '../components/BoughtTogether';
import { StorePalPurchasePanel } from '../components/StorePalPurchasePanel';
import { resolveBackorder, visibleInListings } from '../lib/backorder';
import { resolvePolicy } from '../lib/policy';
import { StoreLabel } from '../components/StoreLabel';
import { RecentlyViewed } from '../components/RecentlyViewed';

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
  /** Store > Footer — see StoreFooter's own prop-or-fetch doc comment. */
  footerConfig?: StoreFooterConfig | null;
  /** Store > Stock Settings — backorder on the purchase panel, and hiding sold-out related products. */
  stockSettings?: StorefrontStockSettings;
}

export function ProductView({
  subdomain,
  storeName,
  product,
  categories,
  categoryDetails,
  related,
  socialLinks,
  logoUrl,
  footerConfig,
  stockSettings,
}: ProductViewProps) {
  const visibleRelated = visibleInListings(related, stockSettings);
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <StoreHeader
        subdomain={subdomain}
        storeName={storeName}
        categories={categories}
        categoryDetails={categoryDetails}
        logoUrl={logoUrl}
        socialLinks={socialLinks}
        chatProductName={product.name}
      />

      {/* Breadcrumb: bold, with chevrons and a home icon; a long product name is cut to one line. */}
      <nav aria-label="Breadcrumb" data-rg="breadcrumb" className="max-w-6xl mx-auto px-4 sm:px-6 pt-4">
        <ol className="flex min-w-0 items-center gap-1.5 text-[13px] font-semibold">
          <li className="shrink-0">
            <Link href={`/store/${subdomain}`} className="inline-flex items-center gap-1 text-ink/70 hover:text-accent transition-colors">
              <Home size={14} strokeWidth={2.25} aria-hidden />
              <StoreLabel text="Shop" />
            </Link>
          </li>
          {product.category && (
            <>
              <li aria-hidden className="shrink-0 text-muted">
                <ChevronRight size={14} strokeWidth={2.5} />
              </li>
              <li className="min-w-0 shrink-0 max-w-[45%]">
                <Link
                  href={`/store/${subdomain}?category=${encodeURIComponent(product.category)}`}
                  className="block truncate text-ink/70 hover:text-accent transition-colors"
                >
                  {product.category}
                </Link>
              </li>
            </>
          )}
          <li aria-hidden className="shrink-0 text-muted">
            <ChevronRight size={14} strokeWidth={2.5} />
          </li>
          <li className="min-w-0 truncate font-bold text-ink" aria-current="page">
            {product.name}
          </li>
        </ol>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-5">
        {!product.quoteOnly && product.flashSaleEndsAt && (
          <FlashSaleTimer variant="bar" endsAt={product.flashSaleEndsAt} className="mb-3" />
        )}
        <div className="bg-surface border border-line rounded-xl grid gap-6 lg:gap-10 p-4 sm:p-6 lg:p-8 lg:[grid-template-columns:1.1fr_1fr]">
          <StorePalPurchasePanel
            subdomain={subdomain}
            storeName={storeName}
            product={product}
            backorder={resolveBackorder(stockSettings)}
            policy={resolvePolicy(product, stockSettings)}
          />
        </div>
        {!product.quoteOnly && <ProductOffers subdomain={subdomain} product={product} />}
      </main>

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-surface border border-line rounded-xl mb-5">
          <StorePalProductTabs subdomain={subdomain} slug={product.slug} description={product.description} infoTabs={product.infoTabs} />
        </div>

        {!product.quoteOnly && <BoughtTogether subdomain={subdomain} slug={product.slug} storeName={storeName} />}

        {visibleRelated.length > 0 && (
          <section className="bg-surface border border-line rounded p-4 sm:p-6 mb-8">
            <h3 className="text-[15px] font-bold text-ink mb-4"><StoreLabel text="Related Products" /></h3>
            <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:[grid-template-columns:repeat(auto-fill,minmax(200px,1fr))]">
              {visibleRelated.map((p) => (
                <ProductCard key={p.id} product={p} subdomain={subdomain} storeName={storeName} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* This product is remembered, and the others viewed lately are shown (StorePal only). */}
      <RecentlyViewed subdomain={subdomain} storeName={storeName} currentSlug={product.slug} />

      {/* Shown on phones too (2026-10-29): it was hidden there while the page had a sticky buy bar, which is gone. */}
      <StoreFooter subdomain={subdomain} storeName={storeName} logoUrl={logoUrl} socialLinks={socialLinks} footerConfig={footerConfig} />
    </div>
  );
}
