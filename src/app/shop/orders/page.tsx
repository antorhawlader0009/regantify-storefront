import type { Metadata } from 'next';
import { ShopHeader } from '@/shop/ShopChrome';
import { ShopOrdersList } from '@/shop/ShopOrdersView';

export const metadata: Metadata = { title: 'My orders', robots: { index: false, follow: false } };

/** Every order of the one Shop account, from every store (2026-11-03). */
export default function ShopOrdersPage() {
  return (
    <>
      <ShopHeader />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <ShopOrdersList />
      </main>
    </>
  );
}
