'use client';

import { useEffect, useRef, useState } from 'react';
import { connectLogin } from '@/lib/customerAuthApi';
import { useCustomerAuthStore } from '@/providers/customer-auth-store-provider';
import { trackLogin } from '@/lib/ecommerceEvents';
import { LOGIN_STATE_PARAM, takeLoginState } from '@/lib/loginState';
import { getRegantifyApp } from '@/lib/regantifyApp';

// One code is swapped once per page load, even if React runs the effect twice.
const swapped = new Set<string>();

/**
 * Back from the central Regantify sign-in page, or opened by the Regantify Android app: the address carries ?rgf_login=<one-time code>.
 * It is swapped for THIS store's own sign-in (security F-46: a code is for one store, lasts 2 minutes and works once) and taken off the
 * address bar straight away, so a reload or a shared link never carries it.
 *
 * Mounted once in the store layout, so every template does it (STORE-APP-plan.md Step 2). It used to live in StorePal's header only.
 * Renders nothing unless the code could not be used.
 */
export function RegantifyLoginCatcher() {
  const setSession = useCustomerAuthStore((s) => s.setSession);
  const done = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const url = new URL(window.location.href);
    const code = url.searchParams.get('rgf_login');
    const state = url.searchParams.get(LOGIN_STATE_PARAM);
    url.searchParams.delete(LOGIN_STATE_PARAM);
    if (!code) {
      if (state) window.history.replaceState(window.history.state, '', url.toString());
      return;
    }
    url.searchParams.delete('rgf_login');
    window.history.replaceState(window.history.state, '', url.toString());
    if (swapped.has(code)) return;
    swapped.add(code);
    // Security review P-29: only a sign-in this tab started (or one the Regantify app made itself) is used, so a link with someone
    // else's code can't sign the shopper in to that person's account.
    if (!getRegantifyApp() && !takeLoginState(state)) {
      setError('This sign-in link was not started on this page. Please press "Login with Google by Regantify" again.');
      return;
    }
    connectLogin(code)
      .then((r) => {
        setSession(r.customer, r.accessToken);
        trackLogin('regantify');
      })
      .catch((err: Error) => setError(err.message || 'Could not sign you in. Please try again.'));
  }, [setSession]);

  if (!error) return null;
  return (
    <div role="alert" className="fixed inset-x-4 bottom-4 z-[90] mx-auto max-w-md rounded-lg bg-neutral-900 px-4 py-3 text-[13.5px] text-white shadow-xl sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2">
      <p>{error}</p>
      <div className="mt-2 flex gap-4">
        <button type="button" onClick={() => setError(null)} className="font-semibold underline underline-offset-2">
          Close
        </button>
      </div>
    </div>
  );
}
