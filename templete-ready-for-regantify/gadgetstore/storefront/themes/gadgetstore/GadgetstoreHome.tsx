'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from './icons';
import { GadgetstoreStars } from './GadgetstoreCard';

/*
 * Gadgetstore's home sections (templete/gadgetstore Hero, Categories, NewArrivals, PromoBanner, Features): drawing only, fed by the
 * store's own data in StorePal's HomeView (skin gadgetstore) and by sample data on the template demo page.
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

export interface GsHeroSlide {
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
export function GsSectionTitle({ title, sub }: { title: ReactNode; sub?: string | null }) {
  return (
    <div>
      <h2 className="text-[16px] font-medium uppercase tracking-wide sm:text-[17px]">{title}</h2>
      {sub && <p className="mt-0.5 text-[12px] text-neutral-500">{sub}</p>}
    </div>
  );
}

const linkAll = 'flex shrink-0 items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-ink hover:text-[var(--gs-brand-dark)]';

/**
 * The hero (templete/gadgetstore Hero.tsx): a warm sand gradient with the picture on the right fading into it, the eyebrow in
 * mocha, a big bold serif title whose last line is mocha, a short text and two buttons (Shop Now with an arrow, a white
 * outline one); it slides every 5.5 seconds, pauses on hover and touch, swipes, and has the template's dot bar. The round badge
 * is drawn only when a real value is passed.
 */
