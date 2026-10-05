'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

// How fast the text travels, in pixels per second, so a short banner and a long
// one move at the same speed instead of the short one crawling or racing.
const SPEED_PX_PER_SECOND = 60;

/**
 * The scrolling Site Banner strip (Store > Design > Site Banner, "Marquee"):
 * text enters from the right, crosses to the left and leaves, and the same text is
 * already coming in from the right behind it, like the snake leaving one side of
 * the screen and re-entering on the other. No pause, no jump, no empty stretch.
 *
 * It works by measuring one "set" (all the banner's items plus the gap after
 * them) and repeating it enough times to always cover the screen, then sliding the
 * whole row left by exactly one set's width, so the loop point lands on an
 * identical frame. The old fixed three copies left a small jump (the gap is not
 * part of "a third of the width") and a blank stretch when the text was short.
 *
 * Until measured (first paint) it shows the items still; with reduced motion it
 * stays still (see globals.css).
 */
export function MarqueeTrack({ items }: { items: ReactNode[] }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const setRef = useRef<HTMLDivElement>(null);
  const [metrics, setMetrics] = useState<{ setWidth: number; copies: number } | null>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    const set = setRef.current;
    if (!viewport || !set) return;
    const measure = () => {
      const setWidth = set.getBoundingClientRect().width;
      if (setWidth <= 0) return;
      // After sliding one set left, what is still on screen must cover the whole width.
      const copies = Math.ceil(viewport.getBoundingClientRect().width / setWidth) + 1;
      setMetrics((prev) => (prev && prev.setWidth === setWidth && prev.copies === copies ? prev : { setWidth, copies }));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(set);
    return () => observer.disconnect();
  }, [items]);

  const copies = metrics?.copies ?? 2;
  const style = metrics
    ? ({
        '--marquee-shift': `-${metrics.setWidth}px`,
        animationDuration: `${metrics.setWidth / SPEED_PX_PER_SECOND}s`,
      } as CSSProperties)
    : undefined;

  return (
    <div ref={viewportRef} className="overflow-hidden">
      <div className={`flex w-max items-center py-2.5 whitespace-nowrap ${metrics ? 'storepal-marquee' : ''}`} style={style}>
        {Array.from({ length: copies }, (_, copy) => (
          <div
            key={copy}
            ref={copy === 0 ? setRef : undefined}
            // The repeats are only for the loop; screen readers get one reading.
            aria-hidden={copy > 0 || undefined}
            className="flex shrink-0 items-center gap-16 pr-16"
          >
            {items.map((node, i) => (
              <span key={i} className="shrink-0 text-[13px] font-semibold text-ink">
                {node}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
