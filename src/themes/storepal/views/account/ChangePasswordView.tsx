'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User } from 'lucide-react';
import { changeMyPassword, sendSetPasswordCode, setMyPassword } from '@/lib/customerAuthApi';
import { useCustomerAuthStore, useCustomerAuthHydrated } from '@/providers/customer-auth-store-provider';
import { AccountLayout } from '../../components/AccountLayout';
import { useStoreDisplayName } from '../../lib/useStoreDisplayName';
import { useStoreText } from '../../lib/storeText';

const inputClass =
  'w-full px-3.5 py-2.5 rounded-md border border-line-strong bg-canvas text-[13.5px] outline-none focus:border-ink transition-colors';

/**
 * Account > Change Password (already logged in) - matches the reference sidebar-layout screenshot. An account opened
 * with Google has no password of its own yet (`hasPassword` false): it sets one with a code texted to its phone instead
 * of the current password, and needs a phone first (Edit Profile > Add phone number).
 */
export function ChangePasswordView({ subdomain }: { subdomain: string }) {
  const t = useStoreText();
  const storeName = useStoreDisplayName(subdomain);
  const hydrated = useCustomerAuthHydrated();
  const customer = useCustomerAuthStore((s) => s.customer);
  const accessToken = useCustomerAuthStore((s) => s.accessToken);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [code, setCode] = useState('');
  const [codeSentTo, setCodeSentTo] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  // Set once a Google account saved its first password in this visit, so the page switches to the normal form.
  const [passwordNowSet, setPasswordNowSet] = useState(false);
  // An older saved sign-in may not know hasPassword yet; the server then says the account has none.
  const [needsSet, setNeedsSet] = useState(false);

  const settingFirst = (customer?.hasPassword === false || needsSet) && !passwordNowSet;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    if (!currentPassword.trim() || newPassword.length < 6) {
      setError(t('Enter your current password and a new password of at least 6 characters.'));
      return;
    }
    if (!accessToken) return;
    setSaving(true);
    try {
      await changeMyPassword(accessToken, currentPassword.trim(), newPassword);
      setSaved(true);
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      if (err instanceof Error && err.message.includes('no password yet')) {
        setNeedsSet(true);
        return;
      }
      setError(err instanceof Error ? err.message : t('Could not change your password.'));
    } finally {
      setSaving(false);
    }
  };

  const sendCode = async () => {
    if (!accessToken) return;
    setError(null);
    setSaving(true);
    try {
      const res = await sendSetPasswordCode(accessToken, subdomain);
      setCodeSentTo(res.phone);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Could not send the code. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const handleSet = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (code.trim().length !== 6 || newPassword.length < 6) {
      setError(t('Enter the 6-digit code and a new password of at least 6 characters.'));
      return;
    }
    if (!accessToken) return;
    setSaving(true);
    try {
      await setMyPassword(accessToken, code.trim(), newPassword);
      setPasswordNowSet(true);
      setSaved(true);
      setCode('');
      setNewPassword('');
      setCodeSentTo(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Could not change your password.'));
    } finally {
      setSaving(false);
    }
  };

  if (hydrated && !customer) {
    return (
      <AccountLayout subdomain={subdomain} storeName={storeName}>
        <div className="bg-surface border border-line rounded-lg p-6 text-center">
          <User size={26} className="mx-auto text-muted mb-3" />
          <p className="text-[14px] text-ink font-semibold mb-1">{t('Log in to change your password')}</p>
          <Link
            href={`/store/${subdomain}/account/login`}
            className="inline-block mt-3 px-5 py-2.5 rounded-md bg-ink hover:bg-ink/90 text-white text-[13px] font-bold transition-colors"
          >
            {t('Log in')}
          </Link>
        </div>
      </AccountLayout>
    );
  }

  if (settingFirst) {
    return (
      <AccountLayout subdomain={subdomain} storeName={storeName}>
        <h1 className="text-[22px] font-bold text-ink mb-2">{t('Set a password')}</h1>
        <p className="text-[13px] text-muted mb-5 max-w-md">
          {t('You signed up with Google, so your account has no password yet. Set one to also log in with your phone number.')}
        </p>
        <div className="bg-surface border border-line rounded-lg p-5 sm:p-6 max-w-md">
          {!customer?.phone ? (
            <div className="space-y-3">
              <p className="m-0 text-[13px] text-ink">{t('Add your phone number first. You will log in with it and the new password.')}</p>
              <Link
                href={`/store/${subdomain}/account/profile`}
                className="inline-block px-5 py-2.5 rounded-md bg-ink hover:bg-ink/90 text-white text-[13px] font-bold transition-colors"
              >
                {t('Add phone number')}
              </Link>
            </div>
          ) : !codeSentTo ? (
            <div className="space-y-3">
              <p className="m-0 text-[13px] text-ink">{t('We will text a 6-digit code to your phone to make sure it is you.')}</p>
              {error && <p className="text-[12.5px] text-accent">{error}</p>}
              <button
                type="button"
                onClick={sendCode}
                disabled={saving}
                className="px-6 py-2.5 rounded-md bg-ink hover:bg-ink/90 text-white text-[13.5px] font-bold disabled:opacity-60 transition-colors"
              >
                {saving ? t('Sending…') : t('Send code')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSet} className="space-y-4">
              <p className="m-0 text-[12.5px] text-muted">{t('Code sent to {phone}.').replace('{phone}', codeSentTo)}</p>
              <div>
                <label className="block text-[13px] font-medium text-ink mb-1.5">{t('Code')}</label>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-ink mb-1.5">{t('New Password')}</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value.slice(0, 72))}
                  maxLength={72}
                  autoComplete="new-password"
                  className={inputClass}
                />
              </div>
              {error && <p className="text-[12.5px] text-accent">{error}</p>}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-md bg-ink hover:bg-ink/90 text-white text-[13.5px] font-bold disabled:opacity-60 transition-colors"
                >
                  {saving ? t('Saving…') : t('Set password')}
                </button>
                <button type="button" onClick={sendCode} disabled={saving} className="text-[12.5px] text-muted hover:underline disabled:opacity-60">
                  {t('Send the code again')}
                </button>
              </div>
            </form>
          )}
        </div>
      </AccountLayout>
    );
  }

  return (
    <AccountLayout subdomain={subdomain} storeName={storeName}>
      <h1 className="text-[22px] font-bold text-ink mb-5">{t('Change Password')}</h1>
      <div className="bg-surface border border-line rounded-lg p-5 sm:p-6 max-w-md">
        {passwordNowSet && saved && (
          <p className="text-[12.5px] text-success mb-4">{t('Your password is set. You can now log in with your phone number and this password.')}</p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-ink mb-1.5">{t('Current Password')}</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value.slice(0, 72))}
              maxLength={72}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-ink mb-1.5">{t('New Password')}</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value.slice(0, 72))}
              maxLength={72}
              className={inputClass}
            />
          </div>

          {error && <p className="text-[12.5px] text-accent">{error}</p>}
          {saved && !passwordNowSet && <p className="text-[12.5px] text-success">{t('Password changed successfully.')}</p>}

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-md bg-ink hover:bg-ink/90 text-white text-[13.5px] font-bold disabled:opacity-60 transition-colors"
          >
            {saving ? t('Saving…') : t('Change Password')}
          </button>
        </form>
      </div>
    </AccountLayout>
  );
}
