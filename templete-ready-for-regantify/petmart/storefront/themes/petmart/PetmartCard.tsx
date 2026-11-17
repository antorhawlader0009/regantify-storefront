'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BagIcon, HeartIcon } from './icons';

export interface PetmartCardViewProps {
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
export function PetmartStars({ value, className = 'h-[11px] w-[11px]' }: { value: number; className?: string }) {
  return (
    <span className="inline-flex items-center gap-[1px]" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox="0 0 24 24" className={className} fill={i <= Math.round(value) ? '#fbbf24' : '#d6d3d1'}>
          <path d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9L12 2.5Z" />
        </svg>
      ))}
    </span>
  );
}

/**
 * Petmart's product card (templete/petmart ProductCard.tsx): a white rounded card with a mocha-tinted shadow that lifts on
 * hover, a sand photo area with rounded corners, a black "-14%" tag on the top left, a round white heart on the top right,
 * the name, the bold mocha price with the old price crossed out, and a mocha "Add to Cart" button. Drawing only: the
 * store's card (storepal ProductCard, skin petmart) passes its own cart, wishlist and quick-add behaviour in, and the demo
 * page passes sample data. Buttons are always shown (the owner's rule).
 */
export function PetmartCardView({
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
}: PetmartCardViewProps) {
  const roundBtn = 'ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1d4a3c] text-white transition hover:bg-[var(--pk-brand)] active:scale-95';
  const buttonCls = 'flex w-full items-center justify-center gap-2 rounded-md py-2 text-[11px] font-semibold transition';
  return (
    <article
      data-rg="product-card"
      data-rg-product={dataProduct}
      onClickCapture={(e) => {
        if (onLinkClick && (e.target as HTMLElement).closest('a')?.getAttribute('href') === href) onLinkClick();
      }}
      className="pk-fade-up group relative flex h-full flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-card-hover)]"
    >
      <div className="relative overflow-hidden bg-[#f4f4f4]">
        {badge && (
          <div className="pointer-events-none absolute left-2 top-2 z-10 flex flex-col items-start gap-1.5">
            <span
              className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white"
              style={{ backgroundColor: badge.color || ('#c74d1e') }}
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
            className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/85 hover:bg-white"
          >
            <HeartIcon className={`h-4 w-4 ${wished ? 'fill-rose-500 text-rose-500' : 'text-neutral-700'}`} />
          </button>
        )}
        <Link href={href} aria-label={name} className={`relative block overflow-hidden ${'aspect-[4/3.6]'}`}>
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
              <span className="rounded-md bg-ink px-2.5 py-1 text-[11px] font-medium text-white">{soldOut.label}</span>
              {soldOut.note && <span className="rounded bg-white/90 px-2 py-0.5 text-[10.5px] font-medium text-ink">{soldOut.note}</span>}
            </span>
          )}
        </Link>
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-[13px] font-semibold leading-snug text-slate-900" data-rg="product-card-title">
          <Link href={href} className="hover:text-[var(--pk-brand)]">
            {name}
          </Link>
        </h3>
        {subtitle && <p className="mt-0.5 truncate text-[11px] text-neutral-500">{subtitle}</p>}
        {priceText ? (
          <p className="mt-1 text-xl font-bold text-slate-900">{priceText}</p>
        ) : (
          price && (
            <p className="mt-1 flex flex-wrap items-baseline gap-x-2" data-rg="product-card-price">
              <span className="text-xl font-bold text-slate-900">{price}</span>
              {oldPrice && <span className="text-[11px] font-normal text-neutral-400 line-through">{oldPrice}</span>}
            </p>
          )
        )}
        {rating && rating.count > 0 && (
          <div className="mt-1 flex items-center gap-1.5 text-[10px] text-neutral-500">
            <PetmartStars value={rating.average} />
            <span>({rating.count})</span>
          </div>
        )}
        {extra}

        {(action || secondary) && (
          <div className="mt-auto flex items-center justify-between gap-2 pt-3">
            {secondary && (
              <button
                type="button"
                onClick={secondary.onClick}
                data-rg="product-card-buy-now"
                className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-ink transition hover:border-[var(--pk-brand)]"
              >
                {secondary.label}
              </button>
            )}
            {action &&
              (action.href ? (
                <Link href={action.href} aria-label={action.label} className={roundBtn}>
                  <BagIcon className="h-[18px] w-[18px]" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={action.onClick}
                  data-rg="product-card-add-to-cart"
                  aria-label={action.done ? action.doneLabel ?? action.label : action.label}
                  className={roundBtn}
                >
                  <BagIcon className="h-[18px] w-[18px]" />
                </button>
              ))}
                    </div>
        )}
      </div>
      {after}
    </article>
  );
}
