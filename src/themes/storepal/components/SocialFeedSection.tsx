'use client';

/* eslint-disable @next/next/no-img-element -- YouTube's own thumbnail and channel picture hosts, not our image loader. */
import { useEffect, useState } from 'react';
import { Play, X, Youtube } from 'lucide-react';
import type { StorefrontSocialFeed, StorefrontSocialPost } from '@/lib/storefrontApi';
import { bnDigits, useStoreText } from '../lib/storeText';
import { useStorePalDesign } from '../lib/designSettings';
import { CoverFloating } from '@/lib/floatingCover';

const GRID: Record<number, string> = {
  3: 'grid-cols-2 sm:grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-4',
  6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
};

/**
 * Social Feed home section (SOCIAL-FEED-plan.md), StorePal only: the store's YouTube channel header (picture, name, subscribers, videos) and its
 * newest videos as a grid. A tap plays the video in a light box through YouTube's privacy-enhanced player, which loads only when opened.
 */
export function SocialFeedSection({ feed }: { feed: StorefrontSocialFeed }) {
  const t = useStoreText();
  const { storeLanguage } = useStorePalDesign();
  const [open, setOpen] = useState<StorefrontSocialPost | null>(null);
  const num = (n: number) => (storeLanguage === 'bn' ? bnDigits(n.toLocaleString('en-US')) : n.toLocaleString('en-US'));
  const { account, posts } = feed;
  if (posts.length === 0) return null;
  const counts = [account.followers != null ? `${num(account.followers)} ${t('subscribers')}` : null, account.postsCount != null ? `${num(account.postsCount)} ${t('videos')}` : null].filter(Boolean);

  return (
    <section>
      <h2 className="mb-4 text-center text-[20px] font-bold text-ink">{feed.title || t('Watch us on YouTube')}</h2>
      <div className="overflow-hidden rounded-lg border border-black/5 bg-white">
        {feed.showHeader && (
          <div className="flex items-center gap-3 p-4">
            {account.avatarUrl ? (
              <img src={account.avatarUrl} alt="" className="h-14 w-14 shrink-0 rounded-full border border-black/5 object-cover" loading="lazy" />
            ) : (
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                <Youtube size={26} />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <a href={account.profileUrl} target="_blank" rel="noopener noreferrer" className="block truncate text-[14px] font-semibold text-ink hover:underline">
                {account.title}
              </a>
              {account.handle && <p className="truncate text-[12.5px] text-ink/70">@{account.handle}</p>}
              {counts.length > 0 && <p className="text-[12px] text-ink/60">{counts.join(' · ')}</p>}
            </div>
            <a
              href={account.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-red-600 px-3 py-1.5 text-[12.5px] font-semibold text-white hover:bg-red-700"
            >
              <Youtube size={16} />
              <span className="hidden sm:inline">{t('Subscribe')}</span>
            </a>
          </div>
        )}
        <div className={`grid gap-px bg-black/5 ${GRID[feed.columns] ?? GRID[3]}`}>
          {posts.map((p) => (
            <button key={p.id} type="button" onClick={() => setOpen(p)} className="group relative block aspect-video overflow-hidden bg-neutral-100 text-left" aria-label={p.title}>
              <img src={p.thumbUrl} alt={p.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
              <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white">
                  <Play size={18} className="ml-0.5" fill="currentColor" />
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
      {open && <VideoLightbox post={open} onClose={() => setOpen(null)} />}
    </section>
  );
}

function VideoLightbox({ post, onClose }: { post: StorefrontSocialPost; onClose: () => void }) {
  const t = useStoreText();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-3" role="dialog" aria-modal="true" aria-label={post.title} onClick={onClose}>
      <CoverFloating />
      <div className="w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-2 flex justify-end">
          <button type="button" onClick={onClose} aria-label={t('Close')} className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20">
            <X size={20} />
          </button>
        </div>
        <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(post.videoId)}?autoplay=1&rel=0`}
            title={post.title}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <p className="min-w-0 flex-1 text-[14px] font-medium text-white">{post.title}</p>
          <a href={post.permalink} target="_blank" rel="noopener noreferrer" className="shrink-0 text-[13px] font-medium text-white/80 underline hover:text-white">
            {t('Watch on YouTube')}
          </a>
        </div>
      </div>
    </div>
  );
}
