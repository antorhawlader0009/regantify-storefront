'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from './icons';
import { SolevoStars } from './SolevoCard';

/*
 * Solevo's home sections (templete/solevo Hero, CategoryStrip, BestSellers, PromoBanners, Brands, WhyShop): drawing only,
 * fed by the store's own data in StorePal's HomeView (skin solevo) and by sample data on the template demo page.
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
      <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className="object-cover" />
    </span>
  );
}

export interface SvHeroSlide {
  key: string;
  image?: string | null;
  eyebrow?: string;
  /** Lines of the big serif title (the template splits "BUILT FOR / COMFORT"). */
  title: string[];
  accent?: string;
  text?: string;
  href: string;
}

/** The template's section title: small, bold, uppercase. */
export function SvSectionTitle({ title, sub }: { title: ReactNode; sub?: string | null }) {
  return (
    <div>
      <h2 className="text-sm font-bold uppercase tracking-wider">{title}</h2>
      {sub && <p className="mt-1 text-[11px] text-ink/60">{sub}</p>}
    </div>
  );
}

const linkAll = 'flex shrink-0 items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider hover:text-[var(--sv-gold)]';

/**
 * The hero (templete/solevo Hero.tsx): a full-width picture on a warm background fading to it from the left, the eyebrow,
 * a big serif uppercase title with a copper last line, a short text and two buttons; it slides every 6 seconds, pauses
 * on hover and touch, and swipes. The template's round "Up to N% off" badge is drawn only when a real value is passed.
 */
