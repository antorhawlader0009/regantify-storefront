'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import type { ShopBanner } from '@/lib/shopApi';

/** Each banner tone as a card background (Super Admin picks the tone). A dark wash on the left keeps the white text readable. */
const TONE: Record<string, string> = {
  GREEN: 'from-[#1F2937] via-[#3B2A2A] to-[var(--shop-accent)]',
  DARK: 'from-[#111827] via-[#1F2937] to-[#4B5563]',
  AMBER: 'from-[#7C2D12] via-[#C2410C] to-[#F59E0B]',
};

/**
 * "#SpecialForYou" (2026-11-03 redesign): Super Admin's banners as a swipeable row of big rounded cards, the next one peeking in, with
 * dots under it. Text only (banners have no picture); a banner with a link gets a "Shop now" pill. Nothing is made up: no fake discount.
 */
export function BannerCarousel({ banners }: { banners: ShopBanner[] }) {
  const row = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = row.current;
    if (!el) return;
    const onScroll = () => {
      const card = el.firstElementChild as HTMLElement | null;
      if (!card) return;
      setActive(Math.round(el.scrollLeft / (card.offsetWidth + 12)));
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  if (banners.length === 0) return null;
  return (
    <div>
      <div ref={row} className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-1 [scrollbar-width:none]">
        {banners.map((b) => {
          const outside = !!b.linkUrl && /^https:\/\//.test(b.linkUrl);
          const body = (
            <>
              <svg aria-hidden className="absolute -right-6 -top-6 h-40 w-40 opacity-15" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="white" strokeWidth="2" />
                <circle cx="50" cy="50" r="26" fill="none" stroke="white" strokeWidth="2" />
              </svg>
              <div className="relative flex h-full flex-col justify-between gap-4">
                <div>
                  <p className="max-w-[85%] text-xl font-bold leading-tight sm:text-2xl">{b.title}</p>
                  {b.text ? <p className="mt-2 line-clamp-2 max-w-[85%] text-sm text-white/85">{b.text}</p> : null}
                </div>
                {b.linkUrl ? (
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[var(--shop-accent)] px-4 py-1.5 text-sm font-semibold text-white shadow-md ring-2 ring-white/30">
                    Shop now <ArrowRight size={14} aria-hidden />
                  </span>
                ) : null}
              </div>
            </>
          );
          const cls = `relative block h-44 w-[86%] shrink-0 snap-start overflow-hidden rounded-[20px] bg-gradient-to-r p-5 text-white shadow-[0_8px_24px_rgba(16,24,40,0.12)] sm:h-48 sm:w-[60%] lg:w-[44%] ${TONE[b.tone] ?? TONE.GREEN}`;
          return b.linkUrl ? (
            <a key={b.id} href={b.linkUrl} className={cls} {...(outside ? { target: '_blank', rel: 'noopener' } : {})}>
              {body}
            </a>
          ) : (
            <div key={b.id} className={cls}>
              {body}
            </div>
          );
        })}
      </div>
      {banners.length > 1 ? (
        <div className="mt-3 flex justify-center gap-1.5" aria-hidden>
          {banners.map((b, i) => (
            <span key={b.id} className={`h-1.5 rounded-full transition-all ${i === active ? 'w-5 bg-[var(--shop-accent)]' : 'w-1.5 bg-slate-300'}`} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
