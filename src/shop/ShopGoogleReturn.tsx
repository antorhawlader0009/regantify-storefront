'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { shopApi, ShopApiError, useShopSession } from './shopClient';

/**
 * The end of "Continue with Google" on the Regantify Shop (2026-11-03): Google's one-time code goes to the Shop's proxy, which checks the
 * state against its cookie, signs in and keeps the token in the httpOnly session cookie. Then back to the page the shopper started from.
 */
export function ShopGoogleReturn() {
  const router = useRouter();
  const params = useSearchParams();
  const signedIn = useShopSession((s) => s.signedIn);
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const code = params.get('code');
    const state = params.get('state');
    if (params.get('error') || !code || !state) {
      setError(params.get('error') === 'access_denied' ? 'Google sign-in was cancelled.' : 'Google sign-in did not finish. Please try again.');
      return;
    }
    shopApi<{ customer: { name: string | null }; next: string }>('auth/google/finish', { method: 'POST', body: { code, state } })
      .then(async (r) => {
        await signedIn({ name: r.customer.name });
        router.replace(r.next || '/shop');
      })
      .catch((e) => setError(e instanceof ShopApiError ? e.message : 'Could not sign you in. Please try again.'));
  }, [params, router, signedIn]);

  return (
    <div className="rounded-2xl bg-white p-6 shadow-[0_2px_12px_rgba(16,24,40,0.06)]">
      {error ? (
        <>
          <p className="text-sm text-red-600">{error}</p>
          <Link href="/shop/login" className="mt-4 inline-block text-sm font-semibold text-[var(--shop-accent)] underline">
            Back to sign in
          </Link>
        </>
      ) : (
        <p className="text-sm text-slate-700">Signing you in with Google…</p>
      )}
    </div>
  );
}
