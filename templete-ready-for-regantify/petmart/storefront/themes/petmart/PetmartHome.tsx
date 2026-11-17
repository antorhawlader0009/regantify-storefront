'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from './icons';
import { PetmartStars } from './PetmartCard';

/*
 * Petmart's home sections (templete/petmart Hero, Categories, NewArrivals, PromoBanner, Features): drawing only, fed by the
 * store's own data in StorePal's HomeView (skin petmart) and by sample data on the template demo page.
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

export interface PkHeroSlide {
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
export function PkSectionTitle({ title, sub }: { title: ReactNode; sub?: string | null }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      {sub && <p className="mt-1 text-sm text-neutral-500">{sub}</p>}
    </div>
  );
}

const linkAll = 'inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-slate-800 transition hover:text-[var(--pk-brand)]';

/**
 * The hero (templete/petmart Hero.tsx): a warm sand gradient with the picture on the right fading into it, the eyebrow in
 * mocha, a big bold serif title whose last line is mocha, a short text and two buttons (Shop Now with an arrow, a white
 * outline one); it slides every 5.5 seconds, pauses on hover and touch, swipes, and has the template's dot bar. The round badge
 * is drawn only when a real value is passed.
 */
export function PkHero({
  slides,
  shopLabel,
  exploreLabel,
  exploreHref,
  plainImage,
  badge,
}: {
  slides: PkHeroSlide[];
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
    <div className="pk-wrap pt-4">
    <section
      data-rg="hero"
      className="relative isolate overflow-hidden rounded-3xl bg-[#fff3ea] text-[#163a2f]"
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
            <div className="relative min-h-[380px] md:min-h-[440px]">
              {s.image && (
                <div className="absolute inset-y-0 right-0 w-full md:w-[60%]">
                  <Picture src={s.image} alt="" plain={plainImage} priority={idx === 0} sizes="(max-width: 768px) 100vw, 720px" className="absolute inset-0 h-full w-full" />
                </div>
              )}
              <div className="absolute inset-0 bg-[#fff3e6]/75 md:bg-transparent" />
              <div className="absolute inset-0 hidden bg-gradient-to-r from-[#fff3e6] from-30% via-[#fff3e6]/80 to-transparent md:block" />
              <div className="relative z-10 flex min-h-[380px] flex-col justify-center px-6 py-10 sm:px-10 md:min-h-[440px] md:w-1/2 md:px-12">
                {s.eyebrow && <span className="mb-3 inline-flex w-fit items-center text-xs font-semibold uppercase tracking-[0.3em] text-slate-700">{s.eyebrow}</span>}
                <h2 className="max-w-[460px] font-display text-4xl font-extrabold leading-[1.05] !text-[#163a2f] sm:text-5xl lg:text-[56px]">
                  {s.title.map((line, li) => (
                    <span key={line + li} className="block">
                      {line}
                    </span>
                  ))}
                  {s.accent && <span className="block text-[var(--pk-brand)]">{s.accent}</span>}
                </h2>
                {s.text && <p className="mt-5 max-w-[340px] text-[14px] leading-relaxed text-ink/80">{s.text}</p>}
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href={s.href} className="inline-flex h-12 items-center gap-2 rounded-full bg-[var(--pk-brand)] px-7 text-sm font-semibold text-white shadow-lg shadow-[#c74d1e]/30 transition hover:bg-[var(--pk-brand-dark)]">
                    {shopLabel} <ArrowRight className="h-4 w-4" />
                  </Link>
                  {exploreLabel && exploreHref && (
                    <Link href={exploreHref} className="inline-flex h-12 items-center rounded-full border border-[#1d4a3c]/30 bg-white/70 px-6 text-sm font-semibold text-[#1d4a3c] transition hover:bg-white">
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
          className="absolute right-4 top-0 z-20 hidden w-[110px] flex-col items-center rounded-b-lg bg-[var(--pk-brand)] px-3 pb-3 pt-4 text-center font-display text-white shadow-[var(--shadow-card-hover)] sm:flex"
        >
          <span className="text-[10px]">{badge.top}</span>
          <span className="text-[30px] font-bold leading-none text-[#fdddc9]">{badge.big}</span>
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
              className={`h-1.5 rounded-full transition-all ${idx === i ? 'w-4 bg-[#1d4a3c]' : 'w-1.5 bg-[#1d4a3c]/30'}`}
            />
          ))}
        </div>
      )}
    </section>
    </div>
  );
}

// The template gives each category card its own soft gradient; they cycle for a store's own categories.

