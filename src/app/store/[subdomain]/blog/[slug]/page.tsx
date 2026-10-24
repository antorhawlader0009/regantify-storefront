import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getStoreBlogPost, getStoreProducts, StoreBlogPostNotFoundError, StoreNotFoundError, siteUrl } from '@/lib/storefrontApi';
import { resolveTheme } from '@/lib/theme';
import { BlogPostView } from '@/themes/storepal/views/BlogPostView';
import { socialMeta } from '@/lib/shareMeta';
import { storeParams } from '@/lib/storeRequest';


// Rendered on the first visit and then kept, like the rest of the store (PERFORMANCE-PLAN.md Step 8, see the store layout).
export function generateStaticParams() {
  return [];
}

interface PageProps {
  params: Promise<{ subdomain: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subdomain, slug } = await storeParams(params);
  try {
    const { store, post } = await getStoreBlogPost(subdomain, slug);
    const path = `/store/${subdomain}/blog/${slug}`;
    return {
      title: post.title,
      description: post.excerpt ?? undefined,
      alternates: { canonical: await siteUrl(path) },
      ...socialMeta({ store, title: post.title, description: post.excerpt, url: await siteUrl(path), type: 'article', image: post.coverUrl, locale: store.designSettings?.storeLanguage }),
    };
  } catch {
    return { title: 'Post not found' };
  }
}

// One Store > Magazine post (TellMe idea 106). StorePal only; a draft, a scheduled post and any other theme are a 404.
export default async function BlogPostPage({ params }: PageProps) {
  const { subdomain, slug } = await storeParams(params);
  let data;
  try {
    data = await getStoreBlogPost(subdomain, slug);
  } catch (err) {
    if (err instanceof StoreNotFoundError || err instanceof StoreBlogPostNotFoundError) notFound();
    throw err;
  }
  if (resolveTheme(data.store.theme) !== 'STOREPAL') notFound();
  const { categories } = await getStoreProducts(subdomain).catch(() => ({ categories: [] as string[] }));
  return <BlogPostView subdomain={subdomain} storeName={data.store.storeName} categories={categories} post={data.post} others={data.others} />;
}
