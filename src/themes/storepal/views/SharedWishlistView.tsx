'use client';

import Link from 'next/link';
import { Gift } from 'lucide-react';
import type { StorefrontCategoryDetail, StorefrontProduct } from '@/lib/storefrontApi';
import type { StoreFooterConfig } from '@/lib/socialLinksApi';
import { StoreHeader } from '../components/StoreHeader';
import { StoreFooter } from '../components/StoreFooter';
import { WishlistRow } from './WishlistView';
import { useStoreText } from '../lib/storeText';

interface SharedWishlistViewProps {
  subdomain: string;
  storeName: string;
  ownerName: string | null;
  /** False when the link is broken (nothing could be read from it). */
  valid: boolean;
  products: StorefrontProduct[];
  /** Saved products that are no longer on sale (hidden or deleted). */
  missing: number;
  /** The store offers the gift option at checkout. */
  giftOn: boolean;
  categories: string[];
  categoryDetails?: StorefrontCategoryDetail[];
  logoUrl?: string | null;
  footerConfig?: StoreFooterConfig | null;
}

/**
 * A wishlist someone shared (lib/wishlistLink.ts): their saved products at today's price and stock, each with Add to Cart, so a
 * friend or family member can buy one as a gift. Nothing about the sharer is stored; the name is only what they typed in the link.
 */
export function SharedWishlistView({ subdomain, storeName, ownerName, valid, products, missing, giftOn, categories, categoryDetails, logoUrl, footerConfig }: SharedWishlistViewProps) {
  const t = useStoreText();
  const title = ownerName ? t("{name}'s wishlist").replace('{name}', ownerName) : t('A wishlist for you');

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <StoreHeader subdomain={subdomain} storeName={storeName} categories={categories} categoryDetails={categoryDetails} logoUrl={logoUrl} />
      <main className="max-w-6xl mx-auto px-3 sm:px-6 py-8 flex-1 w-full">
        <h1 className="text-[22px] font-bold text-ink mb-1.5">{title}</h1>
        {valid && products.length > 0 && (
          <p className="mb-5 flex items-start gap-2 text-[13px] text-muted">
            <Gift size={15} className="mt-0.5 shrink-0 text-accent" />
            {giftOn ? t('Pick something to gift. At checkout, tick "This is a gift" to send it to them with a message.') : t('Pick something to gift from this list.')}
          </p>
        )}
        {!valid || products.length === 0 ? (
          <div className="text-center py-16 bg-surface border border-line rounded-lg">
            <p className="text-[15px] font-semibold text-ink mb-1.5">{valid ? t('These products are not available right now.') : t('This wishlist link is not valid.')}</p>
            <Link href={`/store/${subdomain}`} className="mt-3 inline-block px-5 py-2.5 rounded-md bg-ink text-white text-[13px] font-semibold">
              {t('Continue shopping')}
            </Link>
          </div>
        ) : (
          <>
            <ul className="m-0 list-none divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface p-0">
              {products.map((product) => (
                <WishlistRow key={product.id} product={product} subdomain={subdomain} storeName={storeName} alertsOn={false} notifying={false} onToggleNotify={() => undefined} />
              ))}
            </ul>
            {missing > 0 && <p className="mt-4 text-[12.5px] text-muted">{t('{count} saved product(s) are no longer available.').replace('{count}', String(missing))}</p>}
          </>
        )}
      </main>
      <StoreFooter subdomain={subdomain} storeName={storeName} logoUrl={logoUrl} footerConfig={footerConfig} />
    </div>
  );
}
