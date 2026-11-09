'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BagIcon, HeartIcon } from './icons';

export interface ChicwoveCardViewProps {
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

/** Stars drawn in amber with pale grey for the empty ones (the template's product page rating, at a card's size). */
export function ChicwoveStars({ value, className = 'h-[11px] w-[11px]' }: { value: number; className?: string }) {
  return (
    <span className="inline-flex items-center gap-[1px]" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox="0 0 24 24" className={className} fill={i <= Math.round(value) ? '#F5A524' : '#E5DDD6'}>
          <path d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9L12 2.5Z" />
        </svg>
      ))}
    </span>
  );
}

/**
 * Chicwove's product card (templete/chicwove ProductCard.tsx): a white rounded card with a coral-tinted shadow that lifts on
 * hover, a peach photo area with rounded corners, a black "-14%" tag on the top left, a round white heart on the top right,
 * the name, the bold coral price with the old price crossed out, and a coral "Add to Cart" button. Drawing only: the
 * store's card (storepal ProductCard, skin chicwove) passes its own cart, wishlist and quick-add behaviour in, and the demo
 * page passes sample data. Buttons are always shown (the owner's rule).
 */
export function ChicwoveCardView({
  href,
  name,
  subtitle,
  image,
  plainImage = false,
  portrait = true,
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
}: ChicwoveCardViewProps) {
  const buttonCls = 'flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition';
  return (
    <article
      data-rg="product-card"
      data-rg-product={dataProduct}
      onClickCapture={(e) => {
        if (onLinkClick && (e.target as HTMLElement).closest('a')?.getAttribute('href') === href) onLinkClick();
      }}
      className="cw-fade-up group relative flex h-full flex-col rounded-2xl bg-white p-1.5 shadow-[var(--shadow-card)] transition hover:-translate-y-1"
    >
      <div className="relative overflow-hidden rounded-xl bg-[var(--cw-card)]">
        {badge && (
          <div className="pointer-events-none absolute left-2 top-2 z-10 flex flex-col items-start gap-1.5">
            <span
              className="rounded-md px-2.5 py-1 text-[11px] font-semibold leading-none text-white"
              style={{ backgroundColor: badge.color || (badge.tone === 'sale' ? '#1b1b1b' : 'var(--cw-brand)') }}
            >
              {badge.text}
            </span>
          </div>
        )}
        {showWish && (
          <button
            type="button"
            onClick={onWish}
            aria-pressed={wished}
            aria-label={wished ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
            className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow"
          >
            <HeartIcon className={`h-4 w-4 ${wished ? 'fill-[var(--cw-brand)] text-[var(--cw-brand)]' : 'text-neutral-700'}`} />
          </button>
        )}
        <Link href={href} aria-label={name} className={`relative block overflow-hidden ${portrait ? 'aspect-[4/5]' : 'aspect-square'}`}>
          {image ? (
            plainImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt={name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            ) : (
              <Image src={image} alt={name} fill sizes="(max-width: 640px) 50vw, 300px" className="object-cover transition duration-500 group-hover:scale-105" />
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
      </div>

      <div className="flex flex-1 flex-col px-3 pb-3 pt-3">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug" data-rg="product-card-title">
          <Link href={href} className="hover:text-[var(--cw-brand)]">
            {name}
          </Link>
        </h3>
        {subtitle && <p className="mt-0.5 truncate text-[11px] text-neutral-500">{subtitle}</p>}
        {priceText ? (
          <p className="mt-1 text-sm font-bold text-[var(--cw-brand)]">{priceText}</p>
        ) : (
          price && (
            <p className="mt-1 flex flex-wrap items-baseline gap-x-2" data-rg="product-card-price">
              <span className="text-lg font-bold text-[var(--cw-brand)]">{price}</span>
              {oldPrice && <span className="text-xs font-normal text-neutral-400 line-through">{oldPrice}</span>}
            </p>
          )
        )}
        {rating && rating.count > 0 && (
          <div className="mt-1 flex items-center gap-1.5 text-[10px] text-neutral-500">
            <ChicwoveStars value={rating.average} />
            <span>({rating.count})</span>
          </div>
        )}
        {extra}

        {(action || secondary) && (
          <div className="mt-auto space-y-2 pt-3">
            {action &&
              (action.href ? (
                <Link href={action.href} className={`${buttonCls} bg-[var(--cw-brand)] text-white hover:bg-[var(--cw-brand-dark)]`}>
                  {action.label}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={action.onClick}
                  data-rg="product-card-add-to-cart"
                  className={`${buttonCls} ${action.done ? 'bg-ink text-white' : 'bg-[var(--cw-brand)] text-white hover:bg-[var(--cw-brand-dark)]'}`}
                >
                  <BagIcon className="h-4 w-4" />
                  {action.done ? action.doneLabel ?? action.label : action.label}
                </button>
              ))}
            {secondary && (
              <button
                type="button"
                onClick={secondary.onClick}
                data-rg="product-card-buy-now"
                className={`${buttonCls} border border-[var(--cw-brand)]/60 text-[var(--cw-brand)] hover:bg-[var(--cw-soft)]`}
              >
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
