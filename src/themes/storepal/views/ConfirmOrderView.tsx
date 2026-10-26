'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle2, Clock, ShieldQuestion, XCircle } from 'lucide-react';
import { answerConfirmLink, fetchTrackedOrderByLink, type TrackedOrder } from '@/lib/checkoutApi';
import { useTrackLang, type TrackLang } from '@/lib/trackingI18n';
import { LangToggle } from './TrackOrderView';

const taka = (n: number) => `৳${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

const COPY: Record<TrackLang, Record<string, string>> = {
  en: {
    title: 'Is this your order?',
    intro: 'Please tap Yes to confirm it, so we can get it ready for you.',
    order: 'Order',
    total: 'Total to pay on delivery',
    yes: 'Yes, this is my order',
    no: 'I did not order this',
    sending: 'One moment…',
    doneYes: 'Thank you! Your order is confirmed.',
    doneYesNote: 'We will get it ready for delivery. You do not need to do anything else.',
    doneNo: 'Understood. The order was cancelled.',
    doneNoNote: 'Sorry for the trouble. The store has been told.',
    track: 'Track this order',
    unavailable: 'This link is not valid or has expired.',
    handled: 'This order is already being handled by the store. Thank you!',
    cancelled: 'This order is already cancelled.',
    error: 'Something went wrong. Please try again.',
    sure: 'Cancel this order? Press again to confirm.',
  },
  bn: {
    title: 'এটা কি আপনার অর্ডার?',
    intro: 'নিশ্চিত করতে “হ্যাঁ” চাপুন, তাহলে আমরা আপনার জন্য তৈরি করব।',
    order: 'অর্ডার',
    total: 'ডেলিভারির সময় দিতে হবে',
    yes: 'হ্যাঁ, এটা আমার অর্ডার',
    no: 'আমি এই অর্ডার দিইনি',
    sending: 'একটু অপেক্ষা করুন…',
    doneYes: 'ধন্যবাদ! আপনার অর্ডার কনফার্ম হয়েছে।',
    doneYesNote: 'আমরা ডেলিভারির জন্য তৈরি করব। আর কিছু করতে হবে না।',
    doneNo: 'ঠিক আছে। অর্ডারটি বাতিল করা হয়েছে।',
    doneNoNote: 'অসুবিধার জন্য দুঃখিত। দোকানকে জানানো হয়েছে।',
    track: 'অর্ডার ট্র্যাক করুন',
    unavailable: 'এই লিংকটি ঠিক নেই বা মেয়াদ শেষ।',
    handled: 'দোকান এই অর্ডারটি আগেই দেখছে। ধন্যবাদ!',
    cancelled: 'এই অর্ডারটি আগেই বাতিল হয়েছে।',
    error: 'কিছু একটা ভুল হয়েছে। আবার চেষ্টা করুন।',
    sure: 'অর্ডারটি বাতিল করবেন? নিশ্চিত করতে আবার চাপুন।',
  },
};

/**
 * The page behind the SMS "confirm your order" link (IDEA-24, server orders/customer-confirm.ts): "Is this your order?" with two big buttons.
 * Yes marks the order confirmed; "I did not order this" cancels it (asked twice, because it cannot be undone). Theme-independent like the
 * tracking and payment links, so it works for a store on any theme; the token in the address is the proof. It shows only the order number,
 * the items and the total, never the address or phone.
 */
export function ConfirmOrderView({ subdomain, token, storeName, logoUrl }: { subdomain: string; token: string; storeName: string; logoUrl: string | null }) {
  const [lang, setLang] = useTrackLang();
  const t = COPY[lang];
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sure, setSure] = useState(false);
  const [answered, setAnswered] = useState<'YES' | 'NO' | null>(null);

  useEffect(() => {
    let live = true;
    fetchTrackedOrderByLink(subdomain, token)
      .then((o) => live && setOrder(o))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [subdomain, token]);

  async function answer(a: 'YES' | 'NO') {
    if (a === 'NO' && !sure) {
      setSure(true);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const next = await answerConfirmLink(subdomain, token, a);
      setOrder(next);
      setAnswered(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.error);
    } finally {
      setBusy(false);
    }
  }

  const confirmed = answered === 'YES' || !!order?.customerConfirm?.confirmed;
  const cancelled = answered === 'NO' || order?.status === 'CANCELLED';
  const ref = order?.publicCode ?? (order ? `#${order.invoiceNumber}` : '');

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-line bg-canvas">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 min-h-14 py-2 flex items-center justify-between gap-3">
          <Link href={`/store/${subdomain}`} className="flex items-center gap-2 min-w-0">
            {logoUrl ? <Image src={logoUrl} alt={storeName} width={120} height={32} className="h-8 w-auto object-contain" unoptimized /> : <span className="text-[16px] font-bold text-ink truncate">{storeName}</span>}
          </Link>
          <LangToggle lang={lang} onChange={setLang} />
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 sm:px-6 py-8">
        {!order && !failed && (
          <p className="text-center text-[13.5px] text-muted">
            <Clock className="mx-auto mb-3 animate-pulse" size={32} aria-hidden />…
          </p>
        )}

        {failed && (
          <div className="text-center">
            <XCircle className="mx-auto mb-3 text-accent" size={36} aria-hidden />
            <p className="text-[14px] text-ink">{t.unavailable}</p>
          </div>
        )}

        {order && cancelled && (
          <div className="text-center">
            <XCircle className="mx-auto mb-3 text-accent" size={40} aria-hidden />
            <p className="text-[15px] font-semibold text-ink">{answered === 'NO' ? t.doneNo : t.cancelled}</p>
            {answered === 'NO' && <p className="mt-1 text-[13px] text-muted">{t.doneNoNote}</p>}
          </div>
        )}

        {order && !cancelled && confirmed && (
          <div className="text-center">
            <CheckCircle2 className="mx-auto mb-3 text-success" size={44} aria-hidden />
            <p className="text-[16px] font-semibold text-ink">{t.doneYes}</p>
            <p className="mt-1 text-[13px] text-muted">{t.doneYesNote}</p>
            <Link href={`/store/${subdomain}/t/${token}`} className="mt-4 inline-block text-[13.5px] font-medium text-accent hover:underline">
              {t.track}
            </Link>
          </div>
        )}

        {order && !cancelled && !confirmed && order.customerConfirm?.allowed && (
          <div className="rounded-lg border border-line bg-canvas p-5 sm:p-6">
            <ShieldQuestion className="mb-2 text-accent" size={28} aria-hidden />
            <h1 className="m-0 text-[20px] font-bold text-ink">{t.title}</h1>
            <p className="m-0 mt-2 text-[13.5px] text-muted">{t.intro}</p>

            <div className="mt-4 rounded-md bg-surface px-3.5 py-3 text-[13.5px] text-ink">
              <p className="m-0 flex justify-between gap-3">
                <span className="text-muted">{t.order}</span>
                <span className="font-medium break-all text-right">{ref}</span>
              </p>
              <ul className="m-0 mt-2 list-none space-y-0.5 p-0 text-[13px]">
                {order.items.map((i) => (
                  <li key={i.id}>
                    {i.quantity} × {i.productName}
                  </li>
                ))}
              </ul>
              <p className="m-0 mt-2 flex justify-between gap-3 border-t border-line pt-2 font-bold">
                <span>{t.total}</span>
                <span>{taka(Number(order.total))}</span>
              </p>
            </div>

            {error && <p className="m-0 mt-3 text-[12.5px] text-accent">{error}</p>}

            <button
              type="button"
              onClick={() => void answer('YES')}
              disabled={busy}
              className="mt-5 flex w-full items-center justify-center rounded-md bg-accent px-4 min-h-[52px] text-[15px] font-bold text-white transition-colors hover:bg-accent-dark disabled:opacity-60"
            >
              {busy ? t.sending : t.yes}
            </button>
            <button
              type="button"
              onClick={() => void answer('NO')}
              disabled={busy}
              className={`mt-3 flex w-full items-center justify-center rounded-md border px-4 min-h-[46px] text-[13.5px] font-semibold transition-colors disabled:opacity-60 ${
                sure ? 'border-accent bg-accent/10 text-accent' : 'border-line text-ink hover:bg-surface'
              }`}
            >
              {sure ? t.sure : t.no}
            </button>
          </div>
        )}

        {order && !cancelled && !confirmed && !order.customerConfirm?.allowed && (
          <div className="text-center">
            <CheckCircle2 className="mx-auto mb-3 text-success" size={36} aria-hidden />
            <p className="text-[14px] text-ink">{t.handled}</p>
            <Link href={`/store/${subdomain}/t/${token}`} className="mt-3 inline-block text-[13.5px] font-medium text-accent hover:underline">
              {t.track}
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
