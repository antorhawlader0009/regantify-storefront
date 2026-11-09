'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from './icons';
import { ChicwoveStars } from './ChicwoveCard';

/*
 * Chicwove's home sections (templete/chicwove Hero, Categories, NewArrivals, PromoBanner, Features): drawing only, fed by the
 * store's own data in StorePal's HomeView (skin chicwove) and by sample data on the template demo page.
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

export interface CwHeroSlide {
  key: string;
  image?: string | null;
  eyebrow?: string;
  /** Lines of the big serif title (the template splits the line in two, the last one in coral). */
  title: string[];
  accent?: string;
  text?: string;
  href: string;
}

/** The template's section title: a bold heading (the template's `text-xl font-bold`). */
export function CwSectionTitle({ title, sub }: { title: ReactNode; sub?: string | null }) {
  return (
    <div>
      <h2 className="text-xl font-bold">{title}</h2>
      {sub && <p className="mt-1 text-sm text-neutral-500">{sub}</p>}
    </div>
  );
}

const linkAll = 'flex shrink-0 items-center gap-1 text-sm font-medium text-[var(--cw-brand)] hover:underline';

/**
 * The hero (templete/chicwove Hero.tsx): a warm peach gradient with the picture on the right fading into it, the eyebrow in
 * coral, a big bold serif title whose last line is coral, a short text and two buttons (Shop Now with an arrow, a white
 * outline one); it slides every 5.5 seconds, pauses on hover and touch, swipes, and has the template's dot bar. The round badge
 * is drawn only when a real value is passed.
 */
