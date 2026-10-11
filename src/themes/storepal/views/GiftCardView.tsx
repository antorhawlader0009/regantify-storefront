'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Clock, Gift, XCircle } from 'lucide-react';
import { apiOrigin } from '@/lib/checkoutApi';
import { getStoreSocialLinks } from '@/lib/socialLinksApi';
import { useStoreDisplayName } from '../lib/useStoreDisplayName';
import { getGiftCardSale, getStoreNavData, type GiftCardPurchaseResult, type GiftCardSaleConfig, type StoreNavData } from '../lib/storeNavApi';
import { formatPrice } from '../lib/formatPrice';
import { StoreHeader } from '../components/StoreHeader';
import { StoreFooter } from '../components/StoreFooter';

const field = 'w-full px-3.5 py-2.5 rounded-md text-[13.5px] bg-surface border border-line-strong outline-none focus:border-ink transition-colors';

/**
 * /gift-card (TellMe idea 135): the buyer picks an amount, gives their own and the receiver's name and phone and an optional message, and pays through
 * the store's SSLCommerz. After paying, SSLCommerz sends the browser back here with ?invoice=...; this page then re-checks the payment on the server
 * (never trusting the redirect) and shows the result. The receiver is texted the code by the store; the code is also shown to the buyer once paid.
 */
export function GiftCardView({ subdomain }: { subdomain: string }) {
  const invoice = useSearchParams().get('invoice');
  const storeName = useStoreDisplayName(subdomain);
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

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <StoreHeader subdomain={subdomain} storeName={storeName} categories={nav.categories} categoryDetails={nav.categoryDetails} logoUrl={logoUrl} socialLinks={socialLinks} />
      <main className="mx-auto max-w-lg px-4 py-10 sm:px-6">{invoice ? <Result invoice={invoice} subdomain={subdomain} /> : <Form subdomain={subdomain} />}</main>
      <StoreFooter subdomain={subdomain} storeName={storeName} />
    </div>
  );
}

