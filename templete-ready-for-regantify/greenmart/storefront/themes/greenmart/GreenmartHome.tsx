'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from './icons';
import { GreenmartStars } from './GreenmartCard';

/*
 * Greenmart's home sections (templete/greenmart Hero, Categories, NewArrivals, PromoBanner, Features): drawing only, fed by the
 * store's own data in StorePal's HomeView (skin greenmart) and by sample data on the template demo page.
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

export interface GmHeroSlide {
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
export function GmSectionTitle({ title, sub }: { title: ReactNode; sub?: string | null }) {
  return (
    <div>
      <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
      {sub && <p className="mt-1 text-sm text-neutral-500">{sub}</p>}
    </div>
  );
}

const linkAll = 'inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-[var(--gm-brand)] hover:underline';

/**
 * The hero (templete/greenmart Hero.tsx): a warm sand gradient with the picture on the right fading into it, the eyebrow in
 * mocha, a big bold serif title whose last line is mocha, a short text and two buttons (Shop Now with an arrow, a white
 * outline one); it slides every 5.5 seconds, pauses on hover and touch, swipes, and has the template's dot bar. The round badge
 * is drawn only when a real value is passed.
 */
export function GmHero({
  slides,
  shopLabel,
  exploreLabel,
  exploreHref,
  plainImage,
  badge,
}: {
  slides: GmHeroSlide[];
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
      className="relative isolate overflow-hidden bg-gradient-to-br from-[#e9f0dc] via-[#f1f5e8] to-[#eaf0df] text-ink"
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
            <div className="relative min-h-[420px] md:min-h-[540px] lg:min-h-[580px]">
              {s.image && (
                <div className="absolute inset-x-0 top-0 h-60 sm:h-80 md:inset-y-0 md:left-auto md:right-0 md:h-auto md:w-[60%]">
                  <Picture src={s.image} alt="" plain={plainImage} priority={idx === 0} sizes="(min-width: 768px) 60vw, 100vw" className="absolute inset-0 h-full w-full" />
                  <div className="absolute inset-y-0 left-0 hidden w-2/5 bg-gradient-to-r from-[#eef3e3] via-[#eef3e3]/70 to-transparent md:block" />
                  <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#eaf0df] to-transparent md:hidden" />
                </div>
              )}
              <div className="gm-wrap relative z-10 flex min-h-[420px] flex-col justify-end pb-16 pt-64 sm:pt-80 md:min-h-[540px] md:w-1/2 md:justify-center md:pb-24 md:pt-14 lg:min-h-[580px]">
                {s.eyebrow && <span className="w-fit rounded-full bg-[var(--gm-brand-dark)] px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white">{s.eyebrow}</span>}
                <h2 className="mt-5 text-[40px] font-extrabold leading-[1.06] tracking-tight !text-[#1d2a1f] sm:text-5xl lg:text-[56px] xl:text-[68px]">
                  {s.title.map((line, li) => (
                    <span key={line + li} className="block">
                      {line}
                    </span>
                  ))}
                  {s.accent && <span className="block text-[var(--gm-brand)]">{s.accent}</span>}
                </h2>
                {s.text && <p className="mt-5 max-w-md text-base leading-relaxed text-ink/80 sm:text-lg">{s.text}</p>}
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link href={s.href} className="inline-flex items-center gap-2 rounded-xl bg-[var(--gm-brand)] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_4px_18px_-6px_rgba(30,60,30,0.14)] transition hover:bg-[var(--gm-brand-dark)]">
                    {shopLabel} <ArrowRight className="h-4 w-4" />
                  </Link>
                  {exploreLabel && exploreHref && (
                    <Link href={exploreHref} className="inline-flex items-center rounded-xl border border-[var(--gm-brand)] bg-white/70 px-6 py-3.5 text-sm font-semibold text-[var(--gm-brand)] transition hover:bg-white">
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
          className="absolute right-4 top-0 z-20 hidden w-[110px] flex-col items-center rounded-b-lg bg-[var(--gm-brand)] px-3 pb-3 pt-4 text-center font-display text-white shadow-[var(--shadow-card-hover)] sm:flex"
        >
          <span className="text-[10px]">{badge.top}</span>
          <span className="text-[30px] font-bold leading-none text-[#cddfb2]">{badge.big}</span>
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
              className={`h-1.5 rounded-full transition-all ${idx === i ? 'w-6 bg-[var(--gm-brand)]' : 'w-1.5 bg-[var(--gm-brand)]/30'}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// The template gives each category card its own soft gradient; they cycle for a store's own categories.

export function GmCategories({
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
    <section id="categories" className="gm-wrap relative z-10 -mt-6 scroll-mt-24 md:-mt-10">
      <div className="rounded-2xl bg-white p-5 shadow-[var(--shadow-card)] ring-1 ring-black/5 sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <GmSectionTitle title={title ?? exploreLabel} />
          {viewAllLabel && viewAllHref && (
            <Link href={viewAllHref} className={linkAll}>
              {viewAllLabel}
            </Link>
          )}
        </div>
        <ul className="grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-6">
          {items.slice(0, 6).map((c) => (
            <li key={c.name}>
              <Link href={c.href} className="group flex flex-col items-center gap-3">
                <span className="relative block aspect-square w-full max-w-[120px] overflow-hidden rounded-full bg-[var(--gm-soft)] ring-1 ring-[#e4edd3] transition group-hover:ring-2 group-hover:ring-[var(--gm-brand)]">
                  {c.image ? (
                    <Picture src={c.image} alt="" plain={plainImage} sizes="140px" className="absolute inset-0 h-full w-full transition-transform duration-500 group-hover:scale-110" />
                  ) : (
                    <span className="grid h-full w-full place-items-center text-3xl font-extrabold text-[var(--gm-brand)]">{c.name.slice(0, 1)}</span>
                  )}
                </span>
                <span className="text-center text-sm font-medium">{c.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function GmProductGrid({ title, sub, viewAllLabel, viewAllHref, children, id, extra }: { title: string; sub?: string | null; viewAllLabel?: string; viewAllHref?: string; children: ReactNode[]; id?: string; extra?: ReactNode }) {
  if (children.length === 0) return null;
  return (
    <section id={id} className="gm-wrap scroll-mt-24 pt-10">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <GmSectionTitle title={title} sub={sub} />
          {extra}
        </div>
        {viewAllLabel && viewAllHref && (
          <Link href={viewAllHref} className={linkAll}>
            {viewAllLabel}
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
        {children.map((child, i) => (
          <div key={i} className="min-w-0">
            {child}
          </div>
        ))}
      </div>
    </section>
  );
}

export interface GmPromo {
  key: string;
  kicker?: string;
  title: string;
  cta: string;
  href: string;
  image?: string | null;
}

const PROMO_BG = ['from-[#dfe6c3] to-[#c9d4a7]', 'from-[#f4e3cc] to-[#ecd2b0]', 'from-[#d9e8f5] to-[#bcd5ea]'];

export function GmPromoBanners({ banners, plainImage }: { banners: GmPromo[]; plainImage?: boolean }) {
  if (banners.length === 0) return null;
  const list = banners.slice(0, 2);
  return (
    <section id="sale" className={`gm-wrap grid scroll-mt-24 gap-4 pt-10 ${list.length > 1 ? 'lg:grid-cols-2' : ''}`} aria-label="Offers">
      {list.map((b) => (
        <Link key={b.key} href={b.href} className="group relative flex min-h-[200px] items-center overflow-hidden rounded-2xl bg-[var(--gm-soft)] p-5 text-ink hover:text-ink sm:p-6">
          <span className="relative z-10 block max-w-[55%]">
            {b.kicker && <span className="block text-xs font-semibold uppercase tracking-wide text-[var(--gm-brand-dark)]">{b.kicker}</span>}
            <span className="mt-1 block whitespace-pre-line text-3xl font-extrabold leading-tight tracking-tight text-[var(--gm-brand-dark)] lg:text-[36px]">{b.title}</span>
            <span className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--gm-brand)] px-5 py-3 text-sm font-semibold text-white shadow-[0_4px_18px_-6px_rgba(30,60,30,0.14)] transition group-hover:bg-[var(--gm-brand-dark)]">
              {b.cta} <ArrowRight className="h-4 w-4" />
            </span>
          </span>
          {b.image && (
            <span className="absolute inset-y-0 right-0 block w-[48%] [mask-image:linear-gradient(to_right,transparent,black_30%)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_30%)]">
              <Picture src={b.image} alt="" plain={plainImage} sizes="(max-width: 768px) 50vw, 400px" className="absolute inset-0 h-full w-full transition duration-500 group-hover:scale-105" />
            </span>
          )}
        </Link>
      ))}
    </section>
  );
}

/** The endless brand strip: each brand's name in bold with how many styles it has; hover pauses it. */
export function GmBrands({ title, allLabel, allHref, brands, stylesLabel }: { title: string; allLabel?: string; allHref?: string; brands: { name: string; href: string; count?: number }[]; stylesLabel?: (n: number) => string }) {
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
          className="group flex w-44 shrink-0 flex-col items-center justify-center gap-1 border-l border-[var(--gm-brand)]/10 px-4"
        >
          <span className="max-w-full truncate text-sm font-bold uppercase tracking-widest text-neutral-700 transition group-hover:text-[var(--gm-brand)]">{b.name}</span>
          {b.count !== undefined && stylesLabel && <span className="text-[11px] text-neutral-500">{stylesLabel(b.count)}</span>}
        </Link>
      ))}
    </div>
  );
  return (
    <section id="brands" className="gm-wrap scroll-mt-24 pt-12" aria-label={title}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <GmSectionTitle title={title} />
        {allLabel && allHref && (
          <Link href={allHref} className={linkAll}>
            {allLabel} <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      <div className="gm-marquee overflow-hidden rounded-lg bg-[#f1f6e8] py-5 [-webkit-mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)] [mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)]">
        <div className="gm-marquee-track flex w-max">
          {list(false)}
          {list(true)}
        </div>
      </div>
    </section>
  );
}

export function GmFeatures({ title, items }: { title: string; items: { key: string; icon: ReactNode; title: string; text?: string | null }[] }) {
  if (items.length === 0) return null;
  const shown = items.slice(0, 4);
  return (
    <section className="gm-wrap pb-10 pt-10" aria-label={title}>
      <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
      <ul className={`mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:gap-0 lg:divide-x lg:divide-black/10 ${shown.length >= 4 ? 'lg:grid-cols-4' : shown.length === 3 ? 'lg:grid-cols-3' : ''}`}>
        {shown.map((item) => (
          <li key={item.key} className="flex items-center gap-3 lg:px-6 lg:first:pl-0 lg:last:pr-0">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--gm-soft)] text-[var(--gm-brand)] ring-1 ring-[#e4edd3] [&_svg]:h-6 [&_svg]:w-6">{item.icon}</span>
            <span className="leading-snug">
              <span className="block text-sm font-semibold">{item.title}</span>
              {item.text && <span className="mt-0.5 block text-xs text-ink/65">{item.text}</span>}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Customer reviews on the home page, in the template's card style: white rounded cards with the name, stars and the words. */
export function GmReviews({ title, reviews, verifiedLabel }: { title: string; verifiedLabel: string; reviews: { id: string; name: string; rating: number; title?: string | null; content?: string | null; verified?: boolean }[] }) {
  if (reviews.length === 0) return null;
  return (
    <section className="gm-wrap pt-12">
      <h2 className="mb-5 font-display text-3xl font-medium text-ink sm:text-4xl">{title}</h2>
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-2xl bg-white p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-sm font-medium">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--gm-soft)] text-xs font-medium text-[var(--gm-brand)]">{r.name.slice(0, 1).toUpperCase()}</span>
                {r.name}
              </span>
              <GreenmartStars value={r.rating} className="h-3.5 w-3.5" />
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
