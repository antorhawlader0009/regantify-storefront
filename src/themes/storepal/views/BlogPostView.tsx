import Link from 'next/link';
import Image from 'next/image';
import type { StorefrontBlogCard, StorefrontBlogPost } from '@/lib/storefrontApi';
import { StoreHeader } from '../components/StoreHeader';
import { StoreFooter } from '../components/StoreFooter';
import { blogDate } from '../components/MagazineSection';
import { useStoreText } from '../lib/storeText';

interface BlogPostViewProps {
  subdomain: string;
  storeName: string;
  categories: string[];
  post: StorefrontBlogPost;
  others: Array<Pick<StorefrontBlogCard, 'title' | 'slug' | 'coverUrl' | 'publishedAt'>>;
}

/** One magazine post (TellMe idea 106): date and author, title, cover, text and tags, with the other latest posts beside it. */
export function BlogPostView({ subdomain, storeName, categories, post, others }: BlogPostViewProps) {
  const t = useStoreText();
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <StoreHeader subdomain={subdomain} storeName={storeName} categories={categories} />
      <main className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_320px]">
        <article>
          <p className="text-[13px] text-ink/80">
            {blogDate(post.publishedAt)} <span className="mx-1 text-accent">|</span> {post.authorName || storeName}
          </p>
          <h1 className="mb-5 mt-2 text-[26px] font-bold leading-tight">{post.title}</h1>
          {post.coverUrl && (
            <div className="relative mb-6 aspect-[16/10] w-full overflow-hidden rounded-md bg-surface">
              <Image src={post.coverUrl} alt={post.title} fill priority sizes="(min-width:1024px) 720px, 100vw" className="object-cover" />
            </div>
          )}
          {post.content && (
            <div
              className="text-[14px] leading-relaxed text-ink/85 [&_a]:text-accent [&_a]:underline [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-[18px] [&_h2]:font-bold [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:font-semibold [&_img]:my-4 [&_img]:h-auto [&_img]:max-w-full [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-4 [&_strong]:font-semibold [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          )}
          {post.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-4">
              {post.tags.map((tag) => (
                <span key={tag} className="rounded border border-line px-2 py-0.5 text-[10.5px] font-medium uppercase text-muted">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </article>

        {others.length > 0 && (
          <aside>
            <h2 className="mb-4 inline-block border-b-2 border-accent pb-2 text-[16px] font-bold uppercase">{t('Featured post')}</h2>
            <ul className="divide-y divide-dashed divide-line">
              {others.map((o) => (
                <li key={o.slug}>
                  <Link href={`/store/${subdomain}/blog/${o.slug}`} className="flex gap-3 py-4">
                    <span className="relative h-16 w-24 shrink-0 overflow-hidden rounded bg-surface">
                      {o.coverUrl && <Image src={o.coverUrl} alt="" fill sizes="96px" className="object-cover" />}
                    </span>
                    <span>
                      <span className="line-clamp-3 text-[13px] font-medium leading-snug">{o.title}</span>
                      <span className="mt-1 block text-[10.5px] uppercase text-muted">{blogDate(o.publishedAt)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link href={`/store/${subdomain}/blog`} className="text-[12.5px] font-medium text-accent hover:text-accent-dark">
              All posts →
            </Link>
          </aside>
        )}
      </main>
      <StoreFooter subdomain={subdomain} storeName={storeName} />
    </div>
  );
}
