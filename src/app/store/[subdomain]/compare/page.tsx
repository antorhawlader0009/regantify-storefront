import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getStoreProducts, StoreNotFoundError } from '@/lib/storefrontApi';
import { resolveTheme } from '@/lib/theme';
import { CompareView } from '@/themes/storepal/views/CompareView';
import { storeParams } from '@/lib/storeRequest';

interface PageProps {
  params: Promise<{ subdomain: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subdomain } = await storeParams(params);
  try {
    const { store } = await getStoreProducts(subdomain);
    return { title: { absolute: `Compare products — ${store.storeName}` }, robots: { index: false } };
  } catch {
    return { title: 'Compare products' };
  }
}

// Compare products (TellMe idea 74): StorePal only, so every other theme gets a 404 here.
export default async function ComparePage({ params }: PageProps) {
  const { subdomain } = await storeParams(params);
  let data;
  try {
    data = await getStoreProducts(subdomain);
  } catch (err) {
    if (err instanceof StoreNotFoundError) notFound();
    throw err;
  }
  const { store, categories, categoryDetails } = data;
  if (resolveTheme(store.theme) !== 'STOREPAL') notFound();
  return (
    <CompareView
      subdomain={subdomain}
      storeName={store.storeName}
      categories={categories}
      categoryDetails={categoryDetails}
      logoUrl={store.logoUrl}
      footerConfig={store.footerConfig}
      stockSettings={store.stockSettings}
    />
  );
}
