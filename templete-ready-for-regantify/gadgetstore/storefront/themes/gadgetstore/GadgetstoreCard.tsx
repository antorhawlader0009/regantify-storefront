'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BagIcon, HeartIcon } from './icons';

export interface GadgetstoreCardViewProps {
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
export function GadgetstoreStars({ value, className = 'h-[11px] w-[11px]' }: { value: number; className?: string }) {
  return (
    <span className="inline-flex items-center gap-[1px]" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox="0 0 24 24" className={className} fill={i <= Math.round(value) ? '#f59e0b' : '#e5e5e5'}>
          <path d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9L12 2.5Z" />
        </svg>
      ))}
    </span>
  );
}

/**
 * Gadgetstore's product card (templete/gadgetstore ProductCard.tsx): a white rounded card with a mocha-tinted shadow that lifts on
 * hover, a sand photo area with rounded corners, a black "-14%" tag on the top left, a round white heart on the top right,
 * the name, the bold mocha price with the old price crossed out, and a mocha "Add to Cart" button. Drawing only: the
 * store's card (storepal ProductCard, skin gadgetstore) passes its own cart, wishlist and quick-add behaviour in, and the demo
 * page passes sample data. Buttons are always shown (the owner's rule).
 */
export function GadgetstoreCardView({
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
}: GadgetstoreCardViewProps) {
  const buttonCls = 'flex w-full items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-wider transition';
  return (
    <article
      data-rg="product-card"
      data-rg-product={dataProduct}
      onClickCapture={(e) => {
        if (onLinkClick && (e.target as HTMLElement).closest('a')?.getAttribute('href') === href) onLinkClick();
      }}
      className="gs-fade-up group relative flex h-full min-w-0 flex-col"
    >
      <div className="relative overflow-hidden rounded-sm bg-[#f4f4f4]">
        {badge && (
          <div className="pointer-events-none absolute left-2 top-2 z-10 flex flex-col items-start gap-1.5">
            <span
              className="px-1.5 py-0.5 text-[9px] font-bold leading-none text-ink"
              style={{ backgroundColor: badge.color || '#BAD61F', color: badge.color ? '#fff' : undefined }}
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
        <Link href={href} aria-label={name} className={`relative block overflow-hidden ${'aspect-square'}`}>
          {image ? (
            plainImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt={name} loading="lazy" className="h-full w-full object-cover mix-blend-multiply transition duration-500 group-hover:scale-105" />
            ) : (
              <Image src={image} alt={name} fill sizes="(max-width: 640px) 50vw, 300px" className="object-cover mix-blend-multiply transition duration-500 group-hover:scale-105" />
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

      <div className="flex flex-1 flex-col pt-3">
        <h3 className="line-clamp-2 min-h-[2.8em] text-[11.5px] font-medium leading-snug text-ink" data-rg="product-card-title">
          <Link href={href} className="hover:text-[var(--gs-brand)]">
            {name}
          </Link>
        </h3>
        {subtitle && <p className="mt-0.5 truncate text-[11px] text-neutral-500">{subtitle}</p>}
        {priceText ? (
          <p className="mt-1 text-[12px] font-bold text-ink">{priceText}</p>
        ) : (
          price && (
            <p className="mt-1 flex flex-wrap items-baseline gap-x-2" data-rg="product-card-price">
              <span className="text-[12px] font-bold text-ink">{price}</span>
              {oldPrice && <span className="text-[12px] font-normal text-neutral-400 line-through">{oldPrice}</span>}
            </p>
          )
        )}
        {rating && rating.count > 0 && (
          <div className="mt-1 flex items-center gap-1.5 text-[10px] text-neutral-500">
            <GadgetstoreStars value={rating.average} />
            <span>({rating.count})</span>
          </div>
        )}
        {extra}

        {(action || secondary) && (
          <div className="mt-auto space-y-2 pt-3">
            {action &&
              (action.href ? (
                <Link href={action.href} className={`${buttonCls} bg-black text-white hover:bg-neutral-800`}>
                  {action.label}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={action.onClick}
                  data-rg="product-card-add-to-cart"
                  className={`${buttonCls} ${action.done ? 'bg-[var(--gs-brand)] text-ink' : 'bg-black text-white hover:bg-neutral-800'}`}
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
                className={`${buttonCls} border border-neutral-300 bg-white text-ink hover:border-black`}
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