export function GsHero({
  slides,
  shopLabel,
  exploreLabel,
  exploreHref,
  plainImage,
  badge,
}: {
  slides: GsHeroSlide[];
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
      className="relative isolate overflow-hidden bg-gradient-to-r from-[#f1f1f1] via-[#f4f4f4] to-[#e4e4e4]"
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
            <div className="gs-wrap relative min-h-[420px] items-center sm:min-h-[480px] lg:flex lg:min-h-[560px]">
              <div className="relative z-10 py-10 lg:w-1/2 lg:py-14">
                {s.eyebrow && <span className="inline-flex items-center text-[11px] font-medium uppercase tracking-wider text-[var(--gs-brand-dark)]">{s.eyebrow}</span>}
                <h2 className="mt-5 text-[34px] font-medium leading-[1.1] tracking-tight sm:text-[52px] lg:text-[58px]">
                  {s.title.map((line, li) => (
                    <span key={line + li} className="block">
                      {line}
                    </span>
                  ))}
                  {s.accent && <span className="block text-[var(--gs-brand)]">{s.accent}</span>}
                </h2>
                {s.text && <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-neutral-700 xl:text-[16px]">{s.text}</p>}
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href={s.href} className="inline-flex items-center gap-2 bg-[var(--gs-brand)] px-7 py-3.5 text-[11px] font-bold uppercase tracking-wider text-ink transition hover:bg-[var(--gs-brand-dark)] sm:px-8">
                    {shopLabel} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  {exploreLabel && exploreHref && (
                    <Link href={exploreHref} className="border border-neutral-800 px-7 py-3.5 text-[11px] font-medium uppercase tracking-wider transition hover:bg-black hover:text-white sm:px-8">
                      {exploreLabel}
                    </Link>
                  )}
                </div>
              </div>
              {s.image && (
                <div className="absolute inset-y-0 right-0 hidden w-[62%] lg:block [mask-image:linear-gradient(to_right,transparent_0%,rgba(0,0,0,0.5)_18%,black_40%)] [-webkit-mask-image:linear-gradient(to_right,transparent_0%,rgba(0,0,0,0.5)_18%,black_40%)]">
                  <Picture src={s.image} alt="" plain={plainImage} priority={idx === 0} sizes="(max-width: 1200px) 60vw, 720px" className="absolute inset-0 h-full w-full mix-blend-multiply" />
                </div>
              )}
              {s.image && (
                <div className="relative -mx-4 h-[260px] sm:-mx-6 lg:hidden">
                  <Picture src={s.image} alt="" plain={plainImage} sizes="100vw" className="absolute inset-0 h-full w-full mix-blend-multiply" />
                </div>
              )}
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
          <span className="text-2xl font-medium leading-none text-[var(--gs-brand)]">{badge.big}</span>
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
              className={`h-2.5 rounded-full transition-all ${idx === i ? 'w-2.5 bg-[var(--gs-brand)]' : 'w-2.5 bg-neutral-300'}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// The template gives each category card its own soft gradient; they cycle for a store's own categories.

export function GsCategories({
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
    <section id="categories" className="gs-wrap scroll-mt-24 pb-4 pt-10 sm:pt-12">
      <h2 className="text-center text-[16px] font-medium uppercase tracking-wide sm:text-[17px]">{title ?? exploreLabel}</h2>
      <div className="no-scrollbar -mx-4 mt-8 flex gap-5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:gap-8 sm:px-0 lg:grid lg:grid-cols-7 lg:gap-6 lg:overflow-visible">
        {items.slice(0, 7).map((c) => (
          <Link key={c.name} href={c.href} className="group flex min-w-[96px] flex-col items-center text-center">
            <span className="relative block h-[96px] w-[96px] overflow-hidden rounded-full bg-[#f1f1f1] transition group-hover:shadow-md sm:h-[112px] sm:w-[112px] lg:h-[118px] lg:w-[118px]">
              {c.image ? (
                <Picture src={c.image} alt="" plain={plainImage} sizes="120px" className="absolute inset-0 h-full w-full mix-blend-multiply" />
              ) : (
                <span className="grid h-full w-full place-items-center text-3xl font-medium text-neutral-400">{c.name.slice(0, 1)}</span>
              )}
            </span>
            <span className="mt-4 line-clamp-2 text-[10.5px] font-medium uppercase tracking-wide sm:text-[11px]">{c.name}</span>
            <span className="mt-1 text-[10px] text-neutral-500 group-hover:text-black">{exploreLabel}</span>
          </Link>
        ))}
      </div>
      {viewAllLabel && viewAllHref && (
        <div className="mt-6 text-center">
          <Link href={viewAllHref} className={linkAll}>
            {viewAllLabel}
          </Link>
        </div>
      )}
    </section>
  );
}

/** A titled grid of product cards (the template's "New Arrivals": 2 columns, 4 on a computer) with "View All Products" on the right. */
export function GsProductGrid({ title, sub, viewAllLabel, viewAllHref, children, id, extra }: { title: string; sub?: string | null; viewAllLabel?: string; viewAllHref?: string; children: ReactNode[]; id?: string; extra?: ReactNode }) {
  if (children.length === 0) return null;
  return (
    <section id={id} className="gs-wrap scroll-mt-24 pt-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <GsSectionTitle title={title} sub={sub} />
          {extra}
        </div>
        {viewAllLabel && viewAllHref && (
          <Link href={viewAllHref} className={linkAll}>
            {viewAllLabel} <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-5">
        {children.map((child, i) => (
          <div key={i} className="min-w-0">
            {child}
          </div>
        ))}
      </div>
    </section>
  );
}

export interface GsPromo {
  key: string;
  kicker?: string;
  title: string;
  cta: string;
  href: string;
  image?: string | null;
}

export function GsPromoBanners({ banners, plainImage }: { banners: GsPromo[]; plainImage?: boolean }) {
  if (banners.length === 0) return null;
  const list = banners.slice(0, 2);
  return (
    <section id="sale" className={`gs-wrap grid scroll-mt-24 gap-4 pb-6 pt-10 md:gap-5 ${list.length > 1 ? 'md:grid-cols-2' : ''}`} aria-label="Offers">
      {list.map((b, i) => {
        const dark = i % 2 === 0;
        return (
          <Link key={b.key} href={b.href} className={`group relative flex min-h-[210px] items-center overflow-hidden p-6 sm:min-h-[220px] sm:p-8 ${dark ? 'bg-[#0b0b0b] text-white hover:text-white' : 'bg-[#e9e9dc] text-ink hover:text-ink'}`}>
            <span className="relative z-10 block max-w-[60%]">
              {b.kicker && <span className="block text-[11px] uppercase tracking-wider">{b.kicker}</span>}
              <span className="mt-3 block whitespace-pre-line text-[26px] font-medium uppercase leading-tight tracking-tight sm:mt-4 sm:text-[34px]">{b.title}</span>
              <span className="mt-5 inline-block bg-[var(--gs-brand)] px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-black transition group-hover:bg-[var(--gs-brand-dark)]">{b.cta}</span>
            </span>
            {b.image && (
              <span className={`absolute inset-y-0 right-0 block w-[52%] [mask-image:linear-gradient(to_right,transparent,black_40%)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_40%)] ${dark ? 'opacity-90 mix-blend-lighten' : 'mix-blend-multiply'}`}>
                <Picture src={b.image} alt="" plain={plainImage} sizes="(max-width: 768px) 50vw, 520px" className="absolute inset-0 h-full w-full" />
              </span>
            )}
          </Link>
        );
      })}
    </section>
  );
}

/** The endless brand strip: each brand's name in bold with how many styles it has; hover pauses it. */
export function GsBrands({ title, allLabel, allHref, brands, stylesLabel }: { title: string; allLabel?: string; allHref?: string; brands: { name: string; href: string; count?: number }[]; stylesLabel?: (n: number) => string }) {
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
          className="group flex w-44 shrink-0 flex-col items-center justify-center gap-1 border-l border-[var(--gs-brand)]/10 px-4"
        >
          <span className="max-w-full truncate font-display text-xl font-medium tracking-tight text-ink transition group-hover:text-[var(--gs-brand)]">{b.name}</span>
          {b.count !== undefined && stylesLabel && <span className="text-[11px] text-neutral-500">{stylesLabel(b.count)}</span>}
        </Link>
      ))}
    </div>
  );
  return (
    <section id="brands" className="gs-wrap scroll-mt-24 pt-12" aria-label={title}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <GsSectionTitle title={title} />
        {allLabel && allHref && (
          <Link href={allHref} className={linkAll}>
            {allLabel} <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      <div className="gs-marquee overflow-hidden rounded-3xl bg-white py-5 shadow-[var(--shadow-card)] [-webkit-mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)] [mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)]">
        <div className="gs-marquee-track flex w-max">
          {list(false)}
          {list(true)}
        </div>
      </div>
    </section>
  );
}

export function GsFeatures({ title, items }: { title: string; items: { key: string; icon: ReactNode; title: string; text?: string | null }[] }) {
  if (items.length === 0) return null;
  const shown = items.slice(0, 5);
  return (
    <section className="border-b border-neutral-100 bg-white" aria-label={title}>
      <div className={`gs-wrap grid grid-cols-2 gap-y-6 py-6 md:grid-cols-3 lg:divide-x lg:divide-neutral-200 ${shown.length >= 5 ? 'lg:grid-cols-5' : shown.length === 4 ? 'lg:grid-cols-4' : shown.length === 3 ? 'lg:grid-cols-3' : ''}`}>
        {shown.map((item) => (
          <div key={item.key} className="flex items-center gap-3 lg:justify-center lg:px-4">
            <span className="shrink-0 [&_svg]:h-7 [&_svg]:w-7 [&_svg]:stroke-[1.3]">{item.icon}</span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide">{item.title}</p>
              {item.text && <p className="text-[10px] text-neutral-600">{item.text}</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Customer reviews on the home page, in the template's card style: white rounded cards with the name, stars and the words. */
export function GsReviews({ title, reviews, verifiedLabel }: { title: string; verifiedLabel: string; reviews: { id: string; name: string; rating: number; title?: string | null; content?: string | null; verified?: boolean }[] }) {
  if (reviews.length === 0) return null;
  return (
    <section className="gs-wrap pt-12">
      <h2 className="mb-5 font-display text-3xl font-medium text-ink sm:text-4xl">{title}</h2>
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-2xl bg-white p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-sm font-medium">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--gs-soft)] text-xs font-medium text-[var(--gs-brand)]">{r.name.slice(0, 1).toUpperCase()}</span>
                {r.name}
              </span>
              <GadgetstoreStars value={r.rating} className="h-3.5 w-3.5" />
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
