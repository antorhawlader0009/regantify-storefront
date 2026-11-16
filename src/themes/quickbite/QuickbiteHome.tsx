'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from './icons';
import { QuickbiteStars } from './QuickbiteCard';

/*
 * Quickbite's home sections (templete/quickbite Hero, Categories, NewArrivals, PromoBanner, Features): drawing only, fed by the
 * store's own data in StorePal's HomeView (skin quickbite) and by sample data on the template demo page.
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

export interface QbHeroSlide {
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
export function QbSectionTitle({ title, sub }: { title: ReactNode; sub?: string | null }) {
  return (
    <div>
      <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      {sub && <p className="mt-1 text-sm text-ink/60">{sub}</p>}
    </div>
  );
}

const linkAll = 'inline-flex shrink-0 items-center gap-2 text-sm font-medium text-ink transition hover:text-[var(--qb-brand-dark)]';

/**
 * The hero (templete/quickbite Hero.tsx): a warm sand gradient with the picture on the right fading into it, the eyebrow in
 * mocha, a big bold serif title whose last line is mocha, a short text and two buttons (Shop Now with an arrow, a white
 * outline one); it slides every 5.5 seconds, pauses on hover and touch, swipes, and has the template's dot bar. The round badge
 * is drawn only when a real value is passed.
 */
