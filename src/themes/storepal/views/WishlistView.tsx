'use client';

import Link from 'next/link';
import type { StorefrontProduct } from '@/lib/storefrontApi';
import { AccountLayout } from '../components/AccountLayout';
import { useWishlist } from '../lib/wishlist';
import { useStoreText, useFormatPrice } from '../lib/storeText';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Share2, ShoppingBag, X } from 'lucide-react';
import { encodeWishlistLink } from '@/lib/wishlistLink';
import { trackFeature } from '@/lib/featureUse';
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
  /** Absent on a list someone shared (SharedWishlistView): no remove button there. */
  onRemove?: () => void;
}

/** One saved product: picture, name and option pickers, today's price, Add to Cart and a remove button. */
export function WishlistRow({ product, subdomain, storeName, alertsOn, notifying, onToggleNotify, onRemove }: WishlistRowProps) {
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
    <li className="grid grid-cols-[88px_minmax(0,1fr)_40px] gap-x-4 gap-y-3 border-b border-line py-6 lg:grid-cols-[minmax(0,1fr)_140px_220px_48px] lg:items-center">
      <div className="col-span-2 flex gap-4 lg:col-span-1">
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
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={t('Remove from wishlist')}
          className="order-last row-start-1 col-start-3 flex h-8 w-8 items-center justify-center justify-self-end rounded-full border border-red-400 text-red-500 lg:order-none lg:row-auto lg:col-start-4"
        >
          <X size={16} />
        </button>
      ) : (
        <span className="order-last row-start-1 col-start-3 lg:order-none lg:row-auto lg:col-start-4" />
      )}
      <div className="col-start-2 text-[15px] text-muted lg:col-start-auto">
        {formatPrice(displayPrice)}
        {originalPrice && <span className="ml-2 text-[12.5px] line-through opacity-70">{formatPrice(originalPrice)}</span>}
      </div>
      <div className="col-span-3 flex flex-col gap-2 lg:col-span-1 lg:col-start-auto">
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

/**
 * "Share my list": a link holding the saved products (lib/wishlistLink.ts) to send to friends or family, so they know what to buy
 * as a gift. The sharer may add their name. The phone's share sheet when there is one, else WhatsApp and Copy link.
 */
function ShareWishlist({ subdomain, slugs }: { subdomain: string; slugs: string[] }) {
  const t = useStoreText();
  const customer = useCustomerAuthStore((s) => s.customer);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (open && !name && customer?.fullName) setName(customer.fullName);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fill the name once when the panel opens
  }, [open, customer?.fullName]);

  const link = () => `${window.location.origin}${window.location.pathname.replace(/\/wishlist\/?$/, '')}/wishlist/shared/${encodeWishlistLink(slugs, name)}`;
  const message = () => `${t('My wishlist')}: ${link()}`;
  const share = async () => {
    trackFeature('WISHLIST_SHARE');
    if (typeof navigator.share === 'function' && window.matchMedia('(pointer: coarse)').matches) {
      try {
        await navigator.share({ title: t('My wishlist'), url: link() });
        return;
      } catch {
        // Closed the sheet: nothing else to do.
        return;
      }
    }
    setOpen(true);
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div>
      <button type="button" onClick={() => (open ? setOpen(false) : void share())} className="inline-flex items-center gap-2 rounded-sm bg-ink px-8 py-4 text-[13px] font-semibold uppercase tracking-wide text-white">
        <Share2 size={15} />
        {t('Share my wishlist')}
      </button>
      {open && (
        <div className="mt-3 w-full max-w-sm rounded-md border border-line bg-surface p-3">
          <p className="m-0 text-[12.5px] text-muted">{t('Send your list to friends or family so they know what to gift you.')}</p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 40))}
            placeholder={t('Your name (optional)')}
            className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2 text-[13px] outline-none focus:border-ink"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(message())}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-line px-3 py-2 text-[12.5px] font-semibold text-ink hover:border-ink"
            >
              WhatsApp
            </a>
            <button type="button" onClick={() => void copy()} className="rounded-md border border-line px-3 py-2 text-[12.5px] font-semibold text-ink hover:border-ink">
              {copied ? t('Copied ✓') : t('Copy link')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function WishlistView({
  subdomain,
  storeName,
  products,
  categories,
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
    // Inside the My account dialog (2026-10-29, the owner's request), like Orders and Addresses; no page of its own.
    <AccountLayout subdomain={subdomain} storeName={storeName} categories={categories}>
      <div>
        <h2 className="text-[18px] font-bold text-ink mb-4">{t('Wishlist')}</h2>
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
            <div className="hidden lg:grid grid-cols-[minmax(0,1fr)_140px_220px_48px] gap-4 border-b border-line pb-3 text-[12.5px] font-semibold uppercase tracking-wide text-ink">
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
            <div className="mt-6 flex flex-wrap items-start gap-3">
              <ShareWishlist subdomain={subdomain} slugs={saved.map((p) => p.slug)} />
              <button
                type="button"
                onClick={clear}
                className="rounded-sm bg-line px-8 py-4 text-[13px] font-semibold uppercase tracking-wide text-ink hover:bg-line-strong"
              >
                {t('Clear wishlist')}
              </button>
            </div>
          </>
        )}
      </div>
    </AccountLayout>
  );
}
