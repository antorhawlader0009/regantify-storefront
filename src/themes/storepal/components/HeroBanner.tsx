'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { StorefrontCategoryDetail } from '@/lib/storefrontApi';

interface HeroBannerProps {
  subdomain: string;
  categoryDetails: StorefrontCategoryDetail[];
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
export function HeroBanner({ subdomain, categoryDetails }: HeroBannerProps) {
  const [active, setActive] = useState(0);

  const withCover = useMemo(
    () => categoryDetails.filter((c): c is StorefrontCategoryDetail & { coverPhotoUrl: string } => Boolean(c.coverPhotoUrl)),
    [categoryDetails],
  );
  const slides = useMemo(() => shuffle(withCover).slice(0, MAX_SLIDES), [withCover]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setActive((i) => (i + 1) % slides.length);
    }, AUTO_SLIDE_MS);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (slides.length === 0) return null;

  const category = slides[active];

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
      {/* Fixed aspect ratio, the SAME ratio on every screen size (mobile,
          tablet, desktop, ultra-wide) — matches the reference site's
          own slider, which never changes shape, only scales with the
          container. A vendor's cover photos of any source size/shape
          all render at this one ratio via object-cover (crops to fill
          rather than distorting or letterboxing). 21:9 mirrors the
          reference site's wide, short banner proportions. */}
      <div className="relative rounded-lg overflow-hidden bg-surface aspect-[21/9]">
        <Link
          href={`/store/${subdomain}?category=${encodeURIComponent(category.name)}`}
          className="absolute inset-0 block"
        >
          <Image
            key={category.name}
            src={category.coverPhotoUrl}
            alt={category.name}
            fill
            sizes="(max-width: 1100px) 100vw, 1100px"
            className="object-cover"
            priority
          />
        </Link>

        {slides.length > 1 && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-3 flex gap-1.5">
            {slides.map((c, i) => (
              <button
                key={c.name}
                onClick={() => setActive(i)}
                aria-label={`Show ${c.name}`}
                className={`w-2 h-2 rounded-full transition-colors ${i === active ? 'bg-white' : 'bg-white/50'}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
