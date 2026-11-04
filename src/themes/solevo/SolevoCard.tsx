'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { HeartIcon } from './icons';

export interface SolevoCardViewProps {
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

/** The template's stars (templete/solevo Stars.tsx): copper-gold filled, pale grey empty. */
export function SolevoStars({ value, className = 'h-[11px] w-[11px]' }: { value: number; className?: string }) {
  return (
    <span className="inline-flex items-center gap-[1px]" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox="0 0 24 24" className={className} fill={i <= Math.round(value) ? '#C8842F' : '#D9D4CE'}>
          <path d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9L12 2.5Z" />
        </svg>
      ))}
    </span>
  );
}

/**
 * Solevo's product card (templete/solevo ProductCard.tsx): a white card with a hairline border and a soft shadow that lifts
 * on hover, a light grey photo area (the photo blends into it), a copper "-14%" tag on the top left, a round heart on the
 * top right, the name, the category in grey, the bold price with the old price crossed out, stars, and a bordered
 * "Add to Cart" button. Drawing only: the store's card (storepal ProductCard, skin solevo) passes its own cart, wishlist
 * and quick-add behaviour in, and the demo page passes sample data. Buttons are always shown (the owner's rule).
 */
export function SolevoCardView({
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
}: SolevoCardViewProps) {
  const buttonCls =
    'flex w-full items-center justify-center border py-2 text-[11px] font-semibold uppercase tracking-wider transition';
  return (
    <article
      data-rg="product-card"
      data-rg-product={dataProduct}
      onClickCapture={(e) => {
        if (onLinkClick && (e.target as HTMLElement).closest('a')?.getAttribute('href') === href) onLinkClick();
      }}
      className="sv-fade-up group relative flex h-full flex-col overflow-hidden rounded-lg border border-black/[0.06] bg-white shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative bg-[var(--sv-card)]">
        {badge && (
          <div className="pointer-events-none absolute left-2.5 top-2.5 z-10 flex flex-col items-start gap-1">
            <span
              className="px-1.5 py-0.5 text-[10px] font-bold leading-none text-white"
              style={{ backgroundColor: badge.color || (badge.tone === 'sale' ? 'var(--sv-gold)' : '#111111') }}
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
            className="absolute right-2.5 top-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 transition hover:bg-white"
          >
            <HeartIcon className={`h-4 w-4 ${wished ? 'fill-[var(--sv-gold)] text-[var(--sv-gold)]' : 'text-ink/70'}`} />
          </button>
        )}
        <Link href={href} aria-label={name} className={`relative block overflow-hidden ${portrait ? 'aspect-[3/4]' : 'aspect-[4/3]'}`}>
          {image ? (
            plainImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt={name} loading="lazy" className="h-full w-full object-cover mix-blend-multiply transition duration-500 group-hover:scale-105" />
            ) : (
              <Image src={image} alt={name} fill sizes="(max-width: 640px) 50vw, 240px" className="object-cover mix-blend-multiply transition duration-500 group-hover:scale-105" />
            )
          ) : (
            <span className="grid h-full w-full place-items-center text-[12px] text-muted">{name.slice(0, 1)}</span>
          )}
          {soldOut && (
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-white/75">
              <span className="bg-ink px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">{soldOut.label}</span>
              {soldOut.note && <span className="bg-white/90 px-2 py-0.5 text-[10.5px] font-medium text-ink">{soldOut.note}</span>}
            </span>
          )}
        </Link>
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-3.5">
        <h3 className="line-clamp-2 min-h-[2.25rem] text-[13px] font-semibold leading-snug" data-rg="product-card-title">
          <Link href={href} className="hover:text-[var(--sv-gold)]">
            {name}
          </Link>
        </h3>
        {subtitle && <p className="mt-0.5 truncate text-[11px] text-ink/60">{subtitle}</p>}
        {priceText ? (
          <p className="mt-2 text-[13px] font-bold">{priceText}</p>
        ) : (
          price && (
            <p className="mt-2 flex flex-wrap items-baseline gap-x-2 text-sm font-bold" data-rg="product-card-price">
              {price}
              {oldPrice && <span className="text-[11px] font-normal text-ink/45 line-through">{oldPrice}</span>}
            </p>
          )
        )}
        {rating && rating.count > 0 && (
          <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-ink/60">
            <SolevoStars value={rating.average} />
            <span>({rating.count})</span>
          </div>
        )}
        {extra}

        {(action || secondary) && (
          <div className="mt-auto space-y-1.5 pt-3">
            {action &&
              (action.href ? (
                <Link href={action.href} className={`${buttonCls} border-ink hover:bg-ink hover:text-white`}>
                  {action.label}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={action.onClick}
                  data-rg="product-card-add-to-cart"
                  className={`${buttonCls} border-ink ${action.done ? 'bg-ink text-white' : 'hover:bg-ink hover:text-white'}`}
                >
                  {action.done ? action.doneLabel ?? action.label : action.label}
                </button>
              ))}
            {secondary && (
              <button
                type="button"
                onClick={secondary.onClick}
                data-rg="product-card-buy-now"
                className={`${buttonCls} border-ink bg-ink text-white hover:border-[var(--sv-gold)] hover:bg-[var(--sv-gold)]`}
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
