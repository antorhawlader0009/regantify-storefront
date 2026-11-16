'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from './icons';
import { GroceryantoStars } from './GroceryantoCard';

/*
 * Groceryanto's home sections (templete/groceryanto Hero, Categories, NewArrivals, PromoBanner, Features): drawing only, fed by the
 * store's own data in StorePal's HomeView (skin groceryanto) and by sample data on the template demo page.
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

export interface GaHeroSlide {
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
export function GaSectionTitle({ title, sub }: { title: ReactNode; sub?: string | null }) {
  return (
    <div>
      <h2 className="font-display text-[20px] font-medium leading-8 text-[#1a1a1a]">{title}</h2>
      {sub && <p className="mt-1 text-sm text-neutral-500">{sub}</p>}
    </div>
  );
}

const linkAll = 'inline-flex shrink-0 items-center gap-1.5 text-sm text-ink transition hover:text-[var(--ga-brand)]';

/**
 * The hero (templete/groceryanto Hero.tsx): a warm sand gradient with the picture on the right fading into it, the eyebrow in
 * mocha, a big bold serif title whose last line is mocha, a short text and two buttons (Shop Now with an arrow, a white
 * outline one); it slides every 5.5 seconds, pauses on hover and touch, swipes, and has the template's dot bar. The round badge
 * is drawn only when a real value is passed.
 */
export function GaHero({
  slides,
  shopLabel,
  exploreLabel,
  exploreHref,
  plainImage,
  badge,
}: {
  slides: GaHeroSlide[];
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
    <div className="ga-wrap pb-6 pt-10 max-sm:pb-0 max-sm:pt-4">
    <section
      data-rg="hero"
      className="relative isolate overflow-hidden bg-[#e8f8ec] text-ink"
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
      <div className="grid grid-rows-1">
        {slides.map((s, idx) => (
          <div
            key={s.key}
            aria-hidden={idx !== i}
            className={`col-start-1 row-start-1 h-full transition-opacity duration-700 ${idx === i ? 'z-10 opacity-100' : 'pointer-events-none opacity-0'}`}
          >
            <div className="relative min-h-[300px] sm:min-h-[340px] lg:aspect-[1623/430] lg:min-h-0">
              {s.image && <Picture src={s.image} alt="" plain={plainImage} priority={idx === 0} sizes="(max-width: 1350px) 100vw, 1350px" className="absolute inset-0 h-full w-full" />}
              <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/60 to-transparent sm:via-white/40" />
              <div className="relative z-10 flex h-full min-h-[300px] flex-col justify-center px-6 py-10 sm:min-h-[340px] sm:px-10 lg:min-h-0 lg:w-1/2 lg:px-14">
                {s.eyebrow && <span className="w-fit text-sm font-medium uppercase tracking-[0.16em] text-[var(--ga-brand-dark)]">{s.eyebrow}</span>}
                <h2 className="mt-2 font-display text-4xl font-medium leading-[1.1] !text-[#111111] sm:text-5xl">
                  {s.title.map((line, li) => (
                    <span key={line + li} className="block">
                      {line}
                    </span>
                  ))}
                  {s.accent && <span className="block text-[var(--ga-brand)]">{s.accent}</span>}
                </h2>
                {s.text && <p className="mt-3 max-w-[340px] text-base text-[#444]">{s.text}</p>}
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href={s.href} className="inline-flex h-11 items-center gap-2 rounded bg-[var(--ga-brand-dark)] px-7 text-[15px] font-medium text-white transition hover:bg-[var(--ga-brand)]">
                    {shopLabel} <ArrowRight className="h-4 w-4" />
                  </Link>
                  {exploreLabel && exploreHref && (
                    <Link href={exploreHref} className="inline-flex h-11 items-center rounded border border-[var(--ga-brand-dark)] bg-white/70 px-6 text-[15px] font-medium text-[var(--ga-brand-dark)] transition hover:bg-white">
                      {exploreLabel}
                    </Link>
                  )}
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
          className="absolute right-4 top-0 z-20 hidden w-[110px] flex-col items-center rounded-b-lg bg-[var(--ga-brand)] px-3 pb-3 pt-4 text-center font-display text-white shadow-[var(--shadow-card-hover)] sm:flex"
        >
          <span className="text-[10px]">{badge.top}</span>
          <span className="text-[30px] font-bold leading-none text-[#b3dcbc]">{badge.big}</span>
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
              className={`h-1.5 rounded-full transition-all ${idx === i ? 'w-4 bg-[var(--ga-brand)]' : 'w-1.5 bg-black/20'}`}
            />
          ))}
        </div>
      )}
    </section>
    </div>
  );
}

