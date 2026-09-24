'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Check, Heart } from 'lucide-react';
import type { StorefrontVariant, StorefrontVariationOption } from '@/lib/storefrontApi';
import { isOutOfStock } from '@/lib/productDisplay';
import { useCartStore } from '@/providers/cart-store-provider';
import { formatPrice } from '../lib/formatPrice';
import { useShowOutOfStockBadge, useStorePalDesign } from '../lib/designSettings';
import { useWishlist } from '../lib/wishlist';

// Minimal shape ProductCard actually reads — satisfied by both the full
// StorefrontProduct (product listing/search) and the leaner
// StorefrontCardProduct (product detail page's related-products
// sidebar, see getStoreSidebar) without needing two near-identical
// card components — same convention as Medium's own ProductCard. Only
// the full shape carries variationOptions + per-variant prices, so
// inline Add to Cart / Buy Now only works for it; lean cards send those
// buttons to the product page instead.
interface CardProduct {
  slug: string;
  name: string;
  photoUrls: string[];
  price: string;
  discountPrice?: string | null;
  isPreOrder: boolean;
  variants: ({ stock: number } & Partial<Omit<StorefrontVariant, 'stock'>>)[];
  variationOptions?: StorefrontVariationOption[];
  stockQuantity?: number | null;
  summary?: string | null;
  videoUrl?: string | null;
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
  const design = useStorePalDesign();
  const showOutOfStockBadge = useShowOutOfStockBadge();
  const router = useRouter();
  const addLine = useCartStore((s) => s.addLine);
  const wishlist = useWishlist(subdomain);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [added, setAdded] = useState(false);
  const [variantWarning, setVariantWarning] = useState(false);
  const [hovering, setHovering] = useState(false);

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
  const canBuyInline = fullData && !outOfStock && (!hasVariations || showOptions);

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

  const purchase = (kind: 'add' | 'buy') => {
    if (!canBuyInline) {
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
      name: product.name,
      image: product.photoUrls[0],
      unitPrice: Number(displayPrice),
      originalUnitPrice: originalPrice ? Number(originalPrice) : undefined,
      quantity: 1,
      selectedOptions: selected,
      isPreOrder: product.isPreOrder,
    });
    if (kind === 'buy') {
      router.push(`/store/${subdomain}/checkout`);
      return;
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  // "Show Button (Default)": Add to Cart for a simple product, View
  // Product for one with variations. Merged with the explicit toggles so
  // the same button never shows twice.
  const showView = design.cardShowViewButton || (design.cardShowDefaultButton && hasVariations);
  const showAddToCart = design.cardShowAddToCart || (design.cardShowDefaultButton && !hasVariations);
  const showBuyNow = design.cardShowBuyNow;

  const video = design.cardShowVideo && product.videoUrl ? videoEmbed(product.videoUrl) : null;
  const inWishlist = wishlist.has(product.slug);
  const portrait = design.productImageShape === 'PORTRAIT';

  return (
    <div
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
              src={product.photoUrls[0]}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, 260px"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-muted text-[13px]">No image</span>
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
              <span className="bg-ink text-white text-[11px] font-semibold px-2.5 py-1.5 rounded">Out of Stock</span>
            </div>
          )}
        </Link>
        {design.cardShowWishlist && (
          <button
            type="button"
            onClick={() => wishlist.toggle(product.slug)}
            aria-pressed={inWishlist}
            aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-surface/90 shadow flex items-center justify-center text-ink hover:text-accent transition-colors"
          >
            <Heart size={16} className={inWishlist ? 'fill-accent text-accent' : ''} />
          </button>
        )}
      </div>

      <div className={`flex flex-col gap-1.5 flex-1 ${design.cardDisplayAsCard ? 'p-3' : 'pt-2.5'}`}>
        <Link
          href={href}
          className="text-[13px] font-semibold text-ink uppercase tracking-tight leading-snug line-clamp-2 min-h-[2.4em] hover:text-accent transition-colors"
        >
          {product.name}
        </Link>

        {design.cardShowSummary && product.summary && (
          <p className="text-[12px] text-muted leading-snug line-clamp-2">{product.summary}</p>
        )}

        <div className="flex gap-2 items-baseline flex-wrap">
          {originalPrice && <span className="text-muted line-through text-[12.5px]">{formatPrice(originalPrice)}</span>}
          <span className="font-bold text-[15px] text-accent">{formatPrice(displayPrice)}</span>
        </div>

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
        {variantWarning && <p className="text-[11.5px] text-accent-dark">Select an option first.</p>}

        <div className="mt-auto flex flex-col gap-1.5 pt-1">
          {(showAddToCart || showBuyNow) && (
            <div className="flex gap-1.5">
              {showAddToCart && (
                <button
                  type="button"
                  onClick={() => purchase('add')}
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-md border border-ink text-[12.5px] font-semibold text-ink hover:bg-ink hover:text-white transition-colors"
                >
                  {added ? (
                    <>
                      <Check size={13} /> Added
                    </>
                  ) : (
                    'Add to Cart'
                  )}
                </button>
              )}
              {showBuyNow && (
                <button
                  type="button"
                  onClick={() => purchase('buy')}
                  className="flex-1 py-2 rounded-md bg-accent hover:bg-accent-dark text-white text-[12.5px] font-semibold transition-colors"
                >
                  Buy Now
                </button>
              )}
            </div>
          )}
          {showView && (
            <Link
              href={href}
              className="text-center py-2 rounded-md border border-line-strong text-[12.5px] font-semibold text-ink hover:bg-ink hover:text-white hover:border-ink transition-colors"
            >
              View Product
            </Link>
          )}
        </div>
      </div>
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
