'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ChevronLeft, ChevronRight } from './icons';
import { SporteqStars } from './SporteqCard';

/*
 * Sporteq's home sections (components/Hero, Categories, BestSellers, Promos, Features): drawing only, fed by the store's own data
 * in StorePal's HomeView (skin sporteq) and by sample data on the template demo page. `plainImage` switches pictures to a plain
 * <img> for the demo's outside photos. Nothing here invents a promise: a part shows only what the store wrote or what exists,
 * and is left out otherwise (the template's "Limited Collection", "The Heat Is Real", "Sporteq Club" and its sample promises
 * are demo words only).
 */

const display = { fontFamily: 'var(--font-dm-sans), var(--font-bangla-store, var(--font-bangla)), Impact, sans-serif' } as const;

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

export interface EqHeroSlide {
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
export function EqSectionTitle({ title, sub }: { title: ReactNode; sub?: string | null }) {
  return (
    <div>
      <h2 className="text-xl font-bold uppercase tracking-wider" style={display}>{title}</h2>
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
export function EqHero({
  slides,
  shopLabel,
  exploreLabel,
  exploreHref,
  plainImage,
}: {
  slides: EqHeroSlide[];
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
      className="relative isolate overflow-hidden bg-[var(--eq-ink)] text-white"
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
          <div key={sl.key} aria-hidden className={`absolute inset-0 -z-10 transition-opacity duration-700 ${idx === i ? 'opacity-100' : 'opacity-0'}`}>
            <Picture src={sl.image} alt="" plain={plainImage} priority={idx === 0} sizes="100vw" className="absolute inset-0 h-full w-full object-center" />
            {!full && <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/10 lg:via-black/60 lg:to-transparent" />}
          </div>
        );
      })}
      {hasWords && <div className="absolute inset-0 -z-10 bg-black/30 sm:hidden" />}

      <div className="eq-wrap eq-hero-fill relative flex flex-col justify-center py-14">
        {hasWords ? (
          <>
            {s.eyebrow && <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--eq-lime)] sm:text-xs">{s.eyebrow}</p>}
            <h2 className="mt-4 text-[44px] font-extrabold uppercase leading-[1.02] tracking-tight !text-white sm:text-6xl lg:text-[68px]" style={display}>
              {s.title.join(' ')}
              {s.accent && (
                <>
                  <br />
                  <span className="text-[var(--eq-lime)]">{s.accent}</span>
                </>
              )}
            </h2>
            {s.text && <p className="mt-6 max-w-xs text-sm leading-relaxed text-white/90 sm:text-base">{s.text}</p>}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={s.href} className="eq-btn !h-12 !px-7">
                {shopLabel}
              </Link>
              {exploreLabel && exploreHref && (
                <Link href={exploreHref} className="eq-btn eq-btn-ghost !h-12 !px-7">
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
              <button key={sl.key} type="button" aria-label={`Slide ${idx + 1}`} aria-current={idx === i} onClick={() => setI(idx)} className={`h-2.5 w-2.5 rounded-full transition ${idx === i ? 'bg-[var(--eq-lime)]' : 'bg-white/40'}`} />
            ))}
          </div>
        )}
      </div>

      {n > 1 && (
        <>
          <button type="button" onClick={() => go(-1)} className="absolute left-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-black transition hover:bg-white lg:grid" aria-label="Previous slide">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button type="button" onClick={() => go(1)} className="absolute right-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-black transition hover:bg-white lg:grid" aria-label="Next slide">
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}
    </section>
  );
}

