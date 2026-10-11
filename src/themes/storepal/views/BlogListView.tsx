import type { StorefrontBlogCard } from '@/lib/storefrontApi';
import { StoreHeader } from '../components/StoreHeader';
import { StoreFooter } from '../components/StoreFooter';
import { MagazineCard } from '../components/MagazineSection';

/** /blog: every published magazine post (TellMe idea 106). */
export function BlogListView({ subdomain, storeName, categories, posts }: { subdomain: string; storeName: string; categories: string[]; posts: StorefrontBlogCard[] }) {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <StoreHeader subdomain={subdomain} storeName={storeName} categories={categories} />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="text-center text-[28px] font-bold uppercase">Magazine</h1>
        <p className="mb-8 text-center text-[13px] text-muted">Latest from {storeName}</p>
        {posts.length === 0 ? (
          <p className="text-center text-[14px] text-muted">No posts yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {posts.map((post) => (
              <MagazineCard key={post.slug} post={post} subdomain={subdomain} storeName={storeName} />
            ))}
          </div>
        )}
      </main>
      <StoreFooter subdomain={subdomain} storeName={storeName} />
    </div>
  );
}
