import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getStoreProducts, StoreNotFoundError } from '@/lib/storefrontApi';
import { resolveTheme } from '@/lib/theme';
import { WishlistView } from '@/themes/storepal/views/WishlistView';

interface PageProps {
  params: Promise<{ subdomain: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subdomain } = await params;
  try {
    const { store } = await getStoreProducts(subdomain);
    return { title: `Wishlist — ${store.storeName}`, robots: { index: false } };
  } catch {
    return { title: 'Wishlist' };
  }
}

// Store > Design > Product Card's wishlist — StorePal only by design, so
// every other theme gets a 404 here.
export default async function WishlistPage({ params }: PageProps) {
  const { subdomain } = await params;

  let data;
  try {
    data = await getStoreProducts(subdomain);
  } catch (err) {
    if (err instanceof StoreNotFoundError) notFound();
    throw err;
  }

  const { store, products, categories, categoryDetails } = data;
  if (resolveTheme(store.theme) !== 'STOREPAL') notFound();

  return (
    <WishlistView
      subdomain={subdomain}
      storeName={store.storeName}
      products={products}
      categories={categories}
      categoryDetails={categoryDetails}
      logoUrl={store.logoUrl}
      footerConfig={store.footerConfig}
    />
  );
}
