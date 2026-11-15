'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from './icons';
import { MinimogStars } from './MinimogCard';

/*
 * Minimog's home sections (templete/minimog Hero, Categories, NewArrivals, PromoBanner, Features): drawing only, fed by the
 * store's own data in StorePal's HomeView (skin minimog) and by sample data on the template demo page.
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

export interface MgHeroSlide {
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
export function MgSectionTitle({ title, sub }: { title: ReactNode; sub?: string | null }) {
  return (
    <div>
      <h2 className="text-[17px] font-bold">{title}</h2>
      {sub && <p className="mt-0.5 text-[12px] text-neutral-500">{sub}</p>}
    </div>
  );
}

const linkAll = 'flex shrink-0 items-center gap-1.5 text-[12px] font-medium text-ink hover:text-[var(--mg-brand)]';

/**
 * The hero (templete/minimog Hero.tsx): a warm sand gradient with the picture on the right fading into it, the eyebrow in
 * mocha, a big bold serif title whose last line is mocha, a short text and two buttons (Shop Now with an arrow, a white
 * outline one); it slides every 5.5 seconds, pauses on hover and touch, swipes, and has the template's dot bar. The round badge
 * is drawn only when a real value is passed.
 */
export function MgHero({
  slides,
  shopLabel,
  exploreLabel,
  exploreHref,
  plainImage,
  badge,
}: {
  slides: MgHeroSlide[];
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
      className="relative isolate overflow-hidden bg-gradient-to-r from-[#fbf8f3] via-[#f6efe5] to-[#e9dccb]"
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
            <div className="mg-wrap relative min-h-[420px] items-center sm:min-h-[480px] lg:flex lg:min-h-[560px]">
              <div className="relative z-10 py-10 lg:w-1/2 lg:py-14">
                {s.eyebrow && <span className="inline-flex items-center rounded bg-white/70 px-2.5 py-1 text-[10px] font-medium uppercase text-neutral-600">{s.eyebrow}</span>}
                <h2 className="mt-4 text-[34px] font-bold leading-[1.15] tracking-tight sm:text-[40px] xl:text-[48px]">
                  {s.title.map((line, li) => (
                    <span key={line + li} className="block">
                      {line}
                    </span>
                  ))}
                  {s.accent && <span className="block text-[var(--mg-brand)]">{s.accent}</span>}
                </h2>
                {s.text && <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-neutral-700 xl:text-[16px]">{s.text}</p>}
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href={s.href} className="inline-flex items-center gap-2 rounded-md bg-[var(--mg-brand)] px-6 py-3 text-[13px] font-semibold text-white transition hover:bg-[var(--mg-brand-dark)]">
                    {shopLabel} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  {exploreLabel && exploreHref && (
                    <Link href={exploreHref} className="rounded-md border border-neutral-300 bg-white px-6 py-3 text-[13px] font-semibold transition hover:border-[var(--mg-brand)]">
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
          <span className="text-2xl font-medium leading-none text-[var(--mg-brand)]">{badge.big}</span>
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
 * "Shop by Category" (templete/minimog Categories.tsx): a bold heading with "View All Categories" on the right and one
 * gradient card per category (a tall rounded picture, the name, the product count when known, an arrow); five on a computer,
 * a sideways row on a phone.
 */
export function MgCategories({
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
    <section id="categories" className="mg-wrap scroll-mt-24 pt-8">
      <div className="flex items-center justify-between gap-4">
        <MgSectionTitle title={title ?? exploreLabel} />
        {viewAllLabel && viewAllHref && (
          <Link href={viewAllHref} className={linkAll}>
            {viewAllLabel} <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      <div className="mg-no-scrollbar -mx-4 mt-5 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 lg:grid-cols-8">
        {items.slice(0, 8).map((c) => (
          <Link key={c.name} href={c.href} className="group min-w-[110px] text-center sm:min-w-0">
            <span className="block aspect-[4/4.3] overflow-hidden rounded-md bg-neutral-100">
              {c.image ? (
                <Picture src={c.image} alt="" plain={plainImage} sizes="150px" className="h-full w-full transition duration-500 group-hover:scale-105" />
              ) : (
                <span className="grid h-full w-full place-items-center text-3xl font-bold text-[var(--mg-brand)]">{c.name.slice(0, 1)}</span>
              )}
            </span>
            <span className="mt-2 block text-[12px] font-semibold">{c.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/** A titled grid of product cards (the template's "New Arrivals": 2 columns, 4 on a computer) with "View All Products" on the right. */
export function MgProductGrid({ title, sub, viewAllLabel, viewAllHref, children, id, extra }: { title: string; sub?: string | null; viewAllLabel?: string; viewAllHref?: string; children: ReactNode[]; id?: string; extra?: ReactNode }) {
  if (children.length === 0) return null;
  return (
    <section id={id} className="mg-wrap scroll-mt-24 pt-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <MgSectionTitle title={title} sub={sub} />
          {extra}
        </div>
        {viewAllLabel && viewAllHref && (
          <Link href={viewAllHref} className={linkAll}>
            {viewAllLabel} <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {children.map((child, i) => (
          <div key={i} className="min-w-0">
            {child}
          </div>
        ))}
      </div>
    </section>
  );
}

export interface MgPromo {
  key: string;
  kicker?: string;
  title: string;
  cta: string;
  href: string;
  image?: string | null;
}

/**
 * The offer banners (templete/minimog SaleBanner.tsx): a wide sage card with a small caption pill, a big bold title and a green
 * button on the left and the picture masked in on the right; the next banner is a tall card with the picture and a caption over
 * a dark fade. A store shows its own campaigns (up to two), never the template's sample "Spring Sale Is Live!" and countdown.
 */
export function MgPromoBanners({ banners, plainImage }: { banners: MgPromo[]; plainImage?: boolean }) {
  if (banners.length === 0) return null;
  const [main, side] = banners;
  return (
    <section id="sale" className="mg-wrap scroll-mt-24 pt-8" aria-label="Offers">
      <div className={`grid gap-3 ${side ? 'lg:h-[280px] lg:grid-cols-[1fr_300px]' : ''}`}>
        <Link href={main.href} className="group relative block overflow-hidden rounded-xl bg-gradient-to-r from-[#eef0e8] via-[#e9eee2] to-[#dfe6d6] text-ink hover:text-ink">
          <span className="relative z-10 block p-6 sm:p-8 md:w-[64%]">
            {main.kicker && <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-[10px] font-semibold tracking-wide text-[var(--mg-brand-dark)]">{main.kicker}</span>}
            <span className="mt-4 block whitespace-pre-line text-[28px] font-bold leading-[1.1] tracking-tight sm:text-[34px]">{main.title}</span>
            <span className="mt-6 inline-flex items-center gap-2 rounded-md bg-[var(--mg-brand)] px-6 py-3 text-[13px] font-semibold text-white shadow-sm transition group-hover:bg-[var(--mg-brand-dark)]">
              {main.cta} <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </span>
          {main.image && (
            <span className="relative block h-[190px] md:absolute md:inset-y-0 md:right-0 md:h-auto md:w-[40%] md:[mask-image:linear-gradient(to_right,transparent,black_22%)] md:[-webkit-mask-image:linear-gradient(to_right,transparent,black_22%)]">
              <Picture src={main.image} alt="" plain={plainImage} sizes="(max-width: 768px) 100vw, 480px" className="absolute inset-0 h-full w-full" />
            </span>
          )}
        </Link>
        {side && (
          <Link href={side.href} className="group relative block h-[300px] overflow-hidden rounded-xl bg-neutral-200 text-white hover:text-white lg:h-full">
            {side.image && <Picture src={side.image} alt="" plain={plainImage} sizes="300px" className="absolute inset-0 h-full w-full transition duration-500 group-hover:scale-105" />}
            <span className="absolute inset-x-0 bottom-0 block bg-gradient-to-t from-black/45 to-transparent p-4">
              {side.kicker && <span className="block text-[11px] font-medium uppercase tracking-wider text-white/80">{side.kicker}</span>}
              <span className="mt-0.5 inline-flex items-center gap-1.5 text-[14px] font-semibold">
                {side.title.replace(/\n/g, ' ')} <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </span>
          </Link>
        )}
      </div>
    </section>
  );
}

/** The endless brand strip: each brand's name in bold with how many styles it has; hover pauses it. */
export function MgBrands({ title, allLabel, allHref, brands, stylesLabel }: { title: string; allLabel?: string; allHref?: string; brands: { name: string; href: string; count?: number }[]; stylesLabel?: (n: number) => string }) {
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
          className="group flex w-44 shrink-0 flex-col items-center justify-center gap-1 border-l border-[var(--mg-brand)]/10 px-4"
        >
          <span className="max-w-full truncate font-display text-xl font-medium tracking-tight text-ink transition group-hover:text-[var(--mg-brand)]">{b.name}</span>
          {b.count !== undefined && stylesLabel && <span className="text-[11px] text-neutral-500">{stylesLabel(b.count)}</span>}
        </Link>
      ))}
    </div>
  );
  return (
    <section id="brands" className="mg-wrap scroll-mt-24 pt-12" aria-label={title}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <MgSectionTitle title={title} />
        {allLabel && allHref && (
          <Link href={allHref} className={linkAll}>
            {allLabel} <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      <div className="mg-marquee overflow-hidden rounded-3xl bg-white py-5 shadow-[var(--shadow-card)] [-webkit-mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)] [mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)]">
        <div className="mg-marquee-track flex w-max">
          {list(false)}
          {list(true)}
        </div>
      </div>
    </section>
  );
}

/**
 * The feature strip (templete/minimog Features.tsx): one white rounded card with a row of icon blocks (a soft mocha circle,
 * a bold title, a grey line). Only the store's own highlights (Store > Design) are drawn; the template's four sample promises
 * are not shown on a real store.
 */
export function MgFeatures({ title, items }: { title: string; items: { key: string; icon: ReactNode; title: string; text?: string | null }[] }) {
  if (items.length === 0) return null;
  const shown = items.slice(0, 4);
  return (
    <section className="mg-wrap pt-8" aria-label={title}>
      <div className={`grid grid-cols-1 gap-4 rounded-md border border-neutral-100 bg-neutral-50 px-4 py-4 sm:grid-cols-2 ${shown.length >= 4 ? 'lg:grid-cols-4' : shown.length === 3 ? 'lg:grid-cols-3' : ''} lg:divide-x lg:divide-neutral-200 lg:gap-0`}>
        {shown.map((item) => (
          <div key={item.key} className="flex items-center gap-4 lg:px-4">
            <span className="flex shrink-0 items-center justify-center text-ink [&_svg]:h-[19px] [&_svg]:w-[19px] [&_svg]:stroke-[1.5]">{item.icon}</span>
            <div>
              <h3 className="text-[11px] font-bold text-ink">{item.title}</h3>
              {item.text && <p className="text-[10px] leading-snug text-neutral-500">{item.text}</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Customer reviews on the home page, in the template's card style: white rounded cards with the name, stars and the words. */
export function MgReviews({ title, reviews, verifiedLabel }: { title: string; verifiedLabel: string; reviews: { id: string; name: string; rating: number; title?: string | null; content?: string | null; verified?: boolean }[] }) {
  if (reviews.length === 0) return null;
  return (
    <section className="mg-wrap pt-12">
      <h2 className="mb-5 font-display text-3xl font-medium text-ink sm:text-4xl">{title}</h2>
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-2xl bg-white p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-sm font-medium">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--mg-soft)] text-xs font-medium text-[var(--mg-brand)]">{r.name.slice(0, 1).toUpperCase()}</span>
                {r.name}
              </span>
              <MinimogStars value={r.rating} className="h-3.5 w-3.5" />
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
