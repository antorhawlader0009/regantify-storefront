'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { HeartIcon } from './icons';

export interface VaeloraCardViewProps {
  href: string;
  name: string;
  /** Small grey line under the name (the store's category). */
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

/** Stars drawn in amber with pale grey for the empty ones (the template's 12px stars). */
export function VaeloraStars({ value, className = 'h-[12px] w-[12px]' }: { value: number; className?: string }) {
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
 * Vaelora's product card (components/ProductCard.tsx): no box, a tall 4:5 photo on a light grey well with the photo multiplied
 * into it, a round frosted-white heart on its top right (a small brass tag on its top left for a discount or the store's badge);
 * under it, centred: the small spaced category in capitals, the serif name, the price (with the old one crossed out) and the
 * stars; then an outlined "Add to cart" that fills black on hover and an outlined "Buy now" (both always shown). Drawing only:
 * the store's card (storepal ProductCard, skin vaelora) passes its own cart, wishlist and quick-add behaviour in, and the demo
 * page passes sample data.
 */
export function VaeloraCardView({
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
}: VaeloraCardViewProps) {
  void portrait;
  const btn = 'va-btn-sm !h-9 !px-2 !text-[10px] w-full';
  return (
    <article
      data-rg="product-card"
      data-rg-product={dataProduct}
      onClickCapture={(e) => {
        if (onLinkClick && (e.target as HTMLElement).closest('a')?.getAttribute('href') === href) onLinkClick();
      }}
      className={`va-fade-up group relative flex h-full min-w-0 flex-col ${soldOut ? 'va-soldout' : ''}`}
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-neutral-100">
        <Link href={href} aria-label={name} className="relative block h-full w-full">
          {image ? (
            plainImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt={name} loading="lazy" className="va-card-img h-full w-full object-cover mix-blend-multiply transition duration-700 group-hover:scale-105" />
            ) : (
              <Image src={image} alt={name} fill sizes="(max-width: 640px) 50vw, 300px" className="va-card-img object-cover mix-blend-multiply transition duration-700 group-hover:scale-105" />
            )
          ) : (
            <span className="grid h-full w-full place-items-center font-serif text-3xl text-neutral-400">{name.slice(0, 1)}</span>
          )}
        </Link>
        {badge && (
          <span className="va-tag" style={badge.color ? { backgroundColor: badge.color, color: '#fff' } : undefined}>
            {badge.text}
          </span>
        )}
        {soldOut ? (
          <span className="pointer-events-none absolute bottom-2.5 left-2.5 z-[2] flex flex-col items-start gap-1">
            <span className="bg-black px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.14em] text-white">{soldOut.label}</span>
            {soldOut.note && <span className="bg-white px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.14em] text-black">{soldOut.note}</span>}
          </span>
        ) : null}
        {showWish && (
          <button
            type="button"
            onClick={onWish}
            aria-pressed={wished}
            aria-label={wished ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
            className="absolute right-2.5 top-2.5 z-[3] flex h-8 w-8 items-center justify-center rounded-full bg-white/85 backdrop-blur transition hover:bg-white"
          >
            <HeartIcon className={`h-4 w-4 ${wished ? 'fill-[var(--va-brand)] text-[var(--va-brand)]' : ''}`} />
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-1 flex-col text-center">
        {subtitle && <p className="truncate text-[10px] uppercase tracking-[0.2em] text-neutral-500">{subtitle}</p>}
        <h3 className="mt-1 line-clamp-2 text-lg leading-snug" data-rg="product-card-title">
          <Link href={href} className="hover:text-[var(--va-brand)]">
            {name}
          </Link>
        </h3>
        {priceText ? (
          <p className="mt-1 text-sm text-neutral-700">{priceText}</p>
        ) : (
          price && (
            <p className="mt-1 flex flex-wrap items-baseline justify-center gap-x-2 text-sm text-neutral-700 tabular-nums" data-rg="product-card-price">
              <span>{price}</span>
              {oldPrice && <span className="text-xs text-neutral-400 line-through">{oldPrice}</span>}
            </p>
          )
        )}
        {rating && rating.count > 0 && (
          <div className="mt-1.5 flex items-center justify-center gap-1.5 text-[10px] text-neutral-500">
            <VaeloraStars value={rating.average} className="h-[11px] w-[11px]" /> ({rating.count})
          </div>
        )}
        {extra}
        {(action || secondary) && (
          <div className="mt-4 grid grid-cols-1 gap-1.5">
            {action &&
              (action.href ? (
                <Link href={action.href} className={`va-btn va-btn-line ${btn}`}>
                  {action.label}
                </Link>
              ) : (
                <button type="button" onClick={action.onClick} data-rg="product-card-add-to-cart" className={`va-btn va-btn-line ${btn} ${action.done ? 'is-done' : ''}`}>
                  {action.done ? action.doneLabel ?? action.label : action.label}
                </button>
              ))}
            {secondary && (
              <button type="button" onClick={secondary.onClick} data-rg="product-card-buy-now" className={`va-btn ${btn}`}>
                {secondary.label}
              </button>
            )}
          </div>
        )}
      </div>
      {after}
    </article>
  );
}
