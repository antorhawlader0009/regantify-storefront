import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getStoreFaq, getStoreProducts, StoreNotFoundError } from '@/lib/storefrontApi';
import { resolveTheme } from '@/lib/theme';
import { ReportStoreView } from '@/themes/storepal/views/ReportStoreView';

interface PageProps {
  params: Promise<{ subdomain: string }>;
}

// A private form, not something to rank: kept out of search results.
export const metadata: Metadata = { title: 'Report this store', robots: { index: false, follow: false } };

// "Report this store" (super-admin-plan.md Step 17). StorePal only: any other theme is a 404, like the FAQ and the magazine.
// The FAQ call is only used to read the store's name and theme (it is cached with the other store pages).
export default async function ReportPage({ params }: PageProps) {
  const { subdomain } = await params;
  let data;
  try {
    data = await getStoreFaq(subdomain);
  } catch (err) {
    if (err instanceof StoreNotFoundError) notFound();
    throw err;
  }
  if (resolveTheme(data.store.theme) !== 'STOREPAL') notFound();
  const { categories } = await getStoreProducts(subdomain).catch(() => ({ categories: [] as string[] }));
  return <ReportStoreView subdomain={subdomain} storeName={data.store.storeName} categories={categories} />;
}
