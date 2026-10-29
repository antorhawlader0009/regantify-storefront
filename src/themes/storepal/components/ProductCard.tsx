'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Check, Heart, ShoppingCart } from 'lucide-react';
import { plainText } from '@/lib/plainText';
import type { StorefrontVariant, StorefrontVariationOption } from '@/lib/storefrontApi';
import { isOutOfStock } from '@/lib/productDisplay';
import { useCartStore } from '@/providers/cart-store-provider';
import { formatPrice as plainPrice } from '../lib/formatPrice';
import { SoldRecentLine } from './SoldRecentLine';
import { RatingStars } from '@/components/RatingStars';
import { lowStockLabel, useLowStock, useShowOutOfStockBadge, useStorePalDesign, useStorePalLmsForms } from '../lib/designSettings';
import { useWishlist } from '../lib/wishlist';
import { FlashSaleTimer } from './FlashSaleTimer';
import { useCartDrawer } from '../lib/cartDrawer';
import { useCheckoutDialog } from '../lib/checkoutDialog';
import { trackMetaAddToWishlist } from '@/lib/metaPixelEvents';
import { trackAddToWishlist, trackSelectItem } from '@/lib/ecommerceEvents';
import { useStoreText, useFormatPrice } from '../lib/storeText';
import { preOrderDateText } from '../lib/preOrderDate';
import { CardSwatches } from '@/components/CardSwatches';
import { QuickAddSheet } from '@/components/QuickAddSheet';
import type { StorefrontCardSwatches } from '@/lib/storefrontApi';
import { trackFeature } from '@/lib/featureUse';

// Minimal shape ProductCard actually reads — satisfied by both the full
// StorefrontProduct (product listing/search) and the leaner
// StorefrontCardProduct (product detail page's related-products
// sidebar, see getStoreSidebar) without needing two near-identical
// card components — same convention as Medium's own ProductCard. Only
// the full shape carries variationOptions + per-variant prices, so
// inline Add to Cart / Buy Now only works for it; lean cards send those
// buttons to the product page instead.
interface CardProduct {
  /** Average stars from approved reviews (server storefront/product-rating.ts); null/missing = none. */
  rating?: { average: number; count: number } | null;
  /** Reseller system: the supplier key of a product this store resells (the cart keeps one seller per order). */
  resaleGroup?: string | null;
  // For the Meta pixel (cart line / AddToWishlist); every caller passes it,
  // but it's optional so a lean shape without it still type-checks.
  id?: string;
  slug: string;
  name: string;
  photoUrls: string[];
  price: string;
  discountPrice?: string | null;
  isPreOrder: boolean;
  /** Price on request (LMS-plan.md Step 9). */
  quoteOnly?: boolean;
  /** Fewest a shopper may order; Add to cart starts there. */
  minOrderQuantity?: number | null;
  /** Coming soon (TellMe idea 104). */
  comingSoon?: boolean;
  /** A box the shopper fills (IDEA-22): its items are picked on the product page. */
  bundlePick?: number | null;
  /** Sold in packs (TellMe idea 102). */
  quantityStep?: number;
  /** Most pieces one customer can order at once (the store's number or the default 5); null = no limit. */
  maxOrderQuantity?: number | null;
  unitLabel?: string | null;
  /** Buyers in the store's social-proof window (TellMe idea 63). */
  soldRecent?: number;
  /** Expected restock day while sold out (TellMe idea 114). */
  restockDate?: string | null;
  /** The store's own badge ("New", "Hot") — shown in the image's corner. */
  badgeText?: string | null;
  /** Running Flash Sale end (ISO) — shows the sale badge with a countdown. */
  flashSaleEndsAt?: string | null;
  variants: ({ stock: number } & Partial<Omit<StorefrontVariant, 'stock'>>)[];
  variationOptions?: StorefrontVariationOption[];
  stockQuantity?: number | null;
  summary?: string | null;
  videoUrl?: string | null;
  /** Colour circles (list answer only). */
  swatches?: StorefrontCardSwatches | null;
}

interface ProductCardProps {
  product: CardProduct;
  subdomain: string;
  /** Needed for inline Add to Cart / Buy Now (it goes on the cart line); without it those buttons open the product page. */
  storeName?: string;
}

