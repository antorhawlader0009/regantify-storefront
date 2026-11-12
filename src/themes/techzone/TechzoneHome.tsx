'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ChevronLeft, ChevronRight } from './icons';
import { TechzoneStars } from './TechzoneCard';

/*
 * TechZone's home sections (components/Hero, Categories, BestSellers, PromoBanners, Brands, FeatureStrip, Reviews): drawing
 * only, fed by the store's own data in StorePal's HomeView (skin techzone) and by sample data on the template demo page.
 * `plainImage` switches pictures to a plain <img> for the demo's outside photos. Nothing here invents a promise: a part shows
 * only what the store wrote or what exists, and is left out otherwise (the template's sample words such as "Free Shipping",
 * "Genuine Products" and its three customer quotes are not shown on a real store).
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

export interface TzHeroSlide {
  key: string;
  image?: string | null;
  eyebrow?: string;
  /** Lines of the slide's title. */
  title: string[];
  accent?: string;
  text?: string;
  href: string;
}

/** The template's section title: heavy navy, 24 to 28px, with an optional small grey line under it. */
export function TzSectionTitle({ title, sub }: { title: ReactNode; sub?: string | null }) {
  return (
    <div>
      <h2 className="text-2xl font-extrabold text-[var(--tz-navy)] sm:text-[28px]">{title}</h2>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

/** The template's blue "View ..." button beside a section title (BestSellers, RecommendedForYou). */
const viewAllBtn = 'inline-flex h-9 shrink-0 items-center gap-2 rounded-lg bg-[var(--tz-brand)] px-4 text-xs font-semibold !text-white transition hover:bg-[var(--tz-brand-dark)]';
/** The template's small text link beside the category title ("View All Categories"). */
const viewAllText = 'inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-[var(--tz-navy)] transition hover:text-[var(--tz-brand)]';

/**
 * The hero (components/Hero.tsx): a full-width dark navy section that fills the screen below the header. A slide with words
 * shows them on the left (a small spaced caption, a big heavy title, a blue Shop Now button) and its picture on the right,
 * fading into the navy; a slide that is only a picture (the store's website cover) fills the whole section. The dots sit at
 * the bottom left (the open one long and blue). It changes every 4 seconds, pauses on hover and touch, and swipes. A store
 * with no picture gets its name over the navy with a Shop now button.
 */
export function TzHero({
  slides,
  shopLabel,
  plainImage,
}: {
  slides: TzHeroSlide[];
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
    const timer = setInterval(() => setI((x) => (x + 1) % n), 4000);
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
  const s = slides[i];
  // Words on the slide: the template's split layout. A picture-only slide is the whole section.
  const hasWords = !!s.eyebrow || !s.image;

  return (
    <section
      data-rg="hero"
      className="relative overflow-hidden bg-[var(--tz-hero)] text-white"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
        setPaused(true);
      }}
      onTouchEnd={onTouchEnd}
    >
      {slides.map((sl, idx) => {
        if (!sl.image) return null;
        const full = !sl.eyebrow;
        return (
          <div
            key={sl.key}
            aria-hidden
            className={`absolute inset-y-0 right-0 transition-opacity duration-1000 ${full ? 'w-full' : 'w-full lg:w-[70%]'} ${idx === i ? 'opacity-100' : 'opacity-0'}`}
            style={full ? undefined : { maskImage: 'linear-gradient(to right, transparent 0%, black 28%)', WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 28%)' }}
          >
            <Picture src={sl.image} alt="" plain={plainImage} priority={idx === 0} sizes="100vw" className="absolute inset-0 h-full w-full object-center" />
          </div>
        );
      })}

      {/* light overlays: only enough to keep the words readable and blend the edges */}
      {hasWords && <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#050f22] from-20% via-[#050f22]/45 via-45% to-transparent to-70% max-lg:bg-[#050f22]/65 max-lg:bg-none" />}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#050f22]/50 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#050f22]/60 to-transparent" />

      <div className="tz-hero-fill relative mx-auto grid max-w-[1200px] items-center px-4 py-12 lg:px-16">
        {hasWords ? (
          <div className="relative z-10 max-w-md">
            {s.eyebrow && <p className="mb-5 text-xs font-medium uppercase tracking-[0.2em] text-slate-300">{s.eyebrow}</p>}
            <h2 className="text-4xl font-extrabold leading-[1.1] !text-white sm:text-5xl">
              {s.title.join(' ')}
              {s.accent && (
                <>
                  <br />
                  <span className="text-[var(--tz-brand)]">{s.accent}</span>
                </>
              )}
            </h2>
            {s.text && <p className="mt-5 max-w-sm text-sm leading-relaxed text-slate-200">{s.text}</p>}
            <Link href={s.href} className="tz-btn mt-7 !h-11 !px-6">
              {shopLabel} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <Link href={s.href} aria-label={s.title.join(' ')} className="absolute inset-0 z-10" />
        )}
      </div>

      {n > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            className="absolute left-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/30 lg:grid"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            className="absolute right-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/30 lg:grid"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2 lg:left-16 lg:translate-x-0">
            {slides.map((sl, idx) => (
              <button
                key={sl.key}
                type="button"
                aria-label={`Slide ${idx + 1}`}
                aria-current={idx === i}
                onClick={() => setI(idx)}
                className={`h-1.5 rounded-full transition-all ${idx === i ? 'w-5 bg-[var(--tz-brand)]' : 'w-2 bg-white/40'}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

/**
 * The category grid (components/Categories.tsx): small cards with a grey gradient photo area (the photo multiplied into it, a
 * little zoom on hover) and a soft-blue label strip with the name and an arrow; two across on a phone, three from 640px and
 * six from 1024px. A category with no picture shows its first letter on the grey.
 */
export function TzCategories({
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
    <section id="categories" className="tz-wrap scroll-mt-32 pt-12" aria-label={title}>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="mb-2 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.15em] text-[var(--tz-navy)]">
            <span className="h-px w-6 bg-[var(--tz-brand)]" /> {title}
          </p>
        </div>
        {viewAllLabel && viewAllHref && (
          <Link href={viewAllHref} className={viewAllText}>
            {viewAllLabel} <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {items.map((c) => (
          <Link key={c.name} href={c.href} className="group overflow-hidden rounded-lg bg-slate-100 transition hover:shadow-lg">
            <div className="relative flex h-28 items-center justify-center overflow-hidden bg-gradient-to-b from-slate-100 to-slate-200/70 sm:h-32 lg:h-[115px]">
              {c.image ? (
                <Picture src={c.image} alt="" plain={plainImage} sizes="220px" className="absolute inset-0 h-full w-full mix-blend-multiply transition duration-500 group-hover:scale-105" />
              ) : (
                <span className="text-3xl font-extrabold text-slate-400">{c.name.slice(0, 1)}</span>
              )}
            </div>
            <div className="flex items-center gap-2 bg-[var(--tz-soft)] px-3 py-2.5 text-xs font-medium text-[var(--tz-navy)]">
              <span className="min-w-0 truncate">{c.name}</span> <ArrowRight className="h-3 w-3 shrink-0" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/**
 * A titled row of product cards (BestSellers / RecommendedForYou): a heavy navy title with a small grey line, the blue
 * "View ..." button on the right, then 2 columns on a phone and 4 from 1024px.
 */
export function TzProductGrid({ title, sub, viewAllLabel, viewAllHref, children, id, extra }: { title: string; sub?: string | null; viewAllLabel?: string; viewAllHref?: string; children: ReactNode[]; id?: string; extra?: ReactNode }) {
  if (children.length === 0) return null;
  return (
    <section id={id} className="tz-wrap scroll-mt-32 pt-14" aria-label={title}>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div className="flex min-w-0 flex-wrap items-end gap-3">
          <TzSectionTitle title={title} sub={sub} />
          {extra}
        </div>
        {viewAllLabel && viewAllHref && (
          <Link href={viewAllHref} className={viewAllBtn}>
            {viewAllLabel} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {children.map((child, i) => (
          <div key={i} className="h-full min-w-0">
            {child}
          </div>
        ))}
      </div>
    </section>
  );
}

export interface TzPromo {
  key: string;
  kicker?: string;
  title: string;
  cta: string;
  href: string;
  image?: string | null;
}

/**
 * The offer banners (components/PromoBanners.tsx): a store's own campaigns (up to three) as rounded banners, the first dark
 * (navy gradient, white words, white button), the next light (soft blue-lilac gradient, navy words, blue button), and so on,
 * each with its picture on the right fading in. Never the template's sample words.
 */
export function TzPromoBanners({ banners, plainImage }: { banners: TzPromo[]; plainImage?: boolean }) {
  if (banners.length === 0) return null;
  const list = banners.slice(0, 3);
  return (
    <section id="sale" className={`tz-wrap grid scroll-mt-32 gap-5 pt-12 ${list.length === 1 ? '' : list.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'}`} aria-label="Offers">
      {list.map((b, idx) => {
        const dark = idx % 2 === 0;
        return (
          <Link
            key={b.key}
            href={b.href}
            className={`group relative block min-h-[200px] overflow-hidden rounded-lg ${dark ? 'bg-gradient-to-r from-[#050f22] via-[#0a2150] to-[#0b2a66] text-white' : 'bg-gradient-to-r from-[#dbeafe] via-[#e4eafe] to-[#ead9fb] text-[var(--tz-navy)]'}`}
          >
            {b.image && (
              <Picture
                src={b.image}
                alt=""
                plain={plainImage}
                sizes="(max-width: 768px) 100vw, 600px"
                className={`absolute inset-y-0 right-0 h-full w-3/5 transition duration-500 group-hover:scale-105 [mask-image:linear-gradient(to_right,transparent,black_55%)] ${dark ? 'opacity-80' : ''}`}
              />
            )}
            <span className="relative z-10 flex h-full min-h-[200px] max-w-[60%] flex-col justify-center p-6 sm:p-8">
              {b.kicker && <span className={`text-[10px] uppercase tracking-[0.2em] ${dark ? 'text-slate-300' : 'text-slate-600'}`}>{b.kicker}</span>}
              <span className={`mt-2 text-xl font-bold sm:text-2xl ${dark ? 'text-white' : 'text-[var(--tz-navy)]'}`}>{b.title}</span>
              <span
                className={`mt-4 inline-flex h-8 w-fit items-center gap-2 rounded-md px-4 text-[11px] font-semibold transition ${dark ? 'bg-white text-[var(--tz-navy)] group-hover:bg-slate-100' : 'bg-[var(--tz-brand)] text-white group-hover:bg-[var(--tz-brand-dark)]'}`}
              >
                {b.cta} <ArrowRight className="h-3 w-3" />
              </span>
            </span>
          </Link>
        );
      })}
    </section>
  );
}

/**
 * The brand strip (components/Brands.tsx): a soft-blue rounded band with the brands in bold navy capitals moving slowly left
 * to right (paused on hover, faded at both ends). The store's brand names stand where the template shows brand logos.
 */
export function TzBrands({ title, allLabel, allHref, brands }: { title: string; allLabel?: string; allHref?: string; brands: { name: string; href: string; count?: number }[]; stylesLabel?: (n: number) => string }) {
  // Enough copies in one set that the loop has no gap on a wide screen.
  const set = useMemo(() => {
    if (brands.length === 0) return [];
    const out: typeof brands = [];
    while (out.length < 8) out.push(...brands);
    return out;
  }, [brands]);
  if (brands.length === 0) return null;
  return (
    <section id="brands" className="tz-wrap scroll-mt-32 pt-10" aria-label={title}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-[var(--tz-navy)]">{title}</h2>
        {allLabel && allHref && (
          <Link href={allHref} className={viewAllText}>
            {allLabel} <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
      <div
        className="tz-marquee overflow-hidden rounded-lg bg-[var(--tz-soft)] py-4"
        style={{ maskImage: 'linear-gradient(to right, transparent, black 6%, black 94%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 6%, black 94%, transparent)' }}
      >
        {/* two identical sets make a seamless endless loop */}
        <div className="tz-marquee-track flex w-max">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center gap-16 pr-16" aria-hidden={copy === 1 || undefined}>
              {set.map((b, idx) => (
                <Link key={`${b.name}-${idx}`} href={b.href} tabIndex={copy === 1 ? -1 : undefined} className="shrink-0 whitespace-nowrap text-sm font-extrabold uppercase tracking-[0.15em] text-[var(--tz-navy)] transition hover:text-[var(--tz-brand)]">
                  {b.name}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * The highlights strip (components/FeatureStrip.tsx): a full-width soft-blue band, each item a thin navy icon with a small
 * bold title and a grey line, in one row of four. Only the store's own highlights (Store > Design) are drawn; the template's
 * "Free Shipping" and the like are sample words.
 */
export function TzFeatures({ title, items }: { title: string; items: { key: string; icon: ReactNode; title: string; text?: string | null }[] }) {
  if (items.length === 0) return null;
  const shown = items.slice(0, 4);
  return (
    <section className="mt-14 bg-[var(--tz-soft)]" aria-label={title}>
      <div className={`tz-wrap grid grid-cols-1 gap-5 py-6 sm:grid-cols-2 ${shown.length >= 4 ? 'lg:grid-cols-4' : shown.length === 3 ? 'lg:grid-cols-3' : ''}`}>
        {shown.map((item) => (
          <div key={item.key} className="flex items-center gap-4 lg:justify-center">
            <span className="text-[var(--tz-navy)] [&_svg]:h-[34px] [&_svg]:w-[34px] [&_svg]:stroke-[1.3]">{item.icon}</span>
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold text-[var(--tz-navy)]">{item.title}</span>
              {item.text && <span className="block text-xs text-slate-500">{item.text}</span>}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Customer reviews on the home page (components/Reviews.tsx): bordered cards with a round initial, stars, the words and the name. */
export function TzReviews({ title, reviews, verifiedLabel }: { title: string; verifiedLabel: string; reviews: { id: string; name: string; rating: number; title?: string | null; content?: string | null; verified?: boolean }[] }) {
  if (reviews.length === 0) return null;
  return (
    <section className="tz-wrap py-10">
      <div className="mb-3">
        <h2 className="text-base font-bold text-[var(--tz-navy)]">{title}</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {reviews.slice(0, 6).map((r) => (
          <figure key={r.id} className="flex items-center gap-4 rounded-md border border-slate-200 bg-white p-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[var(--tz-soft)] text-lg font-bold text-[var(--tz-brand)]">{r.name.slice(0, 1).toUpperCase()}</span>
            <div className="min-w-0">
              <TechzoneStars value={r.rating} className="h-[11px] w-[11px]" />
              {r.title && <p className="mt-1.5 text-[12px] font-semibold text-[var(--tz-navy)]">{r.title}</p>}
              {r.content && <blockquote className="mt-1 line-clamp-4 text-[11px] leading-snug text-slate-700">&quot;{r.content}&quot;</blockquote>}
              <figcaption className="mt-1.5 text-[11px] text-slate-500">
                {r.name}
                {r.verified && <span className="ml-2 font-semibold text-success">{verifiedLabel}</span>}
              </figcaption>
            </div>
          </figure>
        ))}
      </div>
    </section>
  );
}
