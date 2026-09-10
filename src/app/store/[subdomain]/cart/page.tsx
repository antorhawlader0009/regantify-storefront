import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getStoreProducts, StoreNotFoundError } from '@/lib/storefrontApi';
import { StoreHeader } from '@/components/StoreHeader';
import { StoreFooter } from '@/components/StoreFooter';
import { CartList } from '@/components/CartList';

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

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <StoreHeader subdomain={subdomain} storeName={store.storeName} categories={categories} />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full">
        <h1 className="text-[18px] font-bold text-ink mb-5">Your Cart</h1>
        <div className="bg-surface border border-line rounded-lg p-4 sm:p-6 shadow-card">
          <CartList subdomain={subdomain} storeName={store.storeName} />
        </div>
      </main>
      <StoreFooter subdomain={subdomain} storeName={store.storeName} />
    </div>
  );
}
