'use client';

import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { resendCodOrderOtp, verifyCodOrder } from '@/lib/checkoutApi';

/**
 * Store > COD Guard "After Checkout" — shown on StorePal's thank-you page
 * while the order waits On Hold for the SMS code texted to the shopper's
 * phone at checkout (see OrdersService.verifyCodOrder on the backend).
 * Calls onVerified once the order has moved on, so the page can drop this
 * card and show the normal confirmation.
 */
export function CodOrderVerification({
  subdomain,
  orderId,
  onVerified,
}: {
  subdomain: string;
  orderId: string;
  onVerified: () => void;
}) {
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const verify = async () => {
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code from the SMS.');
      return;
    }
    setVerifying(true);
    setError(null);
    try {
      const result = await verifyCodOrder(subdomain, orderId, code);
      if (result.codVerificationStatus !== 'PENDING') onVerified();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not verify the code. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const resend = async () => {
    setResending(true);
    setError(null);
    setNotice(null);
    try {
      await resendCodOrderOtp(subdomain, orderId);
      setNotice('A new code is on its way.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend the code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="storepal-fade-up mb-6 rounded-lg border border-accent/25 bg-accent-light p-5">
      <div className="flex items-start gap-3">
        <ShieldCheck size={20} className="text-accent shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[14px] font-bold text-ink">Confirm your order</p>
          <p className="m-0 mt-1 text-[12.5px] text-muted">
            We sent a 6-digit code to your phone. Enter it to confirm this Cash on Delivery order. Your order is on
            hold until you do.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                setError(null);
              }}
              placeholder="Enter code"
              aria-label="Verification code"
              className="w-40 px-3 py-2.5 rounded-md border border-line bg-surface text-[15px] tracking-[0.3em] text-ink focus:outline-none focus:border-accent"
            />
            <button
              type="button"
              onClick={verify}
              disabled={verifying}
              className="px-5 py-2.5 rounded-md bg-accent hover:bg-accent-dark text-white text-[13px] font-bold disabled:opacity-60 transition-colors"
            >
              {verifying ? 'Verifying…' : 'Confirm Order'}
            </button>
          </div>
          {error && <p className="m-0 mt-2 text-[12.5px] text-accent">{error}</p>}
          {notice && <p className="m-0 mt-2 text-[12.5px] text-success">{notice}</p>}
          <button
            type="button"
            onClick={resend}
            disabled={resending}
            className="mt-2 text-[12.5px] font-semibold text-accent underline underline-offset-2 disabled:opacity-60"
          >
            {resending ? 'Sending…' : 'Resend code'}
          </button>
        </div>
      </div>
    </div>
  );
}
