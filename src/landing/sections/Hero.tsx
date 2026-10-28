'use client';

import { useEffect, useState } from 'react';
import type { BannerVideoProps, HeroSliderProps, TwoColumnProps, TwoColumnSide } from '../types';
import { ProductVideo } from '@/components/ProductVideo';

export function HeroSliderSection({ props }: { props: HeroSliderProps }) {
  const slides = props.slides ?? [];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!props.autoplayMs || slides.length <= 1) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), props.autoplayMs);
    return () => clearInterval(timer);
  }, [props.autoplayMs, slides.length]);

  if (slides.length === 0) return null;
  const slide = slides[index] ?? slides[0];

  return (
    <div className="relative h-[420px] w-full overflow-hidden sm:h-[520px]">
      {slide.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={slide.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-neutral-200" />
      )}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/35 px-6 text-center">
        {slide.headline && (
          <h1 className="max-w-2xl text-3xl font-bold text-white sm:text-5xl">{slide.headline}</h1>
        )}
        {slide.subheadline && <p className="max-w-xl text-base text-white/90 sm:text-lg">{slide.subheadline}</p>}
        {slide.ctaLabel && (
          <a
            href={slide.ctaLink || '#checkout'}
            className="mt-2 rounded-lg bg-orange-600 px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-700"
          >
            {slide.ctaLabel}
          </a>
        )}
      </div>
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-2 w-2 rounded-full transition-colors ${i === index ? 'bg-white' : 'bg-white/50'}`}
            />
          ))}
        </div>
      )}
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

function TwoColumnSidePane({ side }: { side: TwoColumnSide }) {
  if (!side) return null;
  if (side.kind === 'image') {
    if (!side.imageUrl) return null;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={side.imageUrl} alt={side.alt || ''} className="h-full w-full rounded-lg object-cover" />
    );
  }
  return <div className="prose prose-neutral" dangerouslySetInnerHTML={{ __html: side.html || '' }} />;
}

export function TwoColumnSection({ props }: { props: TwoColumnProps }) {
  return (
    <div
      className={`mx-auto grid max-w-5xl grid-cols-1 gap-6 px-5 py-8 sm:px-8 ${
        props.stackOnMobile ? 'sm:grid-cols-2' : 'grid-cols-2'
      }`}
    >
      <TwoColumnSidePane side={props.left} />
      <TwoColumnSidePane side={props.right} />
    </div>
  );
}