/**
 * "Shop by Category" (templete/petmart Categories.tsx): a bold heading with "View All Categories" on the right and one
 * gradient card per category (a tall rounded picture, the name, the product count when known, an arrow); five on a computer,
 * a sideways row on a phone.
 */
export function PkCategories({
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
  const TINTS = ['#e9f1d8', '#fbe9e3', '#fdf1d4', '#e3eef7', '#efe6f3', '#e6f2ee', '#f6ead8', '#ececec'];
  return (
    <section id="categories" aria-label={title ?? exploreLabel} className="pk-wrap scroll-mt-24 pt-5">
      <div className="rounded-2xl bg-slate-50 px-3 py-5">
        <ul className="no-scrollbar flex gap-5 overflow-x-auto sm:gap-6 lg:justify-between">
          {items.slice(0, 8).map((c, k) => (
            <li key={c.name} className="shrink-0">
              <Link href={c.href} className="group flex w-[74px] flex-col items-center gap-2 sm:w-[84px]">
                <span className="flex h-[66px] w-[66px] items-center justify-center overflow-hidden rounded-full border-4 border-white shadow-[var(--shadow-card)] ring-1 ring-black/5 transition group-hover:-translate-y-1 group-hover:shadow-[var(--shadow-card-hover)] sm:h-[72px] sm:w-[72px]" style={{ background: TINTS[k % TINTS.length] }}>
                  {c.image ? (
                    <Picture src={c.image} alt="" plain={plainImage} sizes="80px" className="h-full w-full" />
                  ) : (
                    <span className="font-display text-2xl font-semibold text-[var(--pk-brand)]">{c.name.slice(0, 1)}</span>
                  )}
                </span>
                <span className="line-clamp-2 text-center text-[11px] font-medium">{c.name}</span>
              </Link>
            </li>
          ))}
          {viewAllLabel && viewAllHref && (
            <li className="shrink-0">
              <Link href={viewAllHref} className="group flex w-[74px] flex-col items-center gap-2 sm:w-[84px]">
                <span className="flex h-[66px] w-[66px] items-center justify-center rounded-full border-4 border-white bg-white shadow-[var(--shadow-card)] ring-1 ring-black/5 transition group-hover:-translate-y-1 sm:h-[72px] sm:w-[72px]">
                  <ArrowRight className="h-6 w-6 text-[var(--pk-brand)]" />
                </span>
                <span className="text-center text-[11px] font-medium">{viewAllLabel}</span>
              </Link>
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}

export function PkProductGrid({ title, sub, viewAllLabel, viewAllHref, children, id, extra }: { title: string; sub?: string | null; viewAllLabel?: string; viewAllHref?: string; children: ReactNode[]; id?: string; extra?: ReactNode }) {
  if (children.length === 0) return null;
  return (
    <section id={id} className="pk-wrap scroll-mt-24 pt-9">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <PkSectionTitle title={title} sub={sub} />
          {extra}
        </div>
        {viewAllLabel && viewAllHref && (
          <Link href={viewAllHref} className={linkAll}>
            {viewAllLabel} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {children.map((child, i) => (
          <div key={i} className="min-w-0">
            {child}
          </div>
        ))}
      </div>
    </section>
  );
}

export interface PkPromo {
  key: string;
  kicker?: string;
  title: string;
  cta: string;
  href: string;
  image?: string | null;
}

const PROMO_BG = ['from-[#fbd9c5] to-[#fbd9c5]', 'from-[#d6e8f6] to-[#d6e8f6]', 'from-[#e4efe9] to-[#e4efe9]'];

/**
 * The promo tiles (templete/petmart-store PromoCards.tsx): up to three rounded tiles in a row, a pale terracotta one, a sand one and a black one, a
 * small caption, an extra-bold title and a text link on the left, the picture multiplied in on the right. A store shows its own
 * campaigns (up to three), never the template's sample "Up To 70% Off" and countdown.
 */
export function PkPromoBanners({ banners, plainImage }: { banners: PkPromo[]; plainImage?: boolean }) {
  if (banners.length === 0) return null;
  const list = banners.slice(0, 3);
  return (
    <section id="sale" className={`pk-wrap grid scroll-mt-24 gap-4 pt-9 md:grid-cols-2 ${list.length >= 3 ? 'lg:grid-cols-3' : ''}`} aria-label="Offers">
      {list.map((b, i) => (
        <Link key={b.key} href={b.href} className={`group relative flex min-h-[210px] items-center overflow-hidden rounded-2xl bg-gradient-to-r p-6 text-ink hover:text-ink sm:p-8 ${PROMO_BG[i % PROMO_BG.length]} ${i % 3 === 2 ? '!text-white hover:!text-white' : ''}`}>
          <span className="relative z-10 block max-w-[52%]">
            {b.kicker && <span className="block text-[13px] text-slate-700">{b.kicker}</span>}
            <span className="mt-1 block whitespace-pre-line font-display text-3xl font-extrabold leading-[1.05] text-[var(--pk-brand)] sm:text-4xl">{b.title}</span>
            <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--pk-brand)] px-5 py-2 text-xs font-semibold text-white">{b.cta}</span>
          </span>
          {b.image && (
            <span className="absolute -right-2 top-0 block h-full w-[48%] mix-blend-multiply">
              <Picture src={b.image} alt="" plain={plainImage} sizes="400px" className="absolute inset-0 h-full w-full transition duration-500 group-hover:scale-105" />
            </span>
          )}
        </Link>
      ))}
    </section>
  );
}

/** The endless brand strip: each brand's name in bold with how many styles it has; hover pauses it. */
export function PkBrands({ title, allLabel, allHref, brands, stylesLabel }: { title: string; allLabel?: string; allHref?: string; brands: { name: string; href: string; count?: number }[]; stylesLabel?: (n: number) => string }) {
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
          className="group flex w-44 shrink-0 flex-col items-center justify-center gap-1 border-l border-[var(--pk-brand)]/10 px-4"
        >
          <span className="max-w-full truncate text-sm font-bold uppercase tracking-widest text-neutral-700 transition group-hover:text-[var(--pk-brand)]">{b.name}</span>
          {b.count !== undefined && stylesLabel && <span className="text-[11px] text-neutral-500">{stylesLabel(b.count)}</span>}
        </Link>
      ))}
    </div>
  );
  return (
    <section id="brands" className="pk-wrap scroll-mt-24 pt-12" aria-label={title}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <PkSectionTitle title={title} />
        {allLabel && allHref && (
          <Link href={allHref} className={linkAll}>
            {allLabel} <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      <div className="pk-marquee overflow-hidden rounded-lg bg-[#e4efe9] py-5 [-webkit-mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)] [mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)]">
        <div className="pk-marquee-track flex w-max">
          {list(false)}
          {list(true)}
        </div>
      </div>
    </section>
  );
}

/**
 * The feature strip (templete/petmart Features.tsx): one white rounded card with a row of icon blocks (a soft mocha circle,
 * a bold title, a grey line). Only the store's own highlights (Store > Design) are drawn; the template's four sample promises
 * are not shown on a real store.
 */
export function PkFeatures({ title, items }: { title: string; items: { key: string; icon: ReactNode; title: string; text?: string | null }[] }) {
  if (items.length === 0) return null;
  const shown = items.slice(0, 4);
  return (
    <section className="pk-wrap pb-4 pt-9" aria-label={title}>
      <div className={`grid grid-cols-1 gap-5 rounded-2xl bg-[#e4efe9] px-6 py-5 sm:grid-cols-2 ${shown.length >= 4 ? 'lg:grid-cols-4' : shown.length === 3 ? 'lg:grid-cols-3' : ''} lg:divide-x lg:divide-stone-200`}>
        {shown.map((item) => (
          <div key={item.key} className="flex items-center gap-4 lg:px-4">
            <span className="flex shrink-0 items-center justify-center text-[#163a2f] [&_svg]:h-9 [&_svg]:w-9">{item.icon}</span>
            <div>
              <h3 className="text-[13px] font-semibold">{item.title}</h3>
              {item.text && <p className="text-[11px] text-slate-600">{item.text}</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Customer reviews on the home page, in the template's card style: white rounded cards with the name, stars and the words. */
export function PkReviews({ title, reviews, verifiedLabel }: { title: string; verifiedLabel: string; reviews: { id: string; name: string; rating: number; title?: string | null; content?: string | null; verified?: boolean }[] }) {
  if (reviews.length === 0) return null;
  return (
    <section className="pk-wrap pt-12">
      <h2 className="mb-5 font-display text-3xl font-medium text-ink sm:text-4xl">{title}</h2>
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-2xl bg-white p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-sm font-medium">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--pk-soft)] text-xs font-medium text-[var(--pk-brand)]">{r.name.slice(0, 1).toUpperCase()}</span>
                {r.name}
              </span>
              <PetmartStars value={r.rating} className="h-3.5 w-3.5" />
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
