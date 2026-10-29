'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { StorefrontCategoryDetail } from '@/lib/storefrontApi';

interface HeroBannerProps {
  subdomain: string;
  categoryDetails: StorefrontCategoryDetail[];
  /** Store > Branding > Website cover photo: shown first; siteCoverOnly shows it alone. */
  siteCoverUrl?: string | null;
  siteCoverOnly?: boolean;
}

interface HeroSlide {
  key: string;
  alt: string;
  url: string;
  /** null = the picture is not a link. */
  href: string | null;
}

// How many banners the hero cycles through at most, and how long each
// one stays up before auto-advancing — see the component doc comment
// below for why this is randomized per page load rather than a fixed
// server-picked order.
const MAX_SLIDES = 5;
const AUTO_SLIDE_MS = 5000;

/** Fisher-Yates shuffle — used instead of `sort(() => Math.random() - 0.5)`,
 * which is a common but statistically biased shuffle. */
function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Home page hero: cycles through this vendor's own Store > Categories
 * cover photos (PUBLIC categories only — see StorefrontService's
 * getStoreProducts categoryDetails). Renders nothing when no category
 * has a cover photo set — an empty hero is preferable to a placeholder
 * that doesn't belong to this store. With exactly one cover photo
 * available, that one is shown with no dots/auto-advance (nothing to
 * cycle between). With more than one, a random subset of up to
 * MAX_SLIDES is picked fresh on every page load (so a vendor with more
 * categories than fit in the hero gets even rotation across visits
 * instead of always leading with the same one) and auto-advances every
 * AUTO_SLIDE_MS — the dots below still let a visitor jump to any slide.
 * The shuffle happens client-side after mount (not during server
 * render) so the server-rendered HTML and the first client render
 * match — picking randomly during SSR would cause a hydration mismatch
 * since the server and client would each roll their own order.
 */
export function HeroBanner({ subdomain, categoryDetails, siteCoverUrl, siteCoverOnly }: HeroBannerProps) {
  const [active, setActive] = useState(0);

  const withCover = useMemo(
    () => categoryDetails.filter((c): c is StorefrontCategoryDetail & { coverPhotoUrl: string } => Boolean(c.coverPhotoUrl)),
    [categoryDetails],
  );
  // Shuffled only after mount, as the comment above says: the server and the first browser render both use the store's own
  // order, so the HTML matches (shuffling during render gave each side its own order: a hydration mismatch that React does
  // not repair, leaving the server's picture under the browser's slide).
  const [shuffled, setShuffled] = useState<typeof withCover | null>(null);
  useEffect(() => {
    setShuffled(shuffle(withCover));
  }, [withCover]);
  // The website cover (Store > Branding) is always the first slide and links nowhere; the category covers follow it unless the
  // store asked for the cover alone. With no website cover this is exactly the old behaviour.
  const slides = useMemo<HeroSlide[]>(() => {
    const own: HeroSlide[] = siteCoverUrl ? [{ key: '__site_cover__', alt: 'Cover', url: siteCoverUrl, href: null }] : [];
    if (siteCoverUrl && siteCoverOnly) return own;
    const categories = (shuffled ?? withCover)
      .slice(0, MAX_SLIDES - own.length)
      .map((c) => ({ key: c.name, alt: c.name, url: c.coverPhotoUrl, href: `/store/${subdomain}?category=${encodeURIComponent(c.name)}` }));
    return [...own, ...categories];
  }, [withCover, shuffled, siteCoverUrl, siteCoverOnly, subdomain]);

  // Restarts after every change (`active` in the deps), so a slide the shopper picked by hand gets its full time.
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setActive((i) => (i + 1) % slides.length);
    }, AUTO_SLIDE_MS);
    return () => clearInterval(timer);
  }, [slides.length, active]);

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

  const picture = (
    <Image
      key={slide.key}
      src={slide.url}
      alt={slide.alt}
      fill
      sizes="(max-width: 1100px) 100vw, 1100px"
      className="object-cover"
      priority
    />
  );

  return (
    <section data-rg="hero" className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
      {/* Fixed aspect ratio, the SAME ratio on every screen size (mobile,
          tablet, desktop, ultra-wide) — matches the reference site's
          own slider, which never changes shape, only scales with the
          container. A vendor's cover photos of any source size/shape
          all render at this one ratio via object-cover (crops to fill
          rather than distorting or letterboxing). 21:9 mirrors the
          reference site's wide, short banner proportions. */}
      {/* An even shadow on all four sides (no offset) plus a faint outline, so the banner lifts off the grey page (2026-10-29). */}
      <div
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="group relative rounded-lg overflow-hidden bg-surface aspect-[21/9] shadow-[0_0_0_1px_rgba(16,18,22,0.05),0_0_24px_rgba(16,18,22,0.14)]">
        {slide.href ? (
          <Link href={slide.href} className="absolute inset-0 block">
            {picture}
          </Link>
        ) : (
          <div className="absolute inset-0">{picture}</div>
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
                key={s.key}
                onClick={() => setActive(i)}
                aria-label={`Show ${s.alt}`}
                className={`w-2 h-2 rounded-full transition-colors ${i === active ? 'bg-white' : 'bg-white/50'}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
