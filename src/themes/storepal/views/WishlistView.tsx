'use client';

import Link from 'next/link';
import type { StorefrontCategoryDetail, StorefrontProduct } from '@/lib/storefrontApi';
import type { StoreFooterConfig } from '@/lib/socialLinksApi';
import { StoreHeader } from '../components/StoreHeader';
import { StoreFooter } from '../components/StoreFooter';
import { useWishlist } from '../lib/wishlist';
import { useStoreText, useFormatPrice } from '../lib/storeText';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ShoppingBag, X } from 'lucide-react';
import { isOutOfStock } from '@/lib/productDisplay';
import { useCartStore } from '@/providers/cart-store-provider';
import { formatPrice as plainPrice } from '../lib/formatPrice';
import { useCartDrawer } from '../lib/cartDrawer';
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
interface WishlistRowProps {
  product: StorefrontProduct;
  subdomain: string;
  storeName: string;
  alertsOn: boolean;
  notifying: boolean;
  onToggleNotify: () => void;
  onRemove: () => void;
}

/** One saved product: picture, name and option pickers, today's price, Add to Cart and a remove button. */
function WishlistRow({ product, subdomain, storeName, alertsOn, notifying, onToggleNotify, onRemove }: WishlistRowProps) {
  const formatPrice = useFormatPrice(plainPrice);
  const t = useStoreText();
  const design = useStorePalDesign();
  const bn = design.storeLanguage === 'bn';
  const router = useRouter();
  const addLine = useCartStore((s) => s.addLine);
  const openCartDrawer = useCartDrawer((s) => s.openDrawer);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [warn, setWarn] = useState(false);
  const [added, setAdded] = useState(false);

  const href = `/store/${subdomain}/product/${product.slug}`;
  const options = product.variationOptions ?? [];
  const hasVariations = product.variants.length > 0;
  const outOfStock = isOutOfStock(product);
  // Things only the product page can handle: a price on request, a coming-soon item, the shopper's own text.
  const needsProductPage = !!product.quoteOnly || !!product.comingSoon || !!(product.customFields && product.customFields.length > 0);

  const matchedVariant =
    options.length > 0 && options.every((o) => selected[o.name])
      ? product.variants.find((v) => options.every((o) => v.optionValues?.[o.name] === selected[o.name]))
      : undefined;
  const hasProductDiscount = Boolean(product.discountPrice) && Number(product.discountPrice) < Number(product.price);
  const displayPrice = matchedVariant?.discountPrice ?? matchedVariant?.listPrice ?? (hasProductDiscount ? product.discountPrice! : product.price);
  const originalPrice =
    matchedVariant?.discountPrice && matchedVariant.listPrice
      ? matchedVariant.listPrice
      : !matchedVariant && hasProductDiscount
        ? product.price
        : null;

  const addToCart = () => {
    if (needsProductPage || outOfStock) {
      router.push(href);
      return;
    }
    if (hasVariations && !matchedVariant) {
      setWarn(true);
      return;
    }
    if (matchedVariant && matchedVariant.stock <= 0 && !product.isPreOrder) {
      router.push(href);
      return;
    }
    addLine({
      subdomain,
      storeName,
      productSlug: product.slug,
      resaleGroup: product.resaleGroup ?? undefined,
      name: product.name,
      image: product.photoUrls[0],
      unitPrice: Number(displayPrice),
      originalUnitPrice: originalPrice ? Number(originalPrice) : undefined,
      quantity: Math.max(product.minOrderQuantity ?? 1, product.quantityStep ?? 1),
      selectedOptions: selected,
      isPreOrder: product.isPreOrder,
      minOrderQuantity: product.minOrderQuantity,
      quantityStep: product.quantityStep,
      productId: product.id,
      variantId: matchedVariant?.id,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
    openCartDrawer();
  };

  return (
    <li className="grid grid-cols-[88px_minmax(0,1fr)_40px] gap-x-4 gap-y-3 border-b border-line py-6 md:grid-cols-[minmax(0,1fr)_140px_220px_48px] md:items-center">
      <div className="col-span-2 flex gap-4 md:col-span-1">
        <Link href={href} className="relative block h-[88px] w-[88px] shrink-0 overflow-hidden bg-canvas">
          {product.photoUrls[0] && <Image src={product.photoUrls[0]} alt={product.name} fill sizes="88px" className="object-cover" />}
        </Link>
        <div className="min-w-0">
          <Link href={href} className="text-[15px] text-ink hover:underline">
            {product.name}
          </Link>
          {options.map((o) => (
            <div key={o.id} className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[13px] text-muted">{o.name}:</span>
              {o.values.map((v) => {
                const on = selected[o.name] === v;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => {
                      setSelected((s) => ({ ...s, [o.name]: v }));
                      setWarn(false);
                    }}
                    aria-pressed={on}
                    className={`min-w-[30px] rounded-sm border px-2 py-1 text-[12.5px] ${on ? 'border-ink bg-ink text-white' : 'border-line-strong bg-surface text-ink'}`}
                  >
                    {v}
                  </button>
                );
              })}
            </div>
          ))}
          {warn && <p className="mt-1.5 text-[12px] text-accent">{t('Choose an option first')}</p>}
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label={t('Remove from wishlist')}
        className="order-last row-start-1 col-start-3 flex h-8 w-8 items-center justify-center justify-self-end rounded-full border border-red-400 text-red-500 md:order-none md:row-auto md:col-start-4"
      >
        <X size={16} />
      </button>
      <div className="col-start-2 text-[15px] text-muted md:col-start-auto">
        {formatPrice(displayPrice)}
        {originalPrice && <span className="ml-2 text-[12.5px] line-through opacity-70">{formatPrice(originalPrice)}</span>}
      </div>
      <div className="col-span-3 flex flex-col gap-2 md:col-span-1 md:col-start-auto">
        <button
          type="button"
          onClick={addToCart}
          className="inline-flex items-center justify-center gap-2 rounded-sm bg-ink px-5 py-3 text-[13.5px] font-semibold text-white"
        >
          <ShoppingBag size={15} />
          {added ? t('Added ✓') : outOfStock ? t('Out of stock') : needsProductPage ? t('View Product') : t('Add to Cart')}
        </button>
        {alertsOn && (
          <button
            type="button"
            onClick={onToggleNotify}
            aria-pressed={notifying}
            className={`rounded-sm border px-2 py-1.5 text-[12px] font-semibold ${notifying ? 'border-ink bg-ink text-white' : 'border-line-strong bg-surface text-ink'}`}
          >
            {notifying
              ? bn ? 'দাম কমলে জানানো হবে ✓' : 'We will tell you ✓'
              : bn ? 'দাম কমলে বা স্টক এলে জানান' : 'Tell me if cheaper or back in stock'}
          </button>
        )}
      </div>
    </li>
  );
}

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
  const { slugs, toggle, clear } = useWishlist(subdomain);
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
      setAlertError(err instanceof Error ? err.message : t('Could not change the alert.'));
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
          <>
            <div className="hidden md:grid grid-cols-[minmax(0,1fr)_140px_220px_48px] gap-4 border-b border-line pb-3 text-[12.5px] font-semibold uppercase tracking-wide text-ink">
              <span>{t('Product')}</span>
              <span>{t('Price')}</span>
              <span>{t('Action')}</span>
              <span />
            </div>
            <ul>
              {saved.map((product) => (
                <WishlistRow
                  key={product.id}
                  product={product}
                  subdomain={subdomain}
                  storeName={storeName}
                  alertsOn={alertsOn}
                  notifying={!!notify[product.slug]}
                  onToggleNotify={() => void toggleNotify(product.slug)}
                  onRemove={() => toggle(product.slug)}
                />
              ))}
            </ul>
            <button
              type="button"
              onClick={clear}
              className="mt-6 rounded-sm bg-line px-8 py-4 text-[13px] font-semibold uppercase tracking-wide text-ink hover:bg-line-strong"
            >
              {t('Clear wishlist')}
            </button>
          </>
        )}
      </main>
      <StoreFooter subdomain={subdomain} storeName={storeName} logoUrl={logoUrl} footerConfig={footerConfig} />
    </div>
  );
}