export function SvHero({
  slides,
  shopLabel,
  exploreLabel,
  exploreHref,
  plainImage,
  badge,
}: {
  slides: SvHeroSlide[];
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
  const slide = slides[i % n];
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
      className="relative isolate overflow-hidden bg-[#e9ddd2]"
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
      {slides.map((s, idx) =>
        s.image ? (
          <div key={s.key} aria-hidden={idx !== i} className={`absolute inset-0 -z-10 transition-opacity duration-700 ${idx === i ? 'opacity-100' : 'opacity-0'}`}>
            <Picture src={s.image} alt="" plain={plainImage} priority={idx === 0} sizes="100vw" className="absolute inset-0 h-full w-full object-[70%_center]" />
          </div>
        ) : null,
      )}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#eadfd5] via-[#eadfd5]/85 to-transparent sm:via-[#eadfd5]/60 lg:via-[#eadfd5]/30" />

      <div className="sv-wrap relative flex min-h-[460px] items-center pb-24 pt-12 sm:min-h-[520px] sm:pt-14 lg:min-h-[600px] lg:pb-32">
        <div key={slide.key} className="sv-fade-up max-w-[460px]" aria-live="polite">
          {slide.eyebrow && <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sv-gold)]">{slide.eyebrow}</p>}
          <h2 className="mt-4 font-display text-[36px] font-semibold uppercase leading-[1.05] sm:text-[52px] lg:text-[58px]">
            {slide.title.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
            {slide.accent && <span className="block text-[var(--sv-gold)]">{slide.accent}</span>}
          </h2>
          {slide.text && <p className="mt-5 max-w-sm text-sm leading-relaxed text-ink/80">{slide.text}</p>}
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href={slide.href} className="sv-btn-dark">
              {shopLabel}
            </Link>
            {exploreLabel && exploreHref && (
              <Link href={exploreHref} className="sv-btn-outline">
                {exploreLabel}
              </Link>
            )}
          </div>
        </div>

        {badge && (
          <Link
            href={badge.href}
            aria-label={`${badge.top} ${badge.big} ${badge.bottom}`}
            className="absolute right-4 top-6 hidden h-[110px] w-[110px] flex-col items-center justify-center rounded-full border-[3px] border-[var(--sv-gold)] bg-ink text-center text-white shadow-xl ring-4 ring-ink transition hover:scale-105 sm:flex lg:right-8 lg:top-10 lg:h-[130px] lg:w-[130px]"
          >
            <span className="text-[8px] uppercase tracking-widest">{badge.top}</span>
            <span className="font-display text-3xl font-semibold leading-none text-[var(--sv-gold)] lg:text-4xl">{badge.big}</span>
            <span className="text-xs font-semibold tracking-widest">{badge.bottom}</span>
            <span className="mt-1 text-[7px] uppercase tracking-widest">{badge.cta}</span>
          </Link>
        )}

        {n > 1 && (
          <div className="absolute bottom-24 left-4 flex items-center gap-2 sm:left-6 lg:bottom-32 lg:left-8">
            {slides.map((s, idx) => (
              <button
                key={s.key}
                type="button"
                aria-label={`Slide ${idx + 1}`}
                aria-current={idx === i}
                onClick={() => setI(idx)}
                className={`h-[3px] transition-all ${idx === i ? 'w-8 bg-ink' : 'w-4 bg-ink/30 hover:bg-ink/50'}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * The category card that overlaps the hero's bottom edge (templete/solevo CategoryStrip.tsx): round pictures with the
 * name and "Explore Now". Six on a computer, a sideways row on a phone; more categories are reached from the menu.
 */
export function SvCategories({ items, exploreLabel, plainImage }: { items: { name: string; href: string; image?: string | null; count?: number }[]; exploreLabel: string; plainImage?: boolean }) {
  if (items.length === 0) return null;
  return (
    <section id="categories" className="sv-wrap relative z-10 -mt-16 scroll-mt-24 lg:-mt-20">
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_6px_30px_rgba(0,0,0,0.08)]">
        <div className="sv-no-scrollbar flex snap-x gap-6 overflow-x-auto px-5 py-5 sm:px-8 md:grid md:grid-cols-3 md:gap-x-6 md:gap-y-5 md:overflow-visible lg:grid-cols-6 lg:gap-4">
          {items.slice(0, 6).map((c) => (
            <Link
              key={c.name}
              href={c.href}
              title={c.count !== undefined ? String(c.count) : undefined}
              className="group flex min-w-[170px] shrink-0 snap-start items-center gap-3 text-left md:min-w-0"
            >
              <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-[#eef0f3]">
                {c.image ? (
                  <Picture src={c.image} alt={c.name} plain={plainImage} sizes="56px" className="h-full w-full transition duration-300 group-hover:scale-110" />
                ) : (
                  <span className="grid h-full w-full place-items-center font-display text-lg font-semibold uppercase text-[var(--sv-gold)]">{c.name.slice(0, 1)}</span>
                )}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[11px] font-semibold uppercase tracking-wider">{c.name}</span>
                <span className="mt-0.5 flex items-center gap-1 text-[11px] text-ink/70 group-hover:text-[var(--sv-gold)]">
                  {exploreLabel} <ArrowRight className="h-3 w-3" />
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/** A titled grid of product cards (the template's "Featured Products": 2, 3 and 5 columns) with "View All Products" on the right. */
export function SvProductGrid({ title, sub, viewAllLabel, viewAllHref, children, id, extra }: { title: string; sub?: string | null; viewAllLabel?: string; viewAllHref?: string; children: ReactNode[]; id?: string; extra?: ReactNode }) {
  if (children.length === 0) return null;
  return (
    <section id={id} className="sv-wrap scroll-mt-24 pt-12">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <SvSectionTitle title={title} sub={sub} />
          {extra}
        </div>
        {viewAllLabel && viewAllHref && (
          <Link href={viewAllHref} className={linkAll}>
            {viewAllLabel} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
        {children.map((child, i) => (
          <div key={i} className="min-w-0">
            {child}
          </div>
        ))}
      </div>
    </section>
  );
}

export interface SvPromo {
  key: string;
  kicker?: string;
  title: string;
  cta: string;
  href: string;
  image?: string | null;
}

/**
 * Offer banners (templete/solevo PromoBanners.tsx): three side by side, dark, blush and tan, each with a picture on the
 * right that fades into the colour. A store shows its own campaigns (up to three), never the template's sample offers.
 */
export function SvPromoBanners({ banners, plainImage }: { banners: SvPromo[]; plainImage?: boolean }) {
  if (banners.length === 0) return null;
  const looks = [
    { bg: 'bg-[#161616]', tag: 'text-[var(--sv-gold)]', text: 'text-white', btn: 'border-white/70 text-white group-hover:bg-white group-hover:text-ink' },
    { bg: 'bg-[var(--sv-blush)]', tag: 'text-[var(--sv-gold)]', text: 'text-ink', btn: 'border-ink/60 text-ink group-hover:bg-ink group-hover:text-white' },
    { bg: 'bg-[var(--sv-tan)]', tag: 'text-[var(--sv-gold)]', text: 'text-ink', btn: 'border-ink/60 text-ink group-hover:bg-ink group-hover:text-white' },
  ];
  const list = banners.slice(0, 3);
  const cols = list.length === 1 ? '' : list.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3';
  return (
    <section id="sale" className={`sv-wrap grid scroll-mt-24 gap-4 pt-10 ${cols}`} aria-label="Offers">
      {list.map((b, i) => {
        const look = looks[i % looks.length];
        return (
          <Link
            key={b.key}
            href={b.href}
            className={`group relative flex min-h-[170px] items-center overflow-hidden rounded-md text-left sm:min-h-[190px] ${look.bg} ${list.length === 3 && i === 2 ? 'sm:col-span-2 lg:col-span-1' : ''}`}
          >
            <div className="relative z-10 w-[55%] p-5 sm:p-6">
              {b.kicker && <p className={`text-[9px] font-semibold uppercase tracking-widest ${look.tag}`}>{b.kicker}</p>}
              <h3 className={`mt-2 whitespace-pre-line font-display text-lg font-semibold leading-snug sm:text-xl ${look.text}`}>{b.title}</h3>
              <span className={`mt-4 inline-block border px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition ${look.btn}`}>{b.cta}</span>
            </div>
            {b.image && (
              <Picture
                src={b.image}
                alt=""
                plain={plainImage}
                sizes="40vw"
                className="absolute right-0 top-0 h-full w-[55%] transition duration-500 group-hover:scale-105 [-webkit-mask-image:linear-gradient(to_right,transparent,#000_35%)] [mask-image:linear-gradient(to_right,transparent,#000_35%)]"
              />
            )}
          </Link>
        );
      })}
    </section>
  );
}

/** The endless brand strip (templete/solevo Brands.tsx): each brand's name in bold with how many styles it has; hover pauses it. */
export function SvBrands({ title, allLabel, allHref, brands, stylesLabel }: { title: string; allLabel?: string; allHref?: string; brands: { name: string; href: string; count?: number }[]; stylesLabel?: (n: number) => string }) {
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
          className="group flex w-44 shrink-0 flex-col items-center justify-center gap-1 border-l border-black/10 px-4"
        >
          <span className="max-w-full truncate text-xl font-black tracking-tight text-ink transition group-hover:text-[var(--sv-gold)]">{b.name}</span>
          {b.count !== undefined && stylesLabel && <span className="text-[9px] font-semibold uppercase tracking-wider text-ink/45">{stylesLabel(b.count)}</span>}
        </Link>
      ))}
    </div>
  );
  return (
    <section id="brands" className="sv-wrap scroll-mt-24 pt-10" aria-label={title}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <SvSectionTitle title={title} />
        {allLabel && allHref && (
          <Link href={allHref} className={linkAll}>
            {allLabel} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      <div className="sv-marquee overflow-hidden rounded-md bg-[var(--sv-panel)] py-5 [-webkit-mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)] [mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)]">
        <div className="sv-marquee-track flex w-max">
          {list(false)}
          {list(true)}
        </div>
      </div>
    </section>
  );
}

/**
 * "Why Shop With Us?" (templete/solevo WhyShop.tsx): the store's own highlights (Store > Design) in a row of small icon
 * blocks. The template's four sample reasons and its photo are not drawn on a real store.
 */
export function SvFeatures({ title, items }: { title: string; items: { key: string; icon: ReactNode; title: string; text?: string | null }[] }) {
  if (items.length === 0) return null;
  return (
    <section className="sv-wrap pb-10 pt-10" aria-label={title}>
      <h2 className="mb-5 text-sm font-bold uppercase tracking-wider">{title}</h2>
      <div className={`grid gap-6 sm:grid-cols-2 ${items.length >= 4 ? 'lg:grid-cols-4' : items.length === 3 ? 'lg:grid-cols-3' : ''}`}>
        {items.slice(0, 5).map((item) => (
          <div key={item.key} className="flex gap-3">
            <span className="shrink-0 text-ink/80">{item.icon}</span>
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-wide">{item.title}</h3>
              {item.text && <p className="mt-1 text-[11px] leading-relaxed text-ink/70">{item.text}</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Customer reviews on the home page, in the template's card style: sand cards with the name, copper stars and the words. */
export function SvReviews({ title, reviews, verifiedLabel }: { title: string; verifiedLabel: string; reviews: { id: string; name: string; rating: number; title?: string | null; content?: string | null; verified?: boolean }[] }) {
  if (reviews.length === 0) return null;
  return (
    <section className="sv-wrap pt-10">
      <h2 className="mb-5 text-sm font-bold uppercase tracking-wider">{title}</h2>
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-lg bg-[var(--sv-sand)] p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-[13px] font-bold">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-xs font-bold">{r.name.slice(0, 1).toUpperCase()}</span>
                {r.name}
              </span>
              <SolevoStars value={r.rating} className="h-3.5 w-3.5" />
            </div>
            {r.verified && <span className="mt-1 block text-[10px] font-semibold uppercase tracking-wide text-success">{verifiedLabel}</span>}
            {r.title && <p className="mt-2 text-[13px] font-semibold">{r.title}</p>}
            {r.content && <p className="mt-1 text-[12.5px] leading-relaxed text-ink/70">{r.content}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
