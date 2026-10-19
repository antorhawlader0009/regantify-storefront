'use client';

import { useState } from 'react';
import { ExternalLink, Facebook, Instagram, Play, Youtube } from 'lucide-react';
import type { StorefrontProductVideo } from '@/lib/storefrontApi';

/**
 * A product's video (YouTube, Facebook, Instagram, TikTok or an .mp4 file), shared by every template: each template
 * only places it and passes its own words. Shows the video's picture with a play button and loads the platform's
 * player only when tapped (Lighthouse's "facade": the players are hundreds of KB each). The picture is the video's
 * own (YouTube's, or one the server copied from TikTok / Meta), else the product's first photo.
 * The server decides the player address (server/src/products/product-video.ts); this never builds one from a link.
 */

const PLATFORM_NAME: Record<StorefrontProductVideo['platform'], string> = {
  YOUTUBE: 'YouTube',
  FACEBOOK: 'Facebook',
  INSTAGRAM: 'Instagram',
  TIKTOK: 'TikTok',
  FILE: '',
};

function PlatformIcon({ platform }: { platform: StorefrontProductVideo['platform'] }) {
  if (platform === 'YOUTUBE') return <Youtube size={14} />;
  if (platform === 'FACEBOOK') return <Facebook size={14} />;
  if (platform === 'INSTAGRAM') return <Instagram size={14} />;
  return null;
}

export interface ProductVideoLabels {
  /** The play button's accessible name, e.g. "Play product video". */
  play: string;
  /** "Watch on {platform}" for a link the server couldn't turn into a player yet. */
  watchOn: (platform: string) => string;
}

export function ProductVideo({
  video,
  fallbackPoster,
  title,
  labels,
  className = '',
}: {
  video: StorefrontProductVideo;
  fallbackPoster?: string | null;
  title: string;
  labels: ProductVideoLabels;
  className?: string;
}) {
  const [playing, setPlaying] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const name = PLATFORM_NAME[video.platform];
  const tall = video.shape === 'TALL';
  // Tall videos (Shorts, TikTok, reels) stay phone-sized so they never fill the whole page.
  const frame = tall ? 'w-full max-w-[340px] mx-auto aspect-[9/16]' : 'w-full aspect-video';

  // A short link the server hasn't followed yet (or can't): no player, just the platform link.
  if (!video.embedUrl) {
    return (
      <a
        href={video.watchUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1.5 text-[13px] font-semibold underline-offset-2 hover:underline ${className}`}
      >
        <PlatformIcon platform={video.platform} />
        {labels.watchOn(name || 'video')}
        <ExternalLink size={13} />
      </a>
    );
  }

  if (playing) {
    if (video.platform === 'FILE') {
      return (
        <div className={`${frame} overflow-hidden rounded-xl bg-black ${className}`}>
          <video src={video.embedUrl} controls autoPlay playsInline className="h-full w-full object-contain" />
        </div>
      );
    }
    // Instagram's player adds its own header and caption bar around the video, so it gets extra height.
    const igHeight =
      video.platform === 'INSTAGRAM'
        ? { height: tall ? 'calc(min(100vw - 32px, 340px) * 16 / 9 + 160px)' : 'calc(min(100vw - 32px, 540px) + 160px)' }
        : undefined;
    return (
      <div
        className={`${igHeight ? (tall ? 'w-full max-w-[340px] mx-auto' : 'w-full max-w-[540px] mx-auto') : frame} overflow-hidden rounded-xl bg-black ${className}`}
        style={igHeight}
      >
        <iframe
          src={video.embedUrl}
          title={title}
          className="h-full w-full border-0"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen; clipboard-write"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    );
  }

  const poster = !posterFailed ? video.thumbUrl ?? fallbackPoster ?? null : fallbackPoster ?? null;
  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={labels.play}
      className={`group relative block ${frame} overflow-hidden rounded-xl bg-neutral-900 cursor-pointer p-0 border-0 ${className}`}
    >
      {poster && (
        // eslint-disable-next-line @next/next/no-img-element -- the picture may be on i.ytimg.com, which the store's image loader doesn't serve
        <img
          src={poster}
          alt=""
          loading="lazy"
          onError={() => setPosterFailed(true)}
          className={`absolute inset-0 h-full w-full object-cover ${video.thumbUrl && !posterFailed ? '' : 'opacity-70 blur-[1px]'}`}
        />
      )}
      <span className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10" />
      <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-neutral-900 shadow-lg transition-transform group-hover:scale-105">
        <Play size={26} className="ml-1" fill="currentColor" />
      </span>
      {name && (
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[11.5px] font-semibold text-white">
          <PlatformIcon platform={video.platform} />
          {name}
        </span>
      )}
    </button>
  );
}
