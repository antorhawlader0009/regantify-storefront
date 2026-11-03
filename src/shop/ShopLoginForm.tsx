'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { phoneInput } from '@/lib/phoneInput';
import { shopApi, ShopApiError, useShopSession } from './shopClient';

/** Only paths inside the Shop may be the page to go back to. */
function safeNext(raw: string | null): string {
  return raw && raw.startsWith('/shop') && !raw.startsWith('//') ? raw : '/shop';
}

/**
 * Phone and a texted code (2026-11-03). A number with no account gets one (the name box is used then); the same account signs in to the
 * Regantify app. The token stays in the Shop's httpOnly cookie; this page only learns the name.
 */
export function ShopLoginForm({ onDone }: { onDone?: () => void }) {
  const router = useRouter();
  const params = useSearchParams();
  const signedIn = useShopSession((s) => s.signedIn);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [google, setGoogle] = useState(false);

  // The Google button shows only when the server has Google set up for the Shop (SHOP_GOOGLE_CALLBACK_URL).
  useEffect(() => {
    let live = true;
    shopApi<{ enabled: boolean }>('auth/google/config')
      .then((r) => live && setGoogle(r.enabled))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);

  async function withGoogle() {
    setError(null);
    setBusy(true);
    try {
      // In the sign-in popup the shopper comes back to the page they were on; on /shop/login to its ?next=.
      const next = onDone ? `${window.location.pathname}${window.location.search}` : safeNext(params.get('next'));
      const r = await shopApi<{ url: string }>('auth/google/start', { method: 'POST', body: { next } });
      window.location.assign(r.url);
    } catch (e) {
      setError(e instanceof ShopApiError ? e.message : 'Could not open Google. Please try again.');
      setBusy(false);
    }
  }

  async function send() {
    setError(null);
    if (!/^01[3-9]\d{8}$/.test(phone)) {
      setError('Enter your mobile number as 01XXXXXXXXX.');
      return;
    }
    setBusy(true);
    try {
      await shopApi('auth/send', { method: 'POST', body: { phone } });
      setStep('code');
    } catch (e) {
      setError(e instanceof ShopApiError ? e.message : 'Could not send the code. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    setError(null);
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code.');
      return;
    }
    setBusy(true);
    try {
      const r = await shopApi<{ customer: { name: string | null } }>('auth/verify', { method: 'POST', body: { phone, code, name: name.trim() } });
      await signedIn({ name: r.customer.name });
      if (onDone) onDone();
      else router.replace(safeNext(params.get('next')));
    } catch (e) {
      setError(e instanceof ShopApiError ? e.message : 'Could not sign you in. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  const field = 'mt-1 block w-full rounded-[14px] border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm focus:border-[var(--shop-accent)] focus:outline-none';
  return (
    <div className="rounded-2xl bg-white shadow-[0_2px_12px_rgba(16,24,40,0.06)] p-6">
      {onDone ? null : <h1 className="text-lg font-semibold text-slate-900">Sign in</h1>}
      <p className="mt-1 text-sm text-slate-600">One sign-in to buy from every store on the Shop. New here? The same steps make your account.</p>
      {step === 'phone' && google ? (
        <>
          <button
            type="button"
            disabled={busy}
            onClick={withGoogle}
            className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-full border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
          >
            <GoogleMark />
            Continue with Google
          </button>
          <div className="mt-4 flex items-center gap-3 text-xs text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            or with your mobile number
            <span className="h-px flex-1 bg-slate-200" />
          </div>
        </>
      ) : null}
      {step === 'phone' ? (
        <div className="mt-5 space-y-4">
          <label className="block text-sm text-slate-800">
            Mobile number
            <input inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(phoneInput(e.target.value))} placeholder="01XXXXXXXXX" className={field} />
          </label>
          <label className="block text-sm text-slate-800">
            Your name <span className="text-slate-400">(only for a new account)</span>
            <input autoComplete="name" maxLength={100} value={name} onChange={(e) => setName(e.target.value)} className={field} />
          </label>
          <button type="button" disabled={busy} onClick={send} className="w-full rounded-full bg-[var(--shop-accent)] py-2.5 text-sm font-semibold text-white hover:bg-[var(--shop-accent-dark)] disabled:opacity-60">
            {busy ? 'Sending…' : 'Send code by SMS'}
          </button>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <p className="text-sm text-slate-700">We sent a 6-digit code to {phone}.</p>
          <label className="block text-sm text-slate-800">
            Code
            <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} className={field} />
          </label>
          <button type="button" disabled={busy} onClick={verify} className="w-full rounded-full bg-[var(--shop-accent)] py-2.5 text-sm font-semibold text-white hover:bg-[var(--shop-accent-dark)] disabled:opacity-60">
            {busy ? 'Checking…' : 'Sign in'}
          </button>
          <button type="button" onClick={() => setStep('phone')} className="w-full text-sm text-slate-600 underline">
            Use another number
          </button>
        </div>
      )}
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

/** Google's "G" mark (the official four colours), for the sign-in button. */
function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
