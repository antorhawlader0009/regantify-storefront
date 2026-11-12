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
import { MahabeshBreadcrumb } from './MahabeshBreadcrumb';
import { MhSectionTitle } from './MahabeshHome';
import { MahabeshReviewsLink } from './MahabeshReviewsLink';

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
function MahabeshProductSide({ subdomain, product, policy }: { subdomain: string; product: StorefrontProduct; policy: ResolvedPolicy | null }) {
  const base = `/store/${subdomain}`;
  const quote = !!product.quoteOnly;
  const tags = product.secondaryCategories.filter((c) => c !== product.category);
  return (
    <aside className="mt-6 space-y-3 lg:col-start-2 lg:mt-0" aria-label="Delivery information">
      {!quote && !product.comingSoon && (
        <div className="rounded-2xl bg-[var(--mh-well)] px-5 py-4 text-[14.5px] font-semibold leading-snug">
          <ProductTrustRow subdomain={subdomain} preOrder={!!product.isPreOrder} />
        </div>
      )}
      {!quote && (
        <div className="rounded-2xl bg-[var(--mh-well)] p-5 text-[14.5px] text-[#1d1d1f]">
          <DeliveryCheck subdomain={subdomain} />
          {policy && (
            <div className="mt-4">
              <ProductPolicyLines policy={policy} />
            </div>
          )}
        </div>
      )}
      {(product.category || tags.length > 0 || product.brand) && (
        <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 pt-1 text-[14px] text-[#62646b]">
          {product.category && (
            <>
              <dt>
                <StoreLabel text="Category" />
              </dt>
              <dd className="m-0">
                <Link href={`${base}?category=${encodeURIComponent(product.category)}`} className="font-semibold text-black hover:text-[var(--mh-brand)]">
                  {product.category}
                </Link>
              </dd>
            </>
          )}
          {tags.length > 0 && (
            <>
              <dt>
                <StoreLabel text="Tags" />
              </dt>
              <dd className="m-0 font-semibold text-black">{tags.join(', ')}</dd>
            </>
          )}
        </dl>
      )}
    </aside>
  );
}

/**
 * Mahabesh's product page (resources/views/details.blade.php): the breadcrumb, the brand in grey and a heavy title, then
 * two columns: the gallery (a column of thumbnails beside a rounded 4:5 photo, sticky) and the price, options and pill
 * buttons, with the grey boxes under them (the store's own delivery and trust lines, the delivery check, warranty and
 * returns, category and tags); then the description, reviews (summary box beside the list, write-a-review box), questions
 * and related products. The buying logic is StorePal's (sizes, bundles, personal text, stock rules, pre-order, backorder,
 * lead forms), drawn in Mahabesh's look. Only what the store set is shown: the template's sample notes are not drawn.
 */
export function MahabeshProductView({ subdomain, storeName, product, categories, categoryDetails, related, socialLinks, logoUrl, footerConfig, stockSettings }: Props) {
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

      <main className="mh-wrap w-full flex-1 pb-4 pt-[18px]">
        <MahabeshBreadcrumb
          subdomain={subdomain}
          homeLabel={<StoreLabel text="Home" />}
          items={[{ label: 'Shop', href: `${base}/products` }, ...crumbs]}
        />

        <div className="mt-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {product.brand && (
              <p className="text-[13.5px] font-semibold text-[#62646b]">
                <Link href={`${base}?brand=${encodeURIComponent(product.brand)}`} className="hover:text-[var(--mh-brand)]">
                  {product.brand}
                </Link>
              </p>
            )}
            {product.badgeText && <span className="mb-2 inline-block bg-[var(--mh-signal)] px-2.5 py-1 text-xs font-extrabold leading-none text-black">{product.badgeText}</span>}
            <h1 data-rg="product-title" className="mt-1 text-[clamp(26px,3vw,36px)] font-extrabold leading-[1.08] tracking-[-0.025em] text-black">
              {product.name}
            </h1>
          </div>
          {!product.quoteOnly && <ShareButton name={product.name} price={Number(product.discountPrice ?? product.price)} />}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13.5px] text-[#62646b]">
          <MahabeshReviewsLink rating={product.rating} />
        </div>

        {!product.quoteOnly && product.flashSaleEndsAt && <FlashSaleTimer variant="bar" endsAt={product.flashSaleEndsAt} className="mt-4" />}

        <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-x-12 lg:gap-y-5 lg:[&>[data-rg=product-gallery]]:sticky lg:[&>[data-rg=product-gallery]]:top-[140px] lg:[&>[data-rg=product-gallery]]:row-span-2 lg:[&>[data-rg=product-gallery]]:self-start">
          <StorePalPurchasePanel subdomain={subdomain} storeName={storeName} product={product} backorder={resolveBackorder(stockSettings)} policy={policy} />
          <MahabeshProductSide subdomain={subdomain} product={product} policy={policy} />
        </div>

        {!product.quoteOnly && <ProductOffers subdomain={subdomain} product={product} />}

        <StorePalProductTabs subdomain={subdomain} slug={product.slug} description={product.description} infoTabs={product.infoTabs} look="mahabesh" />

        {!product.quoteOnly && (
          <div className="mt-12">
            <BoughtTogether subdomain={subdomain} slug={product.slug} storeName={storeName} />
          </div>
        )}

        {visibleRelated.length > 0 && (
          <section className="mt-14" aria-labelledby="mh-rel-title">
            <div className="mb-[22px] flex items-end justify-between gap-3">
              <div id="mh-rel-title">
                <MhSectionTitle title={<StoreLabel text="Related Products" />} />
              </div>
              {product.category && (
                <Link
                  href={`${base}?category=${encodeURIComponent(product.category)}`}
                  className="shrink-0 border-b-[1.5px] border-black pb-px text-[14.5px] font-semibold text-black transition hover:border-[var(--mh-brand)] hover:text-[var(--mh-brand)]"
                >
                  <StoreLabel text="View all" />
                </Link>
              )}
            </div>
            <ul className="grid grid-cols-2 gap-x-2.5 gap-y-6 min-[600px]:grid-cols-3 lg:grid-cols-4 lg:gap-x-[18px] lg:gap-y-8 min-[1200px]:grid-cols-5">
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
