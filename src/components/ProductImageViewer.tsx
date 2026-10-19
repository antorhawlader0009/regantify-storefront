'use client';

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Expand, X, ZoomIn, ZoomOut } from 'lucide-react';
import { variantUrl } from '@/lib/imageVariants';

/**
 * Product photo zoom (TellMe "StorePal 1" idea 3), shared by every template:
 * - HoverZoom wraps the big photo: on a computer, pointing at it shows that spot at 2.2x inside the frame; a click (or a
 *   tap on a phone) opens the viewer. Templates keep their own frame and picture inside it.
 * - PhotoViewer is the full-screen view: swipe or arrows between photos, double-tap / the zoom button / a pinch to zoom
 *   up to 4x, drag to look around while zoomed, Esc or X to close.
 * Shoppers can see the weave, stitching and the real colour up close, which the "it didn't look like the photo" returns
 * are about. The photos are the stored originals (up to 1600 px), so nothing new is uploaded.
 */

const MAX_SCALE = 4;

export function HoverZoom({
  src,
  onOpen,
  label,
  children,
  className = '',
}: {
  src: string | null | undefined;
  onOpen: () => void;
  /** Accessible name of the open button, e.g. "Open photo". */
  label: string;
  children: ReactNode;
  className?: string;
}) {
  const [spot, setSpot] = useState<{ x: number; y: number } | null>(null);
  const fine = useRef(false);
  useEffect(() => {
    fine.current = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  }, []);

  return (
    <div
      className={`group/zoom relative ${src ? 'cursor-zoom-in' : ''} ${className}`}
      onMouseMove={(e) => {
        if (!src || !fine.current) return;
        const r = e.currentTarget.getBoundingClientRect();
        setSpot({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
      }}
      onMouseLeave={() => setSpot(null)}
    >
      {children}
      {src && spot && (
        <div
          className="pointer-events-none absolute inset-0 z-[1] bg-canvas bg-no-repeat"
          style={{ backgroundImage: `url("${src}")`, backgroundSize: '220%', backgroundPosition: `${spot.x}% ${spot.y}%` }}
          aria-hidden
        />
      )}
      {src && (
        <button
          type="button"
          onClick={onOpen}
          aria-label={label}
          className="absolute inset-0 z-[2] h-full w-full cursor-zoom-in bg-transparent p-0"
        >
          <span
            className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/50 bg-white/70 text-ink shadow backdrop-blur-md transition-opacity
              opacity-90 group-hover/zoom:opacity-100"
            aria-hidden
          >
            <Expand size={16} />
          </span>
        </button>
      )}
    </div>
  );
}

export function PhotoViewer({
  photos,
  index,
  onIndexChange,
  onClose,
  title,
  labels,
}: {
  photos: string[];
  /** Null = closed. */
  index: number | null;
  onIndexChange: (i: number) => void;
  onClose: () => void;
  title: string;
  labels: { close: string; previous: string; next: string; zoomIn: string; zoomOut: string };
}) {
  const open = index !== null && photos.length > 0;
  const i = Math.min(index ?? 0, Math.max(photos.length - 1, 0));
  const many = photos.length > 1;
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ dist: number; scale: number; startX: number; startY: number; pan: { x: number; y: number }; moved: boolean } | null>(null);
  const lastTap = useRef(0);

  const reset = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };
  const go = (k: number) => {
    reset();
    onIndexChange((k + photos.length) % photos.length);
  };

  useEffect(() => {
    if (!open) return;
    reset();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (many && e.key === 'ArrowRight') go(i + 1);
      if (many && e.key === 'ArrowLeft') go(i - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-bound when the photo changes so the arrows know `i`
  }, [open, i, many]);

  if (!open) return null;

  const distance = () => {
    const [a, b] = [...pointers.current.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  };

  const onDown = (e: ReactPointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    gesture.current = { dist: distance(), scale, startX: e.clientX, startY: e.clientY, pan, moved: false };
  };
  const onMove = (e: ReactPointerEvent) => {
    if (!pointers.current.has(e.pointerId) || !gesture.current) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    if (pointers.current.size === 2 && g.dist > 0) {
      setScale(Math.min(MAX_SCALE, Math.max(1, (g.scale * distance()) / g.dist)));
      g.moved = true;
      return;
    }
    const dx = e.clientX - g.startX;
    const dy = e.clientY - g.startY;
    if (Math.abs(dx) + Math.abs(dy) > 6) g.moved = true;
    if (scale > 1) setPan({ x: g.pan.x + dx, y: g.pan.y + dy });
  };
  const onUp = (e: ReactPointerEvent) => {
    const g = gesture.current;
    pointers.current.delete(e.pointerId);
    if (pointers.current.size > 0) {
      // One finger left after a pinch: carry on from here.
      const [p] = [...pointers.current.values()];
      gesture.current = { dist: 0, scale, startX: p.x, startY: p.y, pan, moved: true };
      return;
    }
    gesture.current = null;
    if (!g) return;
    const dx = e.clientX - g.startX;
    if (scale === 1 && many && Math.abs(dx) > 50 && g.moved) {
      go(dx < 0 ? i + 1 : i - 1);
      return;
    }
    if (!g.moved) {
      const now = Date.now();
      if (now - lastTap.current < 300) {
        if (scale > 1) reset();
        else setScale(2.5);
        lastTap.current = 0;
      } else lastTap.current = now;
    }
    if (scale <= 1.02) reset();
  };

  const glass =
    'flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white';

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-neutral-950/95" role="dialog" aria-modal="true" aria-label={title}>
      <div className="flex items-center justify-between px-4 pt-4">
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium tabular-nums text-white/85">
          {i + 1} / {photos.length}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => (scale > 1 ? reset() : setScale(2.5))}
            aria-label={scale > 1 ? labels.zoomOut : labels.zoomIn}
            className={glass}
          >
            {scale > 1 ? <ZoomOut size={18} /> : <ZoomIn size={18} />}
          </button>
          <button type="button" onClick={onClose} aria-label={labels.close} className={glass}>
            <X size={20} />
          </button>
        </div>
      </div>

      <div
        className="relative flex min-h-0 flex-1 touch-none select-none items-center justify-center overflow-hidden"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onWheel={(e) => setScale((s) => Math.min(MAX_SCALE, Math.max(1, s - e.deltaY * 0.002)))}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- the stored original, zoomed with CSS */}
        <img
          key={photos[i]}
          src={photos[i]}
          alt=""
          draggable={false}
          className={`max-h-full max-w-full object-contain ${pointers.current.size ? '' : 'transition-transform duration-150'} ${scale > 1 ? 'cursor-grab' : ''}`}
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }}
        />
        {many && scale === 1 && (
          <>
            <button type="button" onClick={() => go(i - 1)} aria-label={labels.previous} className={`${glass} absolute left-3 hidden sm:flex`}>
              <ChevronLeft size={22} />
            </button>
            <button type="button" onClick={() => go(i + 1)} aria-label={labels.next} className={`${glass} absolute right-3 hidden sm:flex`}>
              <ChevronRight size={22} />
            </button>
          </>
        )}
      </div>

      {many && (
        <div className="flex justify-center gap-2 overflow-x-auto px-4 pb-5 pt-3">
          {photos.map((p, k) => (
            <button
              key={`${p}-${k}`}
              type="button"
              onClick={() => go(k)}
              aria-label={`${k + 1}`}
              className={`h-12 w-12 shrink-0 overflow-hidden rounded-md transition ${k === i ? 'ring-2 ring-white' : 'opacity-50 hover:opacity-90'}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- small strip */}
              <img src={variantUrl(p, 320) ?? p} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
