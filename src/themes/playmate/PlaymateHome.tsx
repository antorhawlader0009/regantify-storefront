'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ChevronLeft, ChevronRight } from './icons';

/*
 * PlayMate's home sections (templete/playmate Hero, Features, Categories, BestSellers, PromoBanners, Brands): drawing
 * only, fed by the store's own data in StorePal's HomeView (skin playmate) and by sample data on the template demo
 * page. `plainImage` switches pictures to a plain <img> for the demo's outside photos.
 */

function Picture({ src, alt, className, plain, priority, sizes }: { src: string; alt: string; className: string; plain?: boolean; priority?: boolean; sizes: string }) {
  if (plain) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} loading={priority ? 'eager' : 'lazy'} className={`${className} object-cover`} />;
  }
  return (
    // A slide picture is placed `absolute` by its caller; anything else needs `relative` for the filled image.
    <span className={`${className} block ${/\babsolute\b/.test(className) ? '' : 'relative'}`}>
      <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className="object-cover" />
    </span>
  );
}

export interface PmHeroSlide {
  key: string;
  image?: string | null;
  kicker?: string;
  title1: string;
  title2?: string;
  accent?: string;
  text?: string;
  alt?: string;
  href: string;
}

/** Scalloped badge from the demo ("BEST TOYS FOR HAPPY KIDS"); only the demo passes words for it. */
function Badge({ big, small }: { big: string[]; small: string[] }) {
  const N = 14;
  const pts: string[] = [];
  for (let s = 0; s <= 240; s++) {
    const t = (s / 240) * Math.PI * 2;
    const r = 44 + 4 * Math.cos(N * t);
    pts.push(`${(50 + r * Math.cos(t)).toFixed(2)},${(50 + r * Math.sin(t)).toFixed(2)}`);
  }
  return (
    <div className="relative h-[92px] w-[92px] rotate-[8deg] sm:h-[118px] sm:w-[118px]">
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full drop-shadow-md" aria-hidden="true">
        <polygon points={pts.join(' ')} fill="var(--color-accent)" />
        <circle cx="50" cy="50" r="38" fill="none" stroke="#fff" strokeOpacity="0.5" strokeDasharray="2 3" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white">
        <span className="text-[17px] font-extrabold leading-[1.05] sm:text-[22px]">
          {big.map((w, i) => (
            <span key={i} className="block">
              {w}
            </span>
          ))}
        </span>
        <span className="mt-1 text-[7px] font-semibold leading-tight tracking-wide sm:text-[8.5px]">
          {small.map((w, i) => (
            <span key={i} className="block">
              {w}
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}

export function PmHero({
  slides,
  shopLabel,
  exploreLabel,
  exploreHref,
  plainImage,
  badge,
}: {
  slides: PmHeroSlide[];
  shopLabel: string;
  exploreLabel?: string;
  exploreHref?: string;
  plainImage?: boolean;
  badge?: { big: string[]; small: string[] } | null;
}) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || slides.length < 2) return;
    const timer = setInterval(() => setActive((v) => (v + 1) % slides.length), 6000);
    return () => clearInterval(timer);
  }, [paused, slides.length]);
  if (slides.length === 0) return null;
  const fade = '[-webkit-mask-image:linear-gradient(to_right,transparent,#000_32%)] [mask-image:linear-gradient(to_right,transparent,#000_32%)]';
  return (
    <section
      data-rg="hero"
      className="relative overflow-hidden bg-gradient-to-r from-[#eef0f8] via-[#f4f2f6] to-[#f6ece0]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[62%] md:block" aria-hidden="true">
        {slides.map((s, idx) =>
          s.image ? (
            <Picture
              key={s.key}
              src={s.image}
              alt=""
              plain={plainImage}
              priority={idx === 0}
              sizes="62vw"
              className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${fade} ${idx === active ? 'opacity-100' : 'opacity-0'}`}
            />
          ) : null,
        )}
      </div>
      <div className="pm-wrap relative grid">
        {slides.map((s, idx) => (
          <div
            key={s.key}
            className={`col-start-1 row-start-1 grid items-center gap-2 transition-opacity duration-700 md:min-h-[440px] md:grid-cols-[0.82fr_1.18fr] ${
              idx === active ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
            aria-hidden={idx !== active}
          >
            <div className="pb-4 pt-9 md:py-14">
              {s.kicker && <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-accent">{s.kicker}</p>}
              <h2 className="mt-3 text-[34px] font-extrabold leading-[1.08] tracking-tight text-[#14123a] sm:text-5xl lg:text-[52px]">
                {s.title1}
                {(s.title2 || s.accent) && <br />}
                {s.title2} {s.accent && <span className="text-accent">{s.accent}</span>}
              </h2>
              {s.text && <p className="mt-4 max-w-[320px] text-[15px] leading-relaxed text-ink/80">{s.text}</p>}
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href={s.href} className="pm-btn-primary">
                  {shopLabel}
                </Link>
                {exploreLabel && exploreHref && (
                  <Link href={exploreHref} className="pm-btn-outline">
                    {exploreLabel}
                  </Link>
                )}
              </div>
            </div>
            <div className="relative pb-8 md:self-stretch md:pb-0">
              {s.image && (
                <Picture src={s.image} alt={s.alt ?? s.title1} plain={plainImage} priority={idx === 0} sizes="100vw" className="h-[230px] w-full overflow-hidden rounded-2xl sm:h-[300px] md:hidden" />
              )}
              {badge && (
                <div className="absolute right-2 top-3 sm:right-4 sm:top-5 md:right-0 md:top-10">
                  <Badge big={badge.big} small={badge.small} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {slides.length > 1 && (
        <div className="pm-wrap relative -mt-2 pb-5 md:absolute md:bottom-6 md:left-0 md:right-0 md:mt-0 md:pb-0">
          <div className="flex items-center gap-2.5">
            {slides.map((s, idx) => (
              <button
                key={s.key}
                type="button"
                aria-label={`Slide ${idx + 1}`}
                aria-current={idx === active}
                onClick={() => setActive(idx)}
                className={`h-2.5 rounded-full transition-all ${idx === active ? 'w-6 bg-accent' : 'w-2.5 bg-gray-300 hover:bg-gray-400'}`}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/** The perks strip under the hero (the demo's Features): the store's own highlights. */
export function PmFeatures({ items }: { items: { key: string; icon: ReactNode; title: string; text?: string | null }[] }) {
  if (items.length === 0) return null;
  return (
    <section className="border-b border-line" aria-label="Store benefits">
      <div className={`pm-wrap grid grid-cols-2 gap-y-6 py-6 md:grid-cols-3 ${items.length >= 5 ? 'lg:grid-cols-5' : items.length === 4 ? 'lg:grid-cols-4' : ''} lg:gap-y-0`}>
        {items.slice(0, 5).map((item, i) => (
          <div key={item.key} className={`flex items-center gap-3 px-2 lg:justify-center lg:px-4 ${i > 0 ? 'lg:border-l lg:border-gray-200' : ''}`}>
            <span className="shrink-0 text-ink">{item.icon}</span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wide text-ink">{item.title}</p>
              {item.text && <p className="text-[11px] text-muted">{item.text}</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function SectionTitle({ title, center }: { title: string; center?: boolean }) {
  return (
    <div className={center ? 'text-center' : ''}>
      <h2 className="text-[15px] font-bold uppercase tracking-wide text-ink">{title}</h2>
      {center && <span className="mx-auto mt-2 block h-[2px] w-9 bg-[#d14a6b]" />}
    </div>
  );
}

/** Round category pictures (the demo's Shop by Category). */
export function PmCategories({ title, items, shopLabel, plainImage }: { title: string; items: { name: string; href: string; image?: string | null }[]; shopLabel: string; plainImage?: boolean }) {
  if (items.length === 0) return null;
  const tints = ['#fde9d9', '#e3f1fb', '#fbe3ec', '#e6f6e4', '#efe7fb', '#fff3cc', '#e2f4f3', '#fbe9e3'];
  return (
    <section id="categories" className="scroll-mt-20 py-10 sm:py-12">
      <div className="pm-wrap">
        <SectionTitle title={title} center />
        <ul className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 min-[480px]:grid-cols-4 lg:grid-cols-8">
          {items.slice(0, 8).map((c, i) => (
            <li key={c.name}>
              <Link href={c.href} className="group flex flex-col items-center rounded-lg text-center">
                <span
                  className="relative h-[88px] w-[88px] overflow-hidden rounded-full ring-2 ring-white transition duration-300 group-hover:-translate-y-1 group-hover:shadow-lg sm:h-24 sm:w-24"
                  style={{ background: tints[i % tints.length] }}
                >
                  {c.image ? (
                    <Picture src={c.image} alt={c.name} plain={plainImage} sizes="96px" className="h-full w-full transition duration-500 group-hover:scale-110" />
                  ) : (
                    <span className="grid h-full w-full place-items-center text-[28px] font-extrabold uppercase text-accent">{c.name.slice(0, 1)}</span>
                  )}
                </span>
                <span className="mt-3 text-[10.5px] font-bold uppercase leading-tight tracking-wide text-ink">{c.name}</span>
                <span className="mt-0.5 text-[10.5px] text-muted group-hover:text-accent">{shopLabel}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** A row of product cards that scrolls sideways with arrows (the demo's Best Sellers). */
export function PmProductRow({ title, viewAllLabel, viewAllHref, children, id, extra }: { title: string; viewAllLabel?: string; viewAllHref?: string; children: ReactNode[]; id?: string; extra?: ReactNode }) {
  const ref = useRef<HTMLUListElement>(null);
  if (children.length === 0) return null;
  const scroll = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: 'smooth' });
  const arrow = 'absolute top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-line bg-white text-ink shadow transition hover:bg-accent hover:text-white sm:grid';
  return (
    <section id={id} className="scroll-mt-20 pb-10">
      <div className="pm-wrap">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <SectionTitle title={title} />
            {extra}
          </div>
          {viewAllLabel && viewAllHref && (
            <Link href={viewAllHref} className="inline-flex shrink-0 items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-ink hover:text-accent">
              {viewAllLabel} <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
        <div className="relative">
          <button type="button" className={`${arrow} -left-4 lg:-left-5`} aria-label="Previous" onClick={() => scroll(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button type="button" className={`${arrow} -right-4 lg:-right-5`} aria-label="Next" onClick={() => scroll(1)}>
            <ChevronRight className="h-4 w-4" />
          </button>
          <ul ref={ref} className="pm-no-scrollbar -mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-3 pt-1">
            {children.map((child, i) => (
              <li
                key={i}
                className="shrink-0 basis-[calc((100%-16px)/2)] snap-start min-[560px]:basis-[calc((100%-32px)/3)] md:basis-[calc((100%-48px)/4)] lg:basis-[calc((100%-80px)/6)]"
              >
                {child}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export interface PmPromo {
  key: string;
  kicker: string;
  title: string;
  text?: string;
  cta: string;
  href: string;
  image?: string | null;
}

/** Two side-by-side offer banners, purple then yellow (the demo's PromoBanners). */
export function PmPromoBanners({ banners, plainImage }: { banners: PmPromo[]; plainImage?: boolean }) {
  if (banners.length === 0) return null;
  const fade = '[-webkit-mask-image:linear-gradient(to_right,transparent,#000_40%)] [mask-image:linear-gradient(to_right,transparent,#000_40%)]';
  return (
    <section className="pb-10" aria-label="Offers">
      <div className="pm-wrap grid gap-4 md:grid-cols-2">
        {banners.slice(0, 2).map((b, i) => {
          const purple = i % 2 === 0;
          return (
            <div
              key={b.key}
              className={`relative flex min-h-[190px] items-center overflow-hidden rounded-[6px] p-6 sm:p-8 ${purple ? 'bg-gradient-to-br from-accent to-[#7b5dd2]' : 'bg-[var(--pm-yellow)]'}`}
            >
              {b.image && <Picture src={b.image} alt="" plain={plainImage} sizes="50vw" className={`absolute inset-y-0 right-0 h-full w-[52%] ${fade}`} />}
              <div className="relative z-10 max-w-[58%]">
                <p className={`text-[11px] font-semibold uppercase tracking-wide ${purple ? 'text-[var(--pm-yellow)]' : 'text-accent'}`}>{b.kicker}</p>
                <h3 className={`mt-2 text-[22px] font-extrabold uppercase leading-tight sm:text-[28px] ${purple ? 'text-white' : 'text-ink'}`}>{b.title}</h3>
                {b.text && <p className={`mt-2 text-[12px] font-semibold uppercase tracking-wide ${purple ? 'text-white' : 'text-ink'}`}>{b.text}</p>}
                <Link
                  href={b.href}
                  className={`mt-5 inline-block rounded-[4px] px-5 py-2.5 text-[11px] font-bold uppercase tracking-wide transition ${
                    purple ? 'bg-[var(--pm-yellow)] text-ink hover:brightness-95' : 'bg-accent text-white hover:bg-accent-dark'
                  }`}
                >
                  {b.cta}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** The endless brand strip (the demo's Top Brands). Brands are shown as text pills, linking to the store's brand view. */
export function PmBrands({ title, brands }: { title: string; brands: { name: string; href: string }[] }) {
  if (brands.length === 0) return null;
  const colors = ['#e3000b', '#6c4fc4', '#f58220', '#1b4f9c', '#e9399c', '#1a7a4c', '#d62b2b', '#2f80ed'];
  const list = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center gap-10 pr-10 sm:gap-14 sm:pr-14" aria-hidden={hidden || undefined}>
      {[...brands, ...brands].map((b, idx) => (
        <li key={`${b.name}-${idx}`} className="flex h-12 shrink-0 items-center">
          <Link
            href={b.href}
            tabIndex={hidden || idx >= brands.length ? -1 : undefined}
            className="flex h-full items-center rounded transition duration-200 hover:scale-110"
          >
            <span className="rounded-full px-3.5 py-1 text-[15px] font-extrabold italic leading-none text-white" style={{ backgroundColor: colors[idx % colors.length] }}>
              {b.name}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
  return (
    <section className="bg-[var(--pm-soft)]" aria-label={title}>
      <div className="pm-wrap flex items-center gap-4 py-5 sm:gap-6">
        <h2 className="shrink-0 text-[12px] font-bold uppercase tracking-wide text-ink">{title}</h2>
        <div className="pm-marquee relative min-w-0 flex-1 overflow-hidden [-webkit-mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)] [mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)]">
          <div className="pm-marquee-track flex w-max will-change-transform">
            {list(false)}
            {list(true)}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Customer reviews as PlayMate cards. */
export function PmReviews({ title, reviews, verifiedLabel }: { title: string; verifiedLabel: string; reviews: { id: string; name: string; rating: number; title?: string | null; content?: string | null; verified?: boolean }[] }) {
  if (reviews.length === 0) return null;
  return (
    <section className="py-10">
      <div className="pm-wrap">
        <SectionTitle title={title} center />
        <div className="mt-8 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-[6px] bg-[var(--pm-card)] p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-bold text-ink">{r.name}</span>
                <span className="text-[13px] tracking-tight text-[var(--pm-yellow-strong)]" aria-label={`${r.rating} out of 5`}>
                  {'★'.repeat(Math.round(r.rating))}
                  <span className="text-[#d9d6e6]">{'★'.repeat(5 - Math.round(r.rating))}</span>
                </span>
              </div>
              {r.verified && <span className="mt-1 block text-[10px] font-semibold uppercase tracking-wide text-success">{verifiedLabel}</span>}
              {r.title && <p className="mt-2 text-[13px] font-semibold text-ink">{r.title}</p>}
              {r.content && <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{r.content}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
