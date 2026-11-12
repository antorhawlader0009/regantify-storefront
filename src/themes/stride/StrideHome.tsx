'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ChevronLeft, ChevronRight } from './icons';
import { StrideStars } from './StrideCard';

/*
 * Stride's home sections (components/Hero, Categories, BestSellers, Promos, Features): drawing only, fed by the store's own data
 * in StorePal's HomeView (skin stride) and by sample data on the template demo page. `plainImage` switches pictures to a plain
 * <img> for the demo's outside photos. Nothing here invents a promise: a part shows only what the store wrote or what exists,
 * and is left out otherwise (the template's "Limited Collection", "The Heat Is Real", "Stride Club" and its sample promises
 * are demo words only).
 */

const display = { fontFamily: 'var(--font-oswald), var(--font-bangla-store, var(--font-bangla)), Impact, sans-serif' } as const;

function Picture({ src, alt, className, plain, priority, sizes }: { src: string; alt: string; className: string; plain?: boolean; priority?: boolean; sizes: string }) {
  if (plain) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} loading={priority ? 'eager' : 'lazy'} className={`${className} object-cover`} />;
  }
  return (
    // A picture placed `absolute` by its caller keeps that; anything else needs `relative` for the filled image.
    <span className={`${className} block ${/\babsolute\b/.test(className) ? '' : 'relative'}`}>
      <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className="object-cover" />
    </span>
  );
}

export interface StHeroSlide {
  key: string;
  image?: string | null;
  eyebrow?: string;
  /** Lines of the slide's title. */
  title: string[];
  accent?: string;
  text?: string;
  href: string;
}

/** The template's section title: 15px, extra bold, capitals with a little spacing. */
export function StSectionTitle({ title, sub }: { title: ReactNode; sub?: string | null }) {
  return (
    <div>
      <h2 className="text-[15px] font-extrabold uppercase tracking-wide">{title}</h2>
      {sub && <p className="mt-1 text-xs normal-case text-neutral-500">{sub}</p>}
    </div>
  );
}

/** "View All →" beside a section title: 11px bold capitals, underlined on hover. */
const viewAll = 'inline-flex shrink-0 items-center gap-2 text-[11px] font-bold uppercase tracking-wide hover:underline';

/**
 * The hero (components/Hero.tsx): a light stone section (#f1f0ec) with the slide's photo filling its right side (from 36% on a
 * computer) with a dark fade, and the words on the left: a small caption, a huge Oswald title in capitals, a line, a black
 * "Shop" button and an outlined one; round dots under them. A slide that is only a picture (the store's website cover) fills the
 * whole section. It changes every 5 seconds and pauses on hover; swipes on a phone. A store with no picture gets its name on the
 * stone with a Shop button.
 */
export function StHero({
  slides,
  shopLabel,
  exploreLabel,
  exploreHref,
  plainImage,
}: {
  slides: StHeroSlide[];
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
    const timer = setInterval(() => setI((x) => (x + 1) % n), 5000);
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
  const s = slides[i];
  const hasWords = !!s.eyebrow || !s.image;

  return (
    <section
      data-rg="hero"
      className="relative isolate overflow-hidden bg-[var(--st-hero-bg)]"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
        setPaused(true);
      }}
      onTouchEnd={onTouchEnd}
    >
      {slides.map((sl, idx) => {
        if (!sl.image) return null;
        const full = !sl.eyebrow;
        return (
          <div key={sl.key} aria-hidden className={`absolute inset-0 -z-10 transition-opacity duration-700 ${full ? '' : 'lg:left-[36%]'} ${idx === i ? 'opacity-100' : 'opacity-0'}`}>
            <Picture src={sl.image} alt="" plain={plainImage} priority={idx === 0} sizes="100vw" className="absolute inset-0 h-full w-full object-center" />
            {!full && <div className="absolute inset-0 bg-gradient-to-l from-black/55 via-black/10 to-transparent" />}
          </div>
        );
      })}
      {hasWords && <div className="absolute inset-0 -z-10 bg-gradient-to-r from-white/90 via-white/70 to-white/30 lg:from-[#f1f0ec] lg:from-35% lg:via-[#f1f0ec]/80 lg:via-45% lg:to-transparent lg:to-60%" />}

      <div className="st-wrap st-hero-fill relative flex flex-col justify-center py-14">
        {hasWords ? (
          <>
            {s.eyebrow && <p className="text-[11px] font-medium uppercase tracking-wide">{s.eyebrow}</p>}
            <h2 className="mt-4 text-[48px] font-bold uppercase leading-[0.98] !text-[var(--st-navy)] sm:text-7xl lg:text-[84px]" style={display}>
              {s.title.join(' ')}
              {s.accent && (
                <>
                  <br />
                  <span className="text-[var(--st-lime)]">{s.accent}</span>
                </>
              )}
            </h2>
            {s.text && <p className="mt-6 max-w-sm text-[15px] leading-relaxed">{s.text}</p>}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={s.href} className="st-btn !h-12 !px-7">
                {shopLabel}
              </Link>
              {exploreLabel && exploreHref && (
                <Link href={exploreHref} className="st-btn st-btn-line !h-12 !px-7">
                  {exploreLabel}
                </Link>
              )}
            </div>
          </>
        ) : (
          <Link href={s.href} aria-label={s.title.join(' ')} className="absolute inset-0 z-10" />
        )}
        {n > 1 && (
          <div className="relative z-20 mt-10 flex gap-2" role="tablist" aria-label="Hero slides">
            {slides.map((sl, idx) => (
              <button key={sl.key} type="button" aria-label={`Slide ${idx + 1}`} aria-current={idx === i} onClick={() => setI(idx)} className={`h-2.5 w-2.5 rounded-full transition ${idx === i ? 'bg-[var(--st-navy)]' : 'bg-neutral-400'}`} />
            ))}
          </div>
        )}
      </div>

      {n > 1 && (
        <>
          <button type="button" onClick={() => go(-1)} className="absolute left-3 top-1/2 z-20 hidden h-10 w-10 -tranneutral-y-1/2 place-items-center rounded-full bg-white/80 text-black transition hover:bg-white lg:grid" aria-label="Previous slide">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button type="button" onClick={() => go(1)} className="absolute right-3 top-1/2 z-20 hidden h-10 w-10 -tranneutral-y-1/2 place-items-center rounded-full bg-white/80 text-black transition hover:bg-white lg:grid" aria-label="Next slide">
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}
    </section>
  );
}

