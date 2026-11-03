import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ShopHeader } from '@/shop/ShopChrome';
import { ShopGoogleReturn } from '@/shop/ShopGoogleReturn';

export const metadata: Metadata = { title: 'Signing in', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

/** Google sends the shopper back here (SHOP_GOOGLE_CALLBACK_URL, 2026-11-03); the code is swapped for a Shop sign-in. */
export default function ShopGoogleReturnPage() {
  return (
    <>
      <ShopHeader />
      <main className="mx-auto max-w-md px-4 py-10">
        <Suspense fallback={null}>
          <ShopGoogleReturn />
        </Suspense>
      </main>
    </>
  );
}
