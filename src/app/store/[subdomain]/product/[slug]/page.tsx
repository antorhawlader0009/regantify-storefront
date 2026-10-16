import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getStoreProduct,
  getStoreSidebar,
  StoreNotFoundError,
  ProductNotFoundError,
  siteUrl,
} from '@/lib/storefrontApi';
import { resolveTheme } from '@/lib/theme';
import { isOutOfStock } from '@/lib/productDisplay';
import { safeJsonLd } from '@/lib/safeJsonLd';
import { resolvePolicy } from '@/themes/storepal/lib/policy';
import { ProductView as MediumProductView } from '@/themes/medium/views/ProductView';
import { ProductView as MinimalProductView } from '@/themes/minimal/views/ProductView';
import { ProductView as StorepalProductView } from '@/themes/storepal/views/ProductView';
import { socialMeta } from '@/lib/shareMeta';
import { storeParams } from '@/lib/storeRequest';


interface PageProps {
  params: Promise<{ subdomain: string; slug: string }>;
}

// This is the fix for the gap the vendor-dashboard version had: Add
// Product's "Page title" / "Meta description" (SEO) fields were captured
// but never actually applied to the page — here they drive the real
// <title>/<meta description>, canonical URL, and Open Graph/Twitter tags
// search engines and link previews read. All of it comes straight from
// fields the vendor already fills in on Add Product — no extra SEO work
// for them, it's automatic the moment they save a product.
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subdomain, slug } = await storeParams(params);
  try {
    const { product, store } = await getStoreProduct(subdomain, slug);
    const title = product.metaTitle?.trim() || product.name;
    const description =
      product.metaDescription?.trim() ||
      product.summary?.trim() ||
      `Buy ${product.name} from ${store.storeName}. Fast delivery, cash on delivery available.`;
    const canonicalPath = `/store/${subdomain}/product/${product.slug}`;

    return {
      title,
      description,
      alternates: { canonical: await siteUrl(canonicalPath) },
      // A product photo is kept whole on a coloured 1200x630 band (a cropped shirt or shoe looks broken in a chat).
      ...socialMeta({ store, title, description, url: await siteUrl(canonicalPath), image: product.photoUrls[0], imageMode: 'fit', locale: store.designSettings?.storeLanguage }),
    };
  } catch {
    return { title: 'Product not found' };
  }
}

