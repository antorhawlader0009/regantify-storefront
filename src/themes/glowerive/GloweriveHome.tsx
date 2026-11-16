'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ChevronLeft, ChevronRight } from './icons';
import { GloweriveStars } from './GloweriveCard';

/*
 * Glowerive's home sections (components/Hero, Categories, BestSellers, Promos, Features): drawing only, fed by the store's own data
 * in StorePal's HomeView (skin glowerive) and by sample data on the template demo page. `plainImage` switches pictures to a plain
 * <img> for the demo's outside photos. Nothing here invents a promise: a part shows only what the store wrote or what exists,
 * and is left out otherwise (the template's "Limited Collection", "The Heat Is Real", "Glowerive Club" and its sample promises
 * are demo words only).
 */

const display = { fontFamily: 'var(--font-cormorant), var(--font-bangla-store, var(--font-bangla)), Impact, sans-serif' } as const;

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

export interface GwHeroSlide {
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
export function GwSectionTitle({ title, sub }: { title: ReactNode; sub?: string | null }) {
  return (
    <div>
      <div className="flex items-center justify-center gap-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--gw-brand)]">
        <span className="h-px w-12 bg-[#9fc9c2]" />
        <h2>{title}</h2>
        <span className="h-px w-12 bg-[#9fc9c2]" />
      </div>
      {sub && <p className="mt-1 text-center text-xs text-[#14594f]/70">{sub}</p>}
    </div>
  );
}

/** "View All →" beside a section title: 11px bold capitals, underlined on hover. */
const viewAll = 'inline-flex shrink-0 items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--gw-brand)] hover:underline md:absolute md:right-0 md:top-1/2 md:-translate-y-1/2';

/**
 * The hero (components/Hero.tsx): a light stone section (#f1f0ec) with the slide's photo filling its right side (from 36% on a
 * computer) with a dark fade, and the words on the left: a small caption, a huge Oswald title in capitals, a line, a black
 * "Shop" button and an outlined one; round dots under them. A slide that is only a picture (the store's website cover) fills the
 * whole section. It changes every 5 seconds and pauses on hover; swipes on a phone. A store with no picture gets its name on the
 * stone with a Shop button.
 */
export function GwHero({
  slides,
  shopLabel,
  exploreLabel,
  exploreHref,
  plainImage,
}: {
  slides: GwHeroSlide[];
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
      className="relative isolate overflow-hidden bg-[var(--gw-ink)] text-white"
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
            {!full && <div className="absolute inset-0 bg-gradient-to-r from-[#1c6f65] via-[#1c6f65]/60 to-transparent lg:via-[#1c6f65]/30" />}
          </div>
        );
      })}
      {hasWords && <div className="absolute inset-0 -z-10 bg-black/30 sm:hidden" />}

      <div className="gw-wrap gw-hero-fill relative flex flex-col justify-center pb-24 pt-14">
        {hasWords ? (
          <>
            {s.eyebrow && <p className="text-[11px] uppercase tracking-[0.35em] text-white/80">{s.eyebrow}</p>}
            <h2 className="mt-4 max-w-[560px] text-5xl font-normal leading-[1.08] !text-white sm:text-6xl lg:text-[66px]" style={display}>
              {s.title.join(' ')}
              {s.accent && (
                <>
                  <br />
                  <span>{s.accent}</span>
                </>
              )}
            </h2>
            {s.text && <p className="mt-6 max-w-xs text-sm leading-relaxed text-white/90 sm:text-base">{s.text}</p>}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={s.href} className="gw-btn !h-12 !border-[#0f4a42] !bg-[#0f4a42] !px-8 hover:!bg-[#0b3a34]">
                {shopLabel}
              </Link>
              {exploreLabel && exploreHref && (
                <Link href={exploreHref} className="gw-btn gw-btn-ghost !h-12 !px-7">
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
              <button key={sl.key} type="button" aria-label={`Slide ${idx + 1}`} aria-current={idx === i} onClick={() => setI(idx)} className={`h-2.5 w-2.5 rounded-full transition ${idx === i ? 'bg-white' : 'bg-white/40'}`} />
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

/**
 * The category tiles (components/Categories.tsx): tall 3:4 pictures with rounded corners and a dark fade, the name in Oswald
 * over it and a small "Shop now"; two across on a phone, three from 640px, six from 1024px. A category with no picture shows its
 * first letter on the dark.
 */
export function GwCategories({
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
    <section id="categories" className="gw-wrap scroll-mt-24 pt-12" aria-label={title}>
      <div className="relative mb-5 flex flex-col items-center gap-2 md:block">
        <GwSectionTitle title={title ?? ''} />
        {viewAllLabel && viewAllHref && (
          <Link href={viewAllHref} className={viewAll}>
            {viewAllLabel} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      <div className="mt-8 grid grid-cols-3 gap-x-4 gap-y-8 lg:grid-cols-6">
        {items.slice(0, 6).map((c) => (
          <Link key={c.name} href={c.href} className="group block text-center">
            <span className="mx-auto block aspect-square w-full max-w-[130px] overflow-hidden rounded-full ring-4 ring-[#e6f0ee] transition group-hover:shadow-lg">
              {c.image ? (
                <Picture src={c.image} alt="" plain={plainImage} sizes="130px" className="h-full w-full transition group-hover:scale-110" />
              ) : (
                <span className="grid h-full w-full place-items-center bg-[#e6f0ee] font-display text-4xl font-medium text-[var(--gw-brand)]">{c.name.slice(0, 1)}</span>
              )}
            </span>
            <span className="mt-3 block font-display text-lg font-semibold leading-tightst">{c.name}</span>
            <span className="mt-1 block text-xs text-[#2f857a]">{exploreLabel}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/** A titled row of product cards (components/BestSellers.tsx): the small capital title, "View All" on the right, then 2, 3 and 6 columns. */
export function GwProductGrid({ title, sub, viewAllLabel, viewAllHref, children, id, extra }: { title: string; sub?: string | null; viewAllLabel?: string; viewAllHref?: string; children: ReactNode[]; id?: string; extra?: ReactNode }) {
  if (children.length === 0) return null;
  return (
    <section id={id} className="gw-wrap scroll-mt-24 pt-12" aria-label={title}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-wrap items-end gap-3">
          <div>
            <h2 className="font-display text-2xl font-semibold uppercase tracking-[0.15em] text-[var(--gw-brand)] sm:text-[26px]">{title}</h2>
            {sub && <p className="mt-1 text-xs normal-case text-[#14594f]/70">{sub}</p>}
          </div>
          {extra}
        </div>
        {viewAllLabel && viewAllHref && (
          <Link href={viewAllHref} className="shrink-0 rounded-full border border-[#9fc9c2] px-5 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-[var(--gw-brand)] transition hover:bg-[var(--gw-brand)] hover:text-white">
            {viewAllLabel}
          </Link>
        )}
      </div>
      <div className="mt-6 grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 lg:grid-cols-4">
        {children.map((child, i) => (
          <div key={i} className="h-full min-w-0">
            {child}
          </div>
        ))}
      </div>
    </section>
  );
}

export interface GwPromo {
  key: string;
  kicker?: string;
  title: string;
  cta: string;
  href: string;
  image?: string | null;
}

/**
 * The offer banners (templete/glowerive Offer.tsx): a rounded teal gradient band, the picture on the left (on a computer), a small
 * tracked caption, a big serif title in white and a white pill button. A store shows its own campaigns (up to three, one band
 * each), never the template's sample "Get 20% Off Your First Order".
 */
export function GwPromoBanners({ banners, plainImage }: { banners: GwPromo[]; plainImage?: boolean }) {
  if (banners.length === 0) return null;
  return (
    <section id="sale" className="gw-wrap scroll-mt-24 space-y-5 pt-12" aria-label="Offers">
      {banners.slice(0, 3).map((b) => (
        <Link key={b.key} href={b.href} className={`group grid overflow-hidden rounded-2xl bg-gradient-to-r from-[#1c6f65] to-[#2f857a] text-white hover:text-white ${b.image ? 'lg:grid-cols-[0.8fr_1.2fr]' : ''}`}>
          {b.image && (
            <span className="relative hidden min-h-[220px] lg:block">
              <Picture src={b.image} alt="" plain={plainImage} sizes="480px" className="absolute inset-0 h-full w-full transition duration-500 group-hover:scale-105" />
            </span>
          )}
          <span className="block p-7 sm:p-9">
            {b.kicker && <span className="block text-[10px] uppercase tracking-[0.3em] text-white/80">{b.kicker}</span>}
            <span className="mt-2 block whitespace-pre-line font-display text-3xl leading-tight sm:text-4xl">{b.title}</span>
            <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-xs font-semibold uppercase tracking-widest text-[#14594f] transition group-hover:bg-[#e6f0ee]">
              {b.cta} <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </span>
        </Link>
      ))}
    </section>
  );
}

/** The brand row: each brand a square bordered tile in small bold capitals (with how many products it has), scrolling sideways. */
export function GwBrands({ title, allLabel, allHref, brands, stylesLabel }: { title: string; allLabel?: string; allHref?: string; brands: { name: string; href: string; count?: number }[]; stylesLabel?: (n: number) => string }) {
  if (brands.length === 0) return null;
  return (
    <section id="brands" className="gw-wrap scroll-mt-24 pt-12" aria-label={title}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <GwSectionTitle title={title} />
        {allLabel && allHref && (
          <Link href={allHref} className={viewAll}>
            {allLabel} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      <div className="gw-no-scrollbar flex gap-2.5 overflow-x-auto pb-1">
        {brands.map((b) => (
          <Link
            key={b.name}
            href={b.href}
            className="flex shrink-0 items-center gap-2 border border-neutral-300 px-5 py-3 text-xs font-bold uppercase tracking-wider transition hover:border-[var(--gw-ink)] hover:bg-[var(--gw-ink)] hover:text-white"
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
export function GwFeatures({ title, items }: { title: string; items: { key: string; icon: ReactNode; title: string; text?: string | null }[] }) {
  if (items.length === 0) return null;
  const shown = items.slice(0, 4);
  return (
    <section className="relative z-10 -mt-14 px-4 sm:px-8" aria-label={title}>
      <div className={`mx-auto grid max-w-[1280px] grid-cols-1 gap-y-5 rounded-2xl bg-[#e6f0ee] px-6 py-6 shadow-sm sm:grid-cols-2 lg:divide-x lg:divide-[#cfe3df] ${shown.length >= 4 ? 'lg:grid-cols-4' : shown.length === 3 ? 'lg:grid-cols-3' : ''}`}>
        {shown.map((item) => (
          <div key={item.key} className="flex items-center gap-4 lg:justify-center lg:px-4">
            <span className="[&_svg]:h-[38px] [&_svg]:w-[38px] [&_svg]:stroke-[1.3] [&_svg]:text-[var(--gw-brand)]">{item.icon}</span>
            <span className="min-w-0">
              <span className="block font-display text-lg font-semibold leading-tight">{item.title}</span>
              {item.text && <span className="mt-1 block text-[11px] text-[#14594f]/70">{item.text}</span>}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Customer reviews on the home page: square bordered cards with the stars, the words and the name. */
export function GwReviews({ title, reviews, verifiedLabel }: { title: string; verifiedLabel: string; reviews: { id: string; name: string; rating: number; title?: string | null; content?: string | null; verified?: boolean }[] }) {
  if (reviews.length === 0) return null;
  return (
    <section className="gw-wrap pt-12">
      <div className="mb-5">
        <GwSectionTitle title={title} />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {reviews.slice(0, 6).map((r) => (
          <figure key={r.id} className="rounded-none border border-neutral-200 bg-[#f7f7f7] p-5">
            <GloweriveStars value={r.rating} className="h-3.5 w-3.5" />
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
