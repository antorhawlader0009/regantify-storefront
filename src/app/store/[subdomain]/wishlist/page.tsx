import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getStoreProducts, StoreNotFoundError } from '@/lib/storefrontApi';
import { storeSkin } from '@/lib/theme';
import { PlaymateWishlistPage } from '@/themes/playmate/PlaymateWishlistPage';
import { storeParams } from '@/lib/storeRequest';

interface PageProps {
  params: Promise<{ subdomain: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subdomain } = await storeParams(params);
  try {
    const { store } = await getStoreProducts(subdomain);
    return { title: { absolute: `Wishlist - ${store.storeName}` }, robots: { index: false } };
  } catch {
    return { title: 'Wishlist' };
  }
}

// PlayMate has a wishlist page of its own (the template's WishlistView). On StorePal the wishlist opens inside the
// My account dialog (2026-10-29, the owner's request), so old links land there.
export default async function WishlistPage({ params }: PageProps) {
  const { subdomain } = await storeParams(params);
  let data;
  try {
    data = await getStoreProducts(subdomain);
  } catch (err) {
    if (err instanceof StoreNotFoundError) notFound();
    throw err;
  }
  const { store, products, categories } = data;
  if (storeSkin(store.theme) !== 'playmate') redirect(`/store/${subdomain}/account/wishlist`);
  return <PlaymateWishlistPage subdomain={subdomain} storeName={store.storeName} categories={categories} products={products} />;
}
