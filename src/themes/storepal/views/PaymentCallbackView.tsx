'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { reconcileOrderPayment, getOrderPaymentStatus, type OrderPaymentStatus } from '@/lib/checkoutApi';
import { useStoreDisplayName } from '../lib/useStoreDisplayName';
import { getStoreSocialLinks } from '@/lib/socialLinksApi';
import { getStoreNavData, type StoreNavData } from '../lib/storeNavApi';
import { StoreHeader } from '../components/StoreHeader';
import { StoreFooter } from '../components/StoreFooter';

const HANDOFF_KEY = 'regantify-last-order';

/**
 * Storefront checkout's "Online Payment" landing page (StorePal only —
 * see CheckoutView.tsx's Payment Method choice) — PayStation's
 * `callback_url` (see PaymentsService.initiateForOrder) always points
 * back here with `?invoice=...`. Never trusts a query-param "it worked"
 * signal from the redirect itself — always calls the public reconcile
 * endpoint, which re-verifies with PayStation server-to-server before
 * moving the order out of PAYMENT_INITIATED (see
 * PaymentsService.reconcileInternal). On confirmed success, hands off
 * to /thank-you exactly the way a COD order does (same sessionStorage
 * key useTrackOrder already reads), so the rest of the confirmation
 * flow — memo download, "Track it anytime", etc. — is unchanged.
 */
export function PaymentCallbackView({ subdomain }: { subdomain: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoiceNumber = searchParams.get('invoice');
  const storeName = useStoreDisplayName(subdomain);
  const [state, setState] = useState<'checking' | OrderPaymentStatus | 'error'>('checking');
  const attemptsRef = useRef(0);

  const [nav, setNav] = useState<StoreNavData>({ categories: [], categoryDetails: [] });
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [socialLinks, setSocialLinks] = useState<Awaited<ReturnType<typeof getStoreSocialLinks>>>({});
  useEffect(() => {
    getStoreNavData(subdomain).then(setNav);
    getStoreSocialLinks(subdomain).then((b) => {
      setLogoUrl(b.logoUrl ?? null);
      setSocialLinks(b);
    });
  }, [subdomain]);

  useEffect(() => {
    if (!invoiceNumber) {
      setState('error');
      return;
    }

    let cancelled = false;
    const maxAttempts = 5;

    const check = async () => {
      try {
        const result = await reconcileOrderPayment(invoiceNumber);
        if (cancelled) return;

        if (result.status === 'SUCCESS') {
          const payment = await getOrderPaymentStatus(invoiceNumber).catch(() => null);
          if (cancelled) return;
          if (payment?.order) {
            // Same handoff sessionStorage key a COD order sets right
            // after placeOrder — /thank-you's useTrackOrder reads this
            // to auto-load the confirmation via the same invoice+phone
            // lookup a returning shopper would use manually. The phone
            // comes from getOrderPaymentStatus (the order's own
            // customerPhone, collected at checkout) since this page has
            // no React state of its own — it's a fresh navigation back
            // from PayStation, not a continuation of the checkout form.
            sessionStorage.setItem(
              HANDOFF_KEY,
              JSON.stringify({ subdomain, invoiceNumber: payment.order.invoiceNumber, phone: payment.order.customerPhone }),
            );
          }
          setState('SUCCESS');
          setTimeout(() => router.push(`/store/${subdomain}/thank-you`), 1200);
          return;
        }

        if (result.status === 'FAILED' || result.status === 'CANCELLED') {
          setState(result.status);
          return;
        }

        attemptsRef.current += 1;
        if (attemptsRef.current >= maxAttempts) {
          setState('PENDING');
          return;
        }
        setTimeout(check, 2000);
      } catch {
        if (!cancelled) setState('error');
      }
    };

    check();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceNumber, subdomain]);

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <StoreHeader
        subdomain={subdomain}
        storeName={storeName}
        categories={nav.categories}
        categoryDetails={nav.categoryDetails}
        logoUrl={logoUrl}
        socialLinks={socialLinks}
      />

      <main className="max-w-md mx-auto px-4 py-16 text-center">
        {state === 'checking' && (
          <>
            <Clock className="mx-auto mb-4 text-muted animate-pulse" size={40} />
            <h1 className="text-[18px] font-bold text-ink mb-1">Confirming your payment…</h1>
            <p className="text-[13.5px] text-muted">Please wait while we verify this with PayStation.</p>
          </>
        )}

        {state === 'SUCCESS' && (
          <>
            <CheckCircle2 className="mx-auto mb-4 text-success" size={40} />
            <h1 className="text-[18px] font-bold text-ink mb-1">Payment successful</h1>
            <p className="text-[13.5px] text-muted">Redirecting to your order confirmation…</p>
          </>
        )}

        {state === 'PENDING' && (
          <>
            <Clock className="mx-auto mb-4 text-amber-600" size={40} />
            <h1 className="text-[18px] font-bold text-ink mb-1">Still processing</h1>
            <p className="text-[13.5px] text-muted mb-6">
              PayStation hasn&apos;t confirmed this payment yet. If you completed checkout, your order will be confirmed
              automatically — check Track Order in a minute.
            </p>
            <Link href={`/store/${subdomain}/orders`} className="text-accent text-[13.5px] font-medium hover:underline">
              Track Your Order
            </Link>
          </>
        )}

        {(state === 'FAILED' || state === 'CANCELLED') && (
          <>
            <XCircle className="mx-auto mb-4 text-accent" size={40} />
            <h1 className="text-[18px] font-bold text-ink mb-1">{state === 'CANCELLED' ? 'Payment cancelled' : 'Payment failed'}</h1>
            <p className="text-[13.5px] text-muted mb-6">Nothing was charged. You can return to your cart and try again.</p>
            <Link href={`/store/${subdomain}/cart`} className="text-accent text-[13.5px] font-medium hover:underline">
              Back to Cart
            </Link>
          </>
        )}

        {state === 'error' && (
          <>
            <XCircle className="mx-auto mb-4 text-accent" size={40} />
            <h1 className="text-[18px] font-bold text-ink mb-1">Couldn&apos;t confirm this payment</h1>
            <p className="text-[13.5px] text-muted mb-6">
              {invoiceNumber ? 'Something went wrong verifying this transaction.' : 'No invoice reference was provided.'}
            </p>
            <Link href={`/store/${subdomain}`} className="text-accent text-[13.5px] font-medium hover:underline">
              Back to Store
            </Link>
          </>
        )}
      </main>

      <StoreFooter subdomain={subdomain} storeName={storeName} logoUrl={logoUrl} socialLinks={socialLinks} />
    </div>
  );
}
