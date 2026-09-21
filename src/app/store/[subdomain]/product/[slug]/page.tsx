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
import { ProductView as MediumProductView } from '@/themes/medium/views/ProductView';
import { ProductView as MinimalProductView } from '@/themes/minimal/views/ProductView';
import { ProductView as StorepalProductView } from '@/themes/storepal/views/ProductView';

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
  const { subdomain, slug } = await params;
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
      alternates: { canonical: canonicalPath },
      openGraph: {
        title,
        description,
        url: await siteUrl(canonicalPath),
        siteName: store.storeName,
        type: 'website',
        images: product.photoUrls[0] ? [{ url: product.photoUrls[0], width: 800, height: product.photoSize === 'PORTRAIT' ? 1200 : 800 }] : undefined,
      },
      twitter: {
        card: product.photoUrls[0] ? 'summary_large_image' : 'summary',
        title,
        description,
        images: product.photoUrls[0] ? [product.photoUrls[0]] : undefined,
      },
    };
  } catch {
    return { title: 'Product not found' };
  }
}

export default async function ProductPage({ params }: PageProps) {
  const { subdomain, slug } = await params;

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

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.metaDescription?.trim() || product.summary?.trim() || product.name,
    image: product.photoUrls,
    brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
    offers: {
      '@type': 'Offer',
      url: await siteUrl(`/store/${subdomain}/product/${product.slug}`),
      priceCurrency: 'BDT',
      price: lowestPrice,
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
      {resolveTheme(store.theme) === 'MINIMAL' ? (
        <MinimalProductView {...viewProps} />
      ) : resolveTheme(store.theme) === 'STOREPAL' ? (
        <StorepalProductView
          {...viewProps}
          categoryDetails={categoryDetails}
          logoUrl={store.logoUrl}
          socialLinks={socialLinks}
          footerConfig={store.footerConfig}
        />
      ) : (
        <MediumProductView {...viewProps} />
      )}
    </>
  );
}
