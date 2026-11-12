'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { HeartIcon } from './icons';

export interface TechzoneCardViewProps {
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
export function TechzoneStars({ value, className = 'h-[12px] w-[12px]' }: { value: number; className?: string }) {
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
 * TechZone's product card (components/ProductCard.tsx): a white box with a slate border and rounded corners that lifts with a
 * shadow on hover, a photo on a soft grey gradient with the photo multiplied into it, a small blue tag on its top left and a
 * plain navy heart on its top right; under it the name (one line), the stars and count, the bold navy price with the old one
 * crossed out, and the buttons (a navy "Add to cart" that turns blue on hover, and an outlined "Buy now"; both always
 * shown). Drawing only: the store's card (storepal ProductCard, skin techzone) passes its own cart, wishlist and quick-add
 * behaviour in, and the demo page passes sample data.
 */
export function TechzoneCardView({
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
}: TechzoneCardViewProps) {
  void portrait;
  void subtitle;
  const btn = 'tz-btn-sm !h-8 !rounded-md !px-2 !text-[11px] w-full';
  return (
    <article
      data-rg="product-card"
      data-rg-product={dataProduct}
      onClickCapture={(e) => {
        if (onLinkClick && (e.target as HTMLElement).closest('a')?.getAttribute('href') === href) onLinkClick();
      }}
      className={`tz-fade-up group relative flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-2 transition hover:shadow-lg ${soldOut ? 'tz-soldout' : ''}`}
    >
      <div className="relative h-36 overflow-hidden rounded-lg bg-gradient-to-b from-slate-100 to-slate-200/70 sm:h-40">
        <Link href={href} aria-label={name} className="relative block h-full">
          {image ? (
            plainImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt={name} loading="lazy" className="tz-card-img h-full w-full object-cover mix-blend-multiply transition duration-500 group-hover:scale-105" />
            ) : (
              <Image src={image} alt={name} fill sizes="(max-width: 640px) 50vw, 260px" className="tz-card-img object-cover mix-blend-multiply transition duration-500 group-hover:scale-105" />
            )
          ) : (
            <span className="grid h-full w-full place-items-center text-[12px] text-muted">{name.slice(0, 1)}</span>
          )}
        </Link>
        {badge && (
          <span className="tz-tag" style={badge.color ? { backgroundColor: badge.color, color: '#fff' } : undefined}>
            {badge.text}
          </span>
        )}
        {soldOut ? (
          <span className="pointer-events-none absolute bottom-2 left-2 z-[2] flex flex-col items-start gap-1">
            <span className="rounded bg-[var(--tz-navy)] px-2 py-0.5 text-[10.5px] font-semibold text-white">{soldOut.label}</span>
            {soldOut.note && <span className="rounded bg-white px-2 py-0.5 text-[10.5px] font-semibold text-[var(--tz-navy)]">{soldOut.note}</span>}
          </span>
        ) : null}
        {showWish && (
          <button
            type="button"
            onClick={onWish}
            aria-pressed={wished}
            aria-label={wished ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
            className={`tz-wish ${wished ? 'is-on' : ''}`}
          >
            <HeartIcon className={`h-4 w-4 ${wished ? 'fill-red-500' : ''}`} />
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col px-1 pb-1 pt-3">
        <h3 className="truncate text-[12px] font-medium !text-slate-800" data-rg="product-card-title">
          <Link href={href} className="hover:text-[var(--tz-brand)]">
            {name}
          </Link>
        </h3>
        {rating && rating.count > 0 && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <TechzoneStars value={rating.average} />
            <span className="text-[10px] text-slate-500">({rating.count})</span>
          </div>
        )}
        {priceText ? (
          <p className="mt-2 text-[13px] font-bold text-[var(--tz-navy)]">{priceText}</p>
        ) : (
          price && (
            <p className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 tabular-nums" data-rg="product-card-price">
              <span className="text-[13px] font-bold text-[var(--tz-navy)]">{price}</span>
              {oldPrice && <span className="text-[10px] text-slate-400 line-through">{oldPrice}</span>}
            </p>
          )
        )}
        {extra}
        {(action || secondary) && (
          <div className="mt-3 grid grid-cols-1 gap-1.5">
            {action &&
              (action.href ? (
                <Link href={action.href} className={`tz-btn-dark ${btn}`}>
                  {action.label}
                </Link>
              ) : (
                <button type="button" onClick={action.onClick} data-rg="product-card-add-to-cart" className={`tz-btn-dark ${btn} ${action.done ? 'is-done' : ''}`}>
                  {action.done ? action.doneLabel ?? action.label : action.label}
                </button>
              ))}
            {secondary && (
              <button type="button" onClick={secondary.onClick} data-rg="product-card-buy-now" className={`tz-btn tz-btn-line ${btn}`}>
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
