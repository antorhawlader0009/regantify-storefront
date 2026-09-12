'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Minus, Plus, Truck, ShieldCheck, Banknote, PlayCircle } from 'lucide-react';
import type { StorefrontProduct } from '@/lib/storefrontApi';
import { formatPrice, isOutOfStock } from '@/lib/productDisplay';
import { useCartStore } from '@/providers/cart-store-provider';

interface ProductPurchasePanelProps {
  subdomain: string;
  storeName: string;
  product: StorefrontProduct;
}

/**
 * Minimal's version of the purchase panel. Every bit of purchase logic
 * (variant-photo matching, stock/pre-order rules, cart line building) is
 * identical to Medium's ProductPurchasePanel — copied verbatim, not
 * reimplemented — only the visual treatment differs: no boxed
 * accent-tinted price panel, no pill-shaped trust badges, quiet
 * outline/solid button pair instead of a bold two-tone pair, more
 * whitespace throughout. See Medium's ProductPurchasePanel for the
 * reasoning behind each piece of the logic below.
 */
export function ProductPurchasePanel({ subdomain, storeName, product }: ProductPurchasePanelProps) {
  const router = useRouter();
  const addLine = useCartStore((s) => s.addLine);
  const outOfStock = isOutOfStock(product);

  const [activePhoto, setActivePhoto] = useState(0);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [variantWarning, setVariantWarning] = useState(false);

  const matchedVariant =
    product.variationOptions.length > 0 && product.variationOptions.every((opt) => selected[opt.name])
      ? product.variants.find((v) =>
          product.variationOptions.every((opt) => v.optionValues[opt.name] === selected[opt.name]),
        )
      : undefined;

  const needsVariantSelection = product.variationOptions.length > 0 && !matchedVariant;

  const variationPhotos = product.variationPhotos ?? [];

  const normalize = (s: string) => s.trim().toLowerCase();
  const findVariationPhoto = (optionName: string, optionValue: string) =>
    variationPhotos.find(
      (vp) => normalize(vp.optionName) === normalize(optionName) && normalize(vp.optionValue) === normalize(optionValue),
    );

  const firstPhotoEntry = variationPhotos.find((vp) => vp.photoUrls.length > 0);
  const photoOptionName = firstPhotoEntry
    ? product.variationOptions.find((o) => normalize(o.name) === normalize(firstPhotoEntry.optionName))?.name
    : undefined;

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

  const selectedValuePhoto = photoOptionName
    ? findVariationPhoto(photoOptionName, selected[photoOptionName] ?? '')?.photoUrls[0]
    : undefined;

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

  const saveAmount = displayOriginalPrice ? Number(displayOriginalPrice) - Number(displayPrice) : 0;

  const availableStock = matchedVariant ? matchedVariant.stock : (product.stockQuantity ?? undefined);
  const selectedVariantOutOfStock = !product.isPreOrder && matchedVariant !== undefined && matchedVariant.stock <= 0;
  const canPurchase = product.isPreOrder || (!outOfStock && !selectedVariantOutOfStock);

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

  const handleAddToCart = () => {
    if (needsVariantSelection) {
      setVariantWarning(true);
      return;
    }
    setVariantWarning(false);
    addLine(buildLine());
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  const handleBuyNow = () => {
    if (needsVariantSelection) {
      setVariantWarning(true);
      return;
    }
    if (!canPurchase) return;
    addLine(buildLine());
    router.push(`/store/${subdomain}/checkout`);
  };

  return (
    <>
      {/* Gallery */}
      <div>
        <div className={`relative bg-canvas overflow-hidden mb-4 ${product.photoSize === 'PORTRAIT' ? 'aspect-[3/4]' : 'aspect-square'}`}>
          {activePhotoUrl ? (
            <Image
              key={activePhotoUrl}
              src={activePhotoUrl}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 900px) 100vw, 560px"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-muted text-[13px]">No image</span>
            </div>
          )}
        </div>
        {allPhotos.length > 1 && (
          <div className="flex gap-2.5 flex-wrap">
            {allPhotos.map((url, i) => (
              <button
                key={url + i}
                onClick={() => setActivePhoto(i)}
                className={`relative w-14 h-14 overflow-hidden p-0 cursor-pointer bg-canvas transition-opacity ${
                  i === activePhoto ? 'ring-1 ring-ink' : 'opacity-60 hover:opacity-100'
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
            className="inline-flex items-center gap-1.5 mt-4 text-[12.5px] text-ink border-b border-line hover:border-ink pb-0.5 transition-colors"
          >
            <PlayCircle size={15} strokeWidth={1.5} />
            Watch product video
          </a>
        )}
      </div>

      {/* Info & Purchase */}
      <div>
        {product.brand && <span className="text-[11px] text-muted tracking-[0.06em] uppercase">{product.brand}</span>}
        <h1 className="mt-1.5 mb-3 text-[24px] sm:text-[28px] font-display italic leading-tight text-ink">{product.name}</h1>

        {(product.category || product.secondaryCategories.length > 0) && (
          <div className="flex gap-1.5 flex-wrap mb-4">
            {product.category && (
              <Link
                href={`/store/${subdomain}?category=${encodeURIComponent(product.category)}`}
                className="text-[11px] text-muted no-underline hover:text-accent transition-colors"
              >
                {product.category}
              </Link>
            )}
            {product.secondaryCategories.map((c) => (
              <span key={c} className="text-[11px] text-muted">
                · {c}
              </span>
            ))}
          </div>
        )}

        <div className="mb-6 pb-6 border-b border-line">
          <div className="flex gap-3 items-baseline flex-wrap">
            <span className="text-[22px] text-ink">{formatPrice(displayPrice)}</span>
            {displayOriginalPrice && <span className="text-muted line-through text-[14px]">{formatPrice(displayOriginalPrice)}</span>}
          </div>
          {displayOriginalPrice && (
            <p className="m-0 mt-1.5 text-[12px] text-save">You save {formatPrice(saveAmount)}</p>
          )}

          {product.isPreOrder ? (
            <span className="inline-block text-[11px] tracking-[0.06em] uppercase text-ink border border-ink px-2.5 py-1 mt-3.5">
              Available for pre-order
            </span>
          ) : (
            <p className={`flex items-center gap-1.5 text-[12px] mt-3.5 ${outOfStock ? 'text-accent-dark' : 'text-success'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${outOfStock ? 'bg-accent-dark' : 'bg-success'}`} />
              {availableStock === undefined ? 'In stock' : availableStock > 0 ? `${availableStock} units in stock` : 'Out of stock'}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-2 mb-6 text-[11.5px] text-muted">
          <span className="flex items-center gap-1.5">
            <Truck size={14} strokeWidth={1.5} className="text-ink shrink-0" />
            {product.isPreOrder ? 'Delivery in 20–25 days' : 'Fast delivery'}
          </span>
          <span className="flex items-center gap-1.5">
            <Banknote size={14} strokeWidth={1.5} className="text-ink shrink-0" />
            Cash on delivery
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={14} strokeWidth={1.5} className="text-ink shrink-0" />
            Quality checked
          </span>
        </div>

        {product.variationOptions.map((opt) => (
          <div key={opt.id} className="mb-5">
            <p className="m-0 mb-2.5 text-[11px] tracking-[0.06em] uppercase text-muted">{opt.name}</p>
            <div className="flex gap-2 flex-wrap">
              {opt.values.map((val) => {
                const isSelected = selected[opt.name] === val;
                const swatchPhoto =
                  opt.name === photoOptionName ? findVariationPhoto(opt.name, val)?.photoUrls[0] : undefined;
                return (
                  <button
                    key={val}
                    onClick={() => {
                      setSelected((prev) => ({ ...prev, [opt.name]: val }));
                      setVariantWarning(false);
                    }}
                    className={`flex items-center gap-2 pl-1.5 pr-3.5 py-1.5 text-[12.5px] transition-colors border ${
                      swatchPhoto ? '' : 'px-3.5'
                    } ${
                      isSelected
                        ? 'border-ink text-ink'
                        : 'border-line text-ink hover:border-line-strong'
                    }`}
                  >
                    {swatchPhoto && (
                      <span className="relative w-6 h-6 overflow-hidden shrink-0 bg-canvas">
                        <Image src={swatchPhoto} alt="" fill sizes="24px" className="object-cover" />
                      </span>
                    )}
                    {isSelected && <Check size={12} strokeWidth={1.5} />}
                    {val}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {variantWarning && (
          <p className="text-[12px] text-accent-dark border-l-2 border-accent-dark pl-3 -mt-1 mb-5">
            Select an option above first.
          </p>
        )}

        <div className="mb-6">
          <p className="m-0 mb-2.5 text-[11px] tracking-[0.06em] uppercase text-muted">Quantity</p>
          <div className="inline-flex items-center border border-line">
            <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="w-9 h-9 flex items-center justify-center hover:bg-canvas transition-colors">
              <Minus size={13} strokeWidth={1.5} />
            </button>
            <span className="w-10 text-center text-[13px]">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => (availableStock !== undefined ? Math.min(availableStock, q + 1) : q + 1))}
              disabled={availableStock !== undefined && quantity >= availableStock}
              className="w-9 h-9 flex items-center justify-center hover:bg-canvas transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <Plus size={13} strokeWidth={1.5} />
            </button>
          </div>
          {availableStock !== undefined && quantity >= availableStock && availableStock > 0 && (
            <p className="text-[11px] text-muted mt-1.5">Max available quantity selected.</p>
          )}
        </div>

        <div className="flex gap-2.5">
          <button
            disabled={!canPurchase}
            onClick={handleAddToCart}
            className={`flex-1 py-3.5 border border-ink text-ink text-[12.5px] tracking-[0.04em] uppercase transition-all ${
              canPurchase ? 'hover:bg-ink hover:text-white' : 'opacity-40 cursor-not-allowed'
            }`}
          >
            Add to Cart
          </button>
          <button
            disabled={!canPurchase}
            onClick={handleBuyNow}
            className={`flex-1 py-3.5 text-[12.5px] tracking-[0.04em] uppercase transition-colors ${
              canPurchase ? 'bg-ink hover:bg-accent-dark text-white' : 'bg-line text-muted cursor-not-allowed'
            }`}
          >
            Buy Now
          </button>
        </div>

        {added && (
          <div className="mt-4 flex items-center justify-between gap-3 py-3 border-t border-b border-line text-ink text-[12.5px]">
            <span className="flex items-center gap-1.5">
              <Check size={14} strokeWidth={1.5} />
              Added to cart
            </span>
            <Link href={`/store/${subdomain}/cart`} className="underline underline-offset-2 shrink-0">
              View cart
            </Link>
          </div>
        )}

        {product.summary && <p className="text-[13px] text-muted leading-relaxed mt-6">{product.summary}</p>}

        {product.weight && (
          <p className="text-[11.5px] text-muted mt-3">
            Weight: {product.weight} {product.weightUnit.toLowerCase()}
          </p>
        )}
      </div>

      {/* Sticky mobile bar */}
      <div className="storefront-sticky-bar fixed bottom-0 left-0 right-0 bg-surface border-t border-line px-5 py-3 hidden gap-2.5">
        <button
          disabled={!canPurchase}
          onClick={handleAddToCart}
          className="flex-1 py-3 border border-ink text-ink text-[12.5px] tracking-[0.04em] uppercase"
        >
          Add to Cart
        </button>
        <button
          disabled={!canPurchase}
          onClick={handleBuyNow}
          className="flex-1 py-3 bg-ink text-white text-[12.5px] tracking-[0.04em] uppercase"
        >
          Buy Now
        </button>
      </div>
    </>
  );
}