// The template gives each category card its own soft gradient; they cycle for a store's own categories.

export function GaCategories({
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
    <section id="categories" className="ga-wrap scroll-mt-24 pt-12">
      <div className="mb-6 flex items-center justify-between gap-4">
        <GaSectionTitle title={title ?? exploreLabel} />
        {viewAllLabel && viewAllHref && (
          <Link href={viewAllHref} className={linkAll}>
            {viewAllLabel}
          </Link>
        )}
      </div>
      <ul className="no-scrollbar -mx-2.5 flex gap-5 overflow-x-auto px-2.5 pb-2 lg:mx-0 lg:grid lg:grid-cols-8 lg:gap-4 lg:overflow-visible lg:px-0">
        {items.slice(0, 8).map((c) => (
          <li key={c.name} className="shrink-0">
            <Link href={c.href} className="group flex w-[88px] flex-col items-center gap-3 lg:w-auto">
              <span className="relative block aspect-square w-[88px] overflow-hidden rounded-full border border-[#b3dcbc] bg-white transition group-hover:border-[var(--ga-brand)] lg:w-full lg:max-w-[130px]">
                {c.image ? (
                  <Picture src={c.image} alt="" plain={plainImage} sizes="140px" className="absolute inset-0 h-full w-full transition duration-500 group-hover:scale-105" />
                ) : (
                  <span className="grid h-full w-full place-items-center font-display text-3xl text-[var(--ga-brand)]">{c.name.slice(0, 1)}</span>
                )}
              </span>
              <span className="line-clamp-2 text-center text-sm text-ink">{c.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function GaProductGrid({ title, sub, viewAllLabel, viewAllHref, children, id, extra }: { title: string; sub?: string | null; viewAllLabel?: string; viewAllHref?: string; children: ReactNode[]; id?: string; extra?: ReactNode }) {
  if (children.length === 0) return null;
  return (
    <section id={id} className="ga-wrap scroll-mt-24 pt-12">
      <div className="mb-7 flex items-end justify-between gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <GaSectionTitle title={title} sub={sub} />
          {extra}
        </div>
        {viewAllLabel && viewAllHref && (
          <Link href={viewAllHref} className={linkAll}>
            {viewAllLabel}
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {children.map((child, i) => (
          <div key={i} className="min-w-0">
            {child}
          </div>
        ))}
      </div>
    </section>
  );
}

export interface GaPromo {
  key: string;
  kicker?: string;
  title: string;
  cta: string;
  href: string;
  image?: string | null;
}

const PROMO_BG = ['from-[#dfe6c3] to-[#c9d4a7]', 'from-[#f4e3cc] to-[#ecd2b0]', 'from-[#d9e8f5] to-[#bcd5ea]'];

export function GaPromoBanners({ banners, plainImage }: { banners: GaPromo[]; plainImage?: boolean }) {
  if (banners.length === 0) return null;
  return (
    <section id="sale" className="ga-wrap scroll-mt-24 space-y-4 pt-12" aria-label="Offers">
      {banners.slice(0, 2).map((b) => (
        <Link key={b.key} href={b.href} className="group relative flex min-h-[160px] items-center overflow-hidden bg-gradient-to-r from-[#e8f8ec] to-[#cdeed6] p-6 text-ink hover:text-ink sm:min-h-[230px] sm:px-12">
          <span className="relative z-10 block max-w-[55%]">
            {b.kicker && <span className="block text-sm font-medium uppercase tracking-[0.14em] text-[var(--ga-brand-dark)]">{b.kicker}</span>}
            <span className="mt-1 block whitespace-pre-line font-display text-3xl font-medium leading-tight sm:text-[40px]">{b.title}</span>
            <span className="mt-4 inline-flex items-center gap-2 rounded bg-[var(--ga-brand-dark)] px-6 py-2.5 text-[15px] font-medium text-white transition group-hover:bg-[var(--ga-brand)]">
              {b.cta} <ArrowRight className="h-4 w-4" />
            </span>
          </span>
          {b.image && (
            <span className="absolute inset-y-0 right-0 block w-[50%] [mask-image:linear-gradient(to_right,transparent,black_30%)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_30%)]">
              <Picture src={b.image} alt="" plain={plainImage} sizes="(max-width: 768px) 50vw, 700px" className="absolute inset-0 h-full w-full transition duration-500 group-hover:scale-105" />
            </span>
          )}
        </Link>
      ))}
    </section>
  );
}

/** The endless brand strip: each brand's name in bold with how many styles it has; hover pauses it. */
export function GaBrands({ title, allLabel, allHref, brands, stylesLabel }: { title: string; allLabel?: string; allHref?: string; brands: { name: string; href: string; count?: number }[]; stylesLabel?: (n: number) => string }) {
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
          className="group flex w-44 shrink-0 flex-col items-center justify-center gap-1 border-l border-[var(--ga-brand)]/10 px-4"
        >
          <span className="max-w-full truncate text-sm font-bold uppercase tracking-widest text-neutral-700 transition group-hover:text-[var(--ga-brand)]">{b.name}</span>
          {b.count !== undefined && stylesLabel && <span className="text-[11px] text-neutral-500">{stylesLabel(b.count)}</span>}
        </Link>
      ))}
    </div>
  );
  return (
    <section id="brands" className="ga-wrap scroll-mt-24 pt-12" aria-label={title}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <GaSectionTitle title={title} />
        {allLabel && allHref && (
          <Link href={allHref} className={linkAll}>
            {allLabel} <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      <div className="ga-marquee overflow-hidden rounded-lg bg-[#e8f8ec] py-5 [-webkit-mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)] [mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)]">
        <div className="ga-marquee-track flex w-max">
          {list(false)}
          {list(true)}
        </div>
      </div>
    </section>
  );
}

export function GaFeatures({ title, items }: { title: string; items: { key: string; icon: ReactNode; title: string; text?: string | null }[] }) {
  if (items.length === 0) return null;
  const shown = items.slice(0, 4);
  return (
    <section className="ga-wrap pb-12 pt-12" aria-label={title}>
      <ul className={`grid grid-cols-1 gap-y-5 sm:grid-cols-2 ${shown.length >= 4 ? 'lg:grid-cols-4' : shown.length === 3 ? 'lg:grid-cols-3' : ''}`}>
        {shown.map((item) => (
          <li key={item.key} className="flex items-start gap-1 px-2.5">
            <span className="shrink-0 text-[var(--ga-brand)] [&_svg]:h-10 [&_svg]:w-10 [&_svg]:stroke-[1.2]">{item.icon}</span>
            <span className="block">
              <span className="block pb-2.5 pl-5 font-display text-lg font-normal leading-[25px] text-[var(--ga-brand)]">{item.title}</span>
              {item.text && <span className="block pl-5 text-base text-[#444]">{item.text}</span>}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Customer reviews on the home page, in the template's card style: white rounded cards with the name, stars and the words. */
export function GaReviews({ title, reviews, verifiedLabel }: { title: string; verifiedLabel: string; reviews: { id: string; name: string; rating: number; title?: string | null; content?: string | null; verified?: boolean }[] }) {
  if (reviews.length === 0) return null;
  return (
    <section className="ga-wrap pt-12">
      <h2 className="mb-5 font-display text-3xl font-medium text-ink sm:text-4xl">{title}</h2>
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-2xl bg-white p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-sm font-medium">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--ga-soft)] text-xs font-medium text-[var(--ga-brand)]">{r.name.slice(0, 1).toUpperCase()}</span>
                {r.name}
              </span>
              <GroceryantoStars value={r.rating} className="h-3.5 w-3.5" />
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
