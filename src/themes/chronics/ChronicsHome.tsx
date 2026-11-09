'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from './icons';
import { ChronicsStars } from './ChronicsCard';

/*
 * Chronics' home sections (templete/.../chronics-store Hero, CategoryCards, TrendingProducts, Features, NewArrivals, Brands):
 * drawing only, fed by the store's own data in StorePal's HomeView (skin chronics) and by sample data on the template demo
 * page. `plainImage` switches pictures to a plain <img> for the demo's outside photos. Nothing here invents a promise: a
 * part shows only what the store wrote or what exists, and is left out otherwise.
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

export interface CrHeroSlide {
  key: string;
  image?: string | null;
  eyebrow?: string;
  /** Lines of the big title (the last line, or `accent`, is drawn in pink). */
  title: string[];
  accent?: string;
  text?: string;
  href: string;
}

/** The template's section title: a bold heading. */
export function CrSectionTitle({ title, sub }: { title: ReactNode; sub?: string | null }) {
  return (
    <div>
      <h2 className="text-xl font-bold">{title}</h2>
      {sub && <p className="mt-1 text-[13px] text-ink/60">{sub}</p>}
    </div>
  );
}

const linkAll = 'flex shrink-0 items-center gap-1.5 text-[13px] font-semibold text-[var(--cr-brand)] hover:underline';

/** The template's dotted white pattern in a corner of a band. */
const DOTS = { backgroundImage: 'radial-gradient(#fff 2px, transparent 2.5px)', backgroundSize: '14px 14px' } as const;

// The hero's background changes with each slide (lavender, peach, sky), like the template's three slides.
const HERO_BG = ['from-[#EADFFC] via-[#D9C9F8] to-[#B9A3F1]', 'from-[#FFE9C9] via-[#FFD3B0] to-[#FFB8A0]', 'from-[#D6ECFF] via-[#BFD9FB] to-[#A8C2F5]'];

/**
 * The hero (templete/.../chronics-store Hero.tsx): a soft gradient with white dots in the corner, the small pink tag, a big
 * bold title whose last line is pink, a short text and two buttons (a pink "Shop Now" with an arrow, a frosted outline one);
 * the picture sits on the right and fades into the background. It slides every 6 seconds, pauses on hover and touch, swipes,
 * and has the template's dot bar.
 */
