'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { heroSlideHref, isOutsideLink, type StoreHeroSlide } from '@/lib/heroSlides';

interface HeroBannerProps {
  subdomain: string;
  /** Store > Hero Section's pictures, already cut to the plan's limit by the server. */
  slides: StoreHeroSlide[];
  storeName: string;
}

const AUTO_SLIDE_MS = 6000;

/**
 * StorePal's home page hero: the pictures the store chose in Store > Hero Section, in the store's own order (category covers are no longer
 * used here, the owner's rule 2026-11-17). Nothing renders without a picture. With more than one it moves on every AUTO_SLIDE_MS, but stops
 * while the pointer or keyboard focus is on it, while the tab is hidden, and never moves by itself for a shopper whose system asks for
 * reduced motion (WCAG 2.2.2): arrows, dots and swiping still work.
 */
export function HeroBanner({ subdomain, slides, storeName }: HeroBannerProps) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  // Restarts after every change (`active` in the deps), so a slide the shopper picked by hand gets its full time.
  useEffect(() => {
    if (slides.length <= 1 || paused || reduced) return;
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') setActive((i) => (i + 1) % slides.length);
    }, AUTO_SLIDE_MS);
    return () => clearInterval(timer);
  }, [slides.length, active, paused, reduced]);

  const go = (step: number) => setActive((i) => (i + step + slides.length) % slides.length);

  // Phones: swipe left / right to change the slide. A mostly up-and-down move is a page scroll and is left alone.
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start || slides.length <= 1) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
    go(dx < 0 ? 1 : -1);
  };

  if (slides.length === 0) return null;

  const slide = slides[Math.min(active, slides.length - 1)];
  const href = heroSlideHref(slide.link, subdomain);
  const outside = href ? isOutsideLink(href) : false;
  const hasWords = Boolean(slide.title || slide.text);
  const alt = slide.title || `${storeName} ${active + 1}`;

  const picture = (
    <Image key={slide.id} src={slide.imageUrl} alt={alt} fill sizes="(max-width: 1100px) 100vw, 1100px" className="object-cover" priority={active === 0} />
  );

  const words = hasWords && (
    <div className="pointer-events-none absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-black/15 to-transparent sm:items-center sm:bg-gradient-to-r sm:from-black/55 sm:via-black/20 sm:to-transparent">
      <div className="max-w-[80%] p-4 text-white sm:max-w-[55%] sm:p-10">
        {slide.title && <h2 className="text-lg font-bold leading-tight sm:text-3xl md:text-4xl">{slide.title}</h2>}
        {slide.text && <p className="mt-1 text-xs text-white/90 sm:mt-3 sm:text-base">{slide.text}</p>}
        {href && slide.buttonText && (
          <span className="mt-3 inline-block rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-ink sm:mt-5 sm:px-5 sm:py-2.5 sm:text-sm">
            {slide.buttonText}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <section data-rg="hero" className="max-w-6xl mx-auto px-3 sm:px-6 pt-6" aria-roledescription="carousel" aria-label={storeName}>
      {/* One fixed 21:9 shape on every screen; any picture is cropped to fill it (object-cover). An even shadow lifts it off the page. */}
      <div
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        className="group relative rounded-lg overflow-hidden bg-surface aspect-[21/9] shadow-[0_0_0_1px_rgba(16,18,22,0.05),0_0_24px_rgba(16,18,22,0.14)]"
      >
        {href ? (
          outside ? (
            <a href={href} target="_blank" rel="noopener noreferrer" className="absolute inset-0 block">
              {picture}
              {words}
            </a>
          ) : (
            <Link href={href} className="absolute inset-0 block">
              {picture}
              {words}
            </Link>
          )
        ) : (
          <div className="absolute inset-0">
            {picture}
            {words}
          </div>
        )}

        {/* Computers: previous / next arrows that show while the mouse is over the banner (phones swipe instead). */}
        {slides.length > 1 &&
          ([
            { step: -1, label: 'Previous slide', side: 'left-3', Icon: ChevronLeft },
            { step: 1, label: 'Next slide', side: 'right-3', Icon: ChevronRight },
          ] as const).map(({ step, label, side, Icon }) => (
            <button
              key={label}
              type="button"
              onClick={() => go(step)}
              aria-label={label}
              className={`absolute ${side} top-1/2 -translate-y-1/2 hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-white/85 text-ink shadow-md opacity-0 transition-opacity duration-200 hover:bg-white group-hover:opacity-100 focus-visible:opacity-100`}
            >
              <Icon size={22} strokeWidth={2.25} />
            </button>
          ))}

        {slides.length > 1 && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-3 flex gap-1.5">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show slide ${i + 1}`}
                aria-current={i === active}
                className={`w-2 h-2 rounded-full transition-colors ${i === active ? 'bg-white' : 'bg-white/50'}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
