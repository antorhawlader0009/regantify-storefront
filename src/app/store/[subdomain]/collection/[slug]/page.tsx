import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getStoreCollection, StoreNotFoundError, CollectionNotFoundError, siteUrl } from '@/lib/storefrontApi';
import { resolveTheme } from '@/lib/theme';
import { CollectionView } from '@/themes/storepal/views/CollectionView';
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
    const { collection, store } = await getStoreCollection(subdomain, slug);
    const description = `Shop the ${collection.name} collection from ${store.storeName}.`;
    const canonicalPath = `/store/${subdomain}/collection/${slug}`;
    return {
      title: collection.name,
      description,
      alternates: { canonical: await siteUrl(canonicalPath) },
      ...socialMeta({ store, title: collection.name, description, url: await siteUrl(canonicalPath), image: collection.coverPhotoUrl, locale: store.designSettings?.storeLanguage }),
    };
  } catch {
    return { title: 'Collection not found' };
  }
}

// Collections (hand-picked or by rules, TellMe idea 72) are built for StorePal; other themes 404 here.
export default async function CollectionPage({ params }: PageProps) {
  const { subdomain, slug } = await storeParams(params);
  let data;
  try {
    data = await getStoreCollection(subdomain, slug);
  } catch (err) {
    if (err instanceof StoreNotFoundError || err instanceof CollectionNotFoundError) notFound();
    throw err;
  }
  if (resolveTheme(data.store.theme) !== 'STOREPAL') notFound();
  return (
    <CollectionView
      subdomain={subdomain}
      storeName={data.store.storeName}
      categories={data.categories}
      collection={data.collection}
      products={data.products}
    />
  );
}
