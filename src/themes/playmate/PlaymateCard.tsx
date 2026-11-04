'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CartIcon, HeartIcon } from './icons';

export interface PlaymateCardViewProps {
  href: string;
  name: string;
  /** Small grey line under the name (the demo's subtitle; a store's category). */
  subtitle?: string | null;
  image?: string | null;
  /** The demo page uses outside photos, which go through a plain <img> instead of the store's image loader. */
  plainImage?: boolean;
  portrait?: boolean;
  /** Shown price, already formatted; null hides the price line (price on request, coming soon). */
  price: string | null;
  oldPrice?: string | null;
  /** The pill on the photo's corner: the store's badge, else "-14%" for a discount, else "New". */
  badge?: { text: string; color?: string | null; tone?: 'brand' | 'sale' } | null;
  rating?: { average: number; count: number } | null;
  showWish?: boolean;
  wished?: boolean;
  onWish?: () => void;
  /** "Out of Stock" over the photo, with an optional second line ("Back 20 Nov"). */
  soldOut?: { label: string; note?: string | null } | null;
  /** Extra lines between the price and the button: low stock, "42 bought", swatches, a flash timer. */
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

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-[1px]" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox="0 0 24 24" className="h-[11px] w-[11px]" fill={i <= Math.round(value) ? 'var(--pm-yellow-strong)' : '#d9d6e6'}>
          <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z" />
        </svg>
      ))}
    </span>
  );
}

/**
 * PlayMate's product card (templete/playmate ProductCard.tsx): a soft grey card, the heart on the top right, a pill on
 * the top left, the photo on white, the name in bold, the price with the old price crossed out, stars, and a purple
 * "Add to Cart" that slides up on hover on a computer and is always there on a phone. Drawing only: the store's
 * card (storepal ProductCard, skin playmate) passes its own cart, wishlist and quick-add behaviour in, and the
 * template demo page passes sample data.
 */
export function PlaymateCardView({
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
}: PlaymateCardViewProps) {
  const buttonCls =
    // Always shown (the owner's rule, 2026-11-04): the template hid them until hover; shoppers missed them.
    'flex w-full items-center justify-center gap-2 rounded-[4px] py-2 text-[11px] font-semibold uppercase tracking-wide transition';
  const primaryCls = `${buttonCls} bg-accent text-white hover:bg-accent-dark`;
  return (
    <article
      data-rg="product-card"
      data-rg-product={dataProduct}
      onClickCapture={(e) => {
        if (onLinkClick && (e.target as HTMLElement).closest('a')?.getAttribute('href') === href) onLinkClick();
      }}
      className="group relative flex h-full flex-col rounded-[6px] bg-[var(--pm-card)] p-3 transition duration-300 hover:shadow-lg"
    >
      {showWish && (
        <button
          type="button"
          onClick={onWish}
          aria-pressed={wished}
          aria-label={wished ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
          className="absolute right-4 top-4 z-10 rounded-full bg-white/90 p-1.5 shadow-sm transition hover:scale-110"
        >
          <HeartIcon className={`h-[18px] w-[18px] ${wished ? 'fill-red-500 text-red-500' : 'text-ink'}`} />
        </button>
      )}

      {badge && (
        <span
          className={`absolute left-4 top-4 z-10 rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-white ${badge.tone === 'sale' ? 'bg-red-500' : 'bg-accent'}`}
          style={badge.color ? { backgroundColor: badge.color } : undefined}
        >
          {badge.text}
        </span>
      )}

      <Link href={href} tabIndex={-1} aria-hidden="true" className={`relative block overflow-hidden rounded-[4px] bg-white ${portrait ? 'aspect-[3/4]' : 'aspect-square'}`}>
        {image ? (
          plainImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          ) : (
            <Image src={image} alt={name} fill sizes="(max-width: 640px) 50vw, 240px" className="object-cover transition duration-500 group-hover:scale-105" />
          )
        ) : (
          <span className="grid h-full w-full place-items-center text-[12px] text-muted">{name.slice(0, 1)}</span>
        )}
        {soldOut && (
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-white/75">
            <span className="rounded bg-ink px-2.5 py-1 text-[11px] font-semibold text-white">{soldOut.label}</span>
            {soldOut.note && <span className="rounded bg-white/90 px-2 py-0.5 text-[10.5px] font-medium text-ink">{soldOut.note}</span>}
          </span>
        )}
      </Link>

      <div className="mt-2 flex-1">
        <h3 className="text-[12.5px] font-bold leading-tight text-ink" data-rg="product-card-title">
          <Link href={href} className="line-clamp-2 hover:text-accent">
            {name}
          </Link>
        </h3>
        {subtitle && <p className="mt-0.5 truncate text-[11px] text-muted">{subtitle}</p>}
        {priceText ? (
          <p className="mt-2 text-[13px] font-extrabold text-accent">{priceText}</p>
        ) : (
          price && (
            <p className="mt-2 flex flex-wrap items-baseline gap-2" data-rg="product-card-price">
              <span className="text-[15px] font-extrabold text-ink">{price}</span>
              {oldPrice && <span className="text-[11px] text-muted line-through">{oldPrice}</span>}
            </p>
          )
        )}
        {rating && rating.count > 0 && (
          <p className="mt-1.5 flex items-center gap-1.5 text-[10px] text-muted">
            <Stars value={rating.average} />({rating.count})
          </p>
        )}
        {extra}
      </div>

      {action &&
        (action.href ? (
          <Link href={action.href} className={`mt-3 ${primaryCls}`}>
            {action.label}
          </Link>
        ) : (
          <button type="button" onClick={action.onClick} className={`mt-3 ${primaryCls}`} data-rg="product-card-add-to-cart">
            <CartIcon className="h-3.5 w-3.5" />
            {action.done ? action.doneLabel ?? action.label : action.label}
          </button>
        ))}
      {secondary && (
        <button
          type="button"
          onClick={secondary.onClick}
          data-rg="product-card-buy-now"
          className={`mt-1.5 ${buttonCls} bg-[var(--pm-yellow)] text-ink hover:brightness-95`}
        >
          {secondary.label}
        </button>
      )}
      {after}
    </article>
  );
}
