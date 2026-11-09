'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BagIcon, HeartIcon } from './icons';

export interface ChronicsCardViewProps {
  href: string;
  name: string;
  /** Small grey line under the photo (the store's category). */
  subtitle?: string | null;
  image?: string | null;
  /** The demo page uses outside photos, which go through a plain <img> instead of the store's image loader. */
  plainImage?: boolean;
  portrait?: boolean;
  /** Shown price, already formatted; null hides the price line (price on request, coming soon). */
  price: string | null;
  oldPrice?: string | null;
  /** The tag on the photo's corner: the store's badge, else "-14%" for a discount. */
  badge?: { text: string; color?: string | null; tone?: 'brand' | 'sale' } | null;
  rating?: { average: number; count: number } | null;
  showWish?: boolean;
  wished?: boolean;
  onWish?: () => void;
  /** "Out of Stock" over the photo, with an optional second line ("Back 20 Nov"). */
  soldOut?: { label: string; note?: string | null } | null;
  /** Extra lines between the price and the buttons: low stock, "42 bought", swatches, a flash timer. */
  extra?: ReactNode;
  /** Text in place of the price (price on request, coming soon). */
  priceText?: string | null;
  action?: { label: string; onClick?: () => void; href?: string; done?: boolean; doneLabel?: string } | null;
  secondary?: { label: string; onClick: () => void } | null;
  /** Rendered after the card (the quick add sheet). */
  after?: ReactNode;
  dataProduct?: string;
  onLinkClick?: () => void;
}

/** Stars drawn in amber with pale grey for the empty ones (the template's card stars). */
export function ChronicsStars({ value, className = 'h-[11px] w-[11px]' }: { value: number; className?: string }) {
  return (
    <span className="inline-flex items-center gap-[1px]" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox="0 0 24 24" className={className} fill={i <= Math.round(value) ? '#FBBF24' : '#E5E7EB'}>
          <path d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9L12 2.5Z" />
        </svg>
      ))}
    </span>
  );
}

/**
 * Chronics' product card (templete/.../chronics-store TrendingProducts.tsx): a white card with a hairline border that gets a
 * soft shadow on hover, a round pink "-14%" tag on the photo's top left, a plain heart on its top right, a pink "Add to Cart"
 * bar on the photo's foot, then a thin divider, the category in grey, the name, the bold price (pink on sale) with the old
 * price crossed out and stars. Drawing only: the store's card (storepal ProductCard, skin chronics) passes its own cart,
 * wishlist and quick-add behaviour in, and the demo page passes sample data. The bar is always shown, not only on hover (the
 * owner's rule).
 */
export function ChronicsCardView({
  href,
  name,
  subtitle,
  image,
  plainImage = false,
  portrait = false,
  price,
  oldPrice,
  badge,
  rating,
  showWish = true,
  wished = false,
  onWish,
  soldOut,
  extra,
  priceText,
  action,
  secondary,
  after,
  dataProduct,
  onLinkClick,
}: ChronicsCardViewProps) {
  const barCls = 'flex w-full items-center justify-center gap-1.5 rounded-md py-2 text-[12px] font-semibold shadow-lg transition';
  const onSale = !!oldPrice;
  return (
    <article
      data-rg="product-card"
      data-rg-product={dataProduct}
      onClickCapture={(e) => {
        if (onLinkClick && (e.target as HTMLElement).closest('a')?.getAttribute('href') === href) onLinkClick();
      }}
      className="cr-fade-up group relative flex h-full flex-col rounded-xl border border-gray-100 bg-white p-3 transition hover:shadow-[var(--shadow-card)]"
    >
      <div className="relative">
        {badge && (
          <span
            className="pointer-events-none absolute left-0 top-0 z-10 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
            style={{ backgroundColor: badge.color || 'var(--cr-brand)' }}
          >
            {badge.text}
          </span>
        )}
        {showWish && (
          <button
            type="button"
            onClick={onWish}
            aria-pressed={wished}
            aria-label={wished ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
            className="absolute right-0 top-0 z-10 rounded-full p-1 text-ink/70 hover:text-[var(--cr-brand)]"
          >
            <HeartIcon className={`h-[15px] w-[15px] ${wished ? 'fill-[var(--cr-brand)] text-[var(--cr-brand)]' : ''}`} />
          </button>
        )}
        <Link href={href} aria-label={name} className={`relative mx-auto block w-full overflow-hidden rounded-lg bg-[var(--cr-card)] ${portrait ? 'aspect-[3/4]' : 'aspect-square'}`}>
          {image ? (
            plainImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt={name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            ) : (
              <Image src={image} alt={name} fill sizes="(max-width: 640px) 50vw, 260px" className="object-cover transition duration-500 group-hover:scale-105" />
            )
          ) : (
            <span className="grid h-full w-full place-items-center text-[12px] text-muted">{name.slice(0, 1)}</span>
          )}
          {soldOut && (
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-white/75">
              <span className="rounded-md bg-ink px-2.5 py-1 text-[11px] font-semibold text-white">{soldOut.label}</span>
              {soldOut.note && <span className="rounded bg-white/90 px-2 py-0.5 text-[10.5px] font-medium text-ink">{soldOut.note}</span>}
            </span>
          )}
        </Link>
        {action && (
          <div className="absolute inset-x-1 bottom-1 z-10">
            {action.href ? (
              <Link href={action.href} className={`${barCls} bg-[var(--cr-brand)] text-white hover:bg-[var(--cr-brand-dark)]`}>
                {action.label}
              </Link>
            ) : (
              <button
                type="button"
                onClick={action.onClick}
                data-rg="product-card-add-to-cart"
                className={`${barCls} ${action.done ? 'bg-ink text-white' : 'bg-[var(--cr-brand)] text-white hover:bg-[var(--cr-brand-dark)]'}`}
              >
                <BagIcon className="h-3.5 w-3.5" />
                {action.done ? action.doneLabel ?? action.label : action.label}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-1 flex-col border-t border-gray-100 pt-3">
        {subtitle && <p className="truncate text-[10px] text-ink/60">{subtitle}</p>}
        <h3 className="mt-1 line-clamp-2 text-[12px] font-medium leading-snug text-ink" data-rg="product-card-title">
          <Link href={href} className="hover:text-[var(--cr-brand)]">
            {name}
          </Link>
        </h3>
        {priceText ? (
          <p className="mt-1 text-sm font-bold">{priceText}</p>
        ) : (
          price && (
            <p className="mt-1 text-sm font-bold" data-rg="product-card-price">
              <span className={onSale ? 'text-[var(--cr-brand)]' : 'text-ink'}>{price}</span>
              {oldPrice && <span className="ml-2 text-[11px] font-normal text-ink/40 line-through">{oldPrice}</span>}
            </p>
          )
        )}
        {rating && rating.count > 0 && (
          <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-ink/60">
            <ChronicsStars value={rating.average} />
            <span>({rating.count})</span>
          </div>
        )}
        {extra}
        {secondary && (
          <button
            type="button"
            onClick={secondary.onClick}
            data-rg="product-card-buy-now"
            className="mt-auto flex w-full items-center justify-center rounded-md border border-[var(--cr-brand)]/60 py-2 text-[12px] font-semibold text-[var(--cr-brand)] transition hover:bg-[var(--cr-soft)]"
          >
            {secondary.label}
          </button>
        )}
      </div>
      {after}
    </article>
  );
}
