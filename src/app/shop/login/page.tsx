import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ShopHeader } from '@/shop/ShopChrome';
import { ShopLoginForm } from '@/shop/ShopLoginForm';

export const metadata: Metadata = { title: 'Sign in', robots: { index: false, follow: false } };

/** One sign-in for every store on the Shop (2026-11-03), the same account as the Regantify app. */
export default function ShopLoginPage() {
  return (
    <>
      <ShopHeader />
      <main className="mx-auto max-w-md px-4 py-10">
        <Suspense fallback={null}>
          <ShopLoginForm />
        </Suspense>
      </main>
    </>
  );
}
