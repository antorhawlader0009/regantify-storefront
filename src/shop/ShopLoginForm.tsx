'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
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
export function ShopLoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const signedIn = useShopSession((s) => s.signedIn);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      router.replace(safeNext(params.get('next')));
    } catch (e) {
      setError(e instanceof ShopApiError ? e.message : 'Could not sign you in. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  const field = 'mt-1 block w-full rounded-[14px] border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm focus:border-[var(--shop-accent)] focus:outline-none';
  return (
    <div className="rounded-2xl bg-white shadow-[0_2px_12px_rgba(16,24,40,0.06)] p-6">
      <h1 className="text-lg font-semibold text-slate-900">Sign in</h1>
      <p className="mt-1 text-sm text-slate-600">One sign-in to buy from every store on the Shop. New here? The same steps make your account.</p>
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