export function EqCategories({
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
    <section id="categories" className="eq-wrap scroll-mt-24 py-12 sm:py-14" aria-label={title}>
      <h2 className="text-center text-lg font-extrabold uppercase tracking-wide sm:text-xl">{title ?? ''}</h2>
      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4 lg:grid-cols-8">
        {items.slice(0, 8).map((c) => (
          <Link key={c.name} href={c.href} className="group flex flex-col items-center text-center">
            <span className="relative block h-[88px] w-[88px] overflow-hidden rounded-full bg-[#f1f1f1] ring-0 ring-[var(--eq-lime)] transition duration-300 group-hover:ring-2 sm:h-[96px] sm:w-[96px]">
              {c.image ? (
                <Picture src={c.image} alt="" plain={plainImage} sizes="100px" className="absolute inset-0 h-full w-full transition duration-500 group-hover:scale-110" />
              ) : (
                <span className="grid h-full w-full place-items-center text-3xl font-extrabold text-neutral-400">{c.name.slice(0, 1)}</span>
              )}
            </span>
            <span className="mt-3 line-clamp-2 text-[11px] font-bold uppercase tracking-wide">{c.name}</span>
            <span className="text-[11px] text-neutral-500 transition group-hover:text-[var(--eq-volt-dark)]">{exploreLabel}</span>
          </Link>
        ))}
      </div>
      {viewAllLabel && viewAllHref && (
        <div className="mt-8 text-center">
          <Link href={viewAllHref} className={viewAll}>
            {viewAllLabel} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </section>
  );
}

/** A titled row of product cards (components/BestSellers.tsx): the small capital title, "View All" on the right, then 2, 3 and 6 columns. */
export function EqProductGrid({ title, sub, viewAllLabel, viewAllHref, children, id, extra }: { title: string; sub?: string | null; viewAllLabel?: string; viewAllHref?: string; children: ReactNode[]; id?: string; extra?: ReactNode }) {
  if (children.length === 0) return null;
  return (
    <section id={id} className="eq-wrap scroll-mt-24 pt-12" aria-label={title}>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-wrap items-end gap-3">
          <EqSectionTitle title={title} sub={sub} />
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

export interface EqPromo {
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
export function EqPromoBanners({ banners, plainImage }: { banners: EqPromo[]; plainImage?: boolean }) {
  if (banners.length === 0) return null;
  const list = banners.slice(0, 3);
  return (
    <section id="sale" className={`eq-wrap grid scroll-mt-24 gap-4 pt-10 ${list.length === 1 ? '' : list.length === 2 ? 'lg:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'}`} aria-label="Offers">
      {list.map((b, idx) => {
        const dark = idx % 2 === 0;
        return (
          <Link key={b.key} href={b.href} className={`group relative block min-h-[260px] overflow-hidden ${dark ? 'bg-[var(--eq-ink)] text-white hover:text-white' : 'bg-[#ececec] text-[var(--eq-ink)] hover:text-[var(--eq-ink)]'}`}>
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
              {b.kicker && <span className={`text-[10px] font-semibold uppercase tracking-widest ${dark ? 'text-[var(--eq-lime)]' : 'text-neutral-700'}`}>{b.kicker}</span>}
              <span className="mt-3 block text-3xl font-bold uppercase leading-[1.05] sm:text-4xl" style={display}>
                {b.title}
              </span>
              <span
                className={`mt-5 inline-flex w-fit items-center px-6 py-3 text-[11px] font-bold uppercase tracking-wider transition ${
                  dark ? 'bg-[var(--eq-lime)] text-[#0e0e0e] group-hover:bg-[var(--eq-volt-dark)]' : 'border border-[var(--eq-ink)] bg-white text-[var(--eq-ink)] group-hover:bg-[var(--eq-ink)] group-hover:text-white'
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
export function EqBrands({ title, allLabel, allHref, brands, stylesLabel }: { title: string; allLabel?: string; allHref?: string; brands: { name: string; href: string; count?: number }[]; stylesLabel?: (n: number) => string }) {
  if (brands.length === 0) return null;
  return (
    <section id="brands" className="eq-wrap scroll-mt-24 pt-12" aria-label={title}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <EqSectionTitle title={title} />
        {allLabel && allHref && (
          <Link href={allHref} className={viewAll}>
            {allLabel} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      <div className="eq-no-scrollbar flex gap-2.5 overflow-x-auto pb-1">
        {brands.map((b) => (
          <Link
            key={b.name}
            href={b.href}
            className="flex shrink-0 items-center gap-2 border border-neutral-300 px-5 py-3 text-xs font-bold uppercase tracking-wider transition hover:border-[var(--eq-ink)] hover:bg-[var(--eq-ink)] hover:text-white"
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
export function EqFeatures({ title, items }: { title: string; items: { key: string; icon: ReactNode; title: string; text?: string | null }[] }) {
  if (items.length === 0) return null;
  const shown = items.slice(0, 4);
  return (
    <section className="mt-12 border-b border-neutral-200 bg-[#f7f7f8]" aria-label={title}>
      <div className={`eq-wrap grid grid-cols-1 gap-y-5 py-6 sm:grid-cols-2 lg:divide-x lg:divide-neutral-300 ${shown.length >= 4 ? 'lg:grid-cols-4' : shown.length === 3 ? 'lg:grid-cols-3' : ''}`}>
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
export function EqReviews({ title, reviews, verifiedLabel }: { title: string; verifiedLabel: string; reviews: { id: string; name: string; rating: number; title?: string | null; content?: string | null; verified?: boolean }[] }) {
  if (reviews.length === 0) return null;
  return (
    <section className="eq-wrap pt-12">
      <div className="mb-5">
        <EqSectionTitle title={title} />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {reviews.slice(0, 6).map((r) => (
          <figure key={r.id} className="rounded-none border border-neutral-200 bg-[#f7f7f7] p-5">
            <SporteqStars value={r.rating} className="h-3.5 w-3.5" />
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
