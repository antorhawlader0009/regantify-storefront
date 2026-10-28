'use client';

import { useState } from 'react';
import { sendAddPhoneCode, verifyAddPhone } from '@/lib/customerAuthApi';
import { useCustomerAuthStore } from '@/providers/customer-auth-store-provider';
import { phoneInput } from '@/lib/phoneInput';
import { useStoreText } from '../lib/storeText';

/**
 * Account > Edit Profile for an account opened with Google (no phone yet): add a number with an SMS code. When the
 * number already has an account here, the two are joined into that one (server CustomerAuthService.addPhoneVerify),
 * so orders, addresses and points are in one place and Google keeps working. A new sign-in comes back either way.
 */
export function AddPhoneCard({ subdomain }: { subdomain: string }) {
  const t = useStoreText();
  const accessToken = useCustomerAuthStore((s) => s.accessToken);
  const setSession = useCustomerAuthStore((s) => s.setSession);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code' | 'done'>('phone');
  const [joins, setJoins] = useState(false);
  const [joined, setJoined] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setBusy(true);
    setError(null);
    try {
      const r = await sendAddPhoneCode(accessToken, phone.trim(), subdomain);
      setJoins(r.joinsAccount);
      setStep('code');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the code.');
    } finally {
      setBusy(false);
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setBusy(true);
    setError(null);
    try {
      const r = await verifyAddPhone(accessToken, phone.trim(), code.trim(), subdomain);
      setSession(r.customer, r.accessToken);
      setJoined(r.joined);
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not check the code.');
    } finally {
      setBusy(false);
    }
  };

  const input = 'w-full px-3.5 py-2.5 rounded-md border border-line-strong bg-canvas text-[13.5px] outline-none focus:border-ink transition-colors';
  const button = 'px-4 py-2.5 rounded-md bg-ink hover:bg-ink/90 text-white text-[13px] font-bold transition-colors disabled:opacity-60';

  if (step === 'done') {
    return (
      <div role="status" className="rounded-lg border border-line bg-success-bg p-4 text-[13px] text-success">
        {joined ? t('Your number is added and your two accounts are now one.') : t('Your number is added.')}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <p className="m-0 text-[14px] font-semibold text-ink">{t('Add your phone number')}</p>
      <p className="m-0 mt-1 text-[12.5px] text-muted">
        {t('Needed for reward points, wholesale prices and SMS alerts. If you ordered here before with this number, your orders join this account.')}
      </p>
      {step === 'phone' ? (
        <form onSubmit={send} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input value={phone} onChange={(e) => setPhone(phoneInput(e.target.value))} inputMode="tel" required placeholder="01XXXXXXXXX" className={input} />
          <button type="submit" disabled={busy} className={button}>
            {busy ? '…' : t('Send code')}
          </button>
        </form>
      ) : (
        <form onSubmit={verify} className="mt-3 space-y-2">
          {joins && <p className="m-0 text-[12.5px] text-ink">{t('This number already has an account here. After the code, the two accounts become one.')}</p>}
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              required
              placeholder={t('6-digit code')}
              className={input}
            />
            <button type="submit" disabled={busy || code.length !== 6} className={button}>
              {busy ? '…' : t('Confirm')}
            </button>
          </div>
          <button type="button" onClick={() => setStep('phone')} className="text-[12.5px] text-muted underline underline-offset-2">
            {t('Change number')}
          </button>
        </form>
      )}
      {error && <p className="m-0 mt-2 text-[12.5px] text-accent-dark">{error}</p>}
    </div>
  );
}