/**
 * The category tiles (components/Categories.tsx): tall 3:4 pictures with rounded corners and a dark fade, the name in Oswald
 * over it and a small "Shop now"; two across on a phone, three from 640px, six from 1024px. A category with no picture shows its
 * first letter on the dark.
 */
export function StCategories({
  items,
  plainImage,
  title,
  exploreLabel,
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
    <section id="categories" className="st-wrap scroll-mt-24 pt-12" aria-label={title}>
      <div className="mb-5 flex items-center justify-between gap-4">
        <StSectionTitle title={title ?? ''} />
        {viewAllLabel && viewAllHref && (
          <Link href={viewAllHref} className={viewAll}>
            {viewAllLabel} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {items.map((c) => (
          <Link key={c.name} href={c.href} className="group relative block aspect-[3/4] overflow-hidden rounded-lg bg-neutral-900 text-white hover:text-white">
            {c.image ? (
              <Picture src={c.image} alt="" plain={plainImage} sizes="220px" className="absolute inset-0 h-full w-full transition duration-500 group-hover:scale-105" />
            ) : (
              <span className="grid h-full w-full place-items-center text-4xl font-bold text-neutral-600" style={display}>
                {c.name.slice(0, 1)}
              </span>
            )}
            <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/20" />
            <span className="absolute inset-x-0 bottom-4 px-2 text-center">
              <span className="block truncate text-xl font-semibold tracking-wide" style={display}>
                {c.name}
              </span>
              <span className="mt-1 block text-[10px] font-bold uppercase tracking-wider">{exploreLabel}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/** A titled row of product cards (components/BestSellers.tsx): the small capital title, "View All" on the right, then 2, 3 and 6 columns. */
export function StProductGrid({ title, sub, viewAllLabel, viewAllHref, children, id, extra }: { title: string; sub?: string | null; viewAllLabel?: string; viewAllHref?: string; children: ReactNode[]; id?: string; extra?: ReactNode }) {
  if (children.length === 0) return null;
  return (
    <section id={id} className="st-wrap scroll-mt-24 pt-12" aria-label={title}>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-wrap items-end gap-3">
          <StSectionTitle title={title} sub={sub} />
          {extra}
        </div>
        {viewAllLabel && viewAllHref && (
          <Link href={viewAllHref} className={viewAll}>
            {viewAllLabel} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5 min-[1280px]:grid-cols-6">
        {children.map((child, i) => (
          <div key={i} className="h-full min-w-0">
            {child}
          </div>
        ))}
      </div>
    </section>
  );
}

export interface StPromo {
  key: string;
  kicker?: string;
  title: string;
  cta: string;
  href: string;
  image?: string | null;
}

/**
 * The two promo banners (components/Promos.tsx): the first black with its picture on the right under a black fade, a big Oswald
 * title in capitals and an outlined white button; the next light grey with its picture on the right half, a small caption, a
 * title and a black button; and so on. A store's own campaigns fill them (up to three), never the template's words.
 */
export function StPromoBanners({ banners, plainImage }: { banners: StPromo[]; plainImage?: boolean }) {
  if (banners.length === 0) return null;
  const list = banners.slice(0, 3);
  return (
    <section id="sale" className={`st-wrap grid scroll-mt-24 gap-4 pt-10 ${list.length === 1 ? '' : list.length === 2 ? 'lg:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'}`} aria-label="Offers">
      {list.map((b, idx) => {
        const dark = idx % 2 === 0;
        return (
          <Link key={b.key} href={b.href} className={`group relative block min-h-[260px] overflow-hidden rounded-md ${dark ? 'bg-[var(--st-navy)] text-white hover:text-white' : 'bg-[#e0e0e0] text-[var(--st-navy)] hover:text-[var(--st-navy)]'}`}>
            {b.image && (
              <Picture
                src={b.image}
                alt=""
                plain={plainImage}
                sizes="(max-width: 768px) 100vw, 600px"
                className={`absolute inset-y-0 right-0 h-full transition duration-500 group-hover:scale-105 ${dark ? 'w-full opacity-70 md:w-4/5' : 'w-full opacity-50 md:w-1/2 md:opacity-100'}`}
              />
            )}
            {dark && <span aria-hidden className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />}
            <span className="relative flex h-full min-h-[260px] flex-col justify-center p-6 sm:p-10 md:max-w-[65%]">
              {b.kicker && <span className={`text-[10px] font-semibold uppercase tracking-widest ${dark ? 'text-[var(--st-lime)]' : 'text-neutral-700'}`}>{b.kicker}</span>}
              <span className="mt-3 block text-4xl font-bold uppercase leading-none sm:text-5xl" style={display}>
                {b.title}
              </span>
              <span
                className={`mt-5 inline-flex w-fit items-center px-6 py-3 text-[11px] font-bold uppercase tracking-wider transition ${
                  dark ? 'border border-white group-hover:bg-white group-hover:text-[var(--st-navy)]' : 'bg-[var(--st-navy)] text-white group-hover:bg-neutral-800'
                }`}
              >
                {b.cta}
              </span>
            </span>
          </Link>
        );
      })}
    </section>
  );
}

/** The brand row: each brand a square bordered tile in small bold capitals (with how many products it has), scrolling sideways. */
export function StBrands({ title, allLabel, allHref, brands, stylesLabel }: { title: string; allLabel?: string; allHref?: string; brands: { name: string; href: string; count?: number }[]; stylesLabel?: (n: number) => string }) {
  if (brands.length === 0) return null;
  return (
    <section id="brands" className="st-wrap scroll-mt-24 pt-12" aria-label={title}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <StSectionTitle title={title} />
        {allLabel && allHref && (
          <Link href={allHref} className={viewAll}>
            {allLabel} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      <div className="st-no-scrollbar flex gap-2.5 overflow-x-auto pb-1">
        {brands.map((b) => (
          <Link
            key={b.name}
            href={b.href}
            className="flex shrink-0 items-center gap-2 border border-neutral-300 px-5 py-3 text-xs font-bold uppercase tracking-wider transition hover:border-[var(--st-navy)] hover:bg-[var(--st-navy)] hover:text-white"
          >
            {b.name}
            {b.count !== undefined && stylesLabel && <span className="font-medium normal-case text-neutral-400">{stylesLabel(b.count)}</span>}
          </Link>
        ))}
      </div>
    </section>
  );
}

/**
 * The service strip (components/Features.tsx): a full-width light grey band, four items in a row split by thin lines, each with
 * a thin icon, a small bold capital title and a grey line. Only the store's own highlights (Store > Design) are drawn.
 */
export function StFeatures({ title, items }: { title: string; items: { key: string; icon: ReactNode; title: string; text?: string | null }[] }) {
  if (items.length === 0) return null;
  const shown = items.slice(0, 4);
  return (
    <section className="mt-12 bg-[#f7f7f7]" aria-label={title}>
      <div className={`st-wrap grid grid-cols-1 gap-y-5 py-6 sm:grid-cols-2 lg:divide-x lg:divide-neutral-300 ${shown.length >= 4 ? 'lg:grid-cols-4' : shown.length === 3 ? 'lg:grid-cols-3' : ''}`}>
        {shown.map((item) => (
          <div key={item.key} className="flex items-center gap-4 lg:justify-center lg:px-4">
            <span className="[&_svg]:h-[34px] [&_svg]:w-[34px] [&_svg]:stroke-[1.3]">{item.icon}</span>
            <span className="min-w-0">
              <span className="block text-[11px] font-bold uppercase tracking-wide">{item.title}</span>
              {item.text && <span className="mt-0.5 block text-[11px] text-neutral-600">{item.text}</span>}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Customer reviews on the home page: square bordered cards with the stars, the words and the name. */
export function StReviews({ title, reviews, verifiedLabel }: { title: string; verifiedLabel: string; reviews: { id: string; name: string; rating: number; title?: string | null; content?: string | null; verified?: boolean }[] }) {
  if (reviews.length === 0) return null;
  return (
    <section className="st-wrap pt-12">
      <div className="mb-5">
        <StSectionTitle title={title} />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {reviews.slice(0, 6).map((r) => (
          <figure key={r.id} className="rounded-lg border border-neutral-200 bg-[#f7f7f7] p-5">
            <StrideStars value={r.rating} className="h-3.5 w-3.5" />
            {r.title && <p className="mt-2 text-[13px] font-bold">{r.title}</p>}
            {r.content && <blockquote className="mt-1 line-clamp-4 text-[13px] leading-snug text-neutral-700">{r.content}</blockquote>}
            <figcaption className="mt-3 text-[11px] font-bold uppercase tracking-wide">
              {r.name}
              {r.verified && <span className="ml-2 font-semibold normal-case text-success">{verifiedLabel}</span>}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
