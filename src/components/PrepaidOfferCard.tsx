'use client';

import { useState } from 'react';
import { Wallet } from 'lucide-react';
import { startPrepaidSwitch } from '@/lib/checkoutApi';
import { formatPrice } from '@/lib/productDisplay';

/**
 * "Pay now online and save" (TellMe "StorePal 1" idea 5), shared by every template's thank-you and tracking pages:
 * a Cash on Delivery order the store offers it on (server PrepaidSwitchService) shows the saving and one button. The
 * button turns the order's payment into a payment link and opens the pay page; until the payment arrives nothing about
 * the order changes, so a shopper who changes their mind just pays cash on delivery as before.
 */
export function PrepaidOfferCard({
  subdomain,
  token,
  offer,
  lang,
}: {
  subdomain: string;
  token: string;
  offer: { saving: number; payNow: number };
  lang: 'en' | 'bn';
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bn = lang === 'bn';
  const saving = formatPrice(offer.saving);
  const payNow = formatPrice(offer.payNow);

  const go = async () => {
    setBusy(true);
    setError(null);
    try {
      const { payPath } = await startPrepaidSwitch(subdomain, token);
      window.location.href = payPath;
    } catch (e) {
      setError(e instanceof Error ? e.message : bn ? 'আবার চেষ্টা করুন।' : 'Please try again.');
      setBusy(false);
    }
  };

  return (
    <section className="rounded-lg border border-success/30 bg-success-bg p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success text-white">
          <Wallet size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold text-ink">{bn ? `এখন অনলাইনে পেমেন্ট করলে ${saving} কম` : `Pay online now and save ${saving}`}</p>
          <p className="mt-0.5 text-[13px] text-muted">
            {bn
              ? `bKash, Nagad বা কার্ডে ${payNow} দিলেই হবে, ডেলিভারির সময় কিছু দিতে হবে না। না চাইলে আগের মতোই ক্যাশ অন ডেলিভারি থাকবে।`
              : `Pay ${payNow} with bKash, Nagad or a card and nothing is due on delivery. If you'd rather not, it stays cash on delivery.`}
          </p>
          {error && <p className="mt-2 text-[12.5px] font-medium text-accent-dark">{error}</p>}
          <button
            type="button"
            onClick={go}
            disabled={busy}
            className="mt-3 rounded-lg bg-success px-4 py-2.5 text-[13.5px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {busy ? (bn ? 'খোলা হচ্ছে…' : 'Opening…') : bn ? `${payNow} পেমেন্ট করুন` : `Pay ${payNow} now`}
          </button>
        </div>
      </div>
    </section>
  );
}
