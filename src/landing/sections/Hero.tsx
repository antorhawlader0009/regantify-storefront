'use client';

import { useEffect, useState } from 'react';
import type { BannerVideoProps, HeroSliderProps, TwoColumnProps, TwoColumnSide } from '../types';
import { ProductVideo } from '@/components/ProductVideo';
import { variantUrl } from '@/lib/imageVariants';
import { LandingPhoto, photoSrcSet, usePhotoZoom } from '../LandingPhoto';
import type { LandingLang } from '../landingText';

/**
 * The first screen. The picture is never cropped or darkened behind text any more: a square or tall product photo sits
 * whole next to the headline (above it on a phone), and a wide banner (a seller's own designed artwork, 1.6:1 or wider)
 * runs full width with the text under it. Shoppers tap the picture to zoom. Text on a plain background stays readable
 * whatever the photo looks like.
 */
export function HeroSliderSection({ props, lang = 'en' }: { props: HeroSliderProps; lang?: LandingLang }) {
  const slides = props.slides ?? [];
  const [index, setIndex] = useState(0);
  // Width / height per picture, learnt when it loads; a wide banner gets the full-width layout.
  const [ratios, setRatios] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!props.autoplayMs || slides.length <= 1) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), props.autoplayMs);
    return () => clearInterval(timer);
  }, [props.autoplayMs, slides.length]);

  const photos = slides.map((s) => s.imageUrl).filter(Boolean);
  const zoom = usePhotoZoom(photos, slides[0]?.headline || 'Photo', lang);

  if (slides.length === 0) return null;
  const slide = slides[index] ?? slides[0];
  const wide = !!slide.imageUrl && (ratios[slide.imageUrl] ?? 1) >= 1.6;
  const openZoom = () => zoom.open(Math.max(0, photos.indexOf(slide.imageUrl)));

  const picture = slide.imageUrl ? (
    <button
      type="button"
      onClick={openZoom}
      aria-label={slide.headline || 'Photo'}
      className={`relative block w-full cursor-zoom-in overflow-hidden bg-white ${wide ? 'rounded-none sm:rounded-2xl' : 'aspect-square rounded-2xl shadow-sm ring-1 ring-black/5'}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={variantUrl(slide.imageUrl, 1280) ?? slide.imageUrl}
        srcSet={photoSrcSet(slide.imageUrl)}
        sizes={wide ? '(max-width: 1024px) 100vw, 1024px' : '(max-width: 640px) 100vw, 512px'}
        alt={slide.headline || ''}
        fetchPriority={index === 0 ? 'high' : undefined}
        onLoad={(e) => {
          const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
          if (w && h) setRatios((r) => (r[slide.imageUrl] ? r : { ...r, [slide.imageUrl]: w / h }));
        }}
        className={wide ? 'h-auto w-full object-contain' : 'h-full w-full object-contain'}
      />
    </button>
  ) : null;

  const text = (
    <div className={`flex flex-col gap-3 ${wide ? 'items-center text-center' : 'items-center text-center sm:items-start sm:text-left'}`}>
      {slide.headline && <h1 className="text-[26px] font-extrabold leading-tight text-neutral-900 sm:text-4xl">{slide.headline}</h1>}
      {slide.subheadline && <p className="max-w-xl text-[15px] leading-relaxed text-neutral-600 sm:text-lg">{slide.subheadline}</p>}
      {slide.ctaLabel && (
        <a
          href={slide.ctaLink || '#checkout'}
          className="mt-1 w-full rounded-xl bg-orange-600 px-8 py-3.5 text-center text-[15px] font-bold text-white shadow-sm transition-colors hover:bg-orange-700 sm:w-auto"
        >
          {slide.ctaLabel}
        </a>
      )}
    </div>
  );

  return (
    <div className="bg-gradient-to-b from-orange-50 to-white">
      {wide ? (
        <div className="mx-auto flex max-w-5xl flex-col gap-5 pb-8 sm:px-8 sm:pt-6">
          {picture}
          <div className="px-5 sm:px-0">{text}</div>
        </div>
      ) : (
        <div className="mx-auto grid max-w-5xl items-center gap-6 px-5 py-6 sm:grid-cols-2 sm:gap-10 sm:px-8 sm:py-12">
          {picture && <div className="mx-auto w-full max-w-md sm:order-last">{picture}</div>}
          {text}
        </div>
      )}
      {slides.length > 1 && (
        <div className="flex justify-center gap-1.5 pb-5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-2 rounded-full transition-all ${i === index ? 'w-5 bg-orange-600' : 'w-2 bg-neutral-300'}`}
            />
          ))}
        </div>
      )}
      {zoom.viewer}
    </div>
  );
}

export function BannerVideoSection({ props }: { props: BannerVideoProps }) {
  if (!props.videoUrl) return null;
  // A YouTube / Facebook / Instagram / TikTok link: the shared player (picture first, the platform's player on a tap),
  // with the address the server worked out. A plain video file keeps the full-width banner below.
  if (props.video && props.video.platform !== 'FILE') {
    return (
      <div className="mx-auto w-full max-w-3xl px-5 py-6 sm:px-8">
        <ProductVideo
          video={props.video}
          fallbackPoster={props.posterImageUrl || null}
          title={props.overlayText || 'Video'}
          className="text-orange-600"
          labels={{ play: 'Play video', watchOn: (platform) => `Watch on ${platform}` }}
        />
      </div>
    );
  }
  return (
    <div className="relative h-[360px] w-full overflow-hidden sm:h-[480px]">
      <video
        src={props.videoUrl}
        poster={props.posterImageUrl || undefined}
        autoPlay={props.autoplay && props.muted}
        muted={props.muted}
        loop={props.loop}
        playsInline
        controls={!props.autoplay}
        className="absolute inset-0 h-full w-full object-cover"
      />
      {props.overlayText && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 px-6 text-center">
          <h2 className="text-2xl font-bold text-white sm:text-4xl">{props.overlayText}</h2>
        </div>
      )}
    </div>
  );
}

function TwoColumnSidePane({ side, onOpen }: { side: TwoColumnSide; onOpen: (src: string) => void }) {
  if (!side) return null;
  if (side.kind === 'image') {
    if (!side.imageUrl) return null;
    // Whole, never cropped, and tap to zoom (see LandingPhoto).
    return (
      <LandingPhoto
        src={side.imageUrl}
        alt={side.alt || ''}
        className="aspect-square w-full rounded-2xl ring-1 ring-black/5"
        sizes="(max-width: 640px) 100vw, 512px"
        onOpen={() => onOpen(side.imageUrl)}
      />
    );
  }
  return <div className="rg-rich prose prose-neutral self-center" dangerouslySetInnerHTML={{ __html: side.html || '' }} />;
}

export function TwoColumnSection({ props, lang = 'en' }: { props: TwoColumnProps; lang?: LandingLang }) {
  const photos = [props.left, props.right].flatMap((s) => (s?.kind === 'image' && s.imageUrl ? [s.imageUrl] : []));
  const zoom = usePhotoZoom(photos, 'Photo', lang);
  const open = (src: string) => zoom.open(Math.max(0, photos.indexOf(src)));
  return (
    <div
      className={`mx-auto grid max-w-5xl grid-cols-1 items-start gap-6 px-5 py-8 sm:px-8 ${
        props.stackOnMobile ? 'sm:grid-cols-2' : 'grid-cols-2'
      }`}
    >
      <TwoColumnSidePane side={props.left} onOpen={open} />
      <TwoColumnSidePane side={props.right} onOpen={open} />
      {zoom.viewer}
    </div>
  );
}
