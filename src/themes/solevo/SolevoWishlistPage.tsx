'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { StorefrontProduct } from '@/lib/storefrontApi';
import { isOutOfStock } from '@/lib/productDisplay';
import { encodeWishlistLink } from '@/lib/wishlistLink';
import { trackFeature } from '@/lib/featureUse';
import { useCartStore } from '@/providers/cart-store-provider';
import { useCustomerAuthStore } from '@/providers/customer-auth-store-provider';
import { getServerWishlist, setWishlistNotify } from '@/lib/customerAuthApi';
import { StoreHeader } from '../storepal/components/StoreHeader';
import { StoreFooter } from '../storepal/components/StoreFooter';
import { ProductCard } from '../storepal/components/ProductCard';
import { useWishlist } from '../storepal/lib/wishlist';
import { useStorePalDesign } from '../storepal/lib/designSettings';
import { useStoreText } from '../storepal/lib/storeText';
import { SolevoPageHeader } from './SolevoBreadcrumb';

interface Props {
  subdomain: string;
  storeName: string;
  categories: string[];
  products: StorefrontProduct[];
  logoUrl?: string | null;
}

/** Can this product go into the cart from a card, with no choice to make on its page? */
function addable(p: StorefrontProduct): boolean {
  return (
    p.variants.length === 0 &&
    !isOutOfStock(p) &&
    !p.quoteOnly &&
    !p.comingSoon &&
    !(p.customFields && p.customFields.length > 0) &&
    !p.bundlePick
  );
}

/**
 * Solevo's wishlist page, the template's WishlistView (templete/solevo WishlistView.tsx) on the store's real wishlist
 * (this browser's list, and the account's once signed in): the saved products as Solevo cards, Add All to Cart (only
 * the ones that need no choice; the rest are named), Clear Wishlist, Share my list, and the store's price-drop alerts
 * when it sends them.
 */
