'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from './icons';
import { MallonStars } from './MallonCard';

/*
 * Mallon's home sections (templete/mallon Hero, Categories, NewArrivals, PromoBanner, Features): drawing only, fed by the
 * store's own data in StorePal's HomeView (skin mallon) and by sample data on the template demo page.
 * `plainImage` switches pictures to a plain <img> for the demo's outside photos. Nothing here invents a promise: a part
 * shows only what the store wrote or what exists, and is left out otherwise.
 */

function Picture({ src, alt, className, plain, priority, sizes }: { src: string; alt: string; className: string; plain?: boolean; priority?: boolean; sizes: string }) {
  if (plain) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} loading={priority ? 'eager' : 'lazy'} className={`${className} object-cover`} />;
  }
  return (
    // A picture placed `absolute` by its caller keeps that; anything else needs `relative` for the filled image.
    <span className={`${className} block ${/\babsolute\b/.test(className) ? '' : 'relative'}`}>
      <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className="object-cover object-top" />
    </span>
  );
}

export interface MlHeroSlide {
  key: string;
  image?: string | null;
  eyebrow?: string;
  /** Lines of the big serif title (the template splits the line in two, the last one in mocha). */
  title: string[];
  accent?: string;
  text?: string;
  href: string;
}

/** The template's section title: a bold heading (the template's `text-xl font-medium`). */
export function MlSectionTitle({ title, sub }: { title: ReactNode; sub?: string | null }) {
  return (
    <div>
      <h2 className="text-[16px] font-semibold">{title}</h2>
      {sub && <p className="mt-0.5 text-[11px] text-gray-500">{sub}</p>}
    </div>
  );
}

const linkAll = 'flex shrink-0 items-center gap-1.5 text-[11px] font-medium text-[var(--ml-brand)] hover:underline';

/**
 * The hero (templete/mallon Hero.tsx): a warm sand gradient with the picture on the right fading into it, the eyebrow in
 * mocha, a big bold serif title whose last line is mocha, a short text and two buttons (Shop Now with an arrow, a white
 * outline one); it slides every 5.5 seconds, pauses on hover and touch, swipes, and has the template's dot bar. The round badge
 * is drawn only when a real value is passed.
 */
