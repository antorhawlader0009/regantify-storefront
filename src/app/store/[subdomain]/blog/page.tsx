import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getStoreBlog, getStoreProducts, StoreNotFoundError, siteUrl } from '@/lib/storefrontApi';
import { resolveTheme } from '@/lib/theme';
import { BlogListView } from '@/themes/storepal/views/BlogListView';
import { socialMeta } from '@/lib/shareMeta';
import { storeParams } from '@/lib/storeRequest';

interface PageProps {
  params: Promise<{ subdomain: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subdomain } = await storeParams(params);
  try {
    const { store } = await getStoreBlog(subdomain, 1);
    const path = `/store/${subdomain}/blog`;
    return { title: `Magazine — ${store.storeName}`, alternates: { canonical: await siteUrl(path) }, ...socialMeta({ store, title: `Magazine — ${store.storeName}`, url: await siteUrl(path), locale: store.designSettings?.storeLanguage }) };
  } catch {
    return { title: 'Magazine' };
  }
}

// Store > Magazine's list (TellMe idea 106). StorePal only: any other theme is a 404.
export default async function BlogPage({ params }: PageProps) {
  const { subdomain } = await storeParams(params);
  let data;
  try {
    data = await getStoreBlog(subdomain);
  } catch (err) {
    if (err instanceof StoreNotFoundError) notFound();
    throw err;
  }
  if (resolveTheme(data.store.theme) !== 'STOREPAL') notFound();
  const { categories } = await getStoreProducts(subdomain).catch(() => ({ categories: [] as string[] }));
  return <BlogListView subdomain={subdomain} storeName={data.store.storeName} categories={categories} posts={data.posts} />;
}