export function CwHero({
  slides,
  shopLabel,
  exploreLabel,
  exploreHref,
  plainImage,
  badge,
}: {
  slides: CwHeroSlide[];
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
      className="relative isolate overflow-hidden bg-gradient-to-r from-[#FFEEE2] via-[#FFDFCC] to-[#FFD2BA]"
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
      <div className="grid min-h-[500px] grid-rows-1 sm:min-h-[540px] lg:h-[calc(100svh-6rem)] lg:max-h-[760px]">
        {slides.map((s, idx) => (
          <div
            key={s.key}
            aria-hidden={idx !== i}
            className={`col-start-1 row-start-1 h-full transition-opacity duration-700 ${idx === i ? 'z-10 opacity-100' : 'pointer-events-none opacity-0'}`}
          >
            <div className="relative flex h-full flex-col md:flex-row md:items-center">
              {s.image && (
                <div className="cw-hero-fade relative h-[38%] min-h-[190px] w-full shrink-0 md:absolute md:inset-y-0 md:right-0 md:h-full md:w-[58%]">
                  <Picture src={s.image} alt="" plain={plainImage} priority={idx === 0} sizes="(max-width: 768px) 100vw, 58vw" className="absolute inset-0 h-full w-full" />
                </div>
              )}
              <div className="relative z-10 flex flex-1 items-center pb-10 pt-6 md:w-full md:flex-none md:pb-0 md:pt-0">
                <div className="cw-wrap">
                  <div className="max-w-2xl">
                    {s.eyebrow && <p className="text-sm font-semibold text-[var(--cw-brand)]">{s.eyebrow}</p>}
                    <h2 className="mt-2 font-display font-bold leading-[1.1] md:mt-3" style={{ fontSize: 'clamp(2rem, min(5.2vw, 8.5vh), 4.25rem)' }}>
                      {s.title.map((line, li) => (
                        <span key={line + li} className="block">
                          {line}
                        </span>
                      ))}
                      {s.accent && <span className="block text-[var(--cw-brand)]">{s.accent}</span>}
                    </h2>
                    {s.text && <p className="mt-3 max-w-sm text-sm leading-relaxed text-neutral-700 sm:text-base md:mt-5">{s.text}</p>}
                    <div className="mt-5 flex flex-wrap gap-3 md:mt-8 md:gap-4">
                      <Link href={s.href} className="cw-btn-dark md:!px-7 md:!py-3.5">
                        {shopLabel} <ArrowRight className="h-4 w-4" />
                      </Link>
                      {exploreLabel && exploreHref && (
                        <Link
                          href={exploreHref}
                          className="inline-flex items-center rounded-lg border border-white/70 bg-white/50 px-6 py-3 text-sm font-semibold transition hover:bg-white md:px-7 md:py-3.5"
                        >
                          {exploreLabel}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {badge && (
        <Link
          href={badge.href}
          aria-label={`${badge.top} ${badge.big} ${badge.bottom}`}
          className="absolute right-4 top-6 z-20 hidden h-28 w-28 flex-col items-center justify-center rounded-full border-2 border-dashed border-white/80 bg-white/90 p-2 text-center font-display text-sm font-semibold leading-tight text-ink transition hover:scale-105 sm:flex lg:right-8 lg:top-10"
        >
          <span className="text-[10px]">{badge.top}</span>
          <span className="text-2xl font-bold leading-none text-[var(--cw-brand)]">{badge.big}</span>
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
const CATEGORY_BG = [
  'from-[#FDE4DD] to-[#FBD0C6]',
  'from-[#FFF0D9] to-[#FFE0B5]',
  'from-[#E6EEF8] to-[#CFDDF0]',
  'from-[#F6E1EC] to-[#EDC8DB]',
  'from-[#E5F2E8] to-[#CBE4D2]',
];

/**
 * "Shop by Category" (templete/chicwove Categories.tsx): a bold heading with "View All Categories" on the right and one
 * gradient card per category (a tall rounded picture, the name, the product count when known, an arrow); five on a computer,
 * a sideways row on a phone.
 */
export function CwCategories({
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
    <section id="categories" className="cw-wrap scroll-mt-24 pt-14">
      <div className="flex items-center justify-between gap-4">
        <CwSectionTitle title={title ?? exploreLabel} />
        {viewAllLabel && viewAllHref && (
          <Link href={viewAllHref} className={linkAll}>
            {viewAllLabel} <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      <div className="cw-no-scrollbar -mx-4 mt-5 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-5">
        {items.slice(0, 5).map((c, idx) => (
          <Link
            key={c.name}
            href={c.href}
            className={`group relative flex min-w-[250px] snap-start items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-br p-3 transition hover:-translate-y-1 hover:shadow-[var(--shadow-card)] sm:min-w-0 ${CATEGORY_BG[idx % CATEGORY_BG.length]}`}
          >
            <span className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-white/60">
              {c.image ? (
                <Picture src={c.image} alt={c.name} plain={plainImage} sizes="96px" className="h-full w-full transition-transform duration-500 group-hover:scale-110" />
              ) : (
                <span className="grid h-full w-full place-items-center font-display text-3xl font-bold text-[var(--cw-brand)]">{c.name.slice(0, 1)}</span>
              )}
            </span>
            <span className="min-w-0 flex-1 text-sm">
              <span className="block font-semibold leading-tight">{c.name}</span>
              {c.count !== undefined && <span className="mt-1 block text-xs text-neutral-600">{c.count}</span>}
              <ArrowRight className="mt-2 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/** A titled grid of product cards (the template's "New Arrivals": 2 columns, 4 on a computer) with "View All Products" on the right. */
export function CwProductGrid({ title, sub, viewAllLabel, viewAllHref, children, id, extra }: { title: string; sub?: string | null; viewAllLabel?: string; viewAllHref?: string; children: ReactNode[]; id?: string; extra?: ReactNode }) {
  if (children.length === 0) return null;
  return (
    <section id={id} className="cw-wrap scroll-mt-24 pt-12">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <CwSectionTitle title={title} sub={sub} />
          {extra}
        </div>
        {viewAllLabel && viewAllHref && (
          <Link href={viewAllHref} className={linkAll}>
            {viewAllLabel} <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {children.map((child, i) => (
          <div key={i} className="min-w-0">
            {child}
          </div>
        ))}
      </div>
    </section>
  );
}

export interface CwPromo {
  key: string;
  kicker?: string;
  title: string;
  cta: string;
  href: string;
  image?: string | null;
}

const PROMO_BG = ['from-[#EE5A52] to-[#F27A6F]', 'from-[#D93A35] to-[#EE6A5E]', 'from-[#F0805F] to-[#F59E86]'];

/**
 * The offer banner (templete/chicwove PromoBanner.tsx): a rounded coral gradient band, a big bold serif title in white, a white
 * button, and a picture on the right that bleeds to the band's edge. A store shows its own campaigns (up to three, one band
 * each), never the template's sample "Up To 30% OFF".
 */
export function CwPromoBanners({ banners, plainImage }: { banners: CwPromo[]; plainImage?: boolean }) {
  if (banners.length === 0) return null;
  return (
    <section id="sale" className="cw-wrap scroll-mt-24 space-y-5 pt-12" aria-label="Offers">
      {banners.slice(0, 3).map((b, i) => (
        <div key={b.key} className={`relative overflow-hidden rounded-3xl bg-gradient-to-r ${PROMO_BG[i % PROMO_BG.length]}`}>
          <div className={`relative z-10 grid items-center gap-6 p-6 sm:p-8 md:p-10 ${b.image ? 'md:grid-cols-2' : ''}`}>
            <div className="text-white">
              {b.kicker && <span className="mb-3 inline-block rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[var(--cw-brand)]">{b.kicker}</span>}
              <h3 className="whitespace-pre-line font-display text-3xl font-bold sm:text-4xl md:text-5xl">{b.title}</h3>
              <Link href={b.href} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-ink transition hover:bg-[var(--cw-cream)]">
                {b.cta} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            {b.image && (
              <div className="relative h-44 overflow-hidden rounded-2xl sm:h-52 md:-my-10 md:-mr-10 md:h-[calc(100%+5rem)] md:rounded-none">
                <Picture src={b.image} alt="" plain={plainImage} sizes="(max-width: 768px) 100vw, 40vw" className="absolute inset-0 h-full w-full" />
              </div>
            )}
          </div>
        </div>
      ))}
    </section>
  );
}

/** The endless brand strip: each brand's name in bold with how many styles it has; hover pauses it. */
export function CwBrands({ title, allLabel, allHref, brands, stylesLabel }: { title: string; allLabel?: string; allHref?: string; brands: { name: string; href: string; count?: number }[]; stylesLabel?: (n: number) => string }) {
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
          className="group flex w-44 shrink-0 flex-col items-center justify-center gap-1 border-l border-[var(--cw-brand)]/10 px-4"
        >
          <span className="max-w-full truncate font-display text-xl font-bold tracking-tight text-ink transition group-hover:text-[var(--cw-brand)]">{b.name}</span>
          {b.count !== undefined && stylesLabel && <span className="text-[11px] text-neutral-500">{stylesLabel(b.count)}</span>}
        </Link>
      ))}
    </div>
  );
  return (
    <section id="brands" className="cw-wrap scroll-mt-24 pt-12" aria-label={title}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <CwSectionTitle title={title} />
        {allLabel && allHref && (
          <Link href={allHref} className={linkAll}>
            {allLabel} <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      <div className="cw-marquee overflow-hidden rounded-3xl bg-white py-5 shadow-[var(--shadow-card)] [-webkit-mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)] [mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)]">
        <div className="cw-marquee-track flex w-max">
          {list(false)}
          {list(true)}
        </div>
      </div>
    </section>
  );
}

/**
 * The feature strip (templete/chicwove Features.tsx): one white rounded card with a row of icon blocks (a soft coral circle,
 * a bold title, a grey line). Only the store's own highlights (Store > Design) are drawn; the template's four sample promises
 * are not shown on a real store.
 */
export function CwFeatures({ title, items }: { title: string; items: { key: string; icon: ReactNode; title: string; text?: string | null }[] }) {
  if (items.length === 0) return null;
  const shown = items.slice(0, 4);
  return (
    <section className="cw-wrap pb-4 pt-12" aria-label={title}>
      <div className={`grid grid-cols-1 gap-5 rounded-3xl bg-white p-6 shadow-[var(--shadow-card)] sm:grid-cols-2 ${shown.length >= 4 ? 'lg:grid-cols-4' : shown.length === 3 ? 'lg:grid-cols-3' : ''} lg:divide-x lg:divide-neutral-100`}>
        {shown.map((item) => (
          <div key={item.key} className="flex items-center gap-4 lg:px-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--cw-soft)] text-[var(--cw-brand)] [&_svg]:h-[22px] [&_svg]:w-[22px]">{item.icon}</span>
            <div>
              <h3 className="text-sm font-semibold">{item.title}</h3>
              {item.text && <p className="text-xs text-neutral-500">{item.text}</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Customer reviews on the home page, in the template's card style: white rounded cards with the name, stars and the words. */
export function CwReviews({ title, reviews, verifiedLabel }: { title: string; verifiedLabel: string; reviews: { id: string; name: string; rating: number; title?: string | null; content?: string | null; verified?: boolean }[] }) {
  if (reviews.length === 0) return null;
  return (
    <section className="cw-wrap pt-12">
      <h2 className="mb-5 text-xl font-bold">{title}</h2>
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-2xl bg-white p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--cw-soft)] text-xs font-bold text-[var(--cw-brand)]">{r.name.slice(0, 1).toUpperCase()}</span>
                {r.name}
              </span>
              <ChicwoveStars value={r.rating} className="h-3.5 w-3.5" />
            </div>
            {r.verified && <span className="mt-2 block text-[11px] font-semibold text-success">{verifiedLabel}</span>}
            {r.title && <p className="mt-2 text-sm font-semibold">{r.title}</p>}
            {r.content && <p className="mt-1 text-[13px] leading-relaxed text-neutral-600">{r.content}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
