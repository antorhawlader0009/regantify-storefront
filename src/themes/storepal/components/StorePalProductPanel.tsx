'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Minus, Plus, PlayCircle } from 'lucide-react';
import type { StorefrontProduct } from '@/lib/storefrontApi';
import { ProductVideo } from '@/components/ProductVideo';
import { HoverZoom, PhotoViewer } from '@/components/ProductImageViewer';
import { isOutOfStock } from '@/lib/productDisplay';
// Whole taka like the cards, cart and checkout (the shared formatter shows ".00").
import { formatPrice as plainPrice } from '../lib/formatPrice';
import { useCartStore } from '@/providers/cart-store-provider';
import { useStoreText, useFormatPrice } from '../lib/storeText';
import { useUsdPrice } from '@/lib/usdPrice';
import { BundlePicker, pickedCount, type BundlePickState } from './BundlePicker';
import { useStorePalDesign } from '../lib/designSettings';
import { preOrderDateText } from '../lib/preOrderDate';
import { priceWithBreaks } from '@/lib/priceBreaks';
import { SizeGuideLink } from './SizeGuideLink';
import { useWholesalePrices } from '../lib/wholesale';
import { trackFeature } from '@/lib/featureUse';
import { plainText } from '@/lib/plainText';
import { ComingSoonNotify } from './ComingSoonNotify';
import { RatingStars } from '@/components/RatingStars';
import { CoverFloating } from '@/lib/floatingCover';
import { QuickAddSheet } from '@/components/QuickAddSheet';

interface StorePalProductPanelProps {
  subdomain: string;
  /** Show "Tell me when it is back" under the buttons when the chosen size/colour is sold out (StorePalPurchasePanel decides). */
  variantRestock?: boolean;
  storeName: string;
  product: StorefrontProduct;
  /**
   * Store > Stock Settings' backorder (see themes/storepal/lib/backorder.ts).
   * Only StorePal passes it; without it the panel keeps its hard
   * out-of-stock block, so Medium/Minimal behave exactly as before. With
   * it, out-of-stock items stay purchasable: the stock line shows the
   * short message and Add to Cart / Buy Now first confirm the popup one.
   */
  backorder?: { popupMessageHtml: string; shortMessage: string } | null;
  /**
   * Store > Design > Product Display Options (see themes/storepal/
   * components/StorePalPurchasePanel.tsx). Only StorePal passes it; without
   * it the gallery and stock wording are exactly as before, so
   * Medium/Minimal are unaffected.
   */
  display?: {
    // PORTRAIT forces 3:4 photos; SQUARE still honors product.photoSize.
    imageShape: 'SQUARE' | 'PORTRAIT';
    galleryStyle: 'LEFT' | 'BOTTOM' | 'RIGHT';
    inStock: (stock: number | undefined) => string;
    /** True when the stock line is the red "Only 3 left" one (Store > Stock Settings). */
    isLowStock?: (stock: number | undefined) => boolean;
    outOfStock: string;
    preOrder: string;
    /** The store's language, for the pre-order date wording. */
    language?: string;
  };
  /**
   * LMS store forms (LMS-plan.md Step 9; see themes/storepal/components/
   * StorePalPurchasePanel.tsx). Only StorePal passes them; without them the
   * panel is exactly as before, so Medium/Minimal are unaffected.
   */
  leadSlots?: {
    /** Replaces the price box (a price-on-request product). */
    price?: ReactNode;
    /** Replaces quantity, Add to Cart / Buy Now and the sticky mobile bar ("Notify me", "Request a price"). */
    purchase?: ReactNode;
    /** Under the buttons ("Call me back"). */
    after?: ReactNode;
  };
  /** Beside the product name (StorePal's Share button, TellMe idea 61). */
  titleExtra?: ReactNode;
  /**
   * Called after "Add to Cart" (not "Buy Now", which goes straight to checkout).
   * Only StorePal passes it, to open its slide-in cart; without it nothing
   * changes, so Medium/Minimal are unaffected.
   */
  onAddedToCart?: () => void;
  /**
   * Called after "Buy Now" has added the line, instead of going to /checkout.
   * Only StorePal passes it, to open its checkout dialog.
   */
  onBuyNow?: () => void;
}

/**
 * StorePal's own copy of Medium's ProductPurchasePanel (themes/medium is never edited for StorePal),
 * with its labels through useStoreText() so Store > Design > Store language: Bangla covers the
 * product page too. Keep purchase logic changes in step with the Medium file by hand.
 *
 * Everything on the product page that needs client-side interactivity:
 * photo gallery selection, variant picking, quantity, Add to Cart / Buy
 * Now. Kept separate from the surrounding server-rendered page (name,
 * description, breadcrumb, related products) so only this part ships as
 * client JS - the rest stays server-rendered HTML for fast first paint
 * and SEO. Purchase logic (stock check, variant matching, cart line
 * construction) is unchanged from the audited version - only the visual
 * treatment is refined here.
 */
