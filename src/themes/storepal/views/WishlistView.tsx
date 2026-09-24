'use client';

import Link from 'next/link';
import type { StorefrontCategoryDetail, StorefrontProduct } from '@/lib/storefrontApi';
import type { StoreFooterConfig } from '@/lib/socialLinksApi';
import { StoreHeader } from '../components/StoreHeader';
import { StoreFooter } from '../components/StoreFooter';
import { ProductCard } from '../components/ProductCard';
import { useWishlist } from '../lib/wishlist';

interface WishlistViewProps {
  subdomain: string;
  storeName: string;
  products: StorefrontProduct[];
  categories: string[];
  categoryDetails?: StorefrontCategoryDetail[];
  logoUrl?: string | null;
  footerConfig?: StoreFooterConfig | null;
}

/**
 * The shopper's wishlist (Store > Design > Product Card's "Show Wishlist
 * Button"). The saved slugs live in this browser; products are matched
 * against the live catalog, so a deleted or hidden product just drops out.
 */
export function WishlistView({
  subdomain,
  storeName,
  products,
  categories,
  categoryDetails,
  logoUrl,
  footerConfig,
}: WishlistViewProps) {
  const { slugs } = useWishlist(subdomain);
  const saved = slugs
    .map((slug) => products.find((p) => p.slug === slug))
    .filter((p): p is StorefrontProduct => !!p);

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <StoreHeader
        subdomain={subdomain}
        storeName={storeName}
        categories={categories}
        categoryDetails={categoryDetails}
        logoUrl={logoUrl}
      />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        <h1 className="text-[22px] font-bold text-ink mb-5">Wishlist</h1>
        {saved.length === 0 ? (
          <div className="text-center py-16 bg-surface border border-line rounded-lg">
            <p className="text-[15px] font-semibold text-ink mb-1.5">Your wishlist is empty</p>
            <p className="text-[13px] text-muted mb-4">Tap the heart on any product to save it here.</p>
            <Link
              href={`/store/${subdomain}`}
              className="inline-block px-5 py-2.5 rounded-md bg-ink text-white text-[13px] font-semibold"
            >
              Continue shopping
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:[grid-template-columns:repeat(auto-fill,minmax(200px,1fr))]">
            {saved.map((product) => (
              <ProductCard key={product.id} product={product} subdomain={subdomain} storeName={storeName} />
            ))}
          </div>
        )}
      </main>
      <StoreFooter subdomain={subdomain} storeName={storeName} logoUrl={logoUrl} footerConfig={footerConfig} />
    </div>
  );
}
