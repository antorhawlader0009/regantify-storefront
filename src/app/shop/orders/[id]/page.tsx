import type { Metadata } from 'next';
import { ShopHeader } from '@/shop/ShopChrome';
import { ShopOrderDetail } from '@/shop/ShopOrdersView';

export const metadata: Metadata = { title: 'Order', robots: { index: false, follow: false } };

export default async function ShopOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <ShopHeader />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <ShopOrderDetail orderId={id} />
      </main>
    </>
  );
}