export function QbHero({
  slides,
  shopLabel,
  exploreLabel,
  exploreHref,
  plainImage,
  badge,
}: {
  slides: QbHeroSlide[];
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
      className="relative isolate overflow-hidden text-ink"
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
            <div className="qb-wrap grid min-h-[480px] items-center gap-10 py-12 md:py-16 lg:min-h-[600px] lg:grid-cols-2 lg:gap-6 lg:py-20">
              <div className="relative z-10">
                {s.eyebrow && <p className="mb-5 text-xs font-medium uppercase tracking-[0.35em] text-ink/80">{s.eyebrow}</p>}
                <h2 className="font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-[4.4rem]">
                  {s.title.map((line, li) => (
                    <span key={line + li} className="block">
                      {line}
                    </span>
                  ))}
                  {s.accent && <span className="block text-[var(--qb-brand-dark)]">{s.accent}</span>}
                </h2>
                {s.text && <p className="mt-6 max-w-sm text-base text-ink/75">{s.text}</p>}
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href={s.href} className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--qb-brand)] px-7 py-3.5 text-sm font-semibold text-[#2A211A] shadow-sm transition hover:bg-[var(--qb-brand-dark)] active:scale-[.98]">
                    {shopLabel} <ArrowRight className="h-4 w-4" />
                  </Link>
                  {exploreLabel && exploreHref && (
                    <Link href={exploreHref} className="qb-glass inline-flex items-center justify-center rounded-full px-7 py-3.5 text-sm font-semibold text-ink transition hover:bg-white/60">
                      {exploreLabel}
                    </Link>
                  )}
                </div>
              </div>
              <div className="relative mx-auto w-full max-w-[560px]">
                <div className="absolute -right-6 -top-10 h-[105%] w-[92%] rounded-[58%_42%_30%_70%/55%_32%_68%_45%] border border-white/50 bg-gradient-to-br from-white/50 to-[#F4A640]/40 backdrop-blur-md" />
                {s.image && (
                  <div className="relative z-[5] aspect-square w-full overflow-hidden rounded-[42%_58%_52%_48%/50%_44%_56%_50%] shadow-[0_30px_60px_-25px_rgba(90,50,10,.55)]">
                    <Picture src={s.image} alt="" plain={plainImage} priority={idx === 0} sizes="(max-width: 1024px) 90vw, 560px" className="absolute inset-0 h-full w-full" />
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
          <span className="text-2xl font-medium leading-none text-[var(--qb-brand)]">{badge.big}</span>
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
              className={`h-2 rounded-full transition-all ${idx === i ? 'w-8 bg-[var(--qb-brand)]' : 'w-2 bg-ink/30'}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// The template gives each category card its own soft gradient; they cycle for a store's own categories.

/**
 * "Shop by Category" (templete/quickbite Categories.tsx): a bold heading with "View All Categories" on the right and one
 * gradient card per category (a tall rounded picture, the name, the product count when known, an arrow); five on a computer,
 * a sideways row on a phone.
 */
export function QbCategories({
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
    <section id="categories" className="qb-wrap scroll-mt-24 pt-12">
      <div className="flex items-center justify-between gap-4">
        <QbSectionTitle title={title ?? exploreLabel} />
        {viewAllLabel && viewAllHref && (
          <Link href={viewAllHref} className={linkAll}>
            {viewAllLabel} <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      <div className="mt-8 grid grid-cols-3 gap-x-3 gap-y-8 sm:grid-cols-6">
        {items.slice(0, 6).map((c) => (
          <Link key={c.name} href={c.href} className="group flex flex-col items-center text-center">
            <span className="mb-3 block h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-[var(--qb-soft)] shadow-sm transition group-hover:-translate-y-1 group-hover:shadow-lg sm:h-28 sm:w-28">
              {c.image ? (
                <Picture src={c.image} alt="" plain={plainImage} sizes="120px" className="h-full w-full" />
              ) : (
                <span className="grid h-full w-full place-items-center font-display text-3xl font-bold text-[var(--qb-brand-dark)]">{c.name.slice(0, 1)}</span>
              )}
            </span>
            <span className="text-sm font-semibold">{c.name}</span>
            <span className="mt-1 flex items-center gap-1 text-[11px] text-ink/60">
              {exploreLabel} <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/** A titled grid of product cards (the template's "New Arrivals": 2 columns, 4 on a computer) with "View All Products" on the right. */
export function QbProductGrid({ title, sub, viewAllLabel, viewAllHref, children, id, extra }: { title: string; sub?: string | null; viewAllLabel?: string; viewAllHref?: string; children: ReactNode[]; id?: string; extra?: ReactNode }) {
  if (children.length === 0) return null;
  return (
    <section id={id} className="qb-wrap scroll-mt-24 pt-12">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <QbSectionTitle title={title} sub={sub} />
          {extra}
        </div>
        {viewAllLabel && viewAllHref && (
          <Link href={viewAllHref} className={linkAll}>
            {viewAllLabel} <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
        {children.map((child, i) => (
          <div key={i} className="min-w-0">
            {child}
          </div>
        ))}
      </div>
    </section>
  );
}

export interface QbPromo {
  key: string;
  kicker?: string;
  title: string;
  cta: string;
  href: string;
  image?: string | null;
}

/**
 * The promo banner (templete/quickbite HealthyBanner.tsx): a big rounded banner with the picture across it and a frosted glass
 * card on the left carrying a small caption pill, a big serif title and an amber button. A store shows its own campaigns (up to
 * two, one under the other), never the template's sample "Healthy Choices Delivered" text.
 */
export function QbPromoBanners({ banners, plainImage }: { banners: QbPromo[]; plainImage?: boolean }) {
  if (banners.length === 0) return null;
  return (
    <section id="sale" className="qb-wrap scroll-mt-24 space-y-5 pt-12" aria-label="Offers">
      {banners.slice(0, 2).map((b) => (
        <div key={b.key} className="relative flex min-h-[320px] items-center overflow-hidden rounded-3xl bg-gradient-to-r from-[#F8E9C8] to-[#F1CD8A] p-4 sm:min-h-[400px] sm:p-10">
          {b.image && <Picture src={b.image} alt="" plain={plainImage} sizes="(max-width: 1280px) 100vw, 1200px" className="absolute inset-0 h-full w-full" />}
          <div className="absolute inset-0 bg-gradient-to-r from-[#F1CD8A]/60 via-transparent to-transparent" />
          <div className="qb-glass relative z-10 w-full max-w-md rounded-3xl p-7 sm:p-9">
            {b.kicker && <span className="mb-4 inline-flex items-center rounded-full border border-white/60 bg-white/40 px-3 py-1 text-xs font-medium">{b.kicker}</span>}
            <h3 className="whitespace-pre-line font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">{b.title}</h3>
            <Link href={b.href} className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-[var(--qb-brand)] px-6 py-3 text-sm font-semibold text-[#2A211A] shadow-sm transition hover:bg-[var(--qb-brand-dark)] active:scale-[.98]">
              {b.cta} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      ))}
    </section>
  );
}

/** The endless brand strip: each brand's name in bold with how many styles it has; hover pauses it. */
export function QbBrands({ title, allLabel, allHref, brands, stylesLabel }: { title: string; allLabel?: string; allHref?: string; brands: { name: string; href: string; count?: number }[]; stylesLabel?: (n: number) => string }) {
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
          className="group flex w-44 shrink-0 flex-col items-center justify-center gap-1 border-l border-[var(--qb-brand)]/10 px-4"
        >
          <span className="max-w-full truncate text-sm font-bold uppercase tracking-widest text-neutral-700 transition group-hover:text-[var(--qb-brand)]">{b.name}</span>
          {b.count !== undefined && stylesLabel && <span className="text-[11px] text-neutral-500">{stylesLabel(b.count)}</span>}
        </Link>
      ))}
    </div>
  );
  return (
    <section id="brands" className="qb-wrap scroll-mt-24 pt-12" aria-label={title}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <QbSectionTitle title={title} />
        {allLabel && allHref && (
          <Link href={allHref} className={linkAll}>
            {allLabel} <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      <div className="qb-marquee overflow-hidden rounded-lg bg-[#FBF5E8] py-5 [-webkit-mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)] [mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)]">
        <div className="qb-marquee-track flex w-max">
          {list(false)}
          {list(true)}
        </div>
      </div>
    </section>
  );
}

/**
 * The feature strip (templete/quickbite Features.tsx): one white rounded card with a row of icon blocks (a soft mocha circle,
 * a bold title, a grey line). Only the store's own highlights (Store > Design) are drawn; the template's four sample promises
 * are not shown on a real store.
 */
export function QbFeatures({ title, items }: { title: string; items: { key: string; icon: ReactNode; title: string; text?: string | null }[] }) {
  if (items.length === 0) return null;
  const shown = items.slice(0, 4);
  return (
    <section className="qb-wrap pb-12 pt-12" aria-label={title}>
      <div className={`grid grid-cols-1 gap-5 qb-glass rounded-2xl px-6 py-6 sm:grid-cols-2 ${shown.length >= 4 ? 'lg:grid-cols-4' : shown.length === 3 ? 'lg:grid-cols-3' : ''}`}>
        {shown.map((item) => (
          <div key={item.key} className="flex items-center gap-4 lg:px-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--qb-soft)] text-ink [&_svg]:h-[26px] [&_svg]:w-[26px]">{item.icon}</span>
            <div>
              <h3 className="text-sm font-semibold">{item.title}</h3>
              {item.text && <p className="mt-0.5 text-xs text-ink/55">{item.text}</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Customer reviews on the home page, in the template's card style: white rounded cards with the name, stars and the words. */
export function QbReviews({ title, reviews, verifiedLabel }: { title: string; verifiedLabel: string; reviews: { id: string; name: string; rating: number; title?: string | null; content?: string | null; verified?: boolean }[] }) {
  if (reviews.length === 0) return null;
  return (
    <section className="qb-wrap pt-12">
      <h2 className="mb-5 font-display text-3xl font-medium text-ink sm:text-4xl">{title}</h2>
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-2xl bg-white p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-sm font-medium">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--qb-soft)] text-xs font-medium text-[var(--qb-brand)]">{r.name.slice(0, 1).toUpperCase()}</span>
                {r.name}
              </span>
              <QuickbiteStars value={r.rating} className="h-3.5 w-3.5" />
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
