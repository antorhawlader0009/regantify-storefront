import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getStoreProducts, StoreNotFoundError } from '@/lib/storefrontApi';
import { resolveTheme } from '@/lib/theme';
import { CartView as MediumCartView } from '@/themes/medium/views/CartView';
import { CartView as MinimalCartView } from '@/themes/minimal/views/CartView';
import { CartView as StorepalCartView } from '@/themes/storepal/views/CartView';

interface PageProps {
  params: Promise<{ subdomain: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subdomain } = await params;
  try {
    const { store } = await getStoreProducts(subdomain);
    return { title: `Your Cart — ${store.storeName}` };
  } catch {
    return { title: 'Cart' };
  }
}

export default async function CartPage({ params }: PageProps) {
  const { subdomain } = await params;

  let data;
  try {
    data = await getStoreProducts(subdomain);
  } catch (err) {
    if (err instanceof StoreNotFoundError) notFound();
    throw err;
  }

  const { store, categories } = data;
  const viewProps = { subdomain, storeName: store.storeName, categories };

  return resolveTheme(store.theme) === 'MINIMAL' ? (
    <MinimalCartView {...viewProps} />
  ) : resolveTheme(store.theme) === 'STOREPAL' ? (
    <StorepalCartView {...viewProps} />
  ) : (
    <MediumCartView {...viewProps} />
  );
}
