'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from './icons';
import { EstateproStars } from './EstateproCard';

/*
 * Estatepro's home sections (templete/estatepro Hero, Categories, NewArrivals, PromoBanner, Features): drawing only, fed by the
 * store's own data in StorePal's HomeView (skin estatepro) and by sample data on the template demo page.
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

export interface EpHeroSlide {
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
export function EpSectionTitle({ title, sub }: { title: ReactNode; sub?: string | null }) {
  return (
    <div>
      <h2 className="text-2xl font-bold sm:text-3xl">{title}</h2>
      {sub && <p className="mt-1 text-sm text-neutral-500">{sub}</p>}
    </div>
  );
}

const linkAll = 'inline-flex shrink-0 items-center gap-2 text-xs font-semibold text-ink transition hover:text-[var(--ep-brand-dark)]';

/**
 * The hero (templete/estatepro Hero.tsx): a warm sand gradient with the picture on the right fading into it, the eyebrow in
 * mocha, a big bold serif title whose last line is mocha, a short text and two buttons (Shop Now with an arrow, a white
 * outline one); it slides every 5.5 seconds, pauses on hover and touch, swipes, and has the template's dot bar. The round badge
 * is drawn only when a real value is passed.
 */
export function EpHero({
  slides,
  shopLabel,
  exploreLabel,
  exploreHref,
  plainImage,
  badge,
}: {
  slides: EpHeroSlide[];
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
      className="relative isolate overflow-hidden bg-[#111111] text-white"
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
            <div className="relative h-full min-h-[520px] lg:min-h-[620px]">
              {s.image && (
                <div className="absolute inset-0">
                  <Picture src={s.image} alt="" plain={plainImage} priority={idx === 0} sizes="100vw" className="absolute inset-0 h-full w-full" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/55 to-black/10 lg:via-black/40" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/50" />
              <div className="ep-wrap relative flex min-h-[520px] items-center pb-12 pt-28 lg:min-h-[620px]">
                <div className="max-w-xl">
                  {s.eyebrow && <span className="inline-flex items-center rounded-full border border-[var(--ep-brand)]/70 bg-black/40 px-4 py-2 text-[11px] font-medium uppercase tracking-wider text-[var(--ep-brand)]">{s.eyebrow}</span>}
                  <h2 className="mt-4 text-5xl font-bold leading-[1.05] !text-white sm:text-6xl">
                    {s.title.map((line, li) => (
                      <span key={line + li} className="block">
                        {line}
                      </span>
                    ))}
                    {s.accent && <span className="block text-[var(--ep-brand)]">{s.accent}</span>}
                  </h2>
                  {s.text && <p className="mt-4 max-w-md text-sm leading-relaxed text-white/90 sm:text-[15px]">{s.text}</p>}
                  <div className="mt-7 flex flex-wrap gap-3">
                    <Link href={s.href} className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--ep-brand)] px-7 py-3.5 text-sm font-semibold text-ink transition hover:bg-[#F8DC9B]">
                      {shopLabel} <ArrowRight className="h-4 w-4" />
                    </Link>
                    {exploreLabel && exploreHref && (
                      <Link href={exploreHref} className="inline-flex items-center justify-center gap-2 rounded-full border border-white/40 px-7 py-3.5 text-sm font-semibold text-white transition hover:border-[var(--ep-brand)] hover:text-[var(--ep-brand)]">
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
          <span className="text-2xl font-medium leading-none text-[var(--ep-brand)]">{badge.big}</span>
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
              className={`h-2 rounded-full transition-all ${idx === i ? 'w-8 bg-[var(--ep-brand)]' : 'w-2 bg-white/40'}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// The template gives each category card its own soft gradient; they cycle for a store's own categories.

export function EpCategories({
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
    <section id="categories" className="ep-wrap scroll-mt-24 pb-4 pt-14">
      <div className="flex items-end justify-between gap-4">
        <EpSectionTitle title={title ?? exploreLabel} />
        {viewAllLabel && viewAllHref && (
          <Link href={viewAllHref} className={linkAll + ' hidden sm:inline-flex'}>
            {viewAllLabel} <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      <div className="mt-8 grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 lg:grid-cols-4">
        {items.slice(0, 4).map((c) => (
          <Link key={c.name} href={c.href} className="group overflow-hidden rounded-2xl bg-white text-left shadow-[var(--shadow-card)] transition hover:-translate-y-1">
            <span className="relative block h-44 overflow-hidden bg-[var(--ep-soft)]">
              {c.image ? (
                <Picture src={c.image} alt="" plain={plainImage} sizes="(max-width: 640px) 100vw, 320px" className="absolute inset-0 h-full w-full transition duration-500 group-hover:scale-105" />
              ) : (
                <span className="grid h-full w-full place-items-center text-5xl font-bold text-[var(--ep-brand-dark)]">{c.name.slice(0, 1)}</span>
              )}
            </span>
            <span className="relative -mt-6 flex items-center gap-3 rounded-2xl bg-white px-4 py-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--ep-brand)]/25 text-sm font-bold text-[var(--ep-brand-dark)]">{c.name.slice(0, 1)}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{c.name}</span>
                <span className="block text-[11px] text-zinc-500">{exploreLabel}</span>
              </span>
              <span className="grid h-8 w-8 place-items-center rounded-full bg-zinc-100 transition group-hover:bg-[var(--ep-brand)]">
                <ArrowRight className="h-4 w-4" />
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function EpProductGrid({ title, sub, viewAllLabel, viewAllHref, children, id, extra }: { title: string; sub?: string | null; viewAllLabel?: string; viewAllHref?: string; children: ReactNode[]; id?: string; extra?: ReactNode }) {
  if (children.length === 0) return null;
  return (
    <section id={id} className="ep-wrap scroll-mt-24 py-12">
      <div className="flex items-end justify-between gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <EpSectionTitle title={title} sub={sub} />
          {extra}
        </div>
        {viewAllLabel && viewAllHref && (
          <Link href={viewAllHref} className={linkAll}>
            {viewAllLabel} <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {children.map((child, i) => (
          <div key={i} className="min-w-0">
            {child}
          </div>
        ))}
      </div>
    </section>
  );
}

export interface EpPromo {
  key: string;
  kicker?: string;
  title: string;
  cta: string;
  href: string;
  image?: string | null;
}

const PROMO_BG = ['from-[#F2C468] to-[#F8DC9B]', 'from-black to-black', 'from-[#F2C468] to-[#F8DC9B]'];

export function EpPromoBanners({ banners, plainImage }: { banners: EpPromo[]; plainImage?: boolean }) {
  if (banners.length === 0) return null;
  return (
    <section id="sale" className="ep-wrap scroll-mt-24 space-y-4 pb-14" aria-label="Offers">
      {banners.slice(0, 2).map((b) => (
        <div key={b.key} className="flex flex-col items-center gap-5 rounded-2xl bg-[#222] px-6 py-6 text-white shadow-[var(--shadow-card)] md:flex-row md:justify-between md:px-8">
          <div className="flex items-center gap-4 text-center md:text-left">
            {b.image && (
              <span className="relative hidden h-14 w-14 shrink-0 overflow-hidden rounded-full bg-black sm:block">
                <Picture src={b.image} alt="" plain={plainImage} sizes="60px" className="absolute inset-0 h-full w-full" />
              </span>
            )}
            <div>
              <h3 className="whitespace-pre-line text-lg font-semibold">{b.title}</h3>
              {b.kicker && <p className="text-sm text-white/70">{b.kicker}</p>}
            </div>
          </div>
          <Link href={b.href} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--ep-brand)] px-6 py-3 text-xs font-semibold text-ink transition hover:bg-[#F8DC9B] sm:w-auto">
            {b.cta} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ))}
    </section>
  );
}

/** The endless brand strip: each brand's name in bold with how many styles it has; hover pauses it. */
export function EpBrands({ title, allLabel, allHref, brands, stylesLabel }: { title: string; allLabel?: string; allHref?: string; brands: { name: string; href: string; count?: number }[]; stylesLabel?: (n: number) => string }) {
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
          className="group flex w-44 shrink-0 flex-col items-center justify-center gap-1 border-l border-[var(--ep-brand)]/10 px-4"
        >
          <span className="max-w-full truncate text-sm font-bold uppercase tracking-widest text-neutral-700 transition group-hover:text-[var(--ep-brand)]">{b.name}</span>
          {b.count !== undefined && stylesLabel && <span className="text-[11px] text-neutral-500">{stylesLabel(b.count)}</span>}
        </Link>
      ))}
    </div>
  );
  return (
    <section id="brands" className="ep-wrap scroll-mt-24 pt-12" aria-label={title}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <EpSectionTitle title={title} />
        {allLabel && allHref && (
          <Link href={allHref} className={linkAll}>
            {allLabel} <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      <div className="ep-marquee overflow-hidden rounded-lg bg-[#FDF8EE] py-5 [-webkit-mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)] [mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)]">
        <div className="ep-marquee-track flex w-max">
          {list(false)}
          {list(true)}
        </div>
      </div>
    </section>
  );
}

export function EpFeatures({ title, items }: { title: string; items: { key: string; icon: ReactNode; title: string; text?: string | null }[] }) {
  if (items.length === 0) return null;
  const shown = items.slice(0, 4);
  return (
    <section className="relative isolate overflow-hidden bg-black text-white" aria-label={title}>
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black via-[#141414] to-[#222]" />
      <div className="ep-wrap grid items-center gap-10 py-14 lg:grid-cols-2 lg:py-16">
        <div>
          <h2 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">{title}</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:ml-auto lg:max-w-xl">
          {shown.map((item) => (
            <div key={item.key} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/10 p-5 transition hover:bg-white/15">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-emerald-900/70 text-[var(--ep-brand)] ring-1 ring-[var(--ep-brand)]/40 [&_svg]:h-[22px] [&_svg]:w-[22px]">{item.icon}</span>
              <div>
                <p className="text-sm font-semibold">{item.title}</p>
                {item.text && <p className="text-[11px] text-white/70">{item.text}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Customer reviews on the home page, in the template's card style: white rounded cards with the name, stars and the words. */
export function EpReviews({ title, reviews, verifiedLabel }: { title: string; verifiedLabel: string; reviews: { id: string; name: string; rating: number; title?: string | null; content?: string | null; verified?: boolean }[] }) {
  if (reviews.length === 0) return null;
  return (
    <section className="ep-wrap pt-12">
      <h2 className="mb-5 font-display text-3xl font-medium text-ink sm:text-4xl">{title}</h2>
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-2xl bg-white p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-sm font-medium">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--ep-soft)] text-xs font-medium text-[var(--ep-brand)]">{r.name.slice(0, 1).toUpperCase()}</span>
                {r.name}
              </span>
              <EstateproStars value={r.rating} className="h-3.5 w-3.5" />
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
