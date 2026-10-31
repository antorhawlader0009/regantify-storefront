'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User } from 'lucide-react';
import { deleteMyAccount, sendDeleteAccountCode } from '@/lib/customerAuthApi';
import { clearShopperData } from '@/lib/clearShopperData';
import { useCustomerAuthStore, useCustomerAuthHydrated } from '@/providers/customer-auth-store-provider';
import { AccountLayout } from '../../components/AccountLayout';
import { useStoreDisplayName } from '../../lib/useStoreDisplayName';
import { useStoreText } from '../../lib/storeText';

const inputClass =
  'w-full px-3.5 py-2.5 rounded-md border border-line-strong bg-canvas text-[13.5px] outline-none focus:border-ink transition-colors';

/**
 * Account > Delete my account, also the web link for the store listing (/account/delete, Google Play's account deletion rule,
 * STORE-APP-plan.md Step 4). The shopper proves it is them with a code texted to the account's phone, then the account goes from every shop.
 * An account with no phone (made with Google) is told to add one first or to delete it from the Regantify app.
 */
export function DeleteAccountView({ subdomain }: { subdomain: string }) {
  const t = useStoreText();
  const storeName = useStoreDisplayName(subdomain);
  const hydrated = useCustomerAuthHydrated();
  const customer = useCustomerAuthStore((s) => s.customer);
  const accessToken = useCustomerAuthStore((s) => s.accessToken);
  const clearSession = useCustomerAuthStore((s) => s.clearSession);

  const [codeSentTo, setCodeSentTo] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);

  const sendCode = async () => {
    if (!accessToken) return;
    setError(null);
    setBusy(true);
    try {
      const res = await sendDeleteAccountCode(accessToken);
      setCodeSentTo(res.phone);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Could not send the code. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    if (code.trim().length !== 6) {
      setError(t('Enter the 6-digit code.'));
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await deleteMyAccount(accessToken, code.trim());
      setDeleted(true);
      // The account is gone: forget it in this browser too.
      clearShopperData();
      clearSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Could not delete your account. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  if (deleted) {
    return (
      <AccountLayout subdomain={subdomain} storeName={storeName}>
        <div className="bg-surface border border-line rounded-lg p-6 max-w-md">
          <p className="m-0 text-[15px] font-semibold text-ink">{t('Your account was deleted.')}</p>
          <p className="mt-2 text-[13px] text-muted">{t('Thank you for using Regantify.')}</p>
          <Link href={`/store/${subdomain}`} className="mt-4 inline-block text-[13px] font-semibold text-accent hover:text-accent-dark">
            {t('Back to the store')}
          </Link>
        </div>
      </AccountLayout>
    );
  }

  if (hydrated && !customer) {
    return (
      <AccountLayout subdomain={subdomain} storeName={storeName}>
        <div className="bg-surface border border-line rounded-lg p-6 text-center">
          <User size={26} className="mx-auto text-muted mb-3" />
          <p className="text-[14px] text-ink font-semibold mb-1">{t('Log in to delete your account')}</p>
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

  return (
    <AccountLayout subdomain={subdomain} storeName={storeName}>
      <h1 className="text-[22px] font-bold text-ink mb-2">{t('Delete my account')}</h1>
      <p className="text-[13px] text-muted mb-5 max-w-md">
        {t('This removes your account from every shop that uses Regantify: your sign-ins, saved addresses, carts, wishlist and Google link. It cannot be undone.')}
      </p>
      <div className="bg-surface border border-line rounded-lg p-5 sm:p-6 max-w-md space-y-4">
        <p className="m-0 text-[12.5px] text-muted">
          {t("Orders you already placed stay with the shop that took them, as its sales and delivery records. Reviews and questions you wrote stay on the shop's page without your name or contact details.")}
        </p>

        {customer && !customer.phone ? (
          <div className="space-y-3">
            <p className="m-0 text-[13px] text-ink">{t('Your account has no phone number. Add one first, or delete it from the Regantify app.')}</p>
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
              disabled={busy}
              className="px-6 py-2.5 rounded-md bg-ink hover:bg-ink/90 text-white text-[13.5px] font-bold disabled:opacity-60 transition-colors"
            >
              {busy ? t('Sending…') : t('Send code')}
            </button>
          </div>
        ) : (
          <form onSubmit={remove} className="space-y-4">
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
            {error && <p className="text-[12.5px] text-accent">{error}</p>}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={busy}
                className="px-6 py-2.5 rounded-md bg-accent hover:bg-accent-dark text-white text-[13.5px] font-bold disabled:opacity-60 transition-colors"
              >
                {busy ? t('Deleting…') : t('Delete my account for good')}
              </button>
              <button type="button" onClick={sendCode} disabled={busy} className="text-[12.5px] text-muted hover:underline disabled:opacity-60">
                {t('Send the code again')}
              </button>
            </div>
          </form>
        )}
      </div>
    </AccountLayout>
  );
}
