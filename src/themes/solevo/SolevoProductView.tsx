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
import { ShareButton } from '../storepal/components/ShareButton';
import { ProductTrustRow } from '../storepal/components/TrustStrip';
import { DeliveryCheck } from '../storepal/components/DeliveryCheck';
import { ProductPolicyLines } from '../storepal/components/ProductPolicyLines';
import { resolveBackorder, visibleInListings } from '../storepal/lib/backorder';
import { resolvePolicy, type ResolvedPolicy } from '../storepal/lib/policy';
import { SolevoBreadcrumb } from './SolevoBreadcrumb';
import { SvSectionTitle } from './SolevoHome';
import { SolevoReviewsLink } from './SolevoReviewsLink';

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

/** The side box (the template's grey panel with the truck / returns / secure lines): the store's own delivery and trust lines, the delivery check, warranty and returns, then category and tags. */
function SolevoProductSide({ subdomain, product, policy }: { subdomain: string; product: StorefrontProduct; policy: ResolvedPolicy | null }) {
  const base = `/store/${subdomain}`;
  const quote = !!product.quoteOnly;
  const tags = product.secondaryCategories.filter((c) => c !== product.category);
  return (
    <aside className="space-y-4 md:col-span-2 lg:col-span-1" aria-label="Delivery information">
      {!quote && !product.comingSoon && (
        <div className="rounded-lg bg-[var(--sv-sand)] px-5 py-5 text-sm font-semibold leading-snug">
          <ProductTrustRow subdomain={subdomain} preOrder={!!product.isPreOrder} />
        </div>
      )}
      {!quote && (
        <div className="rounded-lg bg-[var(--sv-panel)] p-5 text-sm text-ink/80">
          <DeliveryCheck subdomain={subdomain} />
          {policy && (
            <div className="mt-4">
              <ProductPolicyLines policy={policy} />
            </div>
          )}
        </div>
      )}
      {(product.category || tags.length > 0 || product.brand) && (
        <dl className="space-y-1 text-xs text-ink/70">
          {product.category && (
            <div>
              <StoreLabel text="Category" />:{' '}
              <Link href={`${base}?category=${encodeURIComponent(product.category)}`} className="font-bold text-ink hover:text-[var(--sv-gold)]">
                {product.category}
              </Link>
            </div>
          )}
          {tags.length > 0 && (
            <div>
              <StoreLabel text="Tags" />: <b className="text-ink">{tags.join(', ')}</b>
            </div>
          )}
        </dl>
      )}
    </aside>
  );
}

/**
 * Solevo's product page, the template's ProductDetail (templete/solevo ProductDetail.tsx): the breadcrumb, a big serif title
 * with brand and stars under it, then gallery | price and buttons | the grey side box, then the description, customer
 * reviews (summary box beside the list, write-a-review box), questions and related products. The buying logic is
 * StorePal's (sizes, bundles, personal text, stock rules, pre-order, backorder, lead forms), drawn in Solevo's look.
 * The template's sample tagline box and "Shipping: Free over $X" lines are not drawn: only what the store set.
 */
export function SolevoProductView({ subdomain, storeName, product, categories, categoryDetails, related, socialLinks, logoUrl, footerConfig, stockSettings }: Props) {
  const visibleRelated = visibleInListings(related, stockSettings).slice(0, 10);
  const policy = resolvePolicy(product, stockSettings);
  const base = `/store/${subdomain}`;
  const crumbs = [
    ...(product.category ? [{ label: product.category, href: `${base}?category=${encodeURIComponent(product.category)}` }] : []),
    { label: product.name },
  ];
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

      <main className="sv-wrap w-full flex-1 py-6 sm:py-8">
        <SolevoBreadcrumb subdomain={subdomain} homeLabel={<StoreLabel text="Home" />} items={crumbs} />
        {product.badgeText && (
          <span className="mt-3 inline-block bg-[var(--sv-gold)] px-2 py-1 text-[10px] font-bold uppercase leading-none tracking-wide text-white">{product.badgeText}</span>
        )}
        <div className="mt-3 flex items-start justify-between gap-3">
          <h1 data-rg="product-title" className="font-display text-3xl font-semibold sm:text-4xl">
            {product.name}
          </h1>
          {!product.quoteOnly && <ShareButton name={product.name} price={Number(product.discountPrice ?? product.price)} />}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink/70">
          {product.brand && (
            <span>
              <StoreLabel text="Brand" />:{' '}
              <Link href={`${base}?brand=${encodeURIComponent(product.brand)}`} className="font-semibold text-ink hover:text-[var(--sv-gold)]">
                {product.brand}
              </Link>
            </span>
          )}
          <SolevoReviewsLink rating={product.rating} />
        </div>

        {!product.quoteOnly && product.flashSaleEndsAt && <FlashSaleTimer variant="bar" endsAt={product.flashSaleEndsAt} className="mt-4" />}

        <div className="mt-6 grid gap-8 md:grid-cols-2 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_300px]">
          <StorePalPurchasePanel subdomain={subdomain} storeName={storeName} product={product} backorder={resolveBackorder(stockSettings)} policy={policy} />
          <SolevoProductSide subdomain={subdomain} product={product} policy={policy} />
        </div>

        {!product.quoteOnly && <ProductOffers subdomain={subdomain} product={product} />}

        <StorePalProductTabs subdomain={subdomain} slug={product.slug} description={product.description} infoTabs={product.infoTabs} look="solevo" />

        {!product.quoteOnly && (
          <div className="mt-12">
            <BoughtTogether subdomain={subdomain} slug={product.slug} storeName={storeName} />
          </div>
        )}

        {visibleRelated.length > 0 && (
          <section className="mt-14" aria-labelledby="sv-rel-title">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div id="sv-rel-title">
                <SvSectionTitle title={<StoreLabel text="Related Products" />} />
              </div>
              {product.category && (
                <Link href={`${base}?category=${encodeURIComponent(product.category)}`} className="text-[11px] font-semibold uppercase tracking-wider hover:text-[var(--sv-gold)]">
                  <StoreLabel text="View all" />
                </Link>
              )}
            </div>
            <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
              {visibleRelated.map((p) => (
                <li key={p.id} className="min-w-0">
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
