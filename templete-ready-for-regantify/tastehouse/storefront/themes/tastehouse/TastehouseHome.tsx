'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from './icons';
import { TastehouseStars } from './TastehouseCard';

/*
 * Tastehouse's home sections (templete/tastehouse Hero, Categories, NewArrivals, PromoBanner, Features): drawing only, fed by the
 * store's own data in StorePal's HomeView (skin tastehouse) and by sample data on the template demo page.
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

export interface ThHeroSlide {
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
export function ThSectionTitle({ title, sub }: { title: ReactNode; sub?: string | null }) {
  return (
    <div>
      <h2 className="text-lg font-extrabold tracking-tight">{title}</h2>
      {sub && <p className="mt-0.5 text-[12px] text-neutral-500">{sub}</p>}
    </div>
  );
}

const linkAll = 'flex shrink-0 items-center gap-2 text-xs font-semibold text-ink transition hover:text-[var(--th-brand)]';

/**
 * The hero (templete/tastehouse Hero.tsx): a warm sand gradient with the picture on the right fading into it, the eyebrow in
 * mocha, a big bold serif title whose last line is mocha, a short text and two buttons (Shop Now with an arrow, a white
 * outline one); it slides every 5.5 seconds, pauses on hover and touch, swipes, and has the template's dot bar. The round badge
 * is drawn only when a real value is passed.
 */
export function ThHero({
  slides,
  shopLabel,
  exploreLabel,
  exploreHref,
  plainImage,
  badge,
}: {
  slides: ThHeroSlide[];
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
    <div className="th-wrap pt-4">
    <section
      data-rg="hero"
      className="relative isolate overflow-hidden rounded-[24px] bg-gradient-to-br from-[#FFF3E4] via-[#FFEEDC] to-[#FFE6CC] text-ink sm:rounded-[28px]"
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
            <div className="relative min-h-[360px] p-5 sm:p-8 lg:min-h-[380px] lg:p-12">
              <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/40" />
              <div className="pointer-events-none absolute right-10 top-24 hidden h-72 w-72 rounded-full bg-[#FFD9A8]/40 sm:block" />
              {s.image && (
                <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[55%] sm:block lg:w-[58%] [mask-image:radial-gradient(ellipse_75%_85%_at_65%_50%,#000_45%,transparent_100%)] [-webkit-mask-image:radial-gradient(ellipse_75%_85%_at_65%_50%,#000_45%,transparent_100%)]">
                  <Picture src={s.image} alt="" plain={plainImage} priority={idx === 0} sizes="(max-width: 1200px) 55vw, 700px" className="absolute inset-0 h-full w-full" />
                </div>
              )}
              <div className="relative z-10 max-w-[420px] sm:max-w-[46%] lg:max-w-[420px]">
                {s.eyebrow && <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--th-brand)]">{s.eyebrow}</p>}
                <h2 className="mt-4 text-[32px] font-extrabold leading-[1.1] tracking-tight sm:mt-5 sm:text-3xl lg:text-4xl xl:text-[44px]">
                  {s.title.map((line, li) => (
                    <span key={line + li} className="block">
                      {line}
                    </span>
                  ))}
                  {s.accent && <span className="block text-[var(--th-brand)]">{s.accent}</span>}
                </h2>
                {s.text && <p className="mt-4 max-w-[300px] text-sm leading-relaxed text-neutral-600 sm:mt-5">{s.text}</p>}
                <div className="mt-6 flex flex-wrap gap-3 sm:mt-7">
                  <Link href={s.href} className="inline-flex items-center gap-3 rounded-xl bg-[var(--th-brand)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-card-hover)] transition hover:bg-[var(--th-brand-dark)] sm:px-6">
                    {shopLabel}
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/25">
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </Link>
                  {exploreLabel && exploreHref && (
                    <Link href={exploreHref} className="inline-flex items-center gap-3 rounded-xl bg-white px-5 py-3 text-sm font-semibold shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-card-hover)] sm:px-6">
                      {exploreLabel}
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--th-brand)] text-white">
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    </Link>
                  )}
                </div>
              </div>
              {s.image && (
                <div className="relative mt-6 h-48 overflow-hidden rounded-2xl sm:hidden">
                  <Picture src={s.image} alt="" plain={plainImage} sizes="100vw" className="absolute inset-0 h-full w-full" />
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
          <span className="text-2xl font-medium leading-none text-[var(--th-brand)]">{badge.big}</span>
          <span className="text-[11px]">{badge.bottom}</span>
        </Link>
      )}

      {n > 1 && (
        <div className="absolute bottom-5 right-6 z-20 flex items-center gap-2">
          {slides.map((s, idx) => (
            <button
              key={s.key}
              type="button"
              aria-label={`Slide ${idx + 1}`}
              aria-current={idx === i}
              onClick={() => setI(idx)}
              className={`h-2 rounded-full transition-all ${idx === i ? 'w-1.5 bg-[var(--th-brand)]' : 'w-1.5 bg-white'}`}
            />
          ))}
        </div>
      )}
    </section>
    </div>
  );
}

