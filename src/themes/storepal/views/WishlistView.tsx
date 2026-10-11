'use client';

import Link from 'next/link';
import type { StorefrontCategoryDetail, StorefrontProduct } from '@/lib/storefrontApi';
import type { StoreFooterConfig } from '@/lib/socialLinksApi';
import { StoreHeader } from '../components/StoreHeader';
import { StoreFooter } from '../components/StoreFooter';
import { ProductCard } from '../components/ProductCard';
import { useWishlist } from '../lib/wishlist';
import { useStoreText } from '../lib/storeText';
import { useEffect, useState } from 'react';
import { useCustomerAuthStore } from '@/providers/customer-auth-store-provider';
import { getServerWishlist, setWishlistNotify } from '@/lib/customerAuthApi';
import { useStorePalDesign } from '../lib/designSettings';

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
  const t = useStoreText();
  const { slugs } = useWishlist(subdomain);
  // "Tell me when the price falls or it is back" (TellMe idea 62): only for a logged-in shopper of a store that sends alerts.
  const design = useStorePalDesign();
  const bn = design.storeLanguage === 'bn';
  const accessToken = useCustomerAuthStore((s) => s.accessToken);
  const [notify, setNotify] = useState<Record<string, boolean>>({});
  const [alertError, setAlertError] = useState<string | null>(null);
  const alertsOn = !!design.wishlistAlertsEnabled && !!accessToken;
  useEffect(() => {
    if (!alertsOn || !accessToken) return;
    getServerWishlist(accessToken, subdomain)
      .then((r) => setNotify(Object.fromEntries(r.items.map((i) => [i.slug, i.notifyDrop]))))
      .catch(() => undefined);
  }, [alertsOn, accessToken, subdomain, slugs.length]);
  const toggleNotify = async (slug: string) => {
    if (!accessToken) return;
    setAlertError(null);
    try {
      const r = await setWishlistNotify(accessToken, subdomain, slug, !notify[slug]);
      setNotify(Object.fromEntries(r.items.map((i) => [i.slug, i.notifyDrop])));
    } catch (err) {
      setAlertError(err instanceof Error ? err.message : 'Could not change the alert.');
    }
  };
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
        <h1 className="text-[22px] font-bold text-ink mb-5">{t('Wishlist')}</h1>
        {alertError && <p className="mb-3 text-[12.5px] text-accent">{alertError}</p>}
        {saved.length === 0 ? (
          <div className="text-center py-16 bg-surface border border-line rounded-lg">
            <p className="text-[15px] font-semibold text-ink mb-1.5">{t('Your wishlist is empty')}</p>
            <p className="text-[13px] text-muted mb-4">{t('Tap the heart on any product to save it here.')}</p>
            <Link
              href={`/store/${subdomain}`}
              className="inline-block px-5 py-2.5 rounded-md bg-ink text-white text-[13px] font-semibold"
            >
              {t('Continue shopping')}
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:[grid-template-columns:repeat(auto-fill,minmax(200px,1fr))]">
            {saved.map((product) => (
              <div key={product.id} className="flex flex-col gap-1.5">
                <ProductCard product={product} subdomain={subdomain} storeName={storeName} />
                {alertsOn && (
                  <button
                    type="button"
                    onClick={() => void toggleNotify(product.slug)}
                    aria-pressed={!!notify[product.slug]}
                    className={`rounded-md border px-2 py-1.5 text-[12px] font-semibold ${notify[product.slug] ? 'border-ink bg-ink text-white' : 'border-line-strong bg-surface text-ink'}`}
                  >
                    {notify[product.slug]
                      ? bn ? 'দাম কমলে জানানো হবে ✓' : 'We will tell you ✓'
                      : bn ? 'দাম কমলে বা স্টক এলে জানান' : 'Tell me if cheaper or back in stock'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      <StoreFooter subdomain={subdomain} storeName={storeName} logoUrl={logoUrl} footerConfig={footerConfig} />
    </div>
  );
}
