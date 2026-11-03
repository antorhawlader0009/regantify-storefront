import type { Metadata } from 'next';
import { ShopHeader } from '@/shop/ShopChrome';
import { ShopCartView } from '@/shop/ShopCartView';

export const metadata: Metadata = { title: 'Cart', robots: { index: false, follow: false } };

/** One cart for every store on the Shop (2026-11-03). */
export default function ShopCartPage() {
  return (
    <>
      <ShopHeader />
      <main className="mx-auto max-w-4xl px-4 py-6">
        <ShopCartView />
      </main>
    </>
  );
}
