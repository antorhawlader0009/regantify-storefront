import Link from 'next/link';
import type { StorefrontProduct, StorefrontCardProduct, StorefrontCategoryDetail, StorefrontStockSettings } from '@/lib/storefrontApi';
import type { SocialLinks, StoreFooterConfig } from '@/lib/socialLinksApi';
import { StoreHeader } from '../storepal/components/StoreHeader';
import { StoreFooter } from '../storepal/components/StoreFooter';
import { ProductCard } from '../storepal/components/ProductCard';
import { FlashSaleTimer } from '../storepal/components/FlashSaleTimer';
import { ProductOffers } from '../storepal/components/ProductOffers';
import { StorePalProductTabs } from '../storepal/components/StorePalProductTabs';
import { BoughtTogether } from '../storepal/components/BoughtTogether';
import { StorePalPurchasePanel } from '../storepal/components/StorePalPurchasePanel';
import { RecentlyViewed } from '../storepal/components/RecentlyViewed';
import { StoreLabel } from '../storepal/components/StoreLabel';
import { resolveBackorder, visibleInListings } from '../storepal/lib/backorder';
import { resolvePolicy } from '../storepal/lib/policy';
import { PlaymateProductHead, PlaymateProductSide } from './PlaymateProductParts';

interface Props {
  subdomain: string;
  storeName: string;
  product: StorefrontProduct;
  categories: string[];
  categoryDetails?: StorefrontCategoryDetail[];
  related: StorefrontCardProduct[];
  socialLinks?: SocialLinks;
  logoUrl?: string | null;
  footerConfig?: StoreFooterConfig | null;
  stockSettings?: StorefrontStockSettings;
}

/**
 * PlayMate's product page, the template's ProductDetail (templete/playmate ProductDetail.tsx): breadcrumb, title with
 * brand / stars / SKU, then gallery | price and buttons | the delivery side box, then details, customer reviews,
 * questions and related products. The buying logic is StorePal's (sizes, bundles, personal text, stock rules, pre-order,
 * backorder, lead forms), drawn in PlayMate's look.
 */
export function PlaymateProductView({ subdomain, storeName, product, categories, categoryDetails, related, socialLinks, logoUrl, footerConfig, stockSettings }: Props) {
  const visibleRelated = visibleInListings(related, stockSettings).slice(0, 10);
  const policy = resolvePolicy(product, stockSettings);
  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      <StoreHeader
        subdomain={subdomain}
        storeName={storeName}
        categories={categories}
        categoryDetails={categoryDetails}
        logoUrl={logoUrl}
        socialLinks={socialLinks}
        chatProductName={product.name}
      />

      <main className="pm-wrap w-full flex-1 py-6 sm:py-8">
        <PlaymateProductHead subdomain={subdomain} product={product} />

        {!product.quoteOnly && product.flashSaleEndsAt && <FlashSaleTimer variant="bar" endsAt={product.flashSaleEndsAt} className="mt-4" />}

        <div className="mt-6 grid gap-8 md:grid-cols-2 lg:grid-cols-[minmax(0,420px)_1fr_300px] lg:gap-10">
          <StorePalPurchasePanel subdomain={subdomain} storeName={storeName} product={product} backorder={resolveBackorder(stockSettings)} policy={policy} />
          <PlaymateProductSide subdomain={subdomain} product={product} policy={policy} />
        </div>

        {!product.quoteOnly && <ProductOffers subdomain={subdomain} product={product} />}

        <StorePalProductTabs subdomain={subdomain} slug={product.slug} description={product.description} infoTabs={product.infoTabs} look="playmate" />

        {!product.quoteOnly && (
          <div className="mt-12">
            <BoughtTogether subdomain={subdomain} slug={product.slug} storeName={storeName} />
          </div>
        )}

        {visibleRelated.length > 0 && (
          <section className="mt-12" aria-labelledby="pm-rel-title">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 id="pm-rel-title" className="text-[15px] font-bold">
                <StoreLabel text="Related Products" />
              </h2>
              {product.category && (
                <Link href={`/store/${subdomain}?category=${encodeURIComponent(product.category)}`} className="text-[12px] font-semibold uppercase tracking-wide text-accent hover:underline">
                  <StoreLabel text="View all" />
                </Link>
              )}
            </div>
            <ul className="grid grid-cols-2 gap-3 min-[560px]:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
              {visibleRelated.map((p) => (
                <li key={p.id}>
                  <ProductCard product={p} subdomain={subdomain} storeName={storeName} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <RecentlyViewed subdomain={subdomain} storeName={storeName} currentSlug={product.slug} />
      <StoreFooter subdomain={subdomain} storeName={storeName} logoUrl={logoUrl} socialLinks={socialLinks} footerConfig={footerConfig} />
    </div>
  );
}
