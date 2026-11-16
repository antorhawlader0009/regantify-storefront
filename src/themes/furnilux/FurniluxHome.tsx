'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from './icons';
import { FurniluxStars } from './FurniluxCard';

/*
 * Furnilux's home sections (templete/furnilux Hero, Categories, NewArrivals, PromoBanner, Features): drawing only, fed by the
 * store's own data in StorePal's HomeView (skin furnilux) and by sample data on the template demo page.
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

export interface FuHeroSlide {
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
export function FuSectionTitle({ title, sub }: { title: ReactNode; sub?: string | null }) {
  return (
    <div>
      <h2 className="text-2xl font-extrabold tracking-tight text-neutral-900 sm:text-[28px]">{title}</h2>
      {sub && <p className="mt-1 text-sm text-neutral-500">{sub}</p>}
    </div>
  );
}

const linkAll = 'flex shrink-0 items-center gap-1 text-xs font-bold uppercase tracking-wide text-[var(--fu-brand)] transition hover:text-[var(--fu-brand-dark)]';

/**
 * The hero (templete/furnilux Hero.tsx): a warm sand gradient with the picture on the right fading into it, the eyebrow in
 * mocha, a big bold serif title whose last line is mocha, a short text and two buttons (Shop Now with an arrow, a white
 * outline one); it slides every 5.5 seconds, pauses on hover and touch, swipes, and has the template's dot bar. The round badge
 * is drawn only when a real value is passed.
 */
