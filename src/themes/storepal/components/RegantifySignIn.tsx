'use client';

import { useEffect, useState } from 'react';
import { getRegantifyApp } from '@/lib/regantifyApp';
import { copyOtherStoreAddresses, getRegantifyConnectConfig, otherStoreAddressCount, regantifyConnectUrl, startGoogleLink, type RegantifyConnectConfig } from '@/lib/customerAuthApi';
import { useCustomerAuthStore } from '@/providers/customer-auth-store-provider';
import { useStoreText } from '../lib/storeText';

/** Google's own "G" mark, unchanged (Google's sign-in branding guidelines). */
export function GoogleMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

/**
 * "Login with Google by Regantify" at the top of StorePal's login and sign-up dialog. It opens the central Regantify sign-in page (server
 * shopper-connect), which comes back to this very page signed in, with the addresses the shopper chose to bring from their other stores.
 * Hidden until the server has the central page set up.
 */
export function RegantifySignInButton({ subdomain }: { subdomain: string }) {
  const t = useStoreText();
  const [cfg, setCfg] = useState<RegantifyConnectConfig | null>(null);
  useEffect(() => {
    let alive = true;
    getRegantifyConnectConfig().then((c) => alive && setCfg(c));
    return () => {
      alive = false;
    };
  }, []);
  // Inside the Regantify app the button opens the app's own sign-in (native Google on the phone's accounts, or a texted code): Google does
  // not allow its sign-in page inside an app's web view. Known after the first render, so the server and the browser agree.
  const [inApp, setInApp] = useState(false);
  useEffect(() => setInApp(!!getRegantifyApp()), []);
  if (!inApp && (!cfg?.enabled || !cfg.url)) return null;
  const google = inApp || !!cfg?.google;
  const go = () => {
    const app = getRegantifyApp();
    if (app) {
      app.signIn();
      return;
    }
    window.location.assign(regantifyConnectUrl(cfg!.url!, subdomain, window.location.href, cfg!.google ? 'google' : undefined));
  };
  return (
    <div className="mb-5">
      <button
        type="button"
        onClick={go}
        className="relative flex h-[52px] w-full items-center justify-center rounded-lg border border-line-strong bg-white px-12 text-ink shadow-[0_1px_2px_rgba(16,24,40,0.05)] transition-colors hover:border-ink/25 hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {/* Google's pattern: the mark pinned to the left edge, the words centred on the whole button. */}
        {google ? (
          <span className="absolute left-4 top-1/2 -translate-y-1/2">
            <GoogleMark size={20} />
          </span>
        ) : null}
        {google ? (
          <span className="flex flex-col items-center">
            <span className="text-[15px] font-semibold leading-[1.15]">{t('Login with Google')}</span>
            <span className="mt-0.5 text-[11px] font-medium leading-none text-muted">{t('by Regantify')}</span>
          </span>
        ) : (
          <span className="text-[14.5px] font-semibold">{t('Continue with your Regantify account')}</span>
        )}
      </button>
      <div className="mt-5 flex items-center gap-3 text-[12px] text-muted">
        <span className="h-px flex-1 bg-line" />
        {t('or')}
        <span className="h-px flex-1 bg-line" />
      </div>
    </div>
  );
}

/**
 * Account > My Addresses (2026-10-29, the owner's request): addresses saved at other Regantify shops. Not connected to Google yet: a card
 * asking to connect it (the central page then joins the Google account's own account, if it had one, and offers its addresses). Connected:
 * a card that opens the central page's address step with Google. Either way the other shops' addresses are only ever listed on the central
 * Regantify page, never on this store's page. Only Google brings them (the owner's rule): the same phone at another store does not.
 */
export function OtherStoreAddressesCard({ subdomain, onCopied }: { subdomain: string; onCopied?: () => void }) {
  const t = useStoreText();
  const accessToken = useCustomerAuthStore((s) => s.accessToken);
  const [cfg, setCfg] = useState<RegantifyConnectConfig | null>(null);
  // Google-connected: how many addresses from other shops could come here (a count only, never the addresses on this page).
  const [other, setOther] = useState<{ google: boolean; count: number; room: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let alive = true;
    getRegantifyConnectConfig().then((c) => alive && setCfg(c));
    if (accessToken) {
      otherStoreAddressCount(accessToken)
        .then((r) => alive && setOther(r))
        .catch(() => alive && setOther({ google: false, count: 0, room: 0 }));
    }
    return () => {
      alive = false;
    };
  }, [accessToken, reload]);
  if (!cfg?.enabled || !cfg.url || other === null) return null;
  // Other stores' addresses come only with Google (the owner's rule): no Google sign-in on the server, no card.
  if (!cfg.google) return null;
  const connected = other.google;

  // Not connected yet: connect Google (the central page then offers the addresses to pick).
  const connect = async () => {
    if (!accessToken) return;
    setBusy(true);
    setError(null);
    try {
      const { url } = await startGoogleLink(accessToken, window.location.href);
      window.location.assign(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Something went wrong. Please try again.'));
      setBusy(false);
    }
  };
  // Connected: copy them here in one tap, no second Google sign-in.
  const bring = async () => {
    if (!accessToken) return;
    setBusy(true);
    setError(null);
    try {
      const { copied } = await copyOtherStoreAddresses(accessToken);
      setDone(copied);
      onCopied?.();
      setReload((n) => n + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Something went wrong. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  const title = !connected
    ? t('Use addresses from your other shops')
    : done !== null
      ? t('{n} addresses added from your other shops').replace('{n}', String(done))
      : other.count > 0
        ? t('{n} addresses found at your other shops').replace('{n}', String(other.count))
        : t('No addresses found at your other shops');
  const note = !connected
    ? t('Connect your Google account. Addresses you saved at other Regantify shops with it can then be used here.')
    : done !== null
      ? t('They are in your list below. You can edit or delete them.')
      : other.count > 0
        ? other.room > 0
          ? t('Add them to this shop to use them at checkout.')
          : t('Your list is full. Delete an address to make room.')
        : t('Addresses you save at other Regantify shops with this Google account will show up here.');
  const action = !connected ? (
    <button
      type="button"
      onClick={() => void connect()}
      disabled={busy}
      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-line-strong bg-white px-4 py-2 text-[13px] font-semibold text-ink shadow-[0_1px_2px_rgba(16,24,40,0.06)] transition-colors hover:bg-canvas disabled:opacity-60"
    >
      <GoogleMark size={15} />
      {busy ? t('Opening Google…') : t('Connect Google')}
    </button>
  ) : done === null && other.count > 0 && other.room > 0 ? (
    <button
      type="button"
      onClick={() => void bring()}
      disabled={busy}
      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      {busy ? t('Adding…') : t('Add them here')}
    </button>
  ) : null;

  return (
    <div className="mb-5 flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 sm:flex-row sm:items-center sm:gap-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-white" aria-hidden>
        <GoogleMark size={20} />
      </span>
      <div className="min-w-0 flex-1" aria-live="polite">
        <p className="m-0 text-[14px] font-semibold text-ink">{title}</p>
        <p className="m-0 mt-0.5 text-[12.5px] leading-snug text-muted">{note}</p>
        {error && <p className="m-0 mt-1 text-[12px] text-accent">{error}</p>}
      </div>
      {action}
    </div>
  );
}


// The code swap (?rgf_login=...) is done by components/RegantifyLoginCatcher.tsx, mounted once in the store layout for every template.
