'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { HeartIcon } from './icons';

export interface MahabeshCardViewProps {
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

/** Stars drawn in amber with pale grey for the empty ones. */
export function MahabeshStars({ value, className = 'h-[12px] w-[12px]' }: { value: number; className?: string }) {
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
 * Mahabesh's product card (resources/views/partials/product-card.blade.php, .s-card): no box, a tall 4:5 photo on a light
 * grey well with rounded corners, a yellow arrow-shaped "-14%" tag on its top left, a round white heart on its top right,
 * a small flag at the bottom left (Pre-order, Sold out); under it the name (two lines), the bold price with the old one
 * crossed out in grey, and two pill buttons side by side: a black "Add to cart" and an outlined "Buy now" (both always
 * shown). Drawing only: the store's card (storepal ProductCard, skin mahabesh) passes its own cart, wishlist and quick-add
 * behaviour in, and the demo page passes sample data.
 */
export function MahabeshCardView({
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
}: MahabeshCardViewProps) {
  void portrait;
  const btn = 'mh-btn mh-btn-sm w-full';
  return (
    <article
      data-rg="product-card"
      data-rg-product={dataProduct}
      onClickCapture={(e) => {
        if (onLinkClick && (e.target as HTMLElement).closest('a')?.getAttribute('href') === href) onLinkClick();
      }}
      className={`mh-fade-up group relative flex h-full min-w-0 flex-col ${soldOut ? 'mh-soldout' : ''}`}
    >
      <Link href={href} aria-label={name} className="relative block aspect-[4/5] overflow-hidden rounded-[10px] bg-[var(--mh-well)]">
        {image ? (
          plainImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={name} loading="lazy" className="mh-card-img h-full w-full object-cover object-top transition duration-[600ms] group-hover:scale-[1.03]" />
          ) : (
            <Image src={image} alt={name} fill sizes="(max-width: 640px) 50vw, 260px" className="mh-card-img object-cover object-top transition duration-[600ms] group-hover:scale-[1.03]" />
          )
        ) : (
          <span className="grid h-full w-full place-items-center text-[12px] text-muted">{name.slice(0, 1)}</span>
        )}
        {badge && (
          <span className="mh-tag" style={badge.color ? { backgroundColor: badge.color, color: '#fff' } : undefined}>
            {badge.text}
          </span>
        )}
        {soldOut ? (
          <span className="absolute bottom-2.5 left-2.5 z-[2] flex flex-col items-start gap-1">
            <span className="rounded-full bg-black px-[9px] py-[3px] text-[11.5px] font-bold text-white">{soldOut.label}</span>
            {soldOut.note && <span className="rounded-full bg-white px-[9px] py-[3px] text-[11.5px] font-bold text-black">{soldOut.note}</span>}
          </span>
        ) : null}
      </Link>

      {showWish && (
        <button
          type="button"
          onClick={onWish}
          aria-pressed={wished}
          aria-label={wished ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
          className={`mh-wish ${wished ? 'is-on' : ''}`}
        >
          <HeartIcon className={`h-[15px] w-[15px] ${wished ? 'fill-[var(--mh-brand)]' : ''}`} />
        </button>
      )}

      <div className="flex flex-1 flex-col gap-1 pt-3">
        {subtitle && <p className="truncate text-[12px] text-[#9a9ca3]">{subtitle}</p>}
        <h3 className="line-clamp-2 min-h-[2.7em] text-[14.5px] font-medium leading-[1.35] text-[#1d1d1f]" data-rg="product-card-title">
          <Link href={href} className="hover:text-[var(--mh-brand)]">
            {name}
          </Link>
        </h3>
        {priceText ? (
          <p className="text-[16px] font-extrabold tracking-[-0.01em] text-black">{priceText}</p>
        ) : (
          price && (
            <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 tabular-nums" data-rg="product-card-price">
              <span className="text-[16px] font-extrabold tracking-[-0.01em] text-black">{price}</span>
              {oldPrice && <span className="text-[13.5px] text-[#9a9ca3] line-through">{oldPrice}</span>}
            </p>
          )
        )}
        {rating && rating.count > 0 && (
          <div className="flex items-center gap-1.5 text-[12px] text-[#62646b]">
            <MahabeshStars value={rating.average} />
            <span>({rating.count})</span>
          </div>
        )}
        {extra}
        {(action || secondary) && (
          <div className={`mt-2.5 grid gap-1.5 ${action && secondary ? 'grid-cols-1 min-[420px]:grid-cols-2' : 'grid-cols-1'}`}>
            {action &&
              (action.href ? (
                <Link href={action.href} className={`${btn}`}>
                  {action.label}
                </Link>
              ) : (
                <button type="button" onClick={action.onClick} data-rg="product-card-add-to-cart" className={`${btn} ${action.done ? 'is-done' : ''}`}>
                  {action.done ? action.doneLabel ?? action.label : action.label}
                </button>
              ))}
            {secondary && (
              <button type="button" onClick={secondary.onClick} data-rg="product-card-buy-now" className={`${btn} mh-btn-line`}>
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
