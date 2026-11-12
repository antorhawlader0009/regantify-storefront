'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ChevronLeft, ChevronRight } from './icons';
import { VaeloraStars } from './VaeloraCard';

/*
 * Vaelora's home sections (components/Hero, Categories, ProductRow, PromoBanners, ServicePromise, ClientStories): drawing only,
 * fed by the store's own data in StorePal's HomeView (skin vaelora) and by sample data on the template demo page. `plainImage`
 * switches pictures to a plain <img> for the demo's outside photos. Nothing here invents a promise: a part shows only what the
 * store wrote or what exists, and is left out otherwise (the template's "Certified authentic", "2-year warranty", its brand story
 * and its client stories are demo words only).
 */

const serif = { fontFamily: 'var(--font-cormorant), var(--font-bangla-store, var(--font-bangla)), Georgia, serif' } as const;
const condensed = { fontFamily: 'var(--font-barlow-cond), var(--font-bangla-store, var(--font-bangla)), Impact, sans-serif' } as const;

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

export interface VaHeroSlide {
  key: string;
  image?: string | null;
  eyebrow?: string;
  /** Lines of the slide's title. */
  title: string[];
  accent?: string;
  text?: string;
  href: string;
}

/** The template's section head: 15px, semibold, capitals with a little spacing. */
export function VaSectionTitle({ title, sub }: { title: ReactNode; sub?: string | null }) {
  return (
    <div>
      <h2 className="text-[15px] font-semibold uppercase tracking-wide" style={{ fontFamily: 'var(--font-dm-sans), var(--font-bangla-store, var(--font-bangla)), sans-serif' }}>
        {title}
      </h2>
      {sub && <p className="mt-1 text-xs normal-case text-neutral-500">{sub}</p>}
    </div>
  );
}

/** "VIEW ALL →" beside a section title: 11px, medium, capitals with spacing, brass on hover. */
const viewAll = 'inline-flex shrink-0 items-center gap-2 text-[11px] font-medium uppercase tracking-wider transition hover:text-[var(--va-brand)]';

/**
 * The hero (components/Hero.tsx): a full-screen black section whose photo fills it, with a black fade from the left; the words
 * sit on the left (a small spaced caption, a big condensed title in capitals with the second line in brass, a line, a brass
 * "Shop" button and an outlined white one); the dots sit at the bottom centre (the open one long and brass). A slide that is only
 * a picture (the store's website cover) shows no words. It changes every 5.5 seconds and pauses on hover; swipes on a phone.
 */
