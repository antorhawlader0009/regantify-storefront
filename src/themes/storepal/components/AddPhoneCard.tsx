'use client';

import { useState } from 'react';
import { CheckCircle2, Smartphone } from 'lucide-react';
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

  // One joined field: the box and its button share a border, so they read as one control on any width (2026-10-29 redesign).
  const group =
    'flex h-12 items-stretch overflow-hidden rounded-xl border border-line-strong bg-surface transition-[border-color,box-shadow] focus-within:border-accent focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-accent)_18%,transparent)]';
  const field = 'min-w-0 flex-1 bg-transparent px-3 text-[15px] tabular-nums text-ink outline-none placeholder:text-muted';
  const button =
    'shrink-0 whitespace-nowrap bg-ink px-5 text-[13.5px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50';

  if (step === 'done') {
    return (
      <div role="status" className="flex items-center gap-3 rounded-2xl border border-success/30 bg-success-bg px-4 py-3.5 text-[13.5px] font-medium text-success">
        <CheckCircle2 size={20} className="shrink-0" aria-hidden />
        {joined ? t('Your number is added and your two accounts are now one.') : t('Your number is added.')}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent" aria-hidden>
          <Smartphone size={19} />
        </span>
        <div className="min-w-0">
          <p className="m-0 text-[15px] font-semibold text-ink">{t('Add your phone number')}</p>
          <p className="m-0 mt-0.5 text-[12.5px] leading-snug text-muted">
            {t('Needed for reward points, wholesale prices and SMS alerts. If you ordered here before with this number, your orders join this account.')}
          </p>
        </div>
      </div>

      {step === 'phone' ? (
        <form onSubmit={send} className="mt-4">
          <div className={group}>
            <span className="flex items-center border-r border-line bg-canvas px-3 text-[14px] font-medium text-muted" aria-hidden>
              +88
            </span>
            <input
              value={phone}
              onChange={(e) => setPhone(phoneInput(e.target.value))}
              inputMode="tel"
              autoComplete="tel-national"
              required
              aria-label={t('Your mobile number')}
              placeholder="01XXXXXXXXX"
              className={field}
            />
            <button type="submit" disabled={busy} className={button}>
              {busy ? t('Sending…') : t('Send code')}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={verify} className="mt-4">
          {joins && (
            <p className="m-0 mb-2.5 rounded-lg bg-canvas px-3 py-2 text-[12.5px] leading-snug text-ink">
              {t('This number already has an account here. After the code, the two accounts become one.')}
            </p>
          )}
          <p className="m-0 mb-2 text-[12.5px] text-muted">
            {t('Code sent to {phone}').replace('{phone}', phone.trim())}{' '}
            <button type="button" onClick={() => setStep('phone')} className="font-semibold text-accent hover:underline">
              {t('Change number')}
            </button>
          </p>
          <div className={group}>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              aria-label={t('6-digit code')}
              placeholder={t('6-digit code')}
              className={`${field} pl-4 tracking-[0.3em]`}
            />
            <button type="submit" disabled={busy || code.length !== 6} className={button}>
              {busy ? '…' : t('Confirm')}
            </button>
          </div>
        </form>
      )}
      {error && <p className="m-0 mt-2 text-[12.5px] text-accent-dark">{error}</p>}
    </div>
  );
}
