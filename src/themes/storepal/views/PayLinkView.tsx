'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle2, Clock, Lock, XCircle } from 'lucide-react';
import { fetchPaymentLink, initiateOrderPayment, type PaymentLinkInfo } from '@/lib/checkoutApi';
import { ui, useTrackLang } from '@/lib/trackingI18n';
import { LangToggle } from './TrackOrderView';

/** Sent to the payment callback page so a failed payment can offer "try again" on this same link. */
export const PAY_LINK_KEY = 'regantify-pay-link';

// Whole taka when it is whole, else two decimals: a fee of ৳1.2 must not round away on a page about money.
const taka = (n: number) => `৳${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

/**
 * The page behind a payment link (TellMe idea 19): the vendor made it on an order they entered themselves and sent it
 * in a chat or SMS. It shows what is to be paid and takes the customer to PayStation; they land back on the same
 * payment-callback page a store checkout uses, which confirms the payment and shows the order. Theme-independent on
 * purpose, like the tracking page, so the link works for a store on any theme. The token is the proof of access.
 */
export function PayLinkView({
  subdomain,
  token,
  storeName,
  logoUrl,
}: {
  subdomain: string;
  token: string;
  storeName: string;
  logoUrl: string | null;
}) {
  const [lang, setLang] = useTrackLang();
  const [info, setInfo] = useState<PaymentLinkInfo | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPaymentLink(subdomain, token)
      .then((i) => !cancelled && setInfo(i))
      .catch((err) => !cancelled && setLoadError(err instanceof Error ? err.message : 'This payment link is not valid.'));
    return () => {
      cancelled = true;
    };
  }, [subdomain, token]);

  async function pay() {
    if (!info?.orderId) return;
    setPaying(true);
    setPayError(null);
    try {
      const { paymentUrl } = await initiateOrderPayment(info.orderId);
      try {
        sessionStorage.setItem(PAY_LINK_KEY, JSON.stringify({ subdomain, token }));
      } catch {
        // not remembered: a failed payment just won't show "try again"
      }
      window.location.href = paymentUrl;
    } catch (err) {
      setPayError(err instanceof Error ? err.message : 'Could not start the payment. Please try again.');
      setPaying(false);
    }
  }

  const expires = info?.expiresAt
    ? new Date(info.expiresAt).toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Dhaka' })
    : null;

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-line bg-canvas">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 min-h-14 py-2 flex items-center justify-between gap-3">
          <Link href={`/store/${subdomain}`} className="flex items-center gap-2 min-w-0">
            {logoUrl ? (
              <Image src={logoUrl} alt={storeName} width={120} height={32} className="h-8 w-auto object-contain" unoptimized />
            ) : (
              <span className="text-[16px] font-bold text-ink truncate">{storeName}</span>
            )}
          </Link>
          <LangToggle lang={lang} onChange={setLang} />
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 sm:px-6 py-8">
        {!info && !loadError && (
          <p className="text-center text-[13.5px] text-muted">
            <Clock className="mx-auto mb-3 animate-pulse" size={32} aria-hidden />…
          </p>
        )}

        {loadError && (
          <div className="text-center">
            <XCircle className="mx-auto mb-3 text-accent" size={36} aria-hidden />
            <p className="text-[14px] text-ink">{ui(lang, 'payUnavailable')}</p>
          </div>
        )}

        {info?.state === 'READY' && (
          <div className="rounded-lg border border-line bg-canvas p-5 sm:p-6">
            <h1 className="m-0 text-[20px] font-bold text-ink">{ui(lang, 'payTitle')}</h1>
            <p className="m-0 mt-2 text-[13.5px] text-muted">
              {info.customerName ? `${ui(lang, 'payHello')} ${info.customerName}. ` : ''}
              {ui(lang, 'payIntro')}
            </p>

            <dl className="mt-5 space-y-2 text-[13.5px] text-ink">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">{ui(lang, 'payOrder')}</dt>
                <dd className="m-0 font-medium break-all text-right">{info.orderRef}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">{ui(lang, 'payAdvance')}</dt>
                <dd className="m-0 font-medium">{taka(info.amount ?? 0)}</dd>
              </div>
              {(info.fee ?? 0) > 0 && (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">{ui(lang, 'payFee')}</dt>
                  <dd className="m-0 font-medium">{taka(info.fee ?? 0)}</dd>
                </div>
              )}
              <div className="flex justify-between gap-3 border-t border-line pt-2 text-[15px] font-bold">
                <dt>{ui(lang, 'payNowAmount')}</dt>
                <dd className="m-0">{taka(info.payable ?? 0)}</dd>
              </div>
              {(info.dueOnDelivery ?? 0) > 0 && (
                <div className="flex justify-between gap-3 text-muted">
                  <dt>{ui(lang, 'payOnDelivery')}</dt>
                  <dd className="m-0">{taka(info.dueOnDelivery ?? 0)}</dd>
                </div>
              )}
            </dl>

            {payError && <p className="m-0 mt-4 text-[12.5px] text-accent">{payError}</p>}

            <button
              type="button"
              onClick={pay}
              disabled={paying}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-md bg-accent px-4 min-h-[48px] text-[14px] font-bold text-white transition-colors hover:bg-accent-dark disabled:opacity-60"
            >
              <Lock size={15} aria-hidden />
              {paying ? ui(lang, 'payOpening') : `${ui(lang, 'payButton')} · ${taka(info.payable ?? 0)}`}
            </button>
            <p className="m-0 mt-3 text-center text-[12px] text-muted">{ui(lang, 'payNote')}</p>
            {expires && (
              <p className="m-0 mt-1 text-center text-[12px] text-muted">
                {ui(lang, 'payValidUntil')} {expires}
              </p>
            )}
          </div>
        )}

        {info?.state === 'PAID' && (
          <div className="text-center">
            <CheckCircle2 className="mx-auto mb-3 text-success" size={40} aria-hidden />
            <p className="text-[15px] font-semibold text-ink">{ui(lang, 'payPaid')}</p>
            <Link href={`/store/${subdomain}/t/${token}`} className="mt-3 inline-block text-[13.5px] font-medium text-accent hover:underline">
              {ui(lang, 'payTrack')}
            </Link>
          </div>
        )}

        {info?.state === 'EXPIRED' && (
          <div className="text-center">
            <Clock className="mx-auto mb-3 text-amber-600" size={36} aria-hidden />
            <p className="text-[14px] text-ink">{ui(lang, 'payExpired')}</p>
          </div>
        )}

        {info?.state === 'UNAVAILABLE' && (
          <div className="text-center">
            <XCircle className="mx-auto mb-3 text-accent" size={36} aria-hidden />
            <p className="text-[14px] text-ink">{ui(lang, 'payUnavailable')}</p>
          </div>
        )}
      </main>
    </div>
  );
}