// The template gives each category card its own soft gradient; they cycle for a store's own categories.

export function ThCategories({
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
  const TINTS = ['#E9F3E3', '#EDF5E1', '#FDEBD3', '#FDE4DE', '#EEE6F7'];
  return (
    <section id="categories" className="th-wrap scroll-mt-24 pt-9">
      <div className="mb-5 flex items-center justify-between gap-4">
        <ThSectionTitle title={title ?? exploreLabel} />
        {viewAllLabel && viewAllHref && (
          <Link href={viewAllHref} className={linkAll}>
            {viewAllLabel} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 xl:grid-cols-5">
        {items.slice(0, 5).map((c, k) => (
          <Link key={c.name} href={c.href} className="group flex min-w-[150px] snap-start flex-col items-center rounded-2xl px-4 pb-5 pt-6 transition hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)] sm:min-w-0" style={{ background: TINTS[k % TINTS.length] }}>
            <span className="relative block h-28 w-28 overflow-hidden rounded-full bg-white/60 shadow-[var(--shadow-card-hover)] ring-4 ring-white/60 xl:h-32 xl:w-32">
              {c.image ? (
                <Picture src={c.image} alt="" plain={plainImage} sizes="140px" className="absolute inset-0 h-full w-full transition duration-500 group-hover:scale-105" />
              ) : (
                <span className="grid h-full w-full place-items-center text-3xl font-extrabold text-[var(--th-brand)]">{c.name.slice(0, 1)}</span>
              )}
            </span>
            <span className="mt-5 text-sm font-bold">{c.name}</span>
            <span className="mt-1 flex items-center gap-1 text-[11px] text-neutral-500">
              {exploreLabel} <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/** A titled grid of product cards (the template's "New Arrivals": 2 columns, 4 on a computer) with "View All Products" on the right. */
export function ThProductGrid({ title, sub, viewAllLabel, viewAllHref, children, id, extra }: { title: string; sub?: string | null; viewAllLabel?: string; viewAllHref?: string; children: ReactNode[]; id?: string; extra?: ReactNode }) {
  if (children.length === 0) return null;
  return (
    <section id={id} className="th-wrap scroll-mt-24 pt-9">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <ThSectionTitle title={title} sub={sub} />
          {extra}
        </div>
        {viewAllLabel && viewAllHref && (
          <Link href={viewAllHref} className={linkAll}>
            {viewAllLabel} <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-5">
        {children.map((child, i) => (
          <div key={i} className="min-w-0">
            {child}
          </div>
        ))}
      </div>
    </section>
  );
}

export interface ThPromo {
  key: string;
  kicker?: string;
  title: string;
  cta: string;
  href: string;
  image?: string | null;
}

export function ThPromoBanners({ banners, plainImage }: { banners: ThPromo[]; plainImage?: boolean }) {
  if (banners.length === 0) return null;
  const list = banners.slice(0, 2);
  const TONES = [
    { bg: 'from-[#E3F1DC] to-[#D5EACB]', kicker: 'text-[#1F5C34]', title: 'text-ink', btn: 'bg-[#1F5C34] hover:bg-[#164426]' },
    { bg: 'from-[#FFEBD8] to-[#FFDDBB]', kicker: 'text-[var(--th-brand)]', title: 'text-[var(--th-brand)]', btn: 'bg-[var(--th-brand)] hover:bg-[var(--th-brand-dark)]' },
  ];
  return (
    <section id="sale" className="th-wrap grid scroll-mt-24 gap-4 pt-9 sm:gap-5 lg:grid-cols-2" aria-label="Offers">
      {list.map((b, i) => {
        const t = TONES[i % TONES.length];
        return (
          <Link key={b.key} href={b.href} className={`group relative block min-h-[220px] overflow-hidden rounded-3xl bg-gradient-to-br p-6 text-ink hover:text-ink sm:p-7 ${t.bg}`}>
            <span className="relative z-10 block max-w-[200px] sm:max-w-[240px]">
              {b.kicker && <span className={`block text-[9px] font-bold uppercase tracking-wider ${t.kicker}`}>{b.kicker}</span>}
              <span className={`mt-4 block whitespace-pre-line text-2xl font-extrabold leading-tight sm:text-[26px] ${t.title}`}>{b.title}</span>
              <span className={`mt-5 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold text-white transition ${t.btn}`}>
                {b.cta} <ArrowRight className="h-3 w-3" />
              </span>
            </span>
            {b.image && (
              <span className="absolute -bottom-8 -right-10 block h-[190px] w-[190px] overflow-hidden rounded-full shadow-[var(--shadow-card-hover)] sm:-bottom-6 sm:-right-6 sm:h-[260px] sm:w-[260px] lg:h-[280px] lg:w-[280px]">
                <Picture src={b.image} alt="" plain={plainImage} sizes="280px" className="absolute inset-0 h-full w-full transition duration-500 group-hover:scale-105" />
              </span>
            )}
          </Link>
        );
      })}
    </section>
  );
}

/** The endless brand strip: each brand's name in bold with how many styles it has; hover pauses it. */
export function ThBrands({ title, allLabel, allHref, brands, stylesLabel }: { title: string; allLabel?: string; allHref?: string; brands: { name: string; href: string; count?: number }[]; stylesLabel?: (n: number) => string }) {
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
          className="group flex w-44 shrink-0 flex-col items-center justify-center gap-1 border-l border-[var(--th-brand)]/10 px-4"
        >
          <span className="max-w-full truncate font-display text-xl font-medium tracking-tight text-ink transition group-hover:text-[var(--th-brand)]">{b.name}</span>
          {b.count !== undefined && stylesLabel && <span className="text-[11px] text-neutral-500">{stylesLabel(b.count)}</span>}
        </Link>
      ))}
    </div>
  );
  return (
    <section id="brands" className="th-wrap scroll-mt-24 pt-12" aria-label={title}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <ThSectionTitle title={title} />
        {allLabel && allHref && (
          <Link href={allHref} className={linkAll}>
            {allLabel} <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      <div className="th-marquee overflow-hidden rounded-3xl bg-white py-5 shadow-[var(--shadow-card)] [-webkit-mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)] [mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)]">
        <div className="th-marquee-track flex w-max">
          {list(false)}
          {list(true)}
        </div>
      </div>
    </section>
  );
}

export function ThFeatures({ title, items }: { title: string; items: { key: string; icon: ReactNode; title: string; text?: string | null }[] }) {
  if (items.length === 0) return null;
  const shown = items.slice(0, 4);
  return (
    <section className="th-wrap pt-9" aria-label={title}>
      <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${shown.length >= 4 ? 'xl:grid-cols-4' : shown.length === 3 ? 'xl:grid-cols-3' : ''}`}>
        {shown.map((item) => (
          <div key={item.key} className="flex items-center gap-3 rounded-2xl bg-[#FBF1E8] px-5 py-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[var(--th-brand)] shadow-[var(--shadow-card)] [&_svg]:h-[18px] [&_svg]:w-[18px]">{item.icon}</span>
            <div>
              <h3 className="text-[13px] font-bold">{item.title}</h3>
              {item.text && <p className="text-[11px] text-neutral-500">{item.text}</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Customer reviews on the home page, in the template's card style: white rounded cards with the name, stars and the words. */
export function ThReviews({ title, reviews, verifiedLabel }: { title: string; verifiedLabel: string; reviews: { id: string; name: string; rating: number; title?: string | null; content?: string | null; verified?: boolean }[] }) {
  if (reviews.length === 0) return null;
  return (
    <section className="th-wrap pt-12">
      <h2 className="mb-5 font-display text-3xl font-medium text-ink sm:text-4xl">{title}</h2>
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-2xl bg-white p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-sm font-medium">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--th-soft)] text-xs font-medium text-[var(--th-brand)]">{r.name.slice(0, 1).toUpperCase()}</span>
                {r.name}
              </span>
              <TastehouseStars value={r.rating} className="h-3.5 w-3.5" />
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
