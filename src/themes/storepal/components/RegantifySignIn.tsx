'use client';

import { useEffect, useRef, useState } from 'react';
import { connectLogin, getRegantifyConnectConfig, regantifyConnectUrl, type RegantifyConnectConfig } from '@/lib/customerAuthApi';
import { useCustomerAuthStore } from '@/providers/customer-auth-store-provider';
import { useAuthDialog } from '../lib/authDialog';

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
  const [cfg, setCfg] = useState<RegantifyConnectConfig | null>(null);
  useEffect(() => {
    let alive = true;
    getRegantifyConnectConfig().then((c) => alive && setCfg(c));
    return () => {
      alive = false;
    };
  }, []);
  if (!cfg?.enabled || !cfg.url) return null;
  const go = () => {
    window.location.assign(regantifyConnectUrl(cfg.url!, subdomain, window.location.href, cfg.google ? 'google' : undefined));
  };
  return (
    <div className="mb-5">
      <button
        type="button"
        onClick={go}
        className="flex min-h-12 w-full items-center justify-center gap-3 py-1.5 rounded-lg border border-line-strong bg-white text-[14.5px] font-semibold text-ink transition-colors hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {cfg.google ? <GoogleMark /> : null}
        {cfg.google ? (
          <span className="flex flex-col items-start leading-tight">
            <span>Login with Google</span>
            <span className="text-[11px] font-normal text-muted">by Regantify</span>
          </span>
        ) : (
          'Continue with your Regantify account'
        )}
      </button>
      <p className="mt-2 text-center text-[12px] text-muted">Your addresses from other Regantify stores can come along.</p>
      <div className="mt-5 flex items-center gap-3 text-[12px] text-muted">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>
    </div>
  );
}

/** Account > My Addresses: bring addresses saved at other Regantify stores (chosen on the central Regantify page, never shown here). */
export function BringAddressesLink({ subdomain }: { subdomain: string }) {
  const [cfg, setCfg] = useState<RegantifyConnectConfig | null>(null);
  useEffect(() => {
    let alive = true;
    getRegantifyConnectConfig().then((c) => alive && setCfg(c));
    return () => {
      alive = false;
    };
  }, []);
  if (!cfg?.enabled || !cfg.url) return null;
  return (
    <button
      type="button"
      onClick={() => window.location.assign(regantifyConnectUrl(cfg.url!, subdomain, window.location.href))}
      className="mb-5 inline-flex items-center gap-2 rounded-lg border border-line-strong bg-white px-3.5 py-2 text-[13px] font-semibold text-ink transition-colors hover:bg-surface"
    >
      Bring addresses from my other Regantify stores
    </button>
  );
}

// One code is swapped once per page load, even if React runs the effect twice.
const swapped = new Set<string>();

/**
 * Back from the central Regantify sign-in page: the address carries ?rgf_login=<one-time code>. It is swapped for this store's sign-in and
 * taken off the address bar straight away, so a reload or a shared link never carries it.
 */
export function RegantifyLoginCatcher() {
  const setSession = useCustomerAuthStore((s) => s.setSession);
  const openLogin = useAuthDialog((s) => s.openLogin);
  const done = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const url = new URL(window.location.href);
    const code = url.searchParams.get('rgf_login');
    if (!code) return;
    url.searchParams.delete('rgf_login');
    window.history.replaceState(window.history.state, '', url.toString());
    if (swapped.has(code)) return;
    swapped.add(code);
    connectLogin(code)
      .then((r) => setSession(r.customer, r.accessToken))
      .catch((err: Error) => setError(err.message || 'Could not sign you in. Please try again.'));
  }, [setSession]);

  if (!error) return null;
  return (
    <div role="alert" className="fixed inset-x-4 bottom-4 z-[90] mx-auto max-w-md rounded-lg bg-ink px-4 py-3 text-[13.5px] text-white shadow-xl sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2">
      <p>{error}</p>
      <div className="mt-2 flex gap-4">
        <button
          type="button"
          onClick={() => {
            setError(null);
            openLogin();
          }}
          className="font-semibold underline underline-offset-2"
        >
          Sign in again
        </button>
        <button type="button" onClick={() => setError(null)} className="text-white/70">
          Close
        </button>
      </div>
    </div>
  );
}