export function CrHero({
  slides,
  shopLabel,
  exploreLabel,
  exploreHref,
  plainImage,
}: {
  slides: CrHeroSlide[];
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
    const timer = setInterval(() => setI((x) => (x + 1) % n), 6000);
    return () => clearInterval(timer);
  }, [paused, n, i]);

  if (n === 0) return null;
  const s = slides[i % n];
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
      className={`relative isolate overflow-hidden bg-gradient-to-br transition-colors duration-700 ${HERO_BG[i % HERO_BG.length]}`}
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
      <div aria-hidden className="absolute right-[6%] top-6 hidden h-36 w-36 opacity-70 md:block" style={DOTS} />
      <div className="cr-wrap grid md:min-h-[400px] md:grid-cols-2 md:items-center lg:min-h-[480px]">
        <div key={s.key} className="cr-fade-up relative z-10 pb-2 pt-9 md:py-12" aria-live="polite">
          {s.eyebrow && <p className="text-sm font-medium text-[var(--cr-brand)]">{s.eyebrow}</p>}
          <h2 className="mt-3 text-[34px] font-bold leading-[1.1] sm:text-4xl md:text-5xl lg:text-[56px]">
            {s.title.map((line, li) => (
              <span key={line + li} className="block">
                {line}
              </span>
            ))}
            {s.accent && <span className="block text-[var(--cr-brand)]">{s.accent}</span>}
          </h2>
          {s.text && <p className="mt-5 max-w-sm text-[14px] leading-relaxed text-ink/80 sm:mt-6 sm:text-[15px]">{s.text}</p>}
          <div className="mt-6 flex flex-wrap items-center gap-3 sm:mt-8 sm:gap-4">
            <Link href={s.href} className="flex items-center gap-3 rounded-md bg-[var(--cr-brand)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--cr-brand)]/30 transition hover:bg-[var(--cr-brand-dark)] sm:px-7">
              {shopLabel} <ArrowRight className="h-4 w-4" />
            </Link>
            {exploreLabel && exploreHref && (
              <Link href={exploreHref} className="rounded-md border border-white/80 bg-white/30 px-6 py-3 text-sm font-semibold text-ink backdrop-blur transition hover:bg-white/60 sm:px-7">
                {exploreLabel}
              </Link>
            )}
          </div>
        </div>

        {s.image && (
          <div className="cr-hero-fade relative -mx-5 h-[270px] sm:h-[330px] md:absolute md:inset-y-0 md:left-[46%] md:right-0 md:mx-0 md:h-auto md:w-auto">
            <Picture src={s.image} alt="" plain={plainImage} priority sizes="(max-width: 768px) 100vw, 54vw" className="absolute inset-0 h-full w-full" />
          </div>
        )}
      </div>

      {n > 1 && (
        <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
          {slides.map((sl, idx) => (
            <button
              key={sl.key}
              type="button"
              aria-label={`Slide ${idx + 1}`}
              aria-current={idx === i}
              onClick={() => setI(idx)}
              className={`h-1.5 rounded-full bg-ink transition-all ${idx === i ? 'w-6' : 'w-1.5 opacity-60'}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// The template's pastel category cards: pink, sky, peach, sun, rose.
const CATEGORY_BG = ['bg-[#FFD3E2]', 'bg-[#C9E2FB]', 'bg-[#FFD9CC]', 'bg-[#FFE79A]', 'bg-[#FFD3E8]'];

/**
 * The category cards (templete/.../chronics-store CategoryCards.tsx): five pastel rounded cards in a row, each with the
 * category's picture on the left half and a small grey line, a bold name and "Shop Now" on the right; two columns on a phone
 * (the last one spans both), three on a tablet, five on a computer.
 */
export function CrCategories({
  items,
  exploreLabel,
  plainImage,
}: {
  items: { name: string; href: string; image?: string | null; count?: number }[];
  exploreLabel: string;
  plainImage?: boolean;
  title?: string;
  viewAllLabel?: string;
  viewAllHref?: string;
}) {
  if (items.length === 0) return null;
  const list = items.slice(0, 5);
  return (
    <section id="categories" className="cr-wrap scroll-mt-32 py-7">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
        {list.map((c, idx) => (
          <Link
            key={c.name}
            href={c.href}
            className={`group relative flex h-[120px] overflow-hidden rounded-xl text-left transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)] ${CATEGORY_BG[idx % CATEGORY_BG.length]} ${
              list.length % 2 === 1 && idx === list.length - 1 ? 'col-span-2 sm:col-span-1' : ''
            }`}
          >
            <span className="relative h-full w-1/2 self-end overflow-hidden">
              {c.image ? (
                <Picture src={c.image} alt={c.name} plain={plainImage} sizes="160px" className="h-full w-full transition duration-500 group-hover:scale-110" />
              ) : (
                <span className="grid h-full w-full place-items-center text-3xl font-extrabold text-[var(--cr-brand)]">{c.name.slice(0, 1)}</span>
              )}
            </span>
            <span className="flex w-1/2 flex-col items-start justify-center pr-3">
              {c.count !== undefined && <span className="text-[10px] text-ink/60">{c.count}</span>}
              <span className="line-clamp-2 text-[14px] font-extrabold leading-tight sm:text-[15px]">{c.name}</span>
              <span className="mt-2 flex items-center gap-1 text-[10px] font-medium">
                {exploreLabel} <ArrowRight className="h-2.5 w-2.5" />
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/** A titled grid of product cards (the template's "Trending Products": 2 columns, 3 on a tablet, 5 on a computer) with "View all" on the right. */
export function CrProductGrid({ title, sub, viewAllLabel, viewAllHref, children, id, extra }: { title: string; sub?: string | null; viewAllLabel?: string; viewAllHref?: string; children: ReactNode[]; id?: string; extra?: ReactNode }) {
  if (children.length === 0) return null;
  return (
    <section id={id} className="cr-wrap scroll-mt-32 pb-8 pt-2">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <CrSectionTitle title={title} sub={sub} />
          {extra}
        </div>
        {viewAllLabel && viewAllHref && (
          <Link href={viewAllHref} className={linkAll}>
            {viewAllLabel} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
        {children.map((child, i) => (
          <div key={i} className="min-w-0">
            {child}
          </div>
        ))}
      </div>
    </section>
  );
}

export interface CrPromo {
  key: string;
  kicker?: string;
  title: string;
  cta: string;
  href: string;
  image?: string | null;
}

const PROMO_BG = ['from-[#FFD9D4] via-[#FFC9CC] to-[#FFB8C4]', 'from-[#EADFFC] via-[#D9C9F8] to-[#C5B2F5]', 'from-[#FFE9C9] via-[#FFD9B8] to-[#FFC8A8]'];

/**
 * The offer band (templete/.../chronics-store NewArrivals.tsx): a full-width soft pink band with white dots, a pink tag, a big
 * bold title, a short line and a pink button; the picture sits on the right and fades into the band. A store shows its own
 * campaigns (up to three, one band each), never the template's sample words.
 */
export function CrPromoBanners({ banners, plainImage }: { banners: CrPromo[]; plainImage?: boolean }) {
  if (banners.length === 0) return null;
  return (
    <div id="sale" className="scroll-mt-32" aria-label="Offers">
      {banners.slice(0, 3).map((b, i) => (
        <section key={b.key} className={`relative overflow-hidden bg-gradient-to-r ${PROMO_BG[i % PROMO_BG.length]}`}>
          <div aria-hidden className="absolute right-[8%] top-10 hidden h-28 w-28 opacity-70 md:block" style={DOTS} />
          <div className="cr-wrap grid md:min-h-[260px] md:grid-cols-2 md:items-center">
            <div className="relative z-10 pb-2 pt-10 md:py-12">
              {b.kicker && <p className="text-[12px] font-medium text-[var(--cr-brand)]">{b.kicker}</p>}
              <h3 className="mt-2 whitespace-pre-line text-[34px] font-bold leading-[1.1] md:text-[44px]">{b.title}</h3>
              <Link href={b.href} className="mt-6 inline-flex items-center gap-3 rounded-md bg-[var(--cr-brand)] px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--cr-brand)]/30 transition hover:bg-[var(--cr-brand-dark)]">
                {b.cta} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            {b.image && (
              <div className="cr-hero-fade relative -mx-5 h-[240px] sm:h-[280px] md:absolute md:inset-y-0 md:left-[46%] md:right-0 md:mx-0 md:h-auto md:w-auto">
                <Picture src={b.image} alt="" plain={plainImage} sizes="(max-width: 768px) 100vw, 54vw" className="absolute inset-0 h-full w-full" />
              </div>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

/** The endless brand strip: each brand's name in bold with how many styles it has; hover pauses it. */
export function CrBrands({ title, allLabel, allHref, brands, stylesLabel }: { title: string; allLabel?: string; allHref?: string; brands: { name: string; href: string; count?: number }[]; stylesLabel?: (n: number) => string }) {
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
          className="group flex w-44 shrink-0 flex-col items-center justify-center gap-1 border-l border-gray-100 px-4"
        >
          <span className="max-w-full truncate text-xl font-extrabold tracking-tight text-ink transition group-hover:text-[var(--cr-brand)]">{b.name}</span>
          {b.count !== undefined && stylesLabel && <span className="text-[10px] text-ink/50">{stylesLabel(b.count)}</span>}
        </Link>
      ))}
    </div>
  );
  return (
    <section id="brands" className="cr-wrap scroll-mt-32 py-8" aria-label={title}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <CrSectionTitle title={title} />
        {allLabel && allHref && (
          <Link href={allHref} className={linkAll}>
            {allLabel} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      <div className="cr-marquee overflow-hidden rounded-2xl bg-white py-5 shadow-[var(--shadow-card)] [-webkit-mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)] [mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)]">
        <div className="cr-marquee-track flex w-max">
          {list(false)}
          {list(true)}
        </div>
      </div>
    </section>
  );
}

// The template's four pastel icon circles: lilac, pink, sky, sun.
const FEATURE_LOOK = ['bg-[#E4DCFA] text-[#7D5FD8]', 'bg-[#FFDDE7] text-[var(--cr-brand)]', 'bg-[#D9E9FD] text-[#3B82F6]', 'bg-[#FFF0B8] text-[#F5A524]'];

/**
 * The feature strip (templete/.../chronics-store Features.tsx): one white rounded card with a row of icon blocks (a pastel
 * circle, a bold title, a grey line). Only the store's own highlights (Store > Design) are drawn; the template's four sample
 * promises are not shown on a real store.
 */
export function CrFeatures({ title, items }: { title: string; items: { key: string; icon: ReactNode; title: string; text?: string | null }[] }) {
  if (items.length === 0) return null;
  const shown = items.slice(0, 4);
  return (
    <section className="cr-wrap pb-8" aria-label={title}>
      <div className={`grid gap-2 rounded-2xl bg-white p-3 shadow-[var(--shadow-card)] sm:grid-cols-2 ${shown.length >= 4 ? 'lg:grid-cols-4' : shown.length === 3 ? 'lg:grid-cols-3' : ''} lg:gap-0 lg:divide-x lg:divide-gray-100 lg:p-5`}>
        {shown.map((item, idx) => (
          <div key={item.key} className="flex items-center gap-4 rounded-xl p-3 lg:px-6">
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full [&_svg]:h-[22px] [&_svg]:w-[22px] ${FEATURE_LOOK[idx % FEATURE_LOOK.length]}`}>{item.icon}</span>
            <span>
              <span className="block text-[12px] font-semibold leading-tight">{item.title}</span>
              {item.text && <span className="mt-0.5 block text-[10px] text-ink/60">{item.text}</span>}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Customer reviews on the home page, in the template's card style: white cards with a hairline border, the name, stars and the words. */
export function CrReviews({ title, reviews, verifiedLabel }: { title: string; verifiedLabel: string; reviews: { id: string; name: string; rating: number; title?: string | null; content?: string | null; verified?: boolean }[] }) {
  if (reviews.length === 0) return null;
  return (
    <section className="cr-wrap pb-8">
      <h2 className="mb-5 text-xl font-bold">{title}</h2>
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-xl border border-gray-100 bg-white p-4 transition hover:shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-[13px] font-semibold">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--cr-soft)] text-xs font-bold text-[var(--cr-brand)]">{r.name.slice(0, 1).toUpperCase()}</span>
                {r.name}
              </span>
              <ChronicsStars value={r.rating} className="h-3.5 w-3.5" />
            </div>
            {r.verified && <span className="mt-2 block text-[11px] font-semibold text-success">{verifiedLabel}</span>}
            {r.title && <p className="mt-2 text-[13px] font-semibold">{r.title}</p>}
            {r.content && <p className="mt-1 text-[12.5px] leading-relaxed text-ink/70">{r.content}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
