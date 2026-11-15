'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from './icons';
import { NovatrendStars } from './NovatrendCard';

/*
 * Novatrend's home sections (templete/novatrend Hero, Categories, NewArrivals, PromoBanner, Features): drawing only, fed by the
 * store's own data in StorePal's HomeView (skin novatrend) and by sample data on the template demo page.
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

export interface NtHeroSlide {
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
export function NtSectionTitle({ title, sub }: { title: ReactNode; sub?: string | null }) {
  return (
    <div>
      <h2 className="text-base font-bold sm:text-lg">{title}</h2>
      {sub && <p className="mt-1 text-sm text-neutral-500">{sub}</p>}
    </div>
  );
}

const linkAll = 'inline-flex shrink-0 items-center gap-1.5 text-xs text-neutral-600 transition hover:text-[var(--nt-brand)]';

/**
 * The hero (templete/novatrend Hero.tsx): a warm sand gradient with the picture on the right fading into it, the eyebrow in
 * mocha, a big bold serif title whose last line is mocha, a short text and two buttons (Shop Now with an arrow, a white
 * outline one); it slides every 5.5 seconds, pauses on hover and touch, swipes, and has the template's dot bar. The round badge
 * is drawn only when a real value is passed.
 */
export function NtHero({
  slides,
  shopLabel,
  exploreLabel,
  exploreHref,
  plainImage,
  badge,
}: {
  slides: NtHeroSlide[];
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
      className="relative isolate overflow-hidden bg-[#0b0b0b] text-white"
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
            <div className="relative h-full min-h-[460px] lg:min-h-[560px]">
              {s.image && (
                <div className="absolute inset-y-0 right-0 w-full lg:w-[72%]">
                  <Picture src={s.image} alt="" plain={plainImage} priority={idx === 0} sizes="(max-width: 1024px) 100vw, 900px" className="absolute inset-0 h-full w-full" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/55 lg:bg-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0b0b0b] via-[#0b0b0b]/80 to-transparent lg:via-[#0b0b0b]/65" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0b]/70 via-transparent to-transparent" />
              <div className="pointer-events-none absolute -bottom-32 -right-24 h-[460px] w-[460px] rounded-full bg-[var(--nt-brand)]/40 blur-[120px]" />
              <div className="nt-wrap relative flex h-full min-h-[460px] items-center py-8 lg:min-h-[560px]">
                <div className="max-w-xl">
                  {s.eyebrow && <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--nt-brand)]">{s.eyebrow}</p>}
                  <h2 className="mt-4 text-4xl font-extrabold leading-[1.08] tracking-tight !text-white sm:text-5xl lg:text-[64px]">
                    {s.title.map((line, li) => (
                      <span key={line + li} className="block">
                        {line}
                      </span>
                    ))}
                    {s.accent && <span className="block text-[var(--nt-brand)]">{s.accent}</span>}
                  </h2>
                  {s.text && <p className="mt-5 max-w-sm text-sm leading-relaxed text-neutral-300 sm:text-base">{s.text}</p>}
                  <div className="mt-8 flex flex-wrap gap-3">
                    <Link href={s.href} className="inline-flex items-center justify-center gap-2 rounded-md bg-[var(--nt-brand)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--nt-brand-dark)]">
                      {shopLabel} <ArrowRight className="h-4 w-4" />
                    </Link>
                    {exploreLabel && exploreHref && (
                      <Link href={exploreHref} className="inline-flex items-center justify-center gap-2 rounded-md border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white hover:text-ink">
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
          <span className="text-2xl font-medium leading-none text-[var(--nt-brand)]">{badge.big}</span>
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
 * "Shop by Category" (templete/novatrend Categories.tsx): a bold heading with "View All Categories" on the right and one
 * gradient card per category (a tall rounded picture, the name, the product count when known, an arrow); five on a computer,
 * a sideways row on a phone.
 */
export function NtCategories({
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
    <section id="categories" className="nt-wrap scroll-mt-24 pt-14">
      <div className="flex items-center justify-between gap-4">
        <NtSectionTitle title={title ?? exploreLabel} />
        {viewAllLabel && viewAllHref && (
          <Link href={viewAllHref} className={linkAll}>
            {viewAllLabel} <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:gap-4">
        {items.slice(0, 6).map((c) => (
          <Link key={c.name} href={c.href} className="group overflow-hidden rounded-2xl border border-neutral-100 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-[var(--shadow-card)]">
            <span className="block aspect-[4/4.2] overflow-hidden bg-neutral-100">
              {c.image ? (
                <Picture src={c.image} alt="" plain={plainImage} sizes="(max-width: 640px) 50vw, 200px" className="h-full w-full transition duration-500 group-hover:scale-105" />
              ) : (
                <span className="grid h-full w-full place-items-center text-3xl font-extrabold text-[var(--nt-brand)]">{c.name.slice(0, 1)}</span>
              )}
            </span>
            <span className="flex items-center justify-between px-3 py-3">
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-semibold">{c.name}</span>
                <span className="block text-[10px] text-neutral-500">{exploreLabel}</span>
              </span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 transition group-hover:translate-x-1 group-hover:text-[var(--nt-brand)]" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/** A titled grid of product cards (the template's "New Arrivals": 2 columns, 4 on a computer) with "View All Products" on the right. */
export function NtProductGrid({ title, sub, viewAllLabel, viewAllHref, children, id, extra }: { title: string; sub?: string | null; viewAllLabel?: string; viewAllHref?: string; children: ReactNode[]; id?: string; extra?: ReactNode }) {
  if (children.length === 0) return null;
  return (
    <section id={id} className="nt-wrap scroll-mt-24 pt-12">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <NtSectionTitle title={title} sub={sub} />
          {extra}
        </div>
        {viewAllLabel && viewAllHref && (
          <Link href={viewAllHref} className={linkAll}>
            {viewAllLabel} <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
        {children.map((child, i) => (
          <div key={i} className="min-w-0">
            {child}
          </div>
        ))}
      </div>
    </section>
  );
}

export interface NtPromo {
  key: string;
  kicker?: string;
  title: string;
  cta: string;
  href: string;
  image?: string | null;
}

const PROMO_BG = ['from-[#ff5a2a] to-[#ff8a5c]', 'from-black to-black', 'from-[#ff5a2a] to-[#ff8a5c]'];

/**
 * The promo tiles (templete/novatrend Promos.tsx): two rounded banners side by side, an orange gradient one and a black one, a
 * small caption, a big extra-bold title and a white button on the left, the picture masked in on the right. A store shows its own
 * campaigns (up to three), never the template's sample "Up To 70% Off" and countdown.
 */
export function NtPromoBanners({ banners, plainImage }: { banners: NtPromo[]; plainImage?: boolean }) {
  if (banners.length === 0) return null;
  const list = banners.slice(0, 3);
  return (
    <section id="sale" className={`nt-wrap grid scroll-mt-24 gap-4 pt-10 md:grid-cols-2 ${list.length >= 3 ? 'lg:grid-cols-3' : ''}`} aria-label="Offers">
      {list.map((b, i) => (
        <Link key={b.key} href={b.href} className={`group relative flex min-h-[230px] overflow-hidden rounded-2xl bg-gradient-to-br p-6 text-white hover:text-white sm:min-h-[250px] sm:p-8 ${PROMO_BG[i % PROMO_BG.length]}`}>
          <span className="relative z-10 block max-w-[55%]">
            {b.kicker && <span className="block text-xs font-medium">{b.kicker}</span>}
            <span className="mt-1 block whitespace-pre-line text-2xl font-extrabold leading-tight sm:text-3xl">{b.title}</span>
            <span className="mt-5 inline-block rounded bg-white px-4 py-2 text-[11px] font-semibold text-black transition group-hover:bg-black group-hover:text-white">{b.cta}</span>
          </span>
          {b.image && (
            <span className="absolute inset-y-0 right-0 block h-full w-[52%] [mask-image:linear-gradient(to_right,transparent,black_35%)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_35%)]">
              <Picture src={b.image} alt="" plain={plainImage} sizes="400px" className="absolute inset-0 h-full w-full transition duration-500 group-hover:scale-105" />
            </span>
          )}
        </Link>
      ))}
    </section>
  );
}

/** The endless brand strip: each brand's name in bold with how many styles it has; hover pauses it. */
export function NtBrands({ title, allLabel, allHref, brands, stylesLabel }: { title: string; allLabel?: string; allHref?: string; brands: { name: string; href: string; count?: number }[]; stylesLabel?: (n: number) => string }) {
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
          className="group flex w-44 shrink-0 flex-col items-center justify-center gap-1 border-l border-[var(--nt-brand)]/10 px-4"
        >
          <span className="max-w-full truncate text-sm font-bold uppercase tracking-widest text-neutral-700 transition group-hover:text-[var(--nt-brand)]">{b.name}</span>
          {b.count !== undefined && stylesLabel && <span className="text-[11px] text-neutral-500">{stylesLabel(b.count)}</span>}
        </Link>
      ))}
    </div>
  );
  return (
    <section id="brands" className="nt-wrap scroll-mt-24 pt-12" aria-label={title}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <NtSectionTitle title={title} />
        {allLabel && allHref && (
          <Link href={allHref} className={linkAll}>
            {allLabel} <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      <div className="nt-marquee overflow-hidden rounded-lg bg-[#f6f6f6] py-5 [-webkit-mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)] [mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)]">
        <div className="nt-marquee-track flex w-max">
          {list(false)}
          {list(true)}
        </div>
      </div>
    </section>
  );
}

/**
 * The feature strip (templete/novatrend Features.tsx): one white rounded card with a row of icon blocks (a soft mocha circle,
 * a bold title, a grey line). Only the store's own highlights (Store > Design) are drawn; the template's four sample promises
 * are not shown on a real store.
 */
export function NtFeatures({ title, items }: { title: string; items: { key: string; icon: ReactNode; title: string; text?: string | null }[] }) {
  if (items.length === 0) return null;
  const shown = items.slice(0, 4);
  return (
    <section className="nt-wrap pb-4 pt-12" aria-label={title}>
      <div className={`grid grid-cols-1 gap-5 rounded-lg bg-[#f6f6f6] px-6 py-5 sm:grid-cols-2 ${shown.length >= 4 ? 'lg:grid-cols-4' : shown.length === 3 ? 'lg:grid-cols-3' : ''} lg:divide-x lg:divide-stone-200`}>
        {shown.map((item) => (
          <div key={item.key} className="flex items-center gap-4 lg:px-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-[var(--nt-brand)] [&_svg]:h-[22px] [&_svg]:w-[22px]">{item.icon}</span>
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
export function NtReviews({ title, reviews, verifiedLabel }: { title: string; verifiedLabel: string; reviews: { id: string; name: string; rating: number; title?: string | null; content?: string | null; verified?: boolean }[] }) {
  if (reviews.length === 0) return null;
  return (
    <section className="nt-wrap pt-12">
      <h2 className="mb-5 font-display text-3xl font-medium text-ink sm:text-4xl">{title}</h2>
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-2xl bg-white p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-sm font-medium">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--nt-soft)] text-xs font-medium text-[var(--nt-brand)]">{r.name.slice(0, 1).toUpperCase()}</span>
                {r.name}
              </span>
              <NovatrendStars value={r.rating} className="h-3.5 w-3.5" />
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
