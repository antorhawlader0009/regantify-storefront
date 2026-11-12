import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getStoreProducts, StoreNotFoundError } from '@/lib/storefrontApi';
import { resolveTheme, storeSkin } from '@/lib/theme';
import { PlaymateCartPage } from '@/themes/playmate/PlaymateCartPage';
import { SolevoCartPage } from '@/themes/solevo/SolevoCartPage';
import { ChronicsCartPage } from '@/themes/chronics/ChronicsCartPage';
import { MahabeshCartPage } from '@/themes/mahabesh/MahabeshCartPage';
import { ChicwoveCartPage } from '@/themes/chicwove/ChicwoveCartPage';
import { CartView as MediumCartView } from '@/themes/medium/views/CartView';
import { CartView as MinimalCartView } from '@/themes/minimal/views/CartView';
import { CartView as StorepalCartView } from '@/themes/storepal/views/CartView';
import { storeParams } from '@/lib/storeRequest';

interface PageProps {
  params: Promise<{ subdomain: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subdomain } = await storeParams(params);
  try {
    const { store } = await getStoreProducts(subdomain);
    return { title: { absolute: `Your Cart - ${store.storeName}` } };
  } catch {
    return { title: 'Cart' };
  }
}

export default async function CartPage({ params }: PageProps) {
  const { subdomain } = await storeParams(params);

  let data;
  try {
    data = await getStoreProducts(subdomain);
  } catch (err) {
    if (err instanceof StoreNotFoundError) notFound();
    throw err;
  }

  const { store, categories, products } = data;
  const viewProps = { subdomain, storeName: store.storeName, categories };
  // PlayMate has its own cart page (the template's CartView), with suggestions from the store's products.
  if (storeSkin(store.theme) === 'mahabesh') return <MahabeshCartPage {...viewProps} products={products} logoUrl={store.logoUrl} />;
  if (storeSkin(store.theme) === 'chronics') return <ChronicsCartPage {...viewProps} products={products} logoUrl={store.logoUrl} />;
  if (storeSkin(store.theme) === 'chicwove') return <ChicwoveCartPage {...viewProps} products={products} logoUrl={store.logoUrl} />;
  if (storeSkin(store.theme) === 'solevo') return <SolevoCartPage {...viewProps} products={products} logoUrl={store.logoUrl} />;
  if (storeSkin(store.theme) === 'playmate') return <PlaymateCartPage {...viewProps} products={products} logoUrl={store.logoUrl} />;

  return resolveTheme(store.theme) === 'MINIMAL' ? (
    <MinimalCartView {...viewProps} />
  ) : resolveTheme(store.theme) === 'STOREPAL' ? (
    <StorepalCartView {...viewProps} />
  ) : (
    <MediumCartView {...viewProps} />
  );
}
