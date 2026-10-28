'use client';

import { Clock } from 'lucide-react';
import { DEFAULT_PLACEHOLDER_PALETTE, PlaceholderArt } from '@/components/store-preview/PlaceholderArt';
import { SAMPLE_PRODUCTS, SAMPLE_PRODUCTS_ID, STORE_SETUP_ID } from '@/components/store-preview/emptyStore';
import { useStorePalDesign } from '../lib/designSettings';
import { useStoreText, useFormatPrice } from '../lib/storeText';
import { formatPrice as plainPrice } from '../lib/formatPrice';

/**
 * StorePal's look for a store with no product yet (store-empty-preview.md): a thin "opening soon" bar, an
 * illustrated hero and a grid of drawn sample products, in the same frame as StorePal's real cards. The pictures and
 * the "is it empty" rule are shared by every template (`components/store-preview/`); only this layout is StorePal's.
 * Nothing here is a link to a product: the samples cannot be clicked, bought or shared.
 */

/** Under the header: tells a shopper why the shop shows samples, and points the owner at the setup steps. */
export function OpeningSoonBar() {
  const t = useStoreText();
  return (
    <div className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2.5 text-center text-[13px] sm:px-6">
        <span className="flex items-center gap-1.5 font-medium text-ink">
          <Clock size={14} aria-hidden />
          {t('Opening soon. New products are on the way.')}
        </span>
        <a href={`#${STORE_SETUP_ID}`} className="font-semibold text-accent hover:text-accent-dark">
          {t('Store owner? Finish setting up')}
        </a>
      </div>
    </div>
  );
}

/** Stands in for the hero slider while the store has no website cover. Same box as HeroBanner, taller on phones for the text. */
export function PlaceholderHero({ storeName }: { storeName: string }) {
  const t = useStoreText();
  return (
    <section className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-surface sm:aspect-[21/9]">
        <PlaceholderArt name="hero-1" className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-black/25" aria-hidden />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center sm:gap-5">
          <p className="m-0 text-[12px] font-semibold uppercase tracking-wider text-white/90 sm:text-[13px]">{storeName}</p>
          <h2 className="m-0 max-w-[18ch] text-[26px] font-bold leading-tight text-white [text-shadow:0_2px_12px_rgba(0,0,0,.25)] sm:text-[44px]">
            {t('Browse our latest products')}
          </h2>
          <a
            href={`#${SAMPLE_PRODUCTS_ID}`}
            className="rounded-md border-2 border-white/90 px-5 py-2 text-[14px] font-semibold text-white transition-colors hover:bg-white hover:text-ink"
          >
            {t('Shop all')}
          </a>
        </div>
      </div>
    </section>
  );
}

/** A StorePal product card with a drawing, "Product title" and a sample price. Follows the card style and image shape set in Store > Design. */
function SampleCard({ art, price, className }: { art: (typeof SAMPLE_PRODUCTS)[number]['art']; price: number; className: string }) {
  const formatPrice = useFormatPrice(plainPrice);
  const t = useStoreText();
  const design = useStorePalDesign();
  const asCard = design.cardDisplayAsCard;
  const portrait = design.productImageShape === 'PORTRAIT';
  return (
    <div className={`${className} flex-col overflow-hidden ${asCard ? 'rounded-md border border-line bg-surface shadow-card' : ''}`}>
      <div
        className={`relative ${portrait ? 'aspect-[3/4]' : 'aspect-square'} ${asCard ? '' : 'overflow-hidden rounded-md'}`}
        style={{ backgroundColor: DEFAULT_PLACEHOLDER_PALETTE.bg }}
      >
        <PlaceholderArt name={art} className="absolute inset-0 h-full w-full" />
      </div>
      <div className={`flex flex-col gap-1.5 ${asCard ? 'p-3' : 'pt-2.5'}`}>
        <p className="m-0 text-[13.5px] font-semibold leading-snug text-ink">{t('Product title')}</p>
        <span className="text-[15px] font-bold text-accent">{formatPrice(price)}</span>
      </div>
    </div>
  );
}

/** The sample grid: 8 cards, 4 x 2 on a computer (an even block, like Shopify's), 3 x 2 on a tablet, 2 x 3 on a phone (6 cards on both, so rows stay even). */
export function PlaceholderProductGrid() {
  const t = useStoreText();
  return (
    <section id={SAMPLE_PRODUCTS_ID} className="scroll-mt-24">
      <h2 className="mb-4 text-[18px] font-bold text-ink">{t('Products')}</h2>
      <p className="sr-only">{t('Sample products. This store has no products yet.')}</p>
      <div
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4"
        aria-hidden
      >
        {SAMPLE_PRODUCTS.map((s, i) => (
          <SampleCard key={s.art} art={s.art} price={s.price} className={i >= 6 ? 'hidden lg:flex' : 'flex'} />
        ))}
      </div>
    </section>
  );
}