export function StorePalProductPanel({ subdomain, storeName, product, backorder, display, leadSlots, titleExtra, onAddedToCart, onBuyNow, variantRestock = false }: StorePalProductPanelProps) {
  const formatPrice = useFormatPrice(plainPrice);
  // Gift senders abroad: "≈ US$X" beside the price, only for a visitor whose browser is not on Bangladesh time (lib/usdPrice.tsx).
  const usd = useUsdPrice();
  const t = useStoreText();
  const design = useStorePalDesign();
  const router = useRouter();
  const addLine = useCartStore((s) => s.addLine);
  const outOfStock = isOutOfStock(product);

  const [activePhoto, setActivePhoto] = useState(0);
  // Full-screen photo viewer (shared PhotoViewer); null = closed.
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [selected, setSelected] = useState<Record<string, string>>({});
  // Product.minOrderQuantity: the picker starts there and never goes below it.
  // Sold in packs (TellMe idea 102): +/- move one pack; the first quantity is one pack at least.
  const packStep = product.quantityStep ?? 1;
  const minQty = Math.max(product.minOrderQuantity ?? 1, packStep);
  const [quantity, setQuantity] = useState(packStep > 1 ? Math.ceil(minQty / packStep) * packStep : minQty);
  const [added, setAdded] = useState(false);
  const [variantWarning, setVariantWarning] = useState(false);
  // Backorder confirm popup - holds the action (add / buy) to run on Continue.
  const [pendingBackorderAction, setPendingBackorderAction] = useState<(() => void) | null>(null);

  const matchedVariant =
    product.variationOptions.length > 0 && product.variationOptions.every((opt) => selected[opt.name])
      ? product.variants.find((v) =>
          product.variationOptions.every((opt) => v.optionValues[opt.name] === selected[opt.name]),
        )
      : undefined;

  const needsVariantSelection = product.variationOptions.length > 0 && !matchedVariant;

  // Sold-out sizes and colours are greyed and struck through, judged with the other options already picked: a value is
  // sold out when every variation it can still make has no stock (or none exists). They stay pressable, so the shopper
  // can pick one and ask to be told when it is back. Pre-order products and stores taking backorders sell regardless.
  const markSoldOut = !product.isPreOrder && !backorder && product.variants.length > 0;
  const valueSoldOut = (optName: string, val: string) => {
    if (!markSoldOut) return false;
    const want: Record<string, string> = { ...selected, [optName]: val };
    const fits = product.variants.filter((v) => Object.entries(want).every(([k, x]) => v.optionValues[k] === x));
    return fits.length === 0 || fits.every((v) => v.stock <= 0);
  };

  // The size guide (Store > Product > Size Guides) sits beside the Size choice: the option named like a size, else
  // the first one; a product with no choices at all gets it as a plain link.
  const sizeGuide = product.sizeGuide ?? null;
  const sizeGuideOptionId = sizeGuide
    ? (product.variationOptions.find((o) => /size|সাইজ|মাপ/i.test(o.name)) ?? product.variationOptions[0])?.id
    : undefined;

  // Defensive: normalize once, since older cached API responses (before
  // this field existed) or an in-flight backend deploy could still omit
  // variationPhotos entirely, and every accessor below assumes an array.
  const variationPhotos = product.variationPhotos ?? [];

  // Matches option names/values the same way the vendor form saves them
  // (trimmed) but case- and whitespace-insensitively on top of that, so a
  // stray casing difference between VariationOption.name and
  // VariationValuePhoto.optionName/optionValue (or between either of
  // those and what's clicked here) can never silently break the photo
  // lookup - the swatch/thumbnail would still show correctly by
  // coincidence in that case, only the "jump to this photo" behavior
  // would quietly fail, which is exactly the bug this guards against.
  const normalize = (s: string) => s.trim().toLowerCase();
  const findVariationPhoto = (optionName: string, optionValue: string) =>
    variationPhotos.find(
      (vp) => normalize(vp.optionName) === normalize(optionName) && normalize(vp.optionValue) === normalize(optionValue),
    );

  // Which single variation option (if any) has its own photo sets - set
  // on Add/Edit Product's "Variation Photos" section (e.g. "Color").
  // There's at most one such option per product by design (see
  // VariationValuePhoto on the server), so this looks for the first
  // entry that actually HAS photos - not just the array's first entry,
  // which could be a stale empty one (e.g. from a record saved before
  // ProductsService started filtering those out on save). Resolved back
  // against the product's own variationOptions list (matched
  // case/whitespace-insensitively) so the rest of this component can key
  // off the exact string used in `selected` and in each option's
  // `.name`/`.values`.
  const firstPhotoEntry = variationPhotos.find((vp) => vp.photoUrls.length > 0);
  const photoOptionName = firstPhotoEntry
    ? product.variationOptions.find((o) => normalize(o.name) === normalize(firstPhotoEntry.optionName))?.name
    : undefined;

  // The full gallery always shows everything: the product's base photos,
  // then every variation value's photos in that option's own value order
  // (e.g. base photos, then Black's photos, then Blue's photos) - not
  // just the currently selected value's photos. A duplicate URL (the
  // vendor re-using the same image for the base product and a variant)
  // is only shown once, at its first occurrence.
  const allPhotos = (() => {
    const ordered = [...product.photoUrls];
    if (photoOptionName) {
      const option = product.variationOptions.find((o) => o.name === photoOptionName);
      for (const value of option?.values ?? []) {
        const photos = findVariationPhoto(photoOptionName, value)?.photoUrls;
        for (const url of photos ?? []) {
          if (!ordered.includes(url)) ordered.push(url);
        }
      }
    }
    return ordered;
  })();

  // The selected value's own first photo, if it has one.
  const selectedValuePhoto = photoOptionName
    ? findVariationPhoto(photoOptionName, selected[photoOptionName] ?? '')?.photoUrls[0]
    : undefined;

  // activePhoto (the index into allPhotos) is the single source of truth
  // for what's displayed - this effect only ever *sets* it in reaction to
  // a variant selection changing; a manual thumbnail click afterward sets
  // activePhoto directly and is left alone until the selection changes
  // again. Keyed on the selected value itself (not on selectedValuePhoto,
  // which is a derived string that can coincidentally repeat), so this
  // fires exactly once per actual selection change.
  useEffect(() => {
    if (!photoOptionName) return;
    const value = selected[photoOptionName];
    if (!value || !selectedValuePhoto) return;
    const index = allPhotos.indexOf(selectedValuePhoto);
    if (index !== -1) setActivePhoto(index);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoOptionName, selected[photoOptionName ?? '']]);

  const activePhotoUrl = allPhotos[activePhoto] ?? allPhotos[0];

  const regularPrice = matchedVariant?.discountPrice ?? matchedVariant?.listPrice ?? product.discountPrice ?? product.price;
  // Wholesale price (TellMe idea 79): only for a logged-in shopper with the store's wholesale tag; the lowest price wins, as at checkout.
  const wholesaleOffer = useWholesalePrices(subdomain)[product.slug];
  const wholesaleApplied = wholesaleOffer !== undefined && wholesaleOffer > 0 && wholesaleOffer < Number(regularPrice);
  const displayPrice = wholesaleApplied ? wholesaleOffer : regularPrice;
  const regularOriginalPrice =
    matchedVariant?.discountPrice && matchedVariant?.listPrice
      ? matchedVariant.listPrice
      : !matchedVariant && product.discountPrice
        ? product.price
        : null;
  const displayOriginalPrice = wholesaleApplied ? (regularOriginalPrice ?? regularPrice) : regularOriginalPrice;

  // Quantity price breaks (TellMe idea 67): the price follows the quantity chosen here; the cart applies the same rule to all of
  // the product's pieces together.
  const breaks = product.priceBreaks ?? [];
  const brokenPrice = priceWithBreaks(Number(displayPrice), breaks, quantity);
  const breakApplied = breaks.length > 0 && brokenPrice < Number(displayPrice);
  const percentOff = displayOriginalPrice
    ? Math.round(((Number(displayOriginalPrice) - Number(displayPrice)) / Number(displayOriginalPrice)) * 100)
    : 0;
  const saveAmount = displayOriginalPrice ? Number(displayOriginalPrice) - Number(displayPrice) : 0;

  const availableStock = matchedVariant ? matchedVariant.stock : (product.stockQuantity ?? undefined);
  // A matched variant with its own zero stock must block purchase even
  // though the product as a whole isn't out of stock (isOutOfStock only
  // checks whether EVERY variant is at zero) - otherwise a shopper could
  // select a specific sold-out combination (e.g. Black, Size 30) while a
  // different one (Blue, Size 30) still has stock, and Add to Cart/Buy
  // Now would stay enabled for the combination that has none.
  const selectedVariantOutOfStock = !product.isPreOrder && matchedVariant !== undefined && matchedVariant.stock <= 0;
  const canPurchase = product.isPreOrder || !!backorder || (!outOfStock && !selectedVariantOutOfStock);
  // With backorder on, quantity isn't capped at stock; this is what the
  // popup below confirms before the line goes into the cart.
  const isBackorderSelection =
    !!backorder &&
    !product.isPreOrder &&
    (outOfStock || selectedVariantOutOfStock || (availableStock !== undefined && quantity > availableStock));
  // Stock, and the store's "most per order" for this product (TellMe idea 56), whichever is smaller.
  const stockCap = backorder ? undefined : availableStock;
  const maxPerOrder = product.maxOrderQuantity ?? undefined;
  const quantityCap = stockCap !== undefined && maxPerOrder !== undefined ? Math.min(stockCap, maxPerOrder) : (stockCap ?? maxPerOrder);

  const buildLine = () => ({
    subdomain,
    storeName,
    productSlug: product.slug,
    resaleGroup: product.resaleGroup ?? undefined,
    name: product.name,
    image: activePhotoUrl,
    // The price without a step; the cart store lowers it to the break price for the product's total pieces (applyBreaks).
    unitPrice: Number(displayPrice) + customFeeNow,
    basePrice: Number(displayPrice),
    ...(pickBox && pickedCount(picks) === pickBox
      ? {
          bundlePicks: pickList,
          customDisplay: [{ label: t('Your picks'), value: pickList.map((p) => `${p.name} ×${p.quantity}`).join(', ') }],
        }
      : {}),
    ...(customFilled
      ? {
          customValues: Object.fromEntries(customFields.filter((f) => (customAnswers[f.id] ?? '').trim()).map((f) => [f.id, customAnswers[f.id].trim().slice(0, f.maxLength)])),
          customDisplay: customFields.filter((f) => (customAnswers[f.id] ?? '').trim()).map((f) => ({ label: f.label, value: customAnswers[f.id].trim().slice(0, f.maxLength) })),
          customFee: customFeeNow || undefined,
        }
      : {}),
    priceBreaks: breaks.length > 0 ? breaks : undefined,
    originalUnitPrice: displayOriginalPrice ? Number(displayOriginalPrice) : undefined,
    quantity,
    selectedOptions: selected,
    isPreOrder: product.isPreOrder,
    preOrderDate: product.isPreOrder ? (product.preOrderDate ?? undefined) : undefined,
    minOrderQuantity: product.minOrderQuantity,
    quantityStep: packStep > 1 ? packStep : undefined,
    maxQuantity: quantityCap,
    // For StorePal's Meta pixel content_ids (see stores/cart-store.ts).
    productId: product.id,
    variantId: matchedVariant?.id,
  });

  const addToCart = () => {
    addLine(buildLine());
    setPicks({});
    if (pickBox) trackFeature('BOX_ADDED');
    onAddedToCart?.();
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  const buyNow = () => {
    addLine(buildLine());
    setPicks({});
    if (pickBox) trackFeature('BOX_ADDED');
    if (onBuyNow) {
      onBuyNow();
      return;
    }
    router.push(`/store/${subdomain}/checkout`);
  };

  // The shopper's own text (TellMe idea 75): a required box left empty stops the order of this product.
  const customFields = product.isBundle ? [] : (product.customFields ?? []);
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});
  const [customError, setCustomError] = useState<string | null>(null);
  const customFilled = customFields.some((f) => (customAnswers[f.id] ?? '').trim());
  const customFeeNow = customFilled && product.customFee ? Number(product.customFee) : 0;
  const customProblem = () => {
    const missing = customFields.find((f) => f.required && !(customAnswers[f.id] ?? '').trim());
    if (!missing) return false;
    setCustomError(`${missing.label}${display?.language === 'bn' ? ' লিখুন' : ' is required'}`);
    return true;
  };

  // A box the shopper fills (IDEA-22): the box must be full before it goes in the cart.
  const pickBox = product.bundle?.pick ?? 0;
  const [picks, setPicks] = useState<BundlePickState>({});
  const [pickError, setPickError] = useState<string | null>(null);
  const pickList = Object.entries(picks).map(([productId, quantity]) => ({ productId, quantity, name: product.bundle?.items.find((i) => (i.productId ?? i.name) === productId)?.name ?? '' }));
  const pickProblem = () => {
    if (!pickBox || pickedCount(picks) === pickBox) return false;
    setPickError(t('Pick exactly {n} items first.').replace('{n}', String(pickBox)));
    return true;
  };

  const handleAddToCart = () => {
    if (pickProblem()) return;
    if (customProblem()) return;
    setCustomError(null);
    if (needsVariantSelection) {
      setVariantWarning(true);
      return;
    }
    setVariantWarning(false);
    if (isBackorderSelection) {
      setPendingBackorderAction(() => addToCart);
      return;
    }
    addToCart();
  };

  const handleBuyNow = () => {
    if (pickProblem()) return;
    if (customProblem()) return;
    setCustomError(null);
    if (needsVariantSelection) {
      setVariantWarning(true);
      return;
    }
    if (!canPurchase) return;
    if (isBackorderSelection) {
      setPendingBackorderAction(() => buyNow);
      return;
    }
    buyNow();
  };

  // Add to Cart and Buy Now on a product with sizes or colours open the bottom sheet first (2026-10-29, the owner's request),
  // the same one product cards use, unless every option is already picked. It shares `selected` with this page, so a size
  // already picked here shows picked there.
  const hasChoices = product.variationOptions.length > 0;
  const [sheet, setSheet] = useState<'add' | 'buy' | null>(null);
  const openSheetOr = (kind: 'add' | 'buy', act: () => void) => {
    // Every option already picked on the page: no sheet, straight to the action. Problems the sheet can't show (a box to
    // fill, the shopper's own text) are shown on the page as before.
    if (!hasChoices || !needsVariantSelection || pickProblem() || customProblem()) {
      act();
      return;
    }
    setVariantWarning(false);
    setSheet(kind);
  };
  const fromSheet = (act: () => void) => {
    if (needsVariantSelection) {
      setVariantWarning(true);
      return;
    }
    setSheet(null);
    act();
  };

  const portrait = display?.imageShape === 'PORTRAIT' || product.photoSize === 'PORTRAIT';
  // Thumbnails beside the photo instead of under it (StorePal's Gallery
  // Style). Only when there's more than one photo to pick from.
  const sideGallery = !!display && display.galleryStyle !== 'BOTTOM' && allPhotos.length > 1;
  const inStockText = (stock: number | undefined) =>
    display ? display.inStock(stock) : stock === undefined ? t('In stock') : `${stock} ${t('units in stock')}`;

  return (
    <>
      {/* Gallery */}
      <div data-rg="product-gallery">
        <div className={sideGallery ? `flex gap-3 items-start ${display.galleryStyle === 'LEFT' ? 'flex-row-reverse' : ''}` : ''}>
        <HoverZoom
          src={activePhotoUrl}
          onOpen={() => setViewerIndex(activePhoto)}
          label={t('Open photo')}
          className={`bg-canvas rounded-xl overflow-hidden ${sideGallery ? 'flex-1 min-w-0' : 'mb-3'} ${portrait ? 'aspect-[3/4]' : 'aspect-square'}`}
        >
          {activePhotoUrl ? (
            <Image
              key={activePhotoUrl}
              src={activePhotoUrl}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 900px) 100vw, 550px"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-muted text-[13px]">No image</span>
            </div>
          )}
          {displayOriginalPrice && (
            <span className="absolute top-3 left-3 z-[3] pointer-events-none bg-accent text-white text-[12px] font-bold px-2.5 py-1 rounded shadow-sm">
              -{percentOff}%
            </span>
          )}
        </HoverZoom>
        <PhotoViewer
          photos={allPhotos}
          index={viewerIndex}
          onIndexChange={(k) => {
            setViewerIndex(k);
            setActivePhoto(k);
          }}
          onClose={() => setViewerIndex(null)}
          title={product.name}
          labels={{ close: t('Close'), previous: t('Previous photo'), next: t('Next photo'), zoomIn: t('Zoom in'), zoomOut: t('Zoom out') }}
        />
        {allPhotos.length > 1 && (
          <div className={sideGallery ? 'flex flex-col gap-2 shrink-0 max-h-[520px] overflow-y-auto p-0.5' : 'flex gap-2 flex-wrap'}>
            {allPhotos.map((url, i) => (
              <button
                key={url + i}
                onClick={() => setActivePhoto(i)}
                aria-label={`${t('Open photo')} ${i + 1}`}
                aria-current={i === activePhoto ? 'true' : undefined}
                className={`relative w-16 h-16 shrink-0 overflow-hidden p-0 cursor-pointer bg-canvas rounded-lg transition-all ${
                  i === activePhoto ? 'ring-2 ring-accent ring-offset-2 ring-offset-surface' : 'ring-1 ring-line hover:ring-line-strong opacity-70 hover:opacity-100'
                }`}
              >
                <Image src={url} alt="" fill sizes="64px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
        </div>
        {product.video ? (
          <div className="mt-4">
            <p className="mb-2 text-[13px] font-semibold text-ink">{t('Product video')}</p>
            <ProductVideo
              video={product.video}
              fallbackPoster={product.photoUrls[0] ?? null}
              title={product.name}
              className="text-accent"
              labels={{ play: t('Play product video'), watchOn: (platform) => t('Watch on {platform}').replace('{platform}', platform) }}
            />
          </div>
        ) : (
          product.videoUrl && (
            <a
              href={product.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 text-[12.5px] text-accent font-semibold hover:text-accent-dark"
            >
              <PlayCircle size={15} />
              {t('Watch product video')}
            </a>
          )
        )}
      </div>

      {/* Info & Purchase */}
      <div>
        {product.badgeText && (
          <span
            className="mb-1.5 inline-block rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white bg-accent"
            style={design.productBadgeColor ? { backgroundColor: design.productBadgeColor } : undefined}
          >
            {product.badgeText}
          </span>
        )}
        {product.brand && <p className="m-0 text-[13px] font-medium text-muted">{product.brand}</p>}
        <div className="flex items-start justify-between gap-3">
          <h1 data-rg="product-title" className="mt-0.5 mb-2 text-[22px] sm:text-[28px] font-bold leading-[1.15] text-ink tracking-[-0.015em] [text-wrap:balance]">{product.name}</h1>
          {titleExtra}
        </div>

        {/* Average stars (approved reviews only, from 3 of them); a tap opens the Reviews tab below. */}
        {product.rating && (
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('storepal:open-reviews'))}
            className="mb-3 -mt-1 flex items-center gap-1 rounded text-[13px] hover:underline underline-offset-2"
          >
            <RatingStars rating={product.rating} label={`Rated ${product.rating.average} out of 5 from ${product.rating.count} reviews`} />
            <span className="text-muted">{t('reviews')}</span>
          </button>
        )}

        {(product.category || product.secondaryCategories.length > 0) && (
          <div className="flex gap-1.5 flex-wrap mb-5">
            {product.category && (
              <Link
                href={`/store/${subdomain}?category=${encodeURIComponent(product.category)}`}
                className="text-[12px] text-muted bg-canvas rounded-full px-2.5 py-1 no-underline hover:bg-accent-light hover:text-accent transition-colors"
              >
                {product.category}
              </Link>
            )}
            {product.secondaryCategories.map((c) => (
              <span key={c} className="text-[12px] text-muted bg-canvas rounded-full px-2.5 py-1">
                {c}
              </span>
            ))}
          </div>
        )}

        {leadSlots?.price ?? (
          <>
        {/* Open price block between two hairlines: the big number is the
            anchor, in the store accent only when it is a sale price, so the
            panel no longer reads like a tinted warning box. */}
        <div data-rg="product-price" className="border-y border-line py-4 mb-5">
          <div className="flex gap-x-3 gap-y-2 items-baseline flex-wrap">
            <span className={`text-[30px] sm:text-[34px] leading-none font-extrabold tracking-tight tabular-nums ${displayOriginalPrice || breakApplied ? 'text-accent' : 'text-ink'}`}>{formatPrice(breakApplied ? brokenPrice : displayPrice)}</span>
            {product.unitLabel && <span className="text-muted text-[14px]">/ {product.unitLabel}</span>}
            {usd(breakApplied ? brokenPrice : displayPrice) && (
              <span className="text-muted text-[13px]">{usd(breakApplied ? brokenPrice : displayPrice)}</span>
            )}
            {wholesaleApplied && <span className="rounded bg-accent px-1.5 py-0.5 text-[11px] font-semibold text-white">{t('Wholesale price')}</span>}
            {breakApplied ? (
              <span className="text-muted line-through text-[16px] tabular-nums">{formatPrice(displayOriginalPrice ?? displayPrice)}</span>
            ) : (
              displayOriginalPrice && <span className="text-muted line-through text-[16px] tabular-nums">{formatPrice(displayOriginalPrice)}</span>
            )}
            {displayOriginalPrice && (
              <span className="self-center rounded-full bg-success-bg px-2.5 py-1 text-[12px] font-semibold leading-none text-save">
                {t('You save')} {formatPrice(saveAmount)}
              </span>
            )}
          </div>
          {breaks.length > 0 && (
            <div className="mt-3 rounded-lg bg-canvas px-3 py-2 text-[12.5px] text-ink">
              <p className="m-0 mb-1 font-semibold">{display?.language === 'bn' ? 'বেশি কিনলে কম দাম' : 'Buy more, pay less'}</p>
              <table className="w-full border-collapse">
                <tbody>
                  {[{ minQty: 1, price: Number(displayPrice) }, ...breaks].map((b, i, all) => {
                    const next = all[i + 1];
                    const range = next ? (next.minQty - 1 === b.minQty ? `${b.minQty}` : `${b.minQty}-${next.minQty - 1}`) : `${b.minQty}+`;
                    const active = quantity >= b.minQty && (!next || quantity < next.minQty);
                    return (
                      <tr key={b.minQty} className={active ? 'font-bold text-accent' : ''}>
                        <td className="py-0.5 pr-3">{range}</td>
                        <td className="py-0.5 text-right tabular-nums">{formatPrice(b.price)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {product.isPreOrder ? (
            <span className="inline-block bg-ink text-white text-[11px] font-semibold px-2.5 py-1 rounded mt-3">
              {display ? display.preOrder : t('Available for pre-order')}
              {product.preOrderDate ? ` · ${preOrderDateText(product.preOrderDate, display?.language)}` : ''}
            </span>
          ) : backorder && (outOfStock || selectedVariantOutOfStock) ? (
            <p className="flex items-center gap-1.5 text-[12.5px] font-semibold mt-3 text-accent-dark">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              {backorder.shortMessage}
            </p>
          ) : (
            <p className={`flex items-center gap-1.5 text-[12.5px] font-semibold mt-3 ${outOfStock || display?.isLowStock?.(availableStock) ? 'text-accent-dark' : 'text-success'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${outOfStock || display?.isLowStock?.(availableStock) ? 'bg-accent' : 'bg-success'}`} />
              {availableStock !== undefined && availableStock <= 0
                ? `${display?.outOfStock ?? t('Out of stock')}${product.restockDate ? ` · ${t('Back')} ${preOrderDateText(product.restockDate, display?.language)}` : ''}`
                : inStockText(availableStock)}
            </p>
          )}
        </div>
          </>
        )}

        {sizeGuide && product.variationOptions.length === 0 && (
          <div className="mb-4">
            <SizeGuideLink guide={sizeGuide} />
          </div>
        )}

        {product.variationOptions.map((opt) => (
          <div key={opt.id} className="mb-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="m-0 text-[13px] text-muted">
                {opt.name}
                {selected[opt.name] ? (
                  <>
                    : <span className="font-semibold text-ink">{selected[opt.name]}</span>
                  </>
                ) : null}
              </p>
              {sizeGuide && opt.id === sizeGuideOptionId && <SizeGuideLink guide={sizeGuide} />}
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {opt.values.map((val) => {
                const isSelected = selected[opt.name] === val;
                const soldOutValue = valueSoldOut(opt.name, val);
                // A tiny swatch thumbnail for this value, if the vendor
                // assigned photos to it - lets shoppers see which "Black"
                // or "Blue" they're picking before selecting it, not just
                // the text label.
                const swatchPhoto =
                  opt.name === photoOptionName ? findVariationPhoto(opt.name, val)?.photoUrls[0] : undefined;
                return (
                  <button
                    key={val}
                    onClick={() => {
                      setSelected((prev) => ({ ...prev, [opt.name]: val }));
                      setVariantWarning(false);
                    }}
                    aria-pressed={isSelected}
                    aria-label={soldOutValue ? `${val}, ${t('Out of stock')}` : undefined}
                    title={soldOutValue ? t('Out of stock') : undefined}
                    className={`flex min-h-10 min-w-11 items-center justify-center gap-1.5 py-1.5 rounded-lg text-[13px] transition-colors border ${
                      swatchPhoto ? 'pl-1.5 pr-3.5' : 'px-3.5'
                    } ${
                      soldOutValue ? 'bg-canvas text-muted line-through decoration-1' : 'bg-surface text-ink'
                    } ${
                      isSelected
                        ? 'border-ink ring-1 ring-ink font-semibold'
                        : soldOutValue
                          ? 'border-dashed border-line font-medium hover:border-line-strong'
                          : 'border-line font-medium hover:border-line-strong'
                    }`}
                  >
                    {swatchPhoto && (
                      <span className={`relative w-6 h-6 rounded overflow-hidden shrink-0 bg-canvas ring-1 ring-black/10 ${soldOutValue ? 'opacity-50 grayscale' : ''}`}>
                        <Image src={swatchPhoto} alt="" fill sizes="24px" className="object-cover" />
                      </span>
                    )}
                    {val}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {variantWarning && (
          <p className="text-[12.5px] text-accent-dark bg-accent-light border border-accent/20 rounded px-3 py-2 -mt-1 mb-4">
            {t('Select an option above first.')}
          </p>
        )}

        {pickBox > 0 && (
          <BundlePicker
            product={product}
            picks={picks}
            onPicks={(next) => {
              setPicks(next);
              setPickError(null);
            }}
            error={pickError}
          />
        )}

        {customFields.length > 0 && (
          <div className="mb-4 space-y-2.5">
            {customFields.map((f) => (
              <div key={f.id}>
                <label className="mb-1 block text-[12.5px] font-semibold text-ink">
                  {f.label}
                  {f.required && <span className="text-accent"> *</span>}
                </label>
                <input
                  value={customAnswers[f.id] ?? ''}
                  maxLength={f.maxLength}
                  onChange={(e) => {
                    setCustomAnswers({ ...customAnswers, [f.id]: e.target.value });
                    setCustomError(null);
                  }}
                  className="w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-[13.5px] outline-none focus:border-ink"
                />
              </div>
            ))}
            {product.customFee && Number(product.customFee) > 0 && (
              <p className="m-0 text-[12px] text-muted">
                {display?.language === 'bn' ? `লিখলে প্রতি পিসে ${formatPrice(product.customFee)} বাড়তি` : `+${formatPrice(product.customFee)} per piece when filled in`}
              </p>
            )}
            {customError && <p className="m-0 text-[12.5px] font-semibold text-accent">{customError}</p>}
          </div>
        )}

        {leadSlots?.purchase ?? (
          <>
        <div className="mb-5">
          <p className="m-0 mb-2 text-[13px] text-muted">{t('Quantity')}</p>
          <div className="inline-flex items-center border border-line rounded-lg overflow-hidden bg-canvas">
            <button onClick={() => setQuantity((q) => Math.max(minQty, q - packStep))} aria-label="-" className="w-10 h-10 flex items-center justify-center hover:bg-line/60 transition-colors">
              <Minus size={13} />
            </button>
            <span className="w-11 text-center text-[14px] font-semibold tabular-nums bg-surface h-10 flex items-center justify-center">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => (quantityCap !== undefined ? Math.max(q, Math.floor(Math.min(quantityCap, q + packStep) / packStep) * packStep) : q + packStep))}
              disabled={quantityCap !== undefined && quantity + packStep > quantityCap}
              aria-label="+"
              className="w-10 h-10 flex items-center justify-center hover:bg-line/60 transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <Plus size={13} />
            </button>
          </div>
          {quantityCap !== undefined && quantity >= quantityCap && quantityCap > 0 && (
            <p className="text-[12px] text-muted mt-1.5">{t('Max available quantity selected.')}</p>
          )}
          {minQty > 1 && <p className="text-[12px] text-muted mt-1.5">{t('Minimum order:')} {minQty}</p>}
        </div>

        <div data-rg="product-buttons" className="flex gap-2.5">
          <button
            disabled={!canPurchase}
            onClick={() => openSheetOr('add', handleAddToCart)}
            data-rg="add-to-cart"
            className={`flex-1 h-12 rounded-lg border-[1.5px] border-ink text-ink text-[14px] font-bold transition-colors ${
              canPurchase ? 'hover:bg-ink hover:text-white' : 'opacity-40 cursor-not-allowed'
            }`}
          >
            {t('Add to Cart')}
          </button>
          <button
            disabled={!canPurchase}
            onClick={() => openSheetOr('buy', handleBuyNow)}
            data-rg="buy-now"
            className={`flex-1 h-12 rounded-lg text-[14px] font-bold transition-colors ${
              canPurchase ? 'bg-accent hover:bg-accent-dark text-white' : 'bg-line text-muted cursor-not-allowed'
            }`}
          >
            {t('Buy Now')}
          </button>
        </div>

        {/* The chosen size/colour is sold out while others are not: wait for this one (the whole-product form is shown by
            StorePalPurchasePanel instead when everything is sold out). */}
        {variantRestock && selectedVariantOutOfStock && !outOfStock && matchedVariant && (
          <div className="mt-4">
            <ComingSoonNotify
              key={JSON.stringify(matchedVariant.optionValues)}
              subdomain={subdomain}
              slug={product.slug}
              restock
              options={matchedVariant.optionValues}
            />
          </div>
        )}

        {added && (
          <div className="mt-3 flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-md bg-success-bg text-success text-[13px]">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 size={15} />
              {t('Added to cart')}
            </span>
            <Link href={`/store/${subdomain}/cart`} className="font-semibold underline underline-offset-2 shrink-0">
              {t('View cart')}
            </Link>
          </div>
        )}
          </>
        )}
        {/* The row under the buttons ("Fast delivery", "Cash on delivery", the store's own items) is ProductTrustRow, first in leadSlots.after. */}
        {leadSlots?.after}

        {/* The summary can hold editor HTML; shown as plain text (it used to print the tags as words). */}
        {plainText(product.summary) && (
          <p data-rg="product-summary" className="text-[13.5px] text-muted leading-relaxed mt-5 whitespace-pre-line">
            {plainText(product.summary)}
          </p>
        )}

        {product.weight && (
          <p className="text-[11.5px] text-muted mt-3">
            Weight: {product.weight} {product.weightUnit.toLowerCase()}
          </p>
        )}
      </div>

      {/* No sticky Add to Cart / Buy Now bar on phones (removed 2026-10-27, the user's request): it repeated the buttons above. */}

      {hasChoices && (
        <QuickAddSheet
          open={sheet !== null}
          onClose={() => setSheet(null)}
          name={product.name}
          image={activePhotoUrl}
          price={formatPrice(displayPrice)}
          originalPrice={displayOriginalPrice ? formatPrice(displayOriginalPrice) : null}
          options={product.variationOptions.map((o) => ({ name: o.name, values: o.values }))}
          selected={selected}
          onSelect={(option, value) => {
            setSelected((prev) => ({ ...prev, [option]: value }));
            setVariantWarning(false);
          }}
          isAvailable={(option, value) => !valueSoldOut(option, value)}
          photoFor={(option, value) => findVariationPhoto(option, value)?.photoUrls[0] ?? null}
          warning={variantWarning ? t('Select an option first.') : null}
          labels={{
            addToCart: t('Add to Cart'),
            buyNow: canPurchase ? t('Buy Now') : undefined,
            close: t('Close'),
          }}
          onAdd={() => fromSheet(handleAddToCart)}
          onBuy={canPurchase ? () => fromSheet(handleBuyNow) : undefined}
        />
      )}

      {backorder && pendingBackorderAction && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4"
          onClick={() => setPendingBackorderAction(null)}
        >
          <CoverFloating />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Backorder"
            className="w-full max-w-md bg-surface rounded-lg shadow-popover p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="m-0 mb-2 text-[15px] font-bold text-ink">Backorder</p>
            <div
              className="text-[13.5px] text-ink leading-relaxed [&_p]:m-0 [&_p+p]:mt-2"
              // Vendor's own RichTextEditor HTML - same trust level as
              // Store > Footer's aboutBlurb (see StorePal's StoreFooter).
              dangerouslySetInnerHTML={{ __html: backorder.popupMessageHtml }}
            />
            <div className="flex gap-2.5 mt-5">
              <button
                onClick={() => setPendingBackorderAction(null)}
                className="flex-1 py-2.5 rounded-md border border-line text-ink text-[13px] font-semibold hover:bg-line/60 transition-colors"
              >
                {t('Cancel')}
              </button>
              <button
                onClick={() => {
                  const action = pendingBackorderAction;
                  setPendingBackorderAction(null);
                  action();
                }}
                className="flex-1 py-2.5 rounded-md bg-accent hover:bg-accent-dark text-white text-[13px] font-bold transition-colors"
              >
                {t('Continue')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