/**
 * StorePal's product card. What it shows is driven by Store > Design >
 * Product Card Display Options / Product Display Options (see
 * useStorePalDesign). With nothing saved it's the original look: a white
 * bordered card, square photo, and a "View Product" button (matches the
 * reference category-listing screenshots rather than the whole card
 * being one click target the way Medium's ProductCard is).
 */
export function ProductCard({ product, subdomain, storeName }: ProductCardProps) {
  const formatPrice = useFormatPrice(plainPrice);
  const t = useStoreText();
  const design = useStorePalDesign();
  // A price-on-request product hides its price only while requests can reach the store (the product page's rule).
  const lmsForms = useStorePalLmsForms();
  const quoteOnly = !!product.quoteOnly && !!lmsForms;
  const showOutOfStockBadge = useShowOutOfStockBadge();
  const lowStockConfig = useLowStock();
  const router = useRouter();
  const addLine = useCartStore((s) => s.addLine);
  const openCartDrawer = useCartDrawer((s) => s.openDrawer);
  const openCheckout = useCheckoutDialog((s) => s.openDialog);
  const wishlist = useWishlist(subdomain);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [added, setAdded] = useState(false);
  const [variantWarning, setVariantWarning] = useState(false);
  const [hovering, setHovering] = useState(false);
  // Colour circles (shared CardSwatches): the photo of the colour pointed at replaces the card's picture.
  const [swatchPhoto, setSwatchPhoto] = useState<string | null>(null);
  // Quick add (shared QuickAddSheet): sizes and colours picked on the card instead of the product page.
  const [sheetOpen, setSheetOpen] = useState(false);

  const href = `/store/${subdomain}/product/${product.slug}`;
  const outOfStock = isOutOfStock(product);
  const options = product.variationOptions ?? [];
  const hasVariations = product.variants.length > 0;
  const fullData = product.variationOptions !== undefined && !!storeName;

  const wantsPurchaseButtons = design.cardShowAddToCart || design.cardShowBuyNow;
  const showOptions =
    fullData && !outOfStock && hasVariations && wantsPurchaseButtons && (design.cardOptionsAsButtons || design.cardOptionsAsSelect);
  // Inline purchase needs the full product data, stock, and (for a
  // product with variations) the option pickers on the card. Anything
  // else — including backorder, whose confirm popup lives on the product
  // page — goes to the product page.
  // A box the shopper fills (IDEA-22) needs its items picked, so it always opens the product page.
  const canBuyInline = fullData && !outOfStock && !product.bundlePick && (!hasVariations || showOptions);
  // A product with variations whose choices aren't on the card opens the quick add sheet instead.
  const quickAdd = fullData && !outOfStock && hasVariations && !showOptions;
  const photoFor = (option: string, value: string) =>
    product.swatches?.option === option ? (product.swatches.items.find((s) => s.value === value)?.photoUrl ?? null) : null;
  const chosenPhoto = options.map((o) => (selected[o.name] ? photoFor(o.name, selected[o.name]) : null)).find(Boolean) ?? null;
  const isAvailable = (option: string, value: string) =>
    product.isPreOrder ||
    product.variants.some(
      (v) =>
        v.optionValues?.[option] === value &&
        v.stock > 0 &&
        options.every((o) => o.name === option || !selected[o.name] || v.optionValues?.[o.name] === selected[o.name]),
    );

  const matchedVariant =
    options.length > 0 && options.every((o) => selected[o.name])
      ? product.variants.find((v) => options.every((o) => v.optionValues?.[o.name] === selected[o.name]))
      : undefined;

  // "Only 3 left": a plain product's stock, or the chosen variation's; never for pre-order.
  const lowStockText =
    product.isPreOrder || outOfStock
      ? null
      : lowStockLabel(lowStockConfig, design.storeLanguage, hasVariations ? matchedVariant?.stock : (product.stockQuantity ?? undefined));

  const hasProductDiscount = Boolean(product.discountPrice) && Number(product.discountPrice) < Number(product.price);
  const displayPrice = matchedVariant?.discountPrice ?? matchedVariant?.listPrice ?? (hasProductDiscount ? product.discountPrice! : product.price);
  const originalPrice =
    matchedVariant?.discountPrice && matchedVariant.listPrice
      ? matchedVariant.listPrice
      : !matchedVariant && hasProductDiscount
        ? product.price
        : null;

  const purchase = (kind: 'add' | 'buy', fromSheet = false) => {
    if (!canBuyInline && !(fromSheet && quickAdd)) {
      if (quickAdd) {
        setVariantWarning(false);
        setSheetOpen(true);
        trackFeature('QUICK_ADD');
        return;
      }
      router.push(href);
      return;
    }
    if (hasVariations && !matchedVariant) {
      setVariantWarning(true);
      return;
    }
    if (matchedVariant && matchedVariant.stock <= 0 && !product.isPreOrder) {
      router.push(href);
      return;
    }
    addLine({
      subdomain,
      storeName: storeName!,
      productSlug: product.slug,
      resaleGroup: product.resaleGroup ?? undefined,
      name: product.name,
      image: chosenPhoto ?? product.photoUrls[0],
      unitPrice: Number(displayPrice),
      originalUnitPrice: originalPrice ? Number(originalPrice) : undefined,
      quantity: Math.max(product.minOrderQuantity ?? 1, product.quantityStep ?? 1),
      selectedOptions: selected,
      isPreOrder: product.isPreOrder,
      minOrderQuantity: product.minOrderQuantity,
      quantityStep: product.quantityStep,
      // The cart never goes past the product's "most per order" (checkout refuses more anyway).
      maxQuantity: product.maxOrderQuantity ?? undefined,
      productId: product.id,
      variantId: matchedVariant?.id,
    });
    setSheetOpen(false);
    if (kind === 'buy') {
      openCheckout();
      return;
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
    openCartDrawer();
  };

  // "Show Button (Default)": Add to Cart for a simple product, View
  // Product for one with variations. Merged with the explicit toggles so
  // the same button never shows twice.
  const comingSoon = !!product.comingSoon;
  // With quick add, a product with variations gets Add to Cart too (it opens the sheet); View Product stays for the rest.
  const showView = !quoteOnly && (design.cardShowViewButton || (design.cardShowDefaultButton && hasVariations && !quickAdd));
  const showAddToCart =
    !quoteOnly && !comingSoon && (design.cardShowAddToCart || (design.cardShowDefaultButton && (!hasVariations || quickAdd)));
  const showBuyNow = !quoteOnly && !comingSoon && design.cardShowBuyNow;

  const video = design.cardShowVideo && product.videoUrl ? videoEmbed(product.videoUrl) : null;
  const inWishlist = wishlist.has(product.slug);
  const portrait = design.productImageShape === 'PORTRAIT';

  return (
    <div
      // GA4 select_item: any of the card's links to the product page (photo, name, button), not its other buttons.
      onClickCapture={(e) => {
        if (product.id && (e.target as HTMLElement).closest('a')?.getAttribute('href') === href) trackSelectItem({ ...product, id: product.id });
      }}
      data-rg="product-card"
      data-rg-product={product.slug}
      className={`flex flex-col overflow-hidden ${
        design.cardDisplayAsCard
          ? 'bg-surface border border-line rounded-md shadow-card hover:shadow-card-hover transition-shadow'
          : ''
      }`}
    >
      <div
        className={`relative bg-canvas ${portrait ? 'aspect-[3/4]' : 'aspect-square'} ${design.cardDisplayAsCard ? '' : 'rounded-md overflow-hidden'}`}
        onMouseEnter={video ? () => setHovering(true) : undefined}
        onMouseLeave={video ? () => setHovering(false) : undefined}
      >
        <Link href={href} className="absolute inset-0 block">
          {product.photoUrls[0] ? (
            <Image
              src={swatchPhoto ?? product.photoUrls[0]}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, 260px"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-muted text-[13px]">{t('No image')}</span>
            </div>
          )}
          {video && hovering && (
            <div className="absolute inset-0 bg-black pointer-events-none">
              {video.kind === 'file' ? (
                <video src={video.src} autoPlay muted loop playsInline className="w-full h-full object-cover" />
              ) : (
                <iframe
                  src={video.src}
                  title={product.name}
                  allow="autoplay; encrypted-media"
                  className="w-full h-full"
                />
              )}
            </div>
          )}
          {outOfStock && showOutOfStockBadge && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
              <span className="flex flex-col items-center gap-1">
                <span className="bg-ink text-white text-[11px] font-semibold px-2.5 py-1.5 rounded">{t('Out of Stock')}</span>
                {product.restockDate && (
                  <span className="bg-white/90 text-ink text-[10.5px] font-medium px-2 py-0.5 rounded">
                    {t('Back')} {preOrderDateText(product.restockDate, design.storeLanguage)}
                  </span>
                )}
              </span>
            </div>
          )}
        </Link>
        {product.badgeText && (
          <span
            className="absolute top-2 left-2 z-10 pointer-events-none rounded px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-white shadow-sm bg-accent"
            style={design.productBadgeColor ? { backgroundColor: design.productBadgeColor } : undefined}
          >
            {product.badgeText}
          </span>
        )}
        {!quoteOnly && product.flashSaleEndsAt && (
          <FlashSaleTimer endsAt={product.flashSaleEndsAt} className={`absolute ${product.badgeText ? "top-9" : "top-2"} left-2 z-10 pointer-events-none`} />
        )}
        {design.cardShowWishlist && (
          <button
            type="button"
            onClick={() => {
              if (!inWishlist && product.id) {
                trackMetaAddToWishlist({ ...product, id: product.id });
                trackAddToWishlist({ ...product, id: product.id });
              }
              wishlist.toggle(product.slug);
            }}
            aria-pressed={inWishlist}
            aria-label={inWishlist ? t('Remove from wishlist') : t('Add to wishlist')}
            className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-surface/90 shadow flex items-center justify-center text-ink hover:text-accent transition-colors"
          >
            <Heart size={16} className={inWishlist ? 'fill-accent text-accent' : ''} />
          </button>
        )}
      </div>

      <div className={`flex flex-col gap-1.5 flex-1 ${design.cardDisplayAsCard ? 'p-2.5 sm:p-3' : 'pt-2.5'}`}>
        <Link
          href={href}
          data-rg="product-card-title"
          className="text-[13.5px] font-semibold text-ink leading-snug line-clamp-2 min-h-[2.6em] hover:text-accent transition-colors"
        >
          {product.name}
        </Link>

        {product.rating && (
          <RatingStars
            rating={product.rating}
            size={12}
            className="text-[11.5px]"
            label={`Rated ${product.rating.average} out of 5 from ${product.rating.count} reviews`}
          />
        )}

        {product.swatches && !quoteOnly && !showOptions && (
          <CardSwatches
            swatches={product.swatches}
            active={selected[product.swatches.option]}
            onPick={(value, photoUrl) => {
              setSelected((prev) => ({ ...prev, [product.swatches!.option]: value }));
              if (photoUrl) setSwatchPhoto(photoUrl);
            }}
          />
        )}

        {design.cardShowSummary && plainText(product.summary) && (
          <p className="text-[12px] text-muted leading-snug line-clamp-2">{plainText(product.summary)}</p>
        )}

        {lowStockText && !quoteOnly && <p className="text-[11.5px] font-semibold text-accent-dark">{lowStockText}</p>}
        {!quoteOnly && <SoldRecentLine product={product} />}

        {comingSoon ? (
          <p className="text-[13.5px] font-bold text-accent">{t('Coming soon')}</p>
        ) : quoteOnly ? (
          <p className="text-[13.5px] font-bold text-ink">{t('Price on request')}</p>
        ) : (
          <div data-rg="product-card-price" className="flex gap-2 items-baseline flex-wrap">
            {originalPrice && <span className="text-muted line-through text-[12.5px]">{formatPrice(originalPrice)}</span>}
            <span className="font-bold text-[15px] text-accent">{formatPrice(displayPrice)}</span>
            {product.unitLabel && <span className="text-muted text-[12px]"> / {product.unitLabel}</span>}
          </div>
        )}

        {showOptions &&
          options.map((opt) =>
            design.cardOptionsAsButtons ? (
              <div key={opt.id} className="flex gap-1 flex-wrap">
                {opt.values.map((val) => {
                  const isSelected = selected[opt.name] === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        setSelected((prev) => ({ ...prev, [opt.name]: val }));
                        setVariantWarning(false);
                      }}
                      className={`px-2 py-1 rounded text-[11.5px] font-medium border transition-colors ${
                        isSelected ? 'border-accent bg-accent text-white' : 'border-line text-ink hover:border-accent'
                      }`}
                    >
                      {val}
                    </button>
                  );
                })}
              </div>
            ) : (
              <select
                key={opt.id}
                value={selected[opt.name] ?? ''}
                onChange={(e) => {
                  setSelected((prev) => ({ ...prev, [opt.name]: e.target.value }));
                  setVariantWarning(false);
                }}
                aria-label={opt.name}
                className="w-full px-2 py-1.5 rounded border border-line bg-surface text-[12px] text-ink"
              >
                <option value="" disabled>
                  {opt.name}
                </option>
                {opt.values.map((val) => (
                  <option key={val} value={val}>
                    {val}
                  </option>
                ))}
              </select>
            ),
          )}
        {variantWarning && <p className="text-[11.5px] text-accent-dark">{t('Select an option first.')}</p>}

        <div className="mt-auto flex flex-col gap-1.5 pt-1">
          {(showAddToCart || showBuyNow) && (
            <div className="flex gap-1.5">
              {showAddToCart && (
                <button
                  type="button"
                  onClick={() => purchase('add')}
                  data-rg="product-card-add-to-cart"
                  aria-label={t('Add to Cart')}
                  // With Buy Now beside it, a phone's two-column card has no room for both words: Add to Cart shrinks to a
                  // cart icon there and Buy Now takes the width. Alone, or from the small breakpoint up, it keeps its words.
                  className={`${showBuyNow ? 'w-10 flex-none sm:w-auto sm:flex-1' : 'flex-1'} flex items-center justify-center gap-1 py-2 rounded-md border border-ink text-[12.5px] font-semibold text-ink hover:bg-ink hover:text-white transition-colors`}
                >
                  {added ? (
                    <>
                      <Check size={13} aria-hidden />
                      <span className={showBuyNow ? 'hidden sm:inline' : ''}>{t('Added')}</span>
                    </>
                  ) : (
                    <>
                      {showBuyNow && <ShoppingCart size={15} className="sm:hidden" aria-hidden />}
                      <span className={showBuyNow ? 'hidden sm:inline' : ''}>{t('Add to Cart')}</span>
                    </>
                  )}
                </button>
              )}
              {showBuyNow && (
                <button
                  type="button"
                  onClick={() => purchase('buy')}
                  data-rg="product-card-buy-now"
                  className="flex-1 py-2 rounded-md bg-accent hover:bg-accent-dark text-white text-[12.5px] font-semibold transition-colors"
                >
                  {t('Buy Now')}
                </button>
              )}
            </div>
          )}
          {comingSoon && (
            <Link
              href={href}
              className="text-center py-2 rounded-md bg-accent hover:bg-accent-dark text-white text-[12.5px] font-semibold transition-colors"
            >
              {t('Notify me')}
            </Link>
          )}
          {quoteOnly && (
            <Link
              href={href}
              className="text-center py-2 rounded-md bg-accent hover:bg-accent-dark text-white text-[12.5px] font-semibold transition-colors"
            >
              {t('Request a price')}
            </Link>
          )}
          {showView && (
            <Link
              href={href}
              className="text-center py-2 rounded-md border border-line-strong text-[12.5px] font-semibold text-ink hover:bg-ink hover:text-white hover:border-ink transition-colors"
            >
              {t('View Product')}
            </Link>
          )}
        </div>
      </div>

      {quickAdd && (
        <QuickAddSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          name={product.name}
          image={product.photoUrls[0]}
          price={formatPrice(displayPrice)}
          originalPrice={originalPrice ? formatPrice(originalPrice) : null}
          options={options}
          selected={selected}
          onSelect={(option, value) => {
            setSelected((prev) => ({ ...prev, [option]: value }));
            setVariantWarning(false);
          }}
          isAvailable={isAvailable}
          photoFor={photoFor}
          note={lowStockText}
          warning={
            variantWarning
              ? t('Select an option first.')
              : matchedVariant && matchedVariant.stock <= 0 && !product.isPreOrder
                ? t('Out of Stock')
                : null
          }
          labels={{ addToCart: t('Add to Cart'), buyNow: showBuyNow ? t('Buy Now') : undefined, close: t('Close') }}
          onAdd={() => purchase('add', true)}
          onBuy={showBuyNow ? () => purchase('buy', true) : undefined}
        />
      )}
    </div>
  );
}

/** A muted, looping embed for Product.videoUrl: YouTube or a direct video file. Null for anything else. */
function videoEmbed(url: string): { kind: 'youtube' | 'file'; src: string } | null {
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/))([\w-]{11})/);
  if (yt) {
    const id = yt[1];
    return {
      kind: 'youtube',
      src: `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${id}&playsinline=1`,
    };
  }
  if (/\.(mp4|webm|ogg)(\?|#|$)/i.test(url)) return { kind: 'file', src: url };
  return null;
}
