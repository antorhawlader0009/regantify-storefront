'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * A row that scrolls sideways (the header's category strip and site menu). When the items don't all fit, round left / right buttons
 * show while the mouse is over the row (2026-10-29, the owner's request), at any screen width wherever a mouse can hover (touch
 * screens get smaller ones that stay shown and step aside while the row is swiped), and move it by most of its width. Each button
 * shows only while there is more to that side. The edge fades
 * follow the same rule, so a fade only shows where something is cut off.
 */
export function ScrollRow({ className, children, as = 'div', dataRg }: { className: string; children: ReactNode; as?: 'div' | 'nav'; dataRg?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  // Touch screens (no hover): the arrows stay shown on the side with more, step aside while the row is being swiped, and come
  // back a moment after it stops (2026-10-29, the owner's request).
  const [touch, setTouch] = useState(false);
  const [moving, setMoving] = useState(false);
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const mq = window.matchMedia('(hover: none)');
    const update = () => setTouch(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => {
      mq.removeEventListener('change', update);
      if (stopTimer.current) clearTimeout(stopTimer.current);
    };
  }, []);
  const onScrollMove = useCallback(() => {
    setMoving(true);
    if (stopTimer.current) clearTimeout(stopTimer.current);
    stopTimer.current = setTimeout(() => setMoving(false), 900);
  }, []);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const left = el.scrollLeft > 2;
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
    setEdges((e) => (e.left === left && e.right === right ? e : { left, right }));
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    measure();
    el.addEventListener('scroll', measure, { passive: true });
    el.addEventListener('scroll', onScrollMove, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', measure);
      el.removeEventListener('scroll', onScrollMove);
      ro.disconnect();
    };
  }, [measure, onScrollMove]);

  const move = (dir: 1 | -1) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.7, behavior: 'smooth' });
  };

  // Fade only the side that is cut off.
  const fade =
    edges.left && edges.right
      ? '[mask-image:linear-gradient(to_right,transparent,#000_40px,#000_calc(100%-40px),transparent)]'
      : edges.right
        ? '[mask-image:linear-gradient(to_right,#000_calc(100%-40px),transparent)]'
        : edges.left
          ? '[mask-image:linear-gradient(to_right,transparent,#000_40px)]'
          : '';
  const Tag = as;
  const arrowBase =
    'absolute top-1/2 z-[1] -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface text-ink shadow-[0_2px_6px_-1px_rgba(16,24,40,0.18)] transition-opacity duration-200 hover:text-accent';
  const arrow = touch
    ? // Phones and tablets: a smaller arrow, shown unless the row is moving.
      `${arrowBase} flex h-7 w-7 ${moving ? 'pointer-events-none opacity-0' : 'opacity-100'}`
    : // A mouse: only while the pointer is over the row (or the arrow has keyboard focus).
      `${arrowBase} hidden h-8 w-8 opacity-0 focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:hover)]:flex`;

  return (
    <div className="group relative max-w-6xl mx-auto">
      <Tag ref={ref} data-rg={dataRg} className={`${className} [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${fade}`}>
        {children}
      </Tag>
      {edges.left && (
        <button type="button" onClick={() => move(-1)} aria-label="Scroll left" className={`${arrow} left-1`}>
          <ChevronLeft size={17} strokeWidth={2.25} />
        </button>
      )}
      {edges.right && (
        <button type="button" onClick={() => move(1)} aria-label="Scroll right" className={`${arrow} right-1`}>
          <ChevronRight size={17} strokeWidth={2.25} />
        </button>
      )}
    </div>
  );
}
