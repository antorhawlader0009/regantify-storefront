import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getStoreProducts, StoreNotFoundError } from '@/lib/storefrontApi';
import { resolveTheme } from '@/lib/theme';
import { WishlistView } from '@/themes/storepal/views/WishlistView';
import { storeParams } from '@/lib/storeRequest';

interface PageProps {
  params: Promise<{ subdomain: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subdomain } = await storeParams(params);
  try {
    const { store } = await getStoreProducts(subdomain);
    return { title: { absolute: `Wishlist — ${store.storeName}` }, robots: { index: false } };
  } catch {
    return { title: 'Wishlist' };
  }
}

// Account > Wishlist: opens inside the My account dialog (2026-10-29). StorePal only by design, so every other theme gets
// a 404 here. The saved products live in this browser (and the account once signed in), so no sign-in is needed.
export default async function AccountWishlistPage({ params }: PageProps) {
  const { subdomain } = await storeParams(params);

  let data;
  try {
    data = await getStoreProducts(subdomain);
  } catch (err) {
    if (err instanceof StoreNotFoundError) notFound();
    throw err;
  }

  const { store, products, categories } = data;
  if (resolveTheme(store.theme) !== 'STOREPAL') notFound();

  return <WishlistView subdomain={subdomain} storeName={store.storeName} products={products} categories={categories} />;
}