export function SolevoWishlistPage({ subdomain, storeName, categories, products, logoUrl }: Props) {
  const t = useStoreText();
  const router = useRouter();
  const design = useStorePalDesign();
  const bn = design.storeLanguage === 'bn';
  const { slugs, clear } = useWishlist(subdomain);
  const addLine = useCartStore((s) => s.addLine);
  const accessToken = useCustomerAuthStore((s) => s.accessToken);
  const customer = useCustomerAuthStore((s) => s.customer);
  const [ready, setReady] = useState(false);
  const [skipped, setSkipped] = useState<{ soldOut: string[]; choose: string[] }>({ soldOut: [], choose: [] });
  const [notify, setNotify] = useState<Record<string, boolean>>({});
  const [shareOpen, setShareOpen] = useState(false);
  const [shareName, setShareName] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => setReady(true), []);
  const alertsOn = !!design.wishlistAlertsEnabled && !!accessToken;
  useEffect(() => {
    if (!alertsOn || !accessToken) return;
    getServerWishlist(accessToken, subdomain)
      .then((r) => setNotify(Object.fromEntries(r.items.map((i) => [i.slug, i.notifyDrop]))))
      .catch(() => undefined);
  }, [alertsOn, accessToken, subdomain, slugs.length]);

  const list = slugs.map((slug) => products.find((p) => p.slug === slug)).filter((p): p is StorefrontProduct => !!p);

  const addAll = () => {
    const soldOut: string[] = [];
    const choose: string[] = [];
    for (const p of list) {
      if (!addable(p)) {
        (isOutOfStock(p) ? soldOut : choose).push(p.name);
        continue;
      }
      const sale = p.discountPrice && Number(p.discountPrice) < Number(p.price);
      addLine({
        subdomain,
        storeName,
        productSlug: p.slug,
        resaleGroup: p.resaleGroup ?? undefined,
        name: p.name,
        image: p.photoUrls[0],
        unitPrice: Number(sale ? p.discountPrice : p.price),
        originalUnitPrice: sale ? Number(p.price) : undefined,
        quantity: Math.max(p.minOrderQuantity ?? 1, p.quantityStep ?? 1),
        selectedOptions: {},
        isPreOrder: p.isPreOrder,
        minOrderQuantity: p.minOrderQuantity,
        quantityStep: p.quantityStep,
        productId: p.id,
      });
    }
    setSkipped({ soldOut, choose });
    if (soldOut.length === 0 && choose.length === 0) {
      router.push(`/store/${subdomain}/cart`);
    }
  };

  const toggleNotify = async (slug: string) => {
    if (!accessToken) return;
    try {
      const r = await setWishlistNotify(accessToken, subdomain, slug, !notify[slug]);
      setNotify(Object.fromEntries(r.items.map((i) => [i.slug, i.notifyDrop])));
    } catch {
      // The switch just stays as it was.
    }
  };

  const shareLink = () => `${window.location.origin}${window.location.pathname.replace(/\/wishlist\/?$/, '')}/wishlist/shared/${encodeWishlistLink(list.map((p) => p.slug), shareName)}`;
  const share = async () => {
    trackFeature('WISHLIST_SHARE');
    if (!shareName && customer?.fullName) setShareName(customer.fullName);
    if (typeof navigator.share === 'function' && window.matchMedia('(pointer: coarse)').matches) {
      try {
        await navigator.share({ title: t('My wishlist'), url: shareLink() });
      } catch {
        // Closed the share sheet.
      }
      return;
    }
    setShareOpen((v) => !v);
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareLink());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      <StoreHeader subdomain={subdomain} storeName={storeName} categories={categories} logoUrl={logoUrl} />
      <SolevoPageHeader
        subdomain={subdomain}
        homeLabel={t('Home')}
        crumbs={[{ label: t('Wishlist') }]}
        title={t('My Wishlist')}
        subtitle={ready ? t('{n} saved items').replace('{n}', String(list.length)) : null}
      >
        {ready && list.length > 0 && (
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <button type="button" className="sv-btn-dark flex-1 sm:flex-none" onClick={addAll}>
              {t('Add All to Cart')}
            </button>
            <button type="button" className="sv-btn-outline flex-1 sm:flex-none" onClick={() => void share()} aria-expanded={shareOpen}>
              {t('Share')}
            </button>
            <button type="button" className="sv-btn-outline flex-1 sm:flex-none" onClick={clear}>
              {t('Clear Wishlist')}
            </button>
          </div>
        )}
      </SolevoPageHeader>
      <main className="sv-wrap w-full flex-1 py-8 sm:py-10">

        {shareOpen && list.length > 0 && (
          <div className="mb-6 rounded-lg bg-[var(--sv-panel)] p-4 sm:ml-auto sm:max-w-md">
            <p className="text-[13px] text-muted">{t('Send your list to friends or family so they know what to gift you.')}</p>
            <input
              value={shareName}
              onChange={(e) => setShareName(e.target.value.slice(0, 40))}
              placeholder={t('Your name (optional)')}
              className="mt-2 w-full border border-black/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-ink"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${t('My wishlist')}: ${typeof window === 'undefined' ? '' : shareLink()}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-ink px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-white transition hover:bg-[var(--sv-gold)]"
              >
                WhatsApp
              </a>
              <button
                type="button"
                onClick={() => void copy()}
                className="border border-black/15 bg-white px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink transition hover:border-ink"
              >
                {copied ? t('Copied ✓') : t('Copy link')}
              </button>
            </div>
          </div>
        )}

        {(skipped.soldOut.length > 0 || skipped.choose.length > 0) && (
          <div className="mb-6 space-y-1 rounded-md bg-[var(--sv-sand)] px-4 py-3 text-xs" role="status">
            {skipped.choose.length > 0 && (
              <p>
                {t('Choose an option on these first:')} <b>{skipped.choose.join(', ')}</b>
              </p>
            )}
            {skipped.soldOut.length > 0 && (
              <p>
                {t('Out of stock, not added:')} <b>{skipped.soldOut.join(', ')}</b>
              </p>
            )}
            <Link href={`/store/${subdomain}/cart`} className="inline-block font-semibold underline underline-offset-2 hover:text-[var(--sv-gold)]">
              {t('Go to cart')}
            </Link>
          </div>
        )}

        {!ready ? (
          <div className="min-h-[40vh]" />
        ) : list.length === 0 ? (
          <div className="mx-auto max-w-md px-6 py-16 text-center">
            <p className="font-display text-xl font-semibold">{t('Your wishlist is empty')}</p>
            <p className="mt-2 text-sm text-ink/60">{t('Tap the heart on any product to save it here.')}</p>
            <Link href={`/store/${subdomain}`} className="sv-btn-dark mt-6">
              {t('Continue shopping')}
            </Link>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
            {list.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} subdomain={subdomain} storeName={storeName} />
                {alertsOn && (
                  <button
                    type="button"
                    onClick={() => void toggleNotify(p.slug)}
                    aria-pressed={!!notify[p.slug]}
                    className={`mt-2 w-full border px-2 py-2 text-[11px] font-semibold transition-colors ${
                      notify[p.slug] ? 'border-ink bg-ink text-white' : 'border-black/15 text-ink hover:border-ink'
                    }`}
                  >
                    {notify[p.slug]
                      ? bn ? 'দাম কমলে জানানো হবে ✓' : 'We will tell you ✓'
                      : bn ? 'দাম কমলে বা স্টক এলে জানান' : 'Tell me if cheaper or back in stock'}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
      <StoreFooter subdomain={subdomain} storeName={storeName} logoUrl={logoUrl} />
    </div>
  );
}
