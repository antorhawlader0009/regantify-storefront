'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ChevronLeft, ChevronRight } from './icons';
import { MahabeshStars } from './MahabeshCard';

/*
 * Mahabesh's home sections (resources/views/index.blade.php): drawing only, fed by the store's own data in StorePal's
 * HomeView (skin mahabesh) and by sample data on the template demo page. `plainImage` switches pictures to a plain <img>
 * for the demo's outside photos. Nothing here invents a promise: a part shows only what the store wrote or what exists,
 * and is left out otherwise (the template's section notes like "Marked down while sizes last." are sample words and are
 * not shown on a real store).
 */

function Picture({ src, alt, className, plain, priority, sizes }: { src: string; alt: string; className: string; plain?: boolean; priority?: boolean; sizes: string }) {
  if (plain) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} loading={priority ? 'eager' : 'lazy'} className={`${className} object-cover`} />;
  }
  return (
    // A picture placed `absolute` by its caller keeps that; anything else needs `relative` for the filled image.
    <span className={`${className} block ${/\babsolute\b/.test(className) ? '' : 'relative'}`}>
      <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className="object-cover" />
    </span>
  );
}

export interface MhHeroSlide {
  key: string;
  image?: string | null;
  eyebrow?: string;
  /** Lines of the slide's title (read by screen readers; the picture carries the look). */
  title: string[];
  accent?: string;
  text?: string;
  href: string;
}

/** The template's section title (.s-h2): heavy, tight, 24 to 34px, with an optional grey line under it. */
export function MhSectionTitle({ title, sub }: { title: ReactNode; sub?: string | null }) {
  return (
    <div>
      <h2 className="text-[clamp(24px,3vw,34px)] font-extrabold leading-[1.08] tracking-[-0.025em] text-black">{title}</h2>
      {sub && <p className="mt-1.5 text-[15px] text-[#62646b]">{sub}</p>}
    </div>
  );
}

/** The template's "View all" link (.s-section__more): bold with a thin line under it, blue on hover. */
const linkAll = 'shrink-0 border-b-[1.5px] border-black pb-px text-[14.5px] font-semibold text-black transition hover:border-[var(--mh-brand)] hover:text-[var(--mh-brand)]';

/**
 * The hero (.s-hero): one rounded frame (21 by 8 on a computer, 21 by 10 on a phone) on a grey well, the slide's picture
 * filling it. A slide is a link. Arrows show when the pointer is over it, the dots are small pills with the open one long
 * and white. It slides every 6 seconds, pauses on hover and touch, and swipes. A store with no picture gets its name on
 * the grey well with a Shop now button.
 */