function Form({ subdomain }: { subdomain: string }) {
  const [config, setConfig] = useState<GiftCardSaleConfig | null | undefined>(undefined);
  const [amount, setAmount] = useState(0);
  const [f, setF] = useState({ buyerName: '', buyerPhone: '', recipientName: '', recipientPhone: '', message: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    getGiftCardSale(subdomain).then((c) => {
      setConfig(c);
      if (c?.amounts[0]) setAmount(c.amounts[0]);
    });
  }, [subdomain]);

  if (config === undefined) return <p className="text-center text-[14px] text-muted">…</p>;
  if (!config || !config.enabled || config.amounts.length === 0) return <p className="text-center text-[14px] text-muted">Gift cards are not on sale right now.</p>;

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await fetch(`${apiOrigin()}/v1/store-gift-cards/store/${encodeURIComponent(subdomain)}/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, ...f, message: f.message || undefined }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof body.message === 'string' ? body.message : Array.isArray(body.message) ? String(body.message[0]) : 'Could not start the payment.');
      window.location.href = body.paymentUrl;
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="text-center">
        <Gift className="mx-auto mb-2" size={32} />
        <h1 className="m-0 text-[26px] font-bold">Gift card</h1>
        <p className="mt-1 text-[13px] text-muted">Send {config.storeName} to someone you care about. They get a code by SMS and spend it at checkout.</p>
      </div>
      <div>
        <p className="mb-1.5 text-[13.5px] font-medium">Amount</p>
        <div className="flex flex-wrap gap-2">
          {config.amounts.map((a) => (
            <button key={a} type="button" onClick={() => setAmount(a)} className={`rounded-md border px-4 py-2 text-[14px] font-semibold ${amount === a ? 'border-ink bg-ink text-white' : 'border-line-strong bg-surface'}`}>
              {formatPrice(a)}
            </button>
          ))}
        </div>
      </div>
      <input className={field} required maxLength={80} placeholder="Your name" value={f.buyerName} onChange={set('buyerName')} />
      <input className={field} required inputMode="tel" maxLength={30} placeholder="Your phone (01XXXXXXXXX)" value={f.buyerPhone} onChange={set('buyerPhone')} />
      <input className={field} required maxLength={80} placeholder="Receiver’s name" value={f.recipientName} onChange={set('recipientName')} />
      <input className={field} required inputMode="tel" maxLength={30} placeholder="Receiver’s phone (01XXXXXXXXX)" value={f.recipientPhone} onChange={set('recipientPhone')} />
      <textarea className={`${field} resize-y`} rows={2} maxLength={160} placeholder="A message (optional)" value={f.message} onChange={set('message')} />
      {config.expiryDays && <p className="m-0 text-[12px] text-muted">The card is valid for {config.expiryDays} days.</p>}
      {error && <p className="m-0 text-[13px] text-red-600">{error}</p>}
      <button type="submit" disabled={busy || amount === 0} className="w-full rounded-md bg-ink px-4 py-3 text-[14px] font-semibold text-white disabled:opacity-60">
        {busy ? 'Opening payment…' : `Pay ${formatPrice(amount)}`}
      </button>
    </form>
  );
}

function Result({ invoice, subdomain }: { invoice: string; subdomain: string }) {
  const [result, setResult] = useState<GiftCardPurchaseResult | null>(null);
  const [failed, setFailed] = useState(false);
  const tries = useRef(0);
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch(`${apiOrigin()}/v1/store-gift-cards/reconcile/${encodeURIComponent(invoice)}`, { method: 'POST' });
        if (!res.ok) throw new Error('x');
        const data = (await res.json()) as GiftCardPurchaseResult;
        if (cancelled) return;
        setResult(data);
        if (data.status === 'PENDING' && ++tries.current < 6) setTimeout(check, 2500);
      } catch {
        if (!cancelled) setFailed(true);
      }
    };
    void check();
    return () => {
      cancelled = true;
    };
  }, [invoice]);

  if (failed) return <p className="text-center text-[14px] text-muted">We could not check this payment. Please refresh in a moment.</p>;
  if (!result) return <p className="text-center text-[14px] text-muted">Checking your payment…</p>;
  if (result.status === 'PAID') {
    return (
      <div className="text-center">
        <CheckCircle2 className="mx-auto mb-3 text-success" size={44} />
        <h1 className="m-0 text-[22px] font-bold">Your gift card is on its way</h1>
        <p className="mt-2 text-[14px] text-muted">
          {formatPrice(result.amount)} for {result.recipientName}. {result.smsSent ? `We sent the code to ${result.recipientPhone} by SMS.` : 'The SMS could not be sent, so please pass this code on yourself.'}
        </p>
        {result.code && <p className="mx-auto mt-4 w-fit rounded-md border border-dashed border-ink px-5 py-2 font-mono text-[18px] font-semibold tracking-wider">{result.code}</p>}
        {result.expiresAt && <p className="mt-2 text-[12px] text-muted">Valid until {result.expiresAt.slice(0, 10)}.</p>}
      </div>
    );
  }
  if (result.status === 'PENDING') {
    return (
      <div className="text-center">
        <Clock className="mx-auto mb-3 text-muted" size={44} />
        <h1 className="m-0 text-[20px] font-bold">Waiting for the payment to be confirmed</h1>
        <p className="mt-2 text-[14px] text-muted">If you paid, it will show here shortly. Refresh this page in a minute.</p>
      </div>
    );
  }
  return (
    <div className="text-center">
      <XCircle className="mx-auto mb-3 text-red-600" size={44} />
      <h1 className="m-0 text-[20px] font-bold">The payment did not go through</h1>
      <a href={`/store/${subdomain}/gift-card`} className="mt-4 inline-block rounded-md bg-ink px-5 py-2.5 text-[14px] font-semibold text-white">
        Try again
      </a>
    </div>
  );
}