export default async function ProductPage({ params }: PageProps) {
  const { subdomain, slug } = await storeParams(params);

  let data;
  try {
    data = await getStoreProduct(subdomain, slug);
  } catch (err) {
    if (err instanceof StoreNotFoundError || err instanceof ProductNotFoundError) notFound();
    throw err;
  }

  const { store, product } = data;

  // Lean sidebar fetch (category strip + up to 4 related products) —
  // see getStoreSidebar: this is intentionally NOT getStoreProducts, which
  // would pull the vendor's entire catalog (every product's full
  // relations — variationOptions, variationPhotos, description, etc) just
  // to compute a handful of cards. Non-fatal on failure: the product page
  // itself still renders fine without its sidebar.
  const sidebar = await getStoreSidebar(subdomain, slug, product.category).catch(() => ({
    categories: [] as string[],
    categoryDetails: [] as Awaited<ReturnType<typeof getStoreSidebar>>['categoryDetails'],
    related: [] as Awaited<ReturnType<typeof getStoreSidebar>>['related'],
  }));
  const { categories, categoryDetails, related } = sidebar;

  // Structured data (schema.org Product) — this is what lets Google show
  // price and stock directly in search results ("rich snippets").
  // Entirely generated from fields the vendor already filled in on Add
  // Product (name, description, price, stock, brand) — nothing extra for
  // them to configure. Deliberately no aggregateRating/review markup:
  // Google's structured-data policy prohibits fake or placeholder review
  // data, and this project only has placeholder reviews (see
  // placeholderContent.ts) — add real rating markup once a genuine
  // review feature exists.
  const outOfStock = isOutOfStock(product);
  const lowestPrice = product.variants.length > 0
    ? Math.min(...product.variants.map((v) => Number(v.discountPrice ?? v.listPrice ?? product.price)))
    : Number(product.discountPrice ?? product.price);

  const productUrl = await siteUrl(`/store/${subdomain}/product/${product.slug}`);
  const homeUrl = await siteUrl(`/store/${subdomain}`);

  // Return window, from the product's own policy or the store's default (Stock Settings): only said when the vendor set one.
  const policy = resolvePolicy(product, store.stockSettings);
  const returnPolicy =
    policy && policy.returnDays != null
      ? {
          '@type': 'MerchantReturnPolicy',
          applicableCountry: 'BD',
          ...(policy.returnDays > 0
            ? { returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow', merchantReturnDays: policy.returnDays }
            : { returnPolicyCategory: 'https://schema.org/MerchantReturnNotPermitted' }),
        }
      : undefined;
  // The store's own delivery charges (Store > Delivery Charge): Dhaka, and the rest of the country.
  const dhakaCharge = Number(store.insideDhakaCharge);
  const restCharge = Number(store.outsideDhakaCharge);
  const shippingDetails =
    Number.isFinite(dhakaCharge) && Number.isFinite(restCharge)
      ? [
          { '@type': 'OfferShippingDetails', shippingRate: { '@type': 'MonetaryAmount', value: dhakaCharge, currency: 'BDT' }, shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'BD', addressRegion: ['Dhaka'] } },
          { '@type': 'OfferShippingDetails', shippingRate: { '@type': 'MonetaryAmount', value: restCharge, currency: 'BDT' }, shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'BD' } },
        ]
      : undefined;

  // The path to this product (Home > Category > Product), shown in the search result instead of a bare web address.
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: store.storeName, item: homeUrl },
      ...(product.category ? [{ '@type': 'ListItem', position: 2, name: product.category, item: `${homeUrl}?category=${encodeURIComponent(product.category)}` }] : []),
      { '@type': 'ListItem', position: product.category ? 3 : 2, name: product.name, item: productUrl },
    ],
  };

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    // The same id the Meta pixel's content_ids and the Facebook catalog
    // feed use (facebook-pixel.md §4.1/§7), so Meta's page reader matches
    // this page to the right catalog item. A product with variants is a
    // group there (one feed row per variant), so it gets the group id.
    ...(product.variants.length > 0 ? { inProductGroupWithID: product.id } : { productID: product.id }),
    name: product.name,
    description: product.metaDescription?.trim() || product.summary?.trim() || product.name,
    image: product.photoUrls,
    brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
    // A price-on-request product publishes no price anywhere, search results included.
    url: productUrl,
    category: product.category || undefined,
    offers: product.quoteOnly ? undefined : {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'BDT',
      price: lowestPrice,
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: store.storeName },
      shippingDetails,
      hasMerchantReturnPolicy: returnPolicy,
      availability: product.isPreOrder
        ? 'https://schema.org/PreOrder'
        : outOfStock
          ? 'https://schema.org/OutOfStock'
          : 'https://schema.org/InStock',
    },
  };

  const viewProps = { subdomain, storeName: store.storeName, product, categories, related };
  const socialLinks = {
    facebookUrl: store.facebookUrl,
    instagramUrl: store.instagramUrl,
    twitterUrl: store.twitterUrl,
    youtubeUrl: store.youtubeUrl,
    tiktokUrl: store.tiktokUrl,
    linkedinUrl: store.linkedinUrl,
    whatsappUrl: store.whatsappUrl,
  };

  return (
    <>
      {/* Structured data for search engines — invisible to visitors,
          read by crawlers to power rich results (price/stock/rating
          shown directly in Google search listings). */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: safeJsonLd(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }}
      />
      {resolveTheme(store.theme) === 'MINIMAL' ? (
        <MinimalProductView {...viewProps} />
      ) : resolveTheme(store.theme) === 'STOREPAL' ? (
        <StorepalProductView
          {...viewProps}
          categoryDetails={categoryDetails}
          logoUrl={store.logoUrl}
          socialLinks={socialLinks}
          footerConfig={store.footerConfig}
          stockSettings={store.stockSettings}
        />
      ) : (
        <MediumProductView {...viewProps} />
      )}
    </>
  );
}