export function MlHero({
  slides,
  shopLabel,
  exploreLabel,
  exploreHref,
  plainImage,
  badge,
}: {
  slides: MlHeroSlide[];
  shopLabel: string;
  exploreLabel?: string;
  exploreHref?: string;
  plainImage?: boolean;
  badge?: { top: string; big: string; bottom: string; cta: string; href: string } | null;
}) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const n = slides.length;
  const go = useCallback((d: number) => setI((x) => (x + d + n) % n), [n]);

  useEffect(() => {
    if (paused || n < 2) return;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => setI((x) => (x + 1) % n), 5500);
    return () => clearInterval(timer);
  }, [paused, n, i]);

  if (n === 0) return null;
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchX.current;
    touchX.current = null;
    setPaused(false);
    if (start == null) return;
    const dx = e.changedTouches[0].clientX - start;
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
  };

  return (
    <section
      data-rg="hero"
      className="relative isolate overflow-hidden bg-white"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
        setPaused(true);
      }}
      onTouchEnd={onTouchEnd}
    >
      <div className="grid grid-rows-1 pb-2">
        {slides.map((s, idx) => (
          <div
            key={s.key}
            aria-hidden={idx !== i}
            className={`col-start-1 row-start-1 h-full transition-opacity duration-700 ${idx === i ? 'z-10 opacity-100' : 'pointer-events-none opacity-0'}`}
          >
            <div className="ml-wrap h-full pt-4 lg:pt-5">
                <div className="relative flex min-h-[320px] items-center overflow-hidden bg-gradient-to-br from-[#2b7fd6] to-[#6cc3ee] p-6 text-white sm:min-h-[385px] sm:p-10">
                  <div className="relative z-10 max-w-md">
                    {s.eyebrow && <p className="text-[11px] uppercase tracking-wider">{s.eyebrow}</p>}
                    <h2 className="mt-2 text-[28px] font-semibold leading-[1.15] !text-white sm:text-[40px]">
                      {s.title.map((line, li) => (
                        <span key={line + li} className="block">
                          {line}
                        </span>
                      ))}
                      {s.accent && <span className="block">{s.accent}</span>}
                    </h2>
                    {s.text && <p className="mt-3 max-w-sm text-[12px] leading-relaxed text-white/90">{s.text}</p>}
                    <div className="mt-6 flex flex-wrap items-center gap-5">
                      <Link href={s.href} className="inline-block rounded-sm bg-[var(--ml-brand)] px-8 py-2.5 text-[12px] font-medium text-white transition hover:bg-[var(--ml-brand-dark)]">
                        {shopLabel}
                      </Link>
                      {exploreLabel && exploreHref && (
                        <Link href={exploreHref} className="text-[12px] underline underline-offset-4 hover:no-underline">
                          {exploreLabel}
                        </Link>
                      )}
                    </div>
                  </div>
                  {s.image && (
                    <div className="absolute right-0 top-0 h-full w-3/5 [-webkit-mask-image:linear-gradient(to_right,transparent,#000_45%)] [mask-image:linear-gradient(to_right,transparent,#000_45%)]">
                      <Picture src={s.image} alt="" plain={plainImage} priority={idx === 0} sizes="(max-width: 1024px) 70vw, 720px" className="absolute inset-0 h-full w-full" />
                    </div>
                  )}
                </div>
              </div>
            </div>
        ))}
      </div>

      {badge && (
        <Link
          href={badge.href}
          aria-label={`${badge.top} ${badge.big} ${badge.bottom}`}
          className="absolute right-4 top-6 z-20 hidden h-28 w-28 flex-col items-center justify-center rounded-full border-2 border-dashed border-white/80 bg-white/90 p-2 text-center font-display text-sm font-medium leading-tight text-ink transition hover:scale-105 sm:flex lg:right-8 lg:top-10"
        >
          <span className="text-[10px]">{badge.top}</span>
          <span className="text-2xl font-medium leading-none text-[var(--ml-brand)]">{badge.big}</span>
          <span className="text-[11px]">{badge.bottom}</span>
        </Link>
      )}

      {n > 1 && (
        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
          {slides.map((s, idx) => (
            <button
              key={s.key}
              type="button"
              aria-label={`Slide ${idx + 1}`}
              aria-current={idx === i}
              onClick={() => setI(idx)}
              className={`h-2 rounded-full transition-all ${idx === i ? 'w-8 bg-ink' : 'w-2 bg-ink/40'}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// The template gives each category card its own soft gradient; they cycle for a store's own categories.

/**
 * "Shop by Category" (templete/mallon Categories.tsx): a bold heading with "View All Categories" on the right and one
 * gradient card per category (a tall rounded picture, the name, the product count when known, an arrow); five on a computer,
 * a sideways row on a phone.
 */
export function MlCategories({
  items,
  exploreLabel,
  plainImage,
  title,
  viewAllLabel,
  viewAllHref,
}: {
  items: { name: string; href: string; image?: string | null; count?: number }[];
  exploreLabel: string;
  plainImage?: boolean;
  title?: string;
  viewAllLabel?: string;
  viewAllHref?: string;
}) {
  if (items.length === 0) return null;
  return (
    <section id="categories" className="ml-wrap scroll-mt-24 pt-14">
      <div className="flex items-end justify-between gap-4 border-b border-gray-200 pb-3">
        <MlSectionTitle title={title ?? exploreLabel} />
        {viewAllLabel && viewAllHref && (
          <Link href={viewAllHref} className={linkAll}>
            {viewAllLabel} <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      <div className="ml-no-scrollbar -mx-4 mt-5 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-6">
        {items.slice(0, 6).map((c) => (
          <Link key={c.name} href={c.href} className="group flex min-w-[88px] flex-col items-center gap-3 text-center sm:min-w-0">
            <span className="relative flex h-[76px] w-[76px] items-center justify-center overflow-hidden rounded-full bg-[var(--ml-sand)] transition group-hover:ring-2 group-hover:ring-[var(--ml-brand)]">
              {c.image ? (
                <Picture src={c.image} alt="" plain={plainImage} sizes="76px" className="h-full w-full" />
              ) : (
                <span className="font-display text-3xl font-medium text-[var(--ml-brand)]">{c.name.slice(0, 1)}</span>
              )}
            </span>
            <span className="text-[12px] font-medium">{c.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/** A titled grid of product cards (the template's "New Arrivals": 2 columns, 4 on a computer) with "View All Products" on the right. */
export function MlProductGrid({ title, sub, viewAllLabel, viewAllHref, children, id, extra }: { title: string; sub?: string | null; viewAllLabel?: string; viewAllHref?: string; children: ReactNode[]; id?: string; extra?: ReactNode }) {
  if (children.length === 0) return null;
  return (
    <section id={id} className="ml-wrap scroll-mt-24 pt-10">
      <div className="flex items-end justify-between gap-4 border-b border-gray-200 pb-3">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <MlSectionTitle title={title} sub={sub} />
          {extra}
        </div>
        {viewAllLabel && viewAllHref && (
          <Link href={viewAllHref} className={linkAll}>
            {viewAllLabel} <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 lg:gap-5">
        {children.map((child, i) => (
          <div key={i} className="min-w-0">
            {child}
          </div>
        ))}
      </div>
    </section>
  );
}

export interface MlPromo {
  key: string;
  kicker?: string;
  title: string;
  cta: string;
  href: string;
  image?: string | null;
}

const PROMO_BG = ['from-[#2b7fd6] to-[#5fb7ec]', 'from-[#12a58a] to-[#35c9ae]', 'from-[#a99af0] to-[#c4b8f7]'];

/**
 * The promo tiles (templete/mallon Promos.tsx): short gradient banners in blue, teal and lilac, a small caption, a title and a
 * small "Shop Now" button on the left, the picture fading in on the right half. A store shows its own campaigns (up to three),
 * never the template's sample "Up to 75% OFF" texts.
 */
export function MlPromoBanners({ banners, plainImage }: { banners: MlPromo[]; plainImage?: boolean }) {
  if (banners.length === 0) return null;
  const list = banners.slice(0, 3);
  return (
    <section id="sale" className={`ml-wrap grid scroll-mt-24 gap-4 pt-10 sm:grid-cols-2 lg:gap-5 ${list.length >= 3 ? 'lg:grid-cols-3' : ''}`} aria-label="Offers">
      {list.map((b, i) => (
        <Link key={b.key} href={b.href} className={`group relative flex h-[138px] items-center overflow-hidden bg-gradient-to-br p-6 text-white hover:text-white ${PROMO_BG[i % PROMO_BG.length]}`}>
          {b.image && (
            <span className="absolute right-0 top-0 h-full w-1/2 [-webkit-mask-image:linear-gradient(to_right,transparent,#000_45%)] [mask-image:linear-gradient(to_right,transparent,#000_45%)]">
              <Picture src={b.image} alt="" plain={plainImage} sizes="320px" className="absolute inset-0 h-full w-full transition duration-500 group-hover:scale-105" />
            </span>
          )}
          <span className="relative z-10 block">
            {b.kicker && <span className="block text-[9px] uppercase tracking-wider">{b.kicker}</span>}
            <span className="block whitespace-pre-line text-[18px] font-semibold leading-tight">{b.title}</span>
            <span className="mt-3 inline-block bg-white/25 px-4 py-1.5 text-[10px] transition group-hover:bg-white/40">{b.cta}</span>
          </span>
        </Link>
      ))}
    </section>
  );
}

/** The endless brand strip: each brand's name in bold with how many styles it has; hover pauses it. */
export function MlBrands({ title, allLabel, allHref, brands, stylesLabel }: { title: string; allLabel?: string; allHref?: string; brands: { name: string; href: string; count?: number }[]; stylesLabel?: (n: number) => string }) {
  if (brands.length === 0) return null;
  // Fewer than 6 brands would leave gaps in the loop, so the list repeats until it is long enough.
  const base = brands.length >= 6 ? brands : Array.from({ length: Math.ceil(6 / brands.length) }, () => brands).flat();
  const list = (hidden: boolean) => (
    <div className="flex shrink-0" aria-hidden={hidden || undefined}>
      {base.map((b, idx) => (
        <Link
          key={`${b.name}-${idx}`}
          href={b.href}
          tabIndex={hidden ? -1 : undefined}
          className="group flex w-44 shrink-0 flex-col items-center justify-center gap-1 border-l border-[var(--ml-brand)]/10 px-4"
        >
          <span className="max-w-full truncate font-display text-xl font-medium tracking-tight text-ink transition group-hover:text-[var(--ml-brand)]">{b.name}</span>
          {b.count !== undefined && stylesLabel && <span className="text-[11px] text-neutral-500">{stylesLabel(b.count)}</span>}
        </Link>
      ))}
    </div>
  );
  return (
    <section id="brands" className="ml-wrap scroll-mt-24 pt-12" aria-label={title}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <MlSectionTitle title={title} />
        {allLabel && allHref && (
          <Link href={allHref} className={linkAll}>
            {allLabel} <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      <div className="ml-marquee overflow-hidden rounded-3xl bg-white py-5 shadow-[var(--shadow-card)] [-webkit-mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)] [mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)]">
        <div className="ml-marquee-track flex w-max">
          {list(false)}
          {list(true)}
        </div>
      </div>
    </section>
  );
}

/**
 * The feature strip (templete/mallon Features.tsx): one white rounded card with a row of icon blocks (a soft mocha circle,
 * a bold title, a grey line). Only the store's own highlights (Store > Design) are drawn; the template's four sample promises
 * are not shown on a real store.
 */
export function MlFeatures({ title, items }: { title: string; items: { key: string; icon: ReactNode; title: string; text?: string | null }[] }) {
  if (items.length === 0) return null;
  const shown = items.slice(0, 4);
  return (
    <section className="ml-wrap pt-6" aria-label={title}>
      <div className={`grid grid-cols-1 gap-5 border-y border-gray-100 py-5 sm:grid-cols-2 ${shown.length >= 4 ? 'lg:grid-cols-4' : shown.length === 3 ? 'lg:grid-cols-3' : ''} lg:divide-x lg:divide-gray-100`}>
        {shown.map((item) => (
          <div key={item.key} className="flex items-center gap-4 lg:px-4">
            <span className="flex shrink-0 items-center justify-center text-[var(--ml-teal)] [&_svg]:h-[30px] [&_svg]:w-[30px] [&_svg]:stroke-[1.5]">{item.icon}</span>
            <div>
              <h3 className="text-[12px] font-semibold">{item.title}</h3>
              {item.text && <p className="mt-0.5 text-[11px] leading-snug text-gray-500">{item.text}</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Customer reviews on the home page, in the template's card style: white rounded cards with the name, stars and the words. */
export function MlReviews({ title, reviews, verifiedLabel }: { title: string; verifiedLabel: string; reviews: { id: string; name: string; rating: number; title?: string | null; content?: string | null; verified?: boolean }[] }) {
  if (reviews.length === 0) return null;
  return (
    <section className="ml-wrap pt-12">
      <h2 className="mb-5 font-display text-3xl font-medium text-ink sm:text-4xl">{title}</h2>
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-2xl bg-white p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-sm font-medium">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--ml-soft)] text-xs font-medium text-[var(--ml-brand)]">{r.name.slice(0, 1).toUpperCase()}</span>
                {r.name}
              </span>
              <MallonStars value={r.rating} className="h-3.5 w-3.5" />
            </div>
            {r.verified && <span className="mt-2 block text-[11px] font-medium text-success">{verifiedLabel}</span>}
            {r.title && <p className="mt-2 text-sm font-medium">{r.title}</p>}
            {r.content && <p className="mt-1 text-[13px] leading-relaxed text-neutral-600">{r.content}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