export function VaHero({
  slides,
  shopLabel,
  exploreLabel,
  exploreHref,
  plainImage,
}: {
  slides: VaHeroSlide[];
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
  const s = slides[i];
  const hasWords = !!s.eyebrow || !s.image;

  return (
    <section
      data-rg="hero"
      className="va-hero-fill relative isolate flex items-center overflow-hidden bg-black text-white"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
        setPaused(true);
      }}
      onTouchEnd={onTouchEnd}
    >
      {slides.map((sl, idx) =>
        sl.image ? (
          <div key={sl.key} aria-hidden className={`absolute inset-0 -z-20 transition-opacity duration-1000 ${idx === i ? 'opacity-100' : 'opacity-0'}`}>
            <Picture src={sl.image} alt="" plain={plainImage} priority={idx === 0} sizes="100vw" className="absolute inset-0 h-full w-full object-center" />
          </div>
        ) : null,
      )}
      {hasWords && (
        <>
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/90 via-black/55 to-black/10" />
          <div className="absolute inset-0 -z-10 bg-black/35 lg:hidden" />
        </>
      )}
      <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-black/60 to-transparent" />

      <div className="mx-auto w-full max-w-[1440px] px-6 py-16 sm:px-12 lg:px-20 xl:px-28">
        {hasWords ? (
          <div className="va-fade-up max-w-[520px]" key={s.key}>
            {s.eyebrow && <p className="text-[11px] uppercase tracking-[0.18em]">{s.eyebrow}</p>}
            <h2 className="mt-5 text-[48px] font-bold uppercase leading-[0.98] !text-white sm:text-[64px] lg:text-[76px]" style={condensed}>
              {s.title.join(' ')}
              {s.accent && (
                <>
                  <br />
                  <span className="text-[var(--va-brand)]">{s.accent}</span>
                </>
              )}
            </h2>
            {s.text && <p className="mt-6 text-[15px] leading-relaxed text-neutral-200">{s.text}</p>}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={s.href} className="inline-flex items-center bg-[var(--va-brand)] px-7 py-3 text-[11px] font-medium uppercase tracking-wider !text-white transition hover:bg-[var(--va-brand-dark)]">
                {shopLabel}
              </Link>
              {exploreLabel && exploreHref && (
                <Link href={exploreHref} className="inline-flex items-center border border-white/60 px-7 py-3 text-[11px] font-medium uppercase tracking-wider !text-white transition hover:bg-white hover:!text-black">
                  {exploreLabel}
                </Link>
              )}
            </div>
          </div>
        ) : (
          <Link href={s.href} aria-label={s.title.join(' ')} className="absolute inset-0 z-10" />
        )}
      </div>

      {n > 1 && (
        <>
          <button type="button" onClick={() => go(-1)} className="absolute left-3 top-1/2 z-20 hidden h-10 w-10 -tranneutral-y-1/2 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/30 lg:grid" aria-label="Previous slide">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button type="button" onClick={() => go(1)} className="absolute right-3 top-1/2 z-20 hidden h-10 w-10 -tranneutral-y-1/2 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/30 lg:grid" aria-label="Next slide">
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-6 left-1/2 z-20 flex -tranneutral-x-1/2 gap-2">
            {slides.map((sl, idx) => (
              <button key={sl.key} type="button" aria-label={`Slide ${idx + 1}`} aria-current={idx === i} onClick={() => setI(idx)} className={`h-1.5 rounded-full transition-all ${idx === i ? 'w-6 bg-[var(--va-brand)]' : 'w-1.5 bg-white/50 hover:bg-white'}`} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

/**
 * The category tiles (components/Categories.tsx): tall 3:4 pictures with rounded corners and a black fade, the name centred at
 * the foot in small spaced capitals with a smaller "Shop now" that turns brass on hover; two across on a phone, four from
 * 1024px. A category with no picture shows its first letter in serif on the dark.
 */
export function VaCategories({
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
    <section id="categories" className="va-wrap scroll-mt-24 pt-8 sm:pt-10" aria-label={title}>
      <div className="mb-5 flex items-center justify-between gap-4">
        <VaSectionTitle title={title ?? ''} />
        {viewAllLabel && viewAllHref && (
          <Link href={viewAllHref} className={viewAll}>
            {viewAllLabel} <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
        {items.map((c) => (
          <Link key={c.name} href={c.href} className="group relative block aspect-[3/4] overflow-hidden rounded-lg bg-neutral-900 text-white hover:text-white">
            {c.image ? (
              <Picture src={c.image} alt="" plain={plainImage} sizes="300px" className="absolute inset-0 h-full w-full transition duration-700 group-hover:scale-105" />
            ) : (
              <span className="grid h-full w-full place-items-center text-5xl text-neutral-600" style={serif}>
                {c.name.slice(0, 1)}
              </span>
            )}
            <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
            <span className="absolute inset-x-0 bottom-0 p-3 text-center sm:p-4">
              <span className="block truncate text-[11px] font-semibold uppercase tracking-wider">{c.name}</span>
              <span className="mt-0.5 block text-[9px] uppercase tracking-wider text-neutral-300 transition group-hover:text-[var(--va-gold-light)]">{exploreLabel}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/** A titled row of product cards (components/ProductRow.tsx): the capital title, "VIEW ALL" on the right, then 2 and 4 columns with roomy gaps. */
export function VaProductGrid({ title, sub, viewAllLabel, viewAllHref, children, id, extra }: { title: string; sub?: string | null; viewAllLabel?: string; viewAllHref?: string; children: ReactNode[]; id?: string; extra?: ReactNode }) {
  if (children.length === 0) return null;
  return (
    <section id={id} className="va-wrap scroll-mt-24 pt-12 sm:pt-16" aria-label={title}>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-wrap items-end gap-3">
          <VaSectionTitle title={title} sub={sub} />
          {extra}
        </div>
        {viewAllLabel && viewAllHref && (
          <Link href={viewAllHref} className={viewAll}>
            {viewAllLabel} <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-4 lg:grid-cols-4 lg:gap-x-6">
        {children.map((child, i) => (
          <div key={i} className="h-full min-w-0">
            {child}
          </div>
        ))}
      </div>
    </section>
  );
}

export interface VaPromo {
  key: string;
  kicker?: string;
  title: string;
  cta: string;
  href: string;
  image?: string | null;
}

/**
 * The two banners (components/PromoBanners.tsx): the first black with its picture on the right under a black fade, a brass
 * caption, a serif title and a brass button; the next on a light grey gradient with a brass-dark caption, a serif title and a
 * black button; and so on. A store's own campaigns fill them (up to three), never the template's words.
 */
export function VaPromoBanners({ banners, plainImage }: { banners: VaPromo[]; plainImage?: boolean }) {
  if (banners.length === 0) return null;
  const list = banners.slice(0, 3);
  return (
    <section id="sale" className={`va-wrap grid scroll-mt-24 gap-4 pt-12 sm:pt-16 ${list.length === 1 ? '' : list.length === 2 ? 'lg:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'}`} aria-label="Offers">
      {list.map((b, idx) => {
        const dark = idx % 2 === 0;
        return (
          <Link key={b.key} href={b.href} className={`group relative block min-h-[280px] overflow-hidden rounded-lg sm:min-h-[320px] ${dark ? 'bg-black text-white hover:text-white' : 'bg-gradient-to-br from-neutral-100 to-neutral-200 text-black hover:text-black'}`}>
            {b.image && <Picture src={b.image} alt="" plain={plainImage} sizes="(max-width: 768px) 100vw, 600px" className={`absolute inset-y-0 right-0 h-full transition duration-700 group-hover:scale-105 ${dark ? 'w-full sm:w-[62%]' : 'w-full opacity-40 sm:w-[55%] sm:opacity-100'}`} />}
            {dark && <span aria-hidden className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />}
            <span className="relative flex h-full min-h-[280px] flex-col justify-center p-7 sm:min-h-[320px] sm:p-9 sm:max-w-[70%]">
              {b.kicker && <span className={`text-[10px] uppercase tracking-[0.2em] ${dark ? 'text-[var(--va-brand)]' : 'text-[var(--va-brand-dark)]'}`}>{b.kicker}</span>}
              <span className="mt-3 block text-[32px] font-medium leading-[1.1] sm:text-4xl" style={serif}>
                {b.title}
              </span>
              <span className={`mt-6 inline-flex w-fit items-center px-6 py-2.5 text-[10px] font-medium uppercase tracking-wider transition ${dark ? 'bg-[var(--va-brand)] text-white group-hover:bg-[var(--va-brand-dark)]' : 'bg-black text-white group-hover:bg-[var(--va-brand)]'}`}>
                {b.cta}
              </span>
            </span>
          </Link>
        );
      })}
    </section>
  );
}

/** The brand row: the store's brands as spaced serif capitals split by thin lines (with how many products each has), scrolling sideways. */
export function VaBrands({ title, allLabel, allHref, brands, stylesLabel }: { title: string; allLabel?: string; allHref?: string; brands: { name: string; href: string; count?: number }[]; stylesLabel?: (n: number) => string }) {
  if (brands.length === 0) return null;
  return (
    <section id="brands" className="va-wrap scroll-mt-24 pt-14 sm:pt-20" aria-label={title}>
      <div className="mb-8 text-center">
        <p className="text-[11px] uppercase tracking-[0.25em] text-[var(--va-brand)]">{title}</p>
        {allLabel && allHref && (
          <Link href={allHref} className={`${viewAll} mt-3`}>
            {allLabel} <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      <div className="va-no-scrollbar flex flex-wrap items-center justify-center gap-x-0 gap-y-3 border-y border-neutral-200 py-5">
        {brands.map((b, idx) => (
          <Link
            key={b.name}
            href={b.href}
            className={`px-6 text-center text-lg uppercase tracking-[0.18em] transition hover:text-[var(--va-brand)] sm:px-9 ${idx > 0 ? 'border-l border-neutral-200' : ''}`}
            style={serif}
          >
            {b.name}
            {b.count !== undefined && stylesLabel && <span className="ml-2 text-[10px] normal-case tracking-normal text-neutral-400">{stylesLabel(b.count)}</span>}
          </Link>
        ))}
      </div>
    </section>
  );
}

/**
 * The promise strip (components/ServicePromise.tsx): a centred spaced caption and a serif heading, then a grid of cells split by
 * thin lines, each with a brass icon, a small capital title and a grey line. Only the store's own highlights (Store > Design)
 * are drawn; the template's four promises are demo words.
 */
export function VaFeatures({ title, items }: { title: string; items: { key: string; icon: ReactNode; title: string; text?: string | null }[] }) {
  if (items.length === 0) return null;
  const shown = items.slice(0, 4);
  return (
    <section className="va-wrap pt-14 sm:pt-20" aria-label={title}>
      <div className={`grid gap-px overflow-hidden rounded-lg border border-neutral-200 bg-neutral-200 sm:grid-cols-2 ${shown.length >= 4 ? 'lg:grid-cols-4' : shown.length === 3 ? 'lg:grid-cols-3' : ''}`}>
        {shown.map((item) => (
          <div key={item.key} className="bg-white p-6 text-center sm:p-8">
            <span className="mx-auto block w-fit text-[var(--va-brand)] [&_svg]:h-8 [&_svg]:w-8">{item.icon}</span>
            <h3 className="mt-4 text-[12px] font-semibold uppercase tracking-wider" style={{ fontFamily: 'var(--font-dm-sans), var(--font-bangla-store, var(--font-bangla)), sans-serif' }}>
              {item.title}
            </h3>
            {item.text && <p className="mt-2 text-xs leading-relaxed text-neutral-500">{item.text}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

/** Customer reviews on the home page (components/ClientStories.tsx): a centred caption and serif heading, then bordered cards with the quote in serif. */
export function VaReviews({ title, reviews, verifiedLabel }: { title: string; verifiedLabel: string; reviews: { id: string; name: string; rating: number; title?: string | null; content?: string | null; verified?: boolean }[] }) {
  if (reviews.length === 0) return null;
  return (
    <section className="va-wrap pt-14 sm:pt-20">
      <div className="mb-8 text-center">
        <p className="text-[11px] uppercase tracking-[0.25em] text-[var(--va-brand)]">{title}</p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {reviews.slice(0, 6).map((r) => (
          <figure key={r.id} className="flex flex-col rounded-lg border border-neutral-200 bg-white p-6 sm:p-8">
            <VaeloraStars value={r.rating} className="h-3.5 w-3.5" />
            {r.title && <p className="mt-3 text-xl leading-snug" style={serif}>{r.title}</p>}
            {r.content && (
              <blockquote className="mt-2 line-clamp-5 text-lg leading-snug" style={serif}>
                “{r.content}”
              </blockquote>
            )}
            <figcaption className="mt-6 text-xs text-neutral-500">
              <b className="block text-[12px] font-semibold uppercase tracking-wider text-black">{r.name}</b>
              {r.verified && <span className="font-semibold text-success">{verifiedLabel}</span>}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
