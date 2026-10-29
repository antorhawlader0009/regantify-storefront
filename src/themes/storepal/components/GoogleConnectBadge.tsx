'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { getMyProfile, getRegantifyConnectConfig, startGoogleLink } from '@/lib/customerAuthApi';
import { useCustomerAuthHydrated, useCustomerAuthStore } from '@/providers/customer-auth-store-provider';
import { useStoreText } from '../lib/storeText';
import { GoogleMark } from './RegantifySignIn';

/**
 * Account dialog header (2026-10-29, the owner's request): "Connect Google" for an account made with a phone, so the shopper can sign in
 * with Google next time; "Google connected" once one is attached. Connecting goes through the central Regantify page (Google allows one
 * registered return address), which lists the addresses saved at other stores to bring here and comes back signed in. Hidden while Regantify's Google sign-in is not set up.
 */
export function GoogleConnectBadge() {
  const t = useStoreText();
  const hydrated = useCustomerAuthHydrated();
  const accessToken = useCustomerAuthStore((s) => s.accessToken);
  const [state, setState] = useState<{ connected: boolean; email: string | null } | null>(null);
  const [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated || !accessToken) return;
    let alive = true;
    Promise.all([getMyProfile(accessToken), getRegantifyConnectConfig()])
      .then(([profile, cfg]) => {
        if (!alive) return;
        setState({ connected: !!profile.googleConnected, email: profile.googleEmail ?? null });
        setAvailable(cfg.google);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [hydrated, accessToken]);

  if (!state) return null;

  if (state.connected) {
    return (
      <span
        className={`inline-flex max-w-[16rem] items-center gap-2 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
          'border-line bg-surface text-ink'
        }`}
        title={state.email ?? undefined}
      >
        <GoogleMark size={15} />
        <span className="hidden truncate sm:inline">{state.email || t('Google connected')}</span>
        <CheckCircle2 size={15} className="shrink-0 text-success" aria-label={t('Google connected')} />
      </span>
    );
  }

  if (!available || !accessToken) return null;

  const connect = async () => {
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

  return (
    <span className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={connect}
        disabled={busy}
        title={t('Sign in with Google next time, no password needed')}
        className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface px-3 py-1.5 text-[12.5px] font-semibold text-ink shadow-[0_1px_2px_rgba(16,24,40,0.06)] transition-colors hover:border-ink/30 hover:bg-canvas focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
      >
        <GoogleMark size={15} />
        {busy ? t('Opening Google…') : t('Connect Google')}
      </button>
      {error && <span className="max-w-[16rem] text-right text-[11.5px] leading-snug text-accent">{error}</span>}
    </span>
  );
}
