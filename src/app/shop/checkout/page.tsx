import type { Metadata } from 'next';
import { ShopHeader } from '@/shop/ShopChrome';
import { ShopCheckoutView } from '@/shop/ShopCheckoutView';

export const metadata: Metadata = { title: 'Checkout', robots: { index: false, follow: false } };

/** One checkout for every store in the Shop cart (2026-11-03): one order per store. */
export default function ShopCheckoutPage() {
  return (
    <>
      <ShopHeader />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <ShopCheckoutView />
      </main>
    </>
  );
}
