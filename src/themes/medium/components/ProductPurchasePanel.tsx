'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Check, Minus, Plus, Truck, ShieldCheck, Banknote, PlayCircle } from 'lucide-react';
import type { StorefrontProduct } from '@/lib/storefrontApi';
import { formatPrice, isOutOfStock } from '@/lib/productDisplay';
import { useCartStore } from '@/providers/cart-store-provider';

interface ProductPurchasePanelProps {
  subdomain: string;
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
}

/**
 * Everything on the product page that needs client-side interactivity:
 * photo gallery selection, variant picking, quantity, Add to Cart / Buy
 * Now. Kept separate from the surrounding server-rendered page (name,
 * description, breadcrumb, related products) so only this part ships as
 * client JS — the rest stays server-rendered HTML for fast first paint
 * and SEO. Purchase logic (stock check, variant matching, cart line
 * construction) is unchanged from the audited version — only the visual
 * treatment is refined here.
 */
export function ProductPurchasePanel({ subdomain, storeName, product, backorder }: ProductPurchasePanelProps) {
  const router = useRouter();
  const addLine = useCartStore((s) => s.addLine);
  const outOfStock = isOutOfStock(product);

  const [activePhoto, setActivePhoto] = useState(0);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [variantWarning, setVariantWarning] = useState(false);
  // Backorder confirm popup — holds the action (add / buy) to run on Continue.
  const [pendingBackorderAction, setPendingBackorderAction] = useState<(() => void) | null>(null);

  const matchedVariant =
    product.variationOptions.length > 0 && product.variationOptions.every((opt) => selected[opt.name])
      ? product.variants.find((v) =>
          product.variationOptions.every((opt) => v.optionValues[opt.name] === selected[opt.name]),
        )
      : undefined;

  const needsVariantSelection = product.variationOptions.length > 0 && !matchedVariant;

  // Defensive: normalize once, since older cached API responses (before
  // this field existed) or an in-flight backend deploy could still omit
  // variationPhotos entirely, and every accessor below assumes an array.
  const variationPhotos = product.variationPhotos ?? [];

  // Matches option names/values the same way the vendor form saves them
  // (trimmed) but case- and whitespace-insensitively on top of that, so a
  // stray casing difference between VariationOption.name and
  // VariationValuePhoto.optionName/optionValue (or between either of
  // those and what's clicked here) can never silently break the photo
  // lookup — the swatch/thumbnail would still show correctly by
  // coincidence in that case, only the "jump to this photo" behavior
  // would quietly fail, which is exactly the bug this guards against.
  const normalize = (s: string) => s.trim().toLowerCase();
  const findVariationPhoto = (optionName: string, optionValue: string) =>
    variationPhotos.find(
      (vp) => normalize(vp.optionName) === normalize(optionName) && normalize(vp.optionValue) === normalize(optionValue),
    );

  // Which single variation option (if any) has its own photo sets — set
  // on Add/Edit Product's "Variation Photos" section (e.g. "Color").
  // There's at most one such option per product by design (see
  // VariationValuePhoto on the server), so this looks for the first
  // entry that actually HAS photos — not just the array's first entry,
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
  // (e.g. base photos, then Black's photos, then Blue's photos) — not
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
  // for what's displayed — this effect only ever *sets* it in reaction to
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

  const displayPrice = matchedVariant?.discountPrice ?? matchedVariant?.listPrice ?? product.discountPrice ?? product.price;
  const displayOriginalPrice =
    matchedVariant?.discountPrice && matchedVariant?.listPrice
      ? matchedVariant.listPrice
      : !matchedVariant && product.discountPrice
        ? product.price
        : null;

  const percentOff = displayOriginalPrice
    ? Math.round(((Number(displayOriginalPrice) - Number(displayPrice)) / Number(displayOriginalPrice)) * 100)
    : 0;
  const saveAmount = displayOriginalPrice ? Number(displayOriginalPrice) - Number(displayPrice) : 0;

  const availableStock = matchedVariant ? matchedVariant.stock : (product.stockQuantity ?? undefined);
  // A matched variant with its own zero stock must block purchase even
  // though the product as a whole isn't out of stock (isOutOfStock only
  // checks whether EVERY variant is at zero) — otherwise a shopper could
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
  const quantityCap = backorder ? undefined : availableStock;

  const buildLine = () => ({
    subdomain,
    storeName,
    productSlug: product.slug,
    name: product.name,
    image: activePhotoUrl,
    unitPrice: Number(displayPrice),
    originalUnitPrice: displayOriginalPrice ? Number(displayOriginalPrice) : undefined,
    quantity,
    selectedOptions: selected,
    isPreOrder: product.isPreOrder,
  });

  const addToCart = () => {
    addLine(buildLine());
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  const buyNow = () => {
    addLine(buildLine());
    router.push(`/store/${subdomain}/checkout`);
  };

  const handleAddToCart = () => {
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

  return (
    <>
      {/* Gallery */}
      <div>
        <div className={`relative bg-canvas border border-line rounded-lg overflow-hidden mb-3 ${product.photoSize === 'PORTRAIT' ? 'aspect-[3/4]' : 'aspect-square'}`}>
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
            <span className="absolute top-3 left-3 bg-accent text-white text-[12px] font-bold px-2.5 py-1 rounded shadow-sm">
              -{percentOff}%
            </span>
          )}
        </div>
        {allPhotos.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            {allPhotos.map((url, i) => (
              <button
                key={url + i}
                onClick={() => setActivePhoto(i)}
                className={`relative w-14 h-14 overflow-hidden p-0 cursor-pointer bg-canvas rounded-md transition-all ${
                  i === activePhoto ? 'ring-2 ring-accent' : 'ring-1 ring-line hover:ring-line-strong opacity-75 hover:opacity-100'
                }`}
              >
                <Image src={url} alt="" fill sizes="56px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
        {product.videoUrl && (
          <a
            href={product.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-3 text-[12.5px] text-accent font-semibold hover:text-accent-dark"
          >
            <PlayCircle size={15} />
            Watch product video
          </a>
        )}
      </div>

      {/* Info & Purchase */}
      <div>
        {product.brand && <span className="text-[11.5px] text-muted uppercase tracking-wider font-medium">{product.brand}</span>}
        <h1 className="mt-1 mb-2.5 text-[19px] sm:text-[22px] font-bold leading-snug text-ink tracking-tight">{product.name}</h1>

        {(product.category || product.secondaryCategories.length > 0) && (
          <div className="flex gap-1.5 flex-wrap mb-3.5">
            {product.category && (
              <Link
                href={`/store/${subdomain}?category=${encodeURIComponent(product.category)}`}
                className="text-[11px] text-muted bg-canvas border border-line rounded px-2 py-0.5 no-underline hover:border-accent hover:text-accent transition-colors"
              >
                {product.category}
              </Link>
            )}
            {product.secondaryCategories.map((c) => (
              <span key={c} className="text-[11px] text-muted bg-canvas border border-line rounded px-2 py-0.5">
                {c}
              </span>
            ))}
          </div>
        )}

        {/* Boxed price panel — a soft accent-tinted background makes this
            the clear visual anchor of the page, matching how established
            BD e-commerce product pages foreground the price block. */}
        <div className="bg-accent-light border border-accent/15 rounded-lg p-4 mb-4">
          <div className="flex gap-2.5 items-baseline flex-wrap">
            <span className="text-[28px] font-bold text-accent tracking-tight">{formatPrice(displayPrice)}</span>
            {displayOriginalPrice && <span className="text-muted line-through text-[15px]">{formatPrice(displayOriginalPrice)}</span>}
          </div>
          {displayOriginalPrice && (
            <p className="m-0 mt-1.5 inline-flex items-center gap-1 text-[12.5px] text-save font-semibold bg-success-bg px-2 py-0.5 rounded w-fit">
              You save {formatPrice(saveAmount)} ({percentOff}%)
            </p>
          )}

          {product.isPreOrder ? (
            <span className="inline-block bg-ink text-white text-[11px] font-semibold px-2.5 py-1 rounded mt-3">
              Available for pre-order
            </span>
          ) : backorder && (outOfStock || selectedVariantOutOfStock) ? (
            <p className="flex items-center gap-1.5 text-[12.5px] font-semibold mt-3 text-accent-dark">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              {backorder.shortMessage}
            </p>
          ) : (
            <p className={`flex items-center gap-1.5 text-[12.5px] font-semibold mt-3 ${outOfStock ? 'text-accent-dark' : 'text-success'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${outOfStock ? 'bg-accent' : 'bg-success'}`} />
              {availableStock === undefined ? 'In stock' : availableStock > 0 ? `${availableStock} units in stock` : 'Out of stock'}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <div className="flex items-center gap-1.5 text-[11.5px] text-ink bg-canvas border border-line rounded-full px-2.5 py-1.5">
            <Truck size={13} className="text-accent shrink-0" />
            {product.isPreOrder ? 'Delivery in 20–25 days' : 'Fast delivery'}
          </div>
          <div className="flex items-center gap-1.5 text-[11.5px] text-ink bg-canvas border border-line rounded-full px-2.5 py-1.5">
            <Banknote size={13} className="text-accent shrink-0" />
            Cash on delivery
          </div>
          <div className="flex items-center gap-1.5 text-[11.5px] text-ink bg-canvas border border-line rounded-full px-2.5 py-1.5">
            <ShieldCheck size={13} className="text-accent shrink-0" />
            Quality checked
          </div>
        </div>

        {product.variationOptions.map((opt) => (
          <div key={opt.id} className="mb-4">
            <p className="m-0 mb-2 text-[12px] font-semibold text-ink">{opt.name}</p>
            <div className="flex gap-1.5 flex-wrap">
              {opt.values.map((val) => {
                const isSelected = selected[opt.name] === val;
                // A tiny swatch thumbnail for this value, if the vendor
                // assigned photos to it — lets shoppers see which "Black"
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
                    className={`flex items-center gap-1.5 pl-1.5 pr-3.5 py-1.5 rounded-md text-[12.5px] font-medium transition-all border ${
                      swatchPhoto ? '' : 'px-3.5'
                    } ${
                      isSelected
                        ? 'border-accent bg-accent text-white shadow-sm'
                        : 'border-line text-ink hover:border-accent hover:bg-accent-light'
                    }`}
                  >
                    {swatchPhoto && (
                      <span className="relative w-6 h-6 rounded overflow-hidden shrink-0 bg-canvas ring-1 ring-black/10">
                        <Image src={swatchPhoto} alt="" fill sizes="24px" className="object-cover" />
                      </span>
                    )}
                    {isSelected && <Check size={12} />}
                    {val}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {variantWarning && (
          <p className="text-[12.5px] text-accent-dark bg-accent-light border border-accent/20 rounded px-3 py-2 -mt-1 mb-4">
            Select an option above first.
          </p>
        )}

        <div className="mb-5">
          <p className="m-0 mb-2 text-[12px] font-semibold text-ink">Quantity</p>
          <div className="inline-flex items-center border border-line rounded-md overflow-hidden bg-canvas">
            <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="w-9 h-9 flex items-center justify-center hover:bg-line/60 transition-colors">
              <Minus size={13} />
            </button>
            <span className="w-10 text-center text-[13.5px] font-semibold bg-surface h-9 flex items-center justify-center">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => (quantityCap !== undefined ? Math.min(quantityCap, q + 1) : q + 1))}
              disabled={quantityCap !== undefined && quantity >= quantityCap}
              className="w-9 h-9 flex items-center justify-center hover:bg-line/60 transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <Plus size={13} />
            </button>
          </div>
          {quantityCap !== undefined && quantity >= quantityCap && quantityCap > 0 && (
            <p className="text-[12px] text-muted mt-1.5">Max available quantity selected.</p>
          )}
        </div>

        <div className="flex gap-2.5">
          <button
            disabled={!canPurchase}
            onClick={handleAddToCart}
            className={`flex-1 py-3 rounded-md border-2 border-ink text-ink text-[13px] font-bold transition-all ${
              canPurchase ? 'hover:bg-ink hover:text-white' : 'opacity-40 cursor-not-allowed'
            }`}
          >
            Add to Cart
          </button>
          <button
            disabled={!canPurchase}
            onClick={handleBuyNow}
            className={`flex-1 py-3 rounded-md text-[13px] font-bold transition-colors shadow-sm ${
              canPurchase ? 'bg-accent hover:bg-accent-dark text-white' : 'bg-line text-muted cursor-not-allowed shadow-none'
            }`}
          >
            Buy Now
          </button>
        </div>

        {added && (
          <div className="mt-3 flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-md bg-success-bg text-success text-[13px]">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 size={15} />
              Added to cart
            </span>
            <Link href={`/store/${subdomain}/cart`} className="font-semibold underline underline-offset-2 shrink-0">
              View cart
            </Link>
          </div>
        )}

        {product.summary && <p className="text-[13px] text-muted leading-relaxed mt-5">{product.summary}</p>}

        {product.weight && (
          <p className="text-[11.5px] text-muted mt-3">
            Weight: {product.weight} {product.weightUnit.toLowerCase()}
          </p>
        )}
      </div>

      {/* Sticky mobile bar */}
      <div className="storefront-sticky-bar fixed bottom-0 left-0 right-0 bg-surface border-t border-line px-4 py-2.5 hidden gap-2.5 shadow-popover">
        <button
          disabled={!canPurchase}
          onClick={handleAddToCart}
          className="flex-1 py-3 rounded-md border-2 border-ink text-ink text-[13.5px] font-bold"
        >
          Add to Cart
        </button>
        <button
          disabled={!canPurchase}
          onClick={handleBuyNow}
          className="flex-1 py-3 rounded-md bg-accent text-white text-[13.5px] font-bold"
        >
          Buy Now
        </button>
      </div>

      {backorder && pendingBackorderAction && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4"
          onClick={() => setPendingBackorderAction(null)}
        >
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
              // Vendor's own RichTextEditor HTML — same trust level as
              // Store > Footer's aboutBlurb (see StorePal's StoreFooter).
              dangerouslySetInnerHTML={{ __html: backorder.popupMessageHtml }}
            />
            <div className="flex gap-2.5 mt-5">
              <button
                onClick={() => setPendingBackorderAction(null)}
                className="flex-1 py-2.5 rounded-md border border-line text-ink text-[13px] font-semibold hover:bg-line/60 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const action = pendingBackorderAction;
                  setPendingBackorderAction(null);
                  action();
                }}
                className="flex-1 py-2.5 rounded-md bg-accent hover:bg-accent-dark text-white text-[13px] font-bold transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