export function MhHero({
  slides,
  shopLabel,
  plainImage,
}: {
  slides: MhHeroSlide[];
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
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchX.current;
    touchX.current = null;
    setPaused(false);
    if (start == null) return;
    const dx = e.changedTouches[0].clientX - start;
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
  };
  const navBtn = 'absolute top-1/2 z-[5] -mt-[22px] grid h-11 w-11 place-items-center rounded-full bg-white/90 text-black opacity-0 transition focus-visible:opacity-100 group-hover/hero:opacity-100';

  return (
    <section data-rg="hero" className="mh-wrap pt-3 lg:pt-5" aria-roledescription="carousel">
      <div
        className="group/hero relative aspect-[21/10] overflow-hidden rounded-xl bg-[var(--mh-well)] lg:aspect-[21/8] lg:rounded-2xl"
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
        {slides.map((s, idx) => (
          <div
            key={s.key}
            aria-hidden={idx !== i}
            className={`absolute inset-0 transition-opacity duration-500 ${idx === i ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
          >
            {s.image ? (
              <Link href={s.href} aria-label={s.title.join(' ')} tabIndex={idx === i ? 0 : -1} className="block h-full w-full">
                <Picture src={s.image} alt={s.title.join(' ')} plain={plainImage} priority={idx === 0} sizes="(max-width: 1320px) 100vw, 1272px" className="absolute inset-0 h-full w-full" />
              </Link>
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-4 px-6 text-center">
                <h2 className="text-[clamp(28px,4vw,44px)] font-extrabold leading-[1.08] tracking-[-0.025em] text-black">{s.title.join(' ')}</h2>
                <Link href={s.href} className="mh-btn">
                  {shopLabel}
                </Link>
              </div>
            )}
          </div>
        ))}
        {n > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} className={`${navBtn} left-4`} aria-label="Previous slide">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => go(1)} className={`${navBtn} right-4`} aria-label="Next slide">
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute inset-x-0 bottom-3.5 z-[5] flex justify-center gap-2">
              {slides.map((sl, idx) => (
                <button
                  key={sl.key}
                  type="button"
                  aria-label={`Slide ${idx + 1}`}
                  aria-current={idx === i}
                  onClick={() => setI(idx)}
                  className={`h-2 rounded bg-white transition-all duration-300 ${idx === i ? 'w-7' : 'w-2 opacity-70'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

/**
 * The category row (.s-cats): tall 4:5 pictures with rounded corners, the name in bold under each (the picture zooms a
 * little on hover), scrolling sideways with snap; six across on a computer, three and a half on a phone. A category with
 * no picture shows its first letter on the grey well.
 */
export function MhCategories({
  items,
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
    <section id="categories" className="mh-wrap scroll-mt-32 pt-10 lg:pt-14" aria-label={title}>
      <div className="mb-[22px] flex items-end justify-between gap-4">
        <MhSectionTitle title={title ?? ''} />
        {viewAllLabel && viewAllHref && (
          <Link href={viewAllHref} className={linkAll}>
            {viewAllLabel}
          </Link>
        )}
      </div>
      <div className="mh-no-scrollbar grid snap-x snap-mandatory auto-cols-[calc((100%-3*12px)/3.4)] grid-flow-col gap-3 overflow-x-auto pb-1 lg:auto-cols-[calc((100%-4*16px)/5)] lg:gap-4 min-[1200px]:auto-cols-[calc((100%-5*16px)/6)]">
        {items.map((c) => (
          <Link key={c.name} href={c.href} className="group snap-start text-black hover:text-black">
            <span className="relative block aspect-[4/5] overflow-hidden rounded-[10px] bg-[var(--mh-well)]">
              {c.image ? (
                <Picture src={c.image} alt="" plain={plainImage} sizes="220px" className="absolute inset-0 h-full w-full transition duration-[600ms] group-hover:scale-[1.04]" />
              ) : (
                <span className="grid h-full w-full place-items-center text-3xl font-extrabold text-[#9a9ca3]">{c.name.slice(0, 1)}</span>
              )}
            </span>
            <span className="mt-2.5 flex justify-between gap-2 text-[15px] font-bold tracking-[-0.01em] group-hover:underline group-hover:underline-offset-[3px]">
              <b className="min-w-0 truncate">{c.name}</b>
              {c.count !== undefined && <span className="text-[13px] font-medium text-[#9a9ca3]">{c.count}</span>}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/**
 * A titled grid of product cards (.s-section + .s-grid): the title on the left, "View all" with its line on the right,
 * then 2 columns on a phone, 3 from 600px, 4 from 992px and 5 from 1200px.
 */
export function MhProductGrid({ title, sub, viewAllLabel, viewAllHref, children, id, extra }: { title: string; sub?: string | null; viewAllLabel?: string; viewAllHref?: string; children: ReactNode[]; id?: string; extra?: ReactNode }) {
  if (children.length === 0) return null;
  return (
    <section id={id} className="mh-wrap scroll-mt-32 pt-10 lg:pt-14" aria-label={title}>
      <div className="mb-4 flex items-end justify-between gap-4 lg:mb-[22px]">
        <div className="flex min-w-0 flex-wrap items-end gap-3">
          <MhSectionTitle title={title} sub={sub} />
          {extra}
        </div>
        {viewAllLabel && viewAllHref && (
          <Link href={viewAllHref} className={linkAll}>
            {viewAllLabel}
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 gap-x-2.5 gap-y-6 min-[600px]:grid-cols-3 min-[600px]:gap-y-[26px] lg:grid-cols-4 lg:gap-x-[18px] min-[1200px]:grid-cols-5 min-[1200px]:gap-y-8">
        {children.map((child, i) => (
          <div key={i} className="min-w-0">
            {child}
          </div>
        ))}
      </div>
    </section>
  );
}

export interface MhPromo {
  key: string;
  kicker?: string;
  title: string;
  cta: string;
  href: string;
  image?: string | null;
}

/**
 * The offer cards: a store's own campaigns (up to three) as rounded picture cards with a dark foot, the campaign's name in
 * white and a small white pill button. The template has no offer band of its own, so these use its card shape (16px corners,
 * grey well) and its pill buttons. Never the template's sample words.
 */
export function MhPromoBanners({ banners, plainImage }: { banners: MhPromo[]; plainImage?: boolean }) {
  if (banners.length === 0) return null;
  const list = banners.slice(0, 3);
  return (
    <section id="sale" className="mh-wrap scroll-mt-32 pt-10 lg:pt-14" aria-label="Offers">
      <div className={`grid gap-3 lg:gap-4 ${list.length === 1 ? '' : list.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
        {list.map((b) => (
          <Link key={b.key} href={b.href} className="group relative block aspect-[16/10] overflow-hidden rounded-2xl bg-[var(--mh-well)] text-white hover:text-white">
            {b.image && <Picture src={b.image} alt="" plain={plainImage} sizes="(max-width: 600px) 100vw, 440px" className="absolute inset-0 h-full w-full transition duration-[600ms] group-hover:scale-[1.04]" />}
            <span aria-hidden className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/70 to-transparent" />
            <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 sm:p-5">
              <span className="min-w-0">
                {b.kicker && <span className="block text-[12px] font-medium text-white/80">{b.kicker}</span>}
                <span className="block text-[20px] font-extrabold leading-tight tracking-[-0.02em] sm:text-[24px]">{b.title}</span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-black transition group-hover:bg-[var(--mh-brand)] group-hover:text-white">
                {b.cta} <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/** The brand row: each brand a bordered pill with how many products it has, scrolling sideways. */
export function MhBrands({ title, allLabel, allHref, brands, stylesLabel }: { title: string; allLabel?: string; allHref?: string; brands: { name: string; href: string; count?: number }[]; stylesLabel?: (n: number) => string }) {
  if (brands.length === 0) return null;
  return (
    <section id="brands" className="mh-wrap scroll-mt-32 pt-10 lg:pt-14" aria-label={title}>
      <div className="mb-4 flex items-end justify-between gap-3 lg:mb-[22px]">
        <MhSectionTitle title={title} />
        {allLabel && allHref && (
          <Link href={allHref} className={linkAll}>
            {allLabel}
          </Link>
        )}
      </div>
      <div className="mh-no-scrollbar flex gap-2.5 overflow-x-auto pb-1">
        {brands.map((b) => (
          <Link
            key={b.name}
            href={b.href}
            className="flex shrink-0 items-center gap-2 rounded-full border-[1.5px] border-[var(--mh-line)] px-5 py-2.5 text-[14.5px] font-bold text-black transition hover:border-black hover:text-black"
          >
            {b.name}
            {b.count !== undefined && stylesLabel && <span className="text-[12.5px] font-medium text-[#9a9ca3]">{stylesLabel(b.count)}</span>}
          </Link>
        ))}
      </div>
    </section>
  );
}

/**
 * The highlights strip: grey rounded tiles (like the template's contact tiles) each with a white round icon, a bold title
 * and a grey line. Only the store's own highlights (Store > Design) are drawn; the template shows none of its own.
 */
export function MhFeatures({ title, items }: { title: string; items: { key: string; icon: ReactNode; title: string; text?: string | null }[] }) {
  if (items.length === 0) return null;
  const shown = items.slice(0, 4);
  return (
    <section className="mh-wrap pt-10 lg:pt-14" aria-label={title}>
      <div className={`grid gap-3 sm:grid-cols-2 ${shown.length >= 4 ? 'lg:grid-cols-4' : shown.length === 3 ? 'lg:grid-cols-3' : ''}`}>
        {shown.map((item) => (
          <div key={item.key} className="flex items-center gap-3.5 rounded-2xl bg-[var(--mh-well)] p-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-black [&_svg]:h-[18px] [&_svg]:w-[18px]">{item.icon}</span>
            <span className="min-w-0">
              <span className="block text-[15px] font-bold leading-tight text-black">{item.title}</span>
              {item.text && <span className="mt-0.5 block text-[13px] text-[#62646b]">{item.text}</span>}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Customer reviews on the home page: bordered rounded cards with the name, stars and the words. */
export function MhReviews({ title, reviews, verifiedLabel }: { title: string; verifiedLabel: string; reviews: { id: string; name: string; rating: number; title?: string | null; content?: string | null; verified?: boolean }[] }) {
  if (reviews.length === 0) return null;
  return (
    <section className="mh-wrap pt-10 lg:pt-14">
      <div className="mb-4 lg:mb-[22px]">
        <MhSectionTitle title={title} />
      </div>
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-2xl border border-[var(--mh-line)] bg-white p-5">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2.5 text-[14px] font-bold text-black">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--mh-well)] text-xs font-bold text-black">{r.name.slice(0, 1).toUpperCase()}</span>
                {r.name}
              </span>
              <MahabeshStars value={r.rating} className="h-3.5 w-3.5" />
            </div>
            {r.verified && <span className="mt-2 block text-[12px] font-semibold text-success">{verifiedLabel}</span>}
            {r.title && <p className="mt-2 text-[14px] font-semibold text-black">{r.title}</p>}
            {r.content && <p className="mt-1 text-[13.5px] leading-relaxed text-[#62646b]">{r.content}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