export function FuHero({
  slides,
  shopLabel,
  exploreLabel,
  exploreHref,
  plainImage,
  badge,
}: {
  slides: FuHeroSlide[];
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
      <div className="grid grid-rows-1">
        {slides.map((s, idx) => (
          <div
            key={s.key}
            aria-hidden={idx !== i}
            className={`col-start-1 row-start-1 h-full transition-opacity duration-700 ${idx === i ? 'z-10 opacity-100' : 'pointer-events-none opacity-0'}`}
          >
            <div className="fu-wrap h-full pt-4">
              <div className="relative overflow-hidden rounded-2xl bg-[#f7f5f0]">
                {s.image && (
                  <Picture src={s.image} alt="" plain={plainImage} priority={idx === 0} sizes="(max-width: 1240px) 100vw, 1240px" className="absolute inset-0 h-full w-full object-[70%_center]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-[#f7f5f0] via-[#f7f5f0]/90 to-transparent sm:via-[#f7f5f0]/60 lg:via-transparent" />
                <div className="relative flex min-h-[420px] flex-col justify-center px-6 py-12 sm:min-h-[480px] sm:px-12 lg:min-h-[560px] lg:px-16">
                  {s.eyebrow && <p className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-[var(--fu-brand)]">{s.eyebrow}</p>}
                  <h2 className="max-w-md text-4xl font-extrabold leading-[1.1] text-neutral-900 sm:text-5xl lg:text-[56px]">
                    {s.title.map((line, li) => (
                      <span key={line + li} className="block">
                        {line}
                      </span>
                    ))}
                    {s.accent && <span className="block text-[var(--fu-brand)]">{s.accent}</span>}
                  </h2>
                  {s.text && <p className="mt-5 max-w-xs text-sm text-neutral-600">{s.text}</p>}
                  <div className="mt-8 flex flex-wrap items-center gap-4">
                    <Link href={s.href} className="inline-flex w-fit items-center gap-2 rounded bg-[var(--fu-brand)] px-6 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[var(--fu-brand-dark)]">
                      {shopLabel} <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    {exploreLabel && exploreHref && (
                      <Link href={exploreHref} className="inline-flex items-center rounded border border-neutral-300 bg-white px-6 py-3 text-xs font-bold uppercase tracking-wider text-neutral-900 transition hover:border-[var(--fu-brand)]">
                        {exploreLabel}
                      </Link>
                    )}
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
          className="absolute right-4 top-6 z-20 hidden h-28 w-28 flex-col items-center justify-center rounded-full border-2 border-dashed border-white/80 bg-white/90 p-2 text-center font-display text-sm font-medium leading-tight text-ink transition hover:scale-105 sm:flex lg:right-8 lg:top-10"
        >
          <span className="text-[10px]">{badge.top}</span>
          <span className="text-2xl font-medium leading-none text-[var(--fu-brand)]">{badge.big}</span>
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
 * "Shop by Category" (templete/furnilux Categories.tsx): a bold heading with "View All Categories" on the right and one
 * gradient card per category (a tall rounded picture, the name, the product count when known, an arrow); five on a computer,
 * a sideways row on a phone.
 */
export function FuCategories({
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
    <section id="categories" className="fu-wrap scroll-mt-24 pt-14">
      <div className="flex items-center justify-between gap-4">
        <FuSectionTitle title={title ?? exploreLabel} />
        {viewAllLabel && viewAllHref && (
          <Link href={viewAllHref} className={linkAll}>
            {viewAllLabel} <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      <div className="mt-5 grid gap-5 md:grid-cols-3">
        {items.slice(0, 3).map((c) => (
          <Link key={c.name} href={c.href} className="group overflow-hidden rounded-xl border border-stone-200 bg-white">
            <span className="block aspect-[4/3] overflow-hidden bg-[#f7f5f0]">
              {c.image ? (
                <Picture src={c.image} alt="" plain={plainImage} sizes="(max-width: 768px) 100vw, 400px" className="h-full w-full transition duration-500 group-hover:scale-105" />
              ) : (
                <span className="grid h-full w-full place-items-center text-4xl font-extrabold text-[var(--fu-brand)]">{c.name.slice(0, 1)}</span>
              )}
            </span>
            <span className="block py-5 text-center">
              <span className="block text-sm font-bold uppercase tracking-wide">{c.name}</span>
              <span className="mt-1 block text-sm text-neutral-600">{exploreLabel}</span>
            </span>
          </Link>
        ))}
      </div>
      {items.length > 3 && (
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          {items.slice(3, 6).map((c) => (
            <Link key={c.name} href={c.href} className="group flex items-center gap-5 overflow-hidden rounded-xl border border-stone-200 bg-[#f7f7f5] p-4 hover:border-[var(--fu-brand)]">
              <span className="block h-20 w-24 shrink-0 overflow-hidden rounded-lg">
                {c.image ? (
                  <Picture src={c.image} alt="" plain={plainImage} sizes="96px" className="h-full w-full transition duration-500 group-hover:scale-110" />
                ) : (
                  <span className="grid h-full w-full place-items-center bg-white text-2xl font-extrabold text-[var(--fu-brand)]">{c.name.slice(0, 1)}</span>
                )}
              </span>
              <span className="block text-sm font-bold uppercase tracking-wide">{c.name}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

/** A titled grid of product cards (the template's "New Arrivals": 2 columns, 4 on a computer) with "View All Products" on the right. */
export function FuProductGrid({ title, sub, viewAllLabel, viewAllHref, children, id, extra }: { title: string; sub?: string | null; viewAllLabel?: string; viewAllHref?: string; children: ReactNode[]; id?: string; extra?: ReactNode }) {
  if (children.length === 0) return null;
  return (
    <section id={id} className="fu-wrap scroll-mt-24 pt-12">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <FuSectionTitle title={title} sub={sub} />
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

export interface FuPromo {
  key: string;
  kicker?: string;
  title: string;
  cta: string;
  href: string;
  image?: string | null;
}

const PROMO_BG = ['from-[#2f5016] to-[#3f6b1f]', 'from-[#3f6b1f] to-[#2f5016]', 'from-[#171717] to-[#2f5016]'];

/**
 * The offer banner (templete/furnilux PromoBanner.tsx): a rounded mocha gradient band, a big bold serif title in white, a white
 * button, and a picture on the right that bleeds to the band's edge. A store shows its own campaigns (up to three, one band
 * each), never the template's sample "Up To 30% OFF".
 */
export function FuPromoBanners({ banners, plainImage }: { banners: FuPromo[]; plainImage?: boolean }) {
  if (banners.length === 0) return null;
  return (
    <section id="sale" className="fu-wrap scroll-mt-24 space-y-5 pt-12" aria-label="Offers">
      {banners.slice(0, 3).map((b, i) => (
        <div key={b.key} className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${PROMO_BG[i % PROMO_BG.length]}`}>
          <div className={`relative z-10 grid items-center gap-6 p-6 sm:p-8 md:p-10 ${b.image ? 'md:grid-cols-2' : ''}`}>
            <div className="text-white">
              {b.kicker && <span className="mb-5 inline-block rounded-full bg-white/10 px-3.5 py-1 text-xs uppercase tracking-[0.16em] text-white/80">{b.kicker}</span>}
              <h3 className="whitespace-pre-line font-display text-3xl font-medium sm:text-4xl md:text-5xl">{b.title}</h3>
              <Link href={b.href} className="mt-5 inline-flex items-center gap-2 rounded-md bg-white px-7 py-3 text-xs font-normal uppercase tracking-[0.14em] text-ink transition hover:bg-[var(--fu-sand)]">
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
export function FuBrands({ title, allLabel, allHref, brands, stylesLabel }: { title: string; allLabel?: string; allHref?: string; brands: { name: string; href: string; count?: number }[]; stylesLabel?: (n: number) => string }) {
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
          className="group flex w-44 shrink-0 flex-col items-center justify-center gap-1 border-l border-[var(--fu-brand)]/10 px-4"
        >
          <span className="max-w-full truncate text-sm font-bold uppercase tracking-widest text-neutral-700 transition group-hover:text-[var(--fu-brand)]">{b.name}</span>
          {b.count !== undefined && stylesLabel && <span className="text-[11px] text-neutral-500">{stylesLabel(b.count)}</span>}
        </Link>
      ))}
    </div>
  );
  return (
    <section id="brands" className="fu-wrap scroll-mt-24 pt-12" aria-label={title}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <FuSectionTitle title={title} />
        {allLabel && allHref && (
          <Link href={allHref} className={linkAll}>
            {allLabel} <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      <div className="fu-marquee overflow-hidden rounded-lg bg-[#f4f4f2] py-5 [-webkit-mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)] [mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)]">
        <div className="fu-marquee-track flex w-max">
          {list(false)}
          {list(true)}
        </div>
      </div>
    </section>
  );
}

/**
 * The feature strip (templete/furnilux Features.tsx): one white rounded card with a row of icon blocks (a soft mocha circle,
 * a bold title, a grey line). Only the store's own highlights (Store > Design) are drawn; the template's four sample promises
 * are not shown on a real store.
 */
export function FuFeatures({ title, items }: { title: string; items: { key: string; icon: ReactNode; title: string; text?: string | null }[] }) {
  if (items.length === 0) return null;
  const shown = items.slice(0, 4);
  return (
    <section className="fu-wrap pb-4 pt-12" aria-label={title}>
      <div className={`grid grid-cols-1 gap-5 rounded-lg bg-[#f4f4f2] px-6 py-5 sm:grid-cols-2 ${shown.length >= 4 ? 'lg:grid-cols-4' : shown.length === 3 ? 'lg:grid-cols-3' : ''} lg:divide-x lg:divide-stone-200`}>
        {shown.map((item) => (
          <div key={item.key} className="flex items-center gap-4 lg:px-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-[var(--fu-brand)] [&_svg]:h-[22px] [&_svg]:w-[22px]">{item.icon}</span>
            <div>
              <h3 className="text-sm font-medium">{item.title}</h3>
              {item.text && <p className="text-xs text-neutral-500">{item.text}</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Customer reviews on the home page, in the template's card style: white rounded cards with the name, stars and the words. */
export function FuReviews({ title, reviews, verifiedLabel }: { title: string; verifiedLabel: string; reviews: { id: string; name: string; rating: number; title?: string | null; content?: string | null; verified?: boolean }[] }) {
  if (reviews.length === 0) return null;
  return (
    <section className="fu-wrap pt-12">
      <h2 className="mb-5 font-display text-3xl font-medium text-ink sm:text-4xl">{title}</h2>
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-2xl bg-white p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-sm font-medium">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--fu-soft)] text-xs font-medium text-[var(--fu-brand)]">{r.name.slice(0, 1).toUpperCase()}</span>
                {r.name}
              </span>
              <FurniluxStars value={r.rating} className="h-3.5 w-3.5" />
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
