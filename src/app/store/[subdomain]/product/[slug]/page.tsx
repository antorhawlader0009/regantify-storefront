import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getStoreProduct,
  getStoreSidebar,
  StoreNotFoundError,
  ProductNotFoundError,
  siteUrl,
} from '@/lib/storefrontApi';
import { StoreHeader } from '@/components/StoreHeader';
import { StoreFooter } from '@/components/StoreFooter';
import { ProductCard } from '@/components/ProductCard';
import { ProductPurchasePanel } from '@/components/ProductPurchasePanel';
import { ProductTabs } from '@/components/ProductTabs';
import { isOutOfStock } from '@/lib/productDisplay';

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
        url: siteUrl(canonicalPath),
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
    related: [] as Awaited<ReturnType<typeof getStoreSidebar>>['related'],
  }));
  const { categories, related } = sidebar;

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
      url: siteUrl(`/store/${subdomain}/product/${product.slug}`),
      priceCurrency: 'BDT',
      price: lowestPrice,
      availability: product.isPreOrder
        ? 'https://schema.org/PreOrder'
        : outOfStock
          ? 'https://schema.org/OutOfStock'
          : 'https://schema.org/InStock',
    },
  };

  return (
    <div className="min-h-screen bg-canvas text-ink pb-[70px] sm:pb-0">
      {/* Structured data for search engines — invisible to visitors,
          read by crawlers to power rich results (price/stock/rating
          shown directly in Google search listings). */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />

      <StoreHeader subdomain={subdomain} storeName={store.storeName} categories={categories} />

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
          <ProductPurchasePanel subdomain={subdomain} storeName={store.storeName} product={product} />
        </div>
      </main>

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-surface border border-line rounded mb-5">
          <ProductTabs description={product.description} />
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
        <StoreFooter subdomain={subdomain} storeName={store.storeName} />
      </div>
    </div>
  );
}
