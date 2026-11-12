'use client';

import { useState } from 'react';
import { PhotoViewer } from '@/components/ProductImageViewer';
import { variantUrl, WIDTH_LADDER } from '@/lib/imageVariants';
import type { LandingLang } from './landingText';

/*
 * Product pictures on a landing page are shown WHOLE (object-contain), never cropped: sellers upload square product
 * photos with the product filling the frame, and `cover` cut off its sides or top (Baymard: shoppers judge the product
 * from its photos, and a cut-off product reads as a bad listing). A tap opens the shared full-screen viewer with
 * pinch / double-tap zoom, which shoppers expect on a phone. Our own uploads get a right-sized WebP through srcset.
 */

/** srcset for one of our own photos (its WebP ladder); undefined for an outside address. */
export function photoSrcSet(src: string): string | undefined {
  if (!variantUrl(src, 320)) return undefined;
  return WIDTH_LADDER.map((w) => `${variantUrl(src, w)} ${w}w`).join(', ');
}

const VIEWER_LABELS: Record<LandingLang, { close: string; previous: string; next: string; zoomIn: string; zoomOut: string }> = {
  en: { close: 'Close', previous: 'Previous photo', next: 'Next photo', zoomIn: 'Zoom in', zoomOut: 'Zoom out' },
  bn: { close: 'বন্ধ করুন', previous: 'আগের ছবি', next: 'পরের ছবি', zoomIn: 'বড় করুন', zoomOut: 'ছোট করুন' },
};

/** A tap-to-zoom state for a set of photos: `open(i)` and the viewer element to render once. */
export function usePhotoZoom(photos: string[], title: string, lang: LandingLang) {
  const [index, setIndex] = useState<number | null>(null);
  const viewer = (
    <PhotoViewer
      photos={photos}
      index={index}
      onIndexChange={setIndex}
      onClose={() => setIndex(null)}
      title={title}
      labels={VIEWER_LABELS[lang]}
    />
  );
  return { open: (i: number) => setIndex(i), viewer };
}

/**
 * One whole product photo in a box of the given shape, on a soft background, with a zoom tap. `sizes` tells the
 * browser how wide it is drawn so a phone downloads a small file.
 */
export function LandingPhoto({
  src,
  alt,
  className = '',
  sizes = '(max-width: 640px) 100vw, 640px',
  onOpen,
  eager,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  onOpen?: () => void;
  eager?: boolean;
}) {
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={variantUrl(src, 960) ?? src}
      srcSet={photoSrcSet(src)}
      sizes={sizes}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      className="h-full w-full object-contain"
    />
  );
  const box = `relative block overflow-hidden bg-neutral-50 ${className}`;
  if (!onOpen) return <div className={box}>{img}</div>;
  return (
    <button type="button" onClick={onOpen} className={`${box} cursor-zoom-in`} aria-label={alt}>
      {img}
    </button>
  );
}
