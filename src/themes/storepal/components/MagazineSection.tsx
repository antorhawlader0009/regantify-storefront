'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import type { StorefrontBlogCard } from '@/lib/storefrontApi';
import { useStoreText } from '../lib/storeText';

export const blogDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Dhaka' });

/** One magazine card: the cover photo with the author, title and a short summary over a dark fade at the bottom. */
export function MagazineCard({ post, subdomain, storeName, priority = false }: { post: StorefrontBlogCard; subdomain: string; storeName: string; priority?: boolean }) {
  return (
    <Link href={`/store/${subdomain}/blog/${post.slug}`} className="group relative block aspect-[3/4] overflow-hidden rounded-md bg-surface">
      {post.coverUrl ? (
        <Image src={post.coverUrl} alt={post.title} fill sizes="(min-width:1024px) 20vw, (min-width:640px) 33vw, 50vw" priority={priority} className="object-cover transition-transform duration-300 group-hover:scale-105" />
      ) : (
        <div className="absolute inset-0 bg-ink/10" aria-hidden />
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/60 to-transparent px-3 pb-3 pt-14 text-white">
        <p className="text-[10.5px] font-semibold uppercase tracking-wide opacity-80">{post.authorName || storeName}</p>
        <h3 className="mt-0.5 line-clamp-3 text-[14px] font-bold leading-snug">{post.title}</h3>
        {post.excerpt && <p className="mt-1 line-clamp-2 text-[11.5px] leading-snug opacity-85">{post.excerpt}</p>}
      </div>
    </Link>
  );
}

/** The home page's Magazine section (TellMe idea 106). Shows nothing until the store has a published post. */
export function MagazineSection({ subdomain, storeName, posts, total }: { subdomain: string; storeName: string; posts: StorefrontBlogCard[]; total: number }) {
  const t = useStoreText();
  if (posts.length === 0) return null;
  return (
    <section>
      <h2 className="text-center text-[20px] font-bold text-ink">{t('Magazine')}</h2>
      <p className="mb-5 text-center text-[13px] text-muted">{t('Latest from the store')}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
        {posts.slice(0, 5).map((post) => (
          <MagazineCard key={post.slug} post={post} subdomain={subdomain} storeName={storeName} />
        ))}
      </div>
      {total > 5 && (
        <div className="mt-4 text-center">
          <Link href={`/store/${subdomain}/blog`} className="inline-flex items-center gap-0.5 text-[13px] font-medium text-accent hover:text-accent-dark">
            {t('View all posts')}
            <ChevronRight size={15} aria-hidden />
          </Link>
        </div>
      )}
    </section>
  );
}
