'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { GoogleMark } from '@/themes/storepal/components/RegantifySignIn';
import { connectApi, connectConfig, type ConnectAnswer } from './connectApi';

type Step =
  | { kind: 'loading' }
  | { kind: 'choose' }
  | { kind: 'code'; phone: string }
  | { kind: 'share'; answer: ConnectAnswer }
  | { kind: 'going'; storeName: string }
  | { kind: 'error'; message: string };

// Kept for the trip to Google and back: where to send the shopper if they cancel there.
const TRIP_KEY = 'rgf-connect-trip';
interface Trip {
  store: string;
  storeName: string;
  returnTo: string;
}

function readTrip(): Trip | null {
  try {
    return JSON.parse(sessionStorage.getItem(TRIP_KEY) ?? 'null') as Trip | null;
  } catch {
    return null;
  }
}

/**
 * The central Regantify sign-in. `start` is opened by a store's "Login with Google by Regantify" (?store=&return=); `callback` is where Google
 * sends the shopper back. Both end on the same step: pick the addresses to bring to this store, then back to the store, signed in.
 */
export function ConnectFlow({ mode }: { mode: 'start' | 'callback' }) {
  const params = useSearchParams();
  const [step, setStep] = useState<Step>({ kind: 'loading' });
  const [storeName, setStoreName] = useState('');
  const [google, setGoogle] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const started = useRef(false);

  const store = params.get('store') ?? '';
  const returnTo = params.get('return') ?? '';
  const trip = typeof window !== 'undefined' ? readTrip() : null;
  // Only an address the server already checked (kept after the store was confirmed), never one straight from the link.
  const backTo = trip?.returnTo ?? '';

  // Lands on the share step; with nothing to bring, goes straight back to the store.
  const arrive = (answer: ConnectAnswer) => {
    setStoreName(answer.store.name);
    if (answer.addresses.length === 0) {
      void finish(answer, []);
      return;
    }
    setPicked(new Set(answer.addresses.map((a) => a.id)));
    setStep({ kind: 'share', answer });
  };

  async function finish(answer: ConnectAnswer, ids: string[]) {
    setBusy(true);
    setError(null);
    try {
      setStep({ kind: 'going', storeName: answer.store.name });
      const { redirect } = await connectApi.finish(answer.connectToken, ids);
      sessionStorage.removeItem(TRIP_KEY);
      window.location.replace(redirect);
    } catch (err) {
      setStep({ kind: 'share', answer });
      setError((err as Error).message);
      setBusy(false);
    }
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (mode === 'callback') {
      const gCode = params.get('code');
      const state = params.get('state');
      if (params.get('error') || !gCode || !state) {
        setStoreName(trip?.storeName ?? '');
        setStep({ kind: 'error', message: 'Google sign-in was cancelled.' });
        return;
      }
      // The code is good for one try: take it off the address bar so a reload doesn't send it again.
      window.history.replaceState(null, '', window.location.pathname);
      connectApi
        .googleCallback(gCode, state)
        .then(arrive)
        .catch((err: Error) => {
          setStoreName(trip?.storeName ?? '');
          setStep({ kind: 'error', message: err.message });
        });
      return;
    }
    if (!store || !returnTo) {
      setStep({ kind: 'error', message: 'Open the store you were shopping at and sign in from there.' });
      return;
    }
    Promise.all([connectApi.target(store, returnTo), connectConfig()])
      .then(([t, cfg]) => {
        setStoreName(t.store.name);
        setGoogle(cfg.google);
        sessionStorage.setItem(TRIP_KEY, JSON.stringify({ store, storeName: t.store.name, returnTo } satisfies Trip));
        setStep({ kind: 'choose' });
      })
      .catch((err: Error) => setStep({ kind: 'error', message: err.message }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function withGoogle() {
    setBusy(true);
    setError(null);
    try {
      const { url } = await connectApi.googleStart(store, returnTo);
      window.location.assign(url);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await connectApi.phoneSend(store, returnTo, phone.trim());
      setCode('');
      setStep({ kind: 'code', phone: phone.trim() });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (step.kind !== 'code') return;
    setBusy(true);
    setError(null);
    try {
      arrive(await connectApi.phoneVerify(store, returnTo, step.phone, code.trim()));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const initial = (storeName.trim()[0] ?? 'S').toUpperCase();

  return (
    <main className="rgf-wrap">
      <div className="rgf-handoff" aria-hidden="true">
        <span className="rgf-handoff-store">{initial}</span>
        <span className="rgf-handoff-path" />
        <span className="rgf-handoff-mark">R</span>
      </div>

      {step.kind === 'loading' && <p className="rgf-lede">Opening your Regantify sign-in…</p>}

      {step.kind === 'error' && (
        <>
          <h1 className="rgf-title">You’re not signed in</h1>
          <p className="rgf-lede">{step.message}</p>
          {backTo ? (
            <a className="rgf-btn rgf-btn-primary" href={backTo}>
              Back to {storeName || 'the store'}
            </a>
          ) : null}
        </>
      )}

      {step.kind === 'choose' && (
        <>
          <h1 className="rgf-title">Sign in to {storeName}</h1>
          <p className="rgf-lede">One Regantify account works in every Regantify store. Your sign-in here is only for {storeName}.</p>
          <div className="rgf-panel">
            {google && (
              <>
                <button type="button" className="rgf-btn rgf-btn-google" onClick={withGoogle} disabled={busy}>
                  <GoogleMark />
                  Continue with Google
                </button>
                <div className="rgf-or">or use your phone number</div>
              </>
            )}
            <form onSubmit={sendCode} className="rgf-stack">
              <div>
                <label className="rgf-label" htmlFor="rgf-phone">
                  Mobile number
                </label>
                <input id="rgf-phone" className="rgf-input" inputMode="tel" autoComplete="tel" placeholder="01XXXXXXXXX" maxLength={16} value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <button type="submit" className="rgf-btn rgf-btn-quiet" disabled={busy || phone.trim().length < 11}>
                {busy ? 'Sending…' : 'Text me a code'}
              </button>
            </form>
            <p className="rgf-note">For an account you made with your phone number at any Regantify store.</p>
            {error && <p className="rgf-error">{error}</p>}
          </div>
          <p className="rgf-foot">
            <a className="rgf-link" href={returnTo}>
              Back to {storeName}
            </a>
          </p>
        </>
      )}

      {step.kind === 'code' && (
        <>
          <h1 className="rgf-title">Enter the code</h1>
          <p className="rgf-lede">We texted a 6-digit code to {step.phone}.</p>
          <form onSubmit={verify} className="rgf-panel rgf-stack">
            <div>
              <label className="rgf-label" htmlFor="rgf-code">
                Code
              </label>
              <input id="rgf-code" className="rgf-input rgf-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} autoFocus />
            </div>
            <button type="submit" className="rgf-btn rgf-btn-primary" disabled={busy || code.length !== 6}>
              {busy ? 'Checking…' : 'Sign in'}
            </button>
            {error && <p className="rgf-error">{error}</p>}
            <p className="rgf-note">
              <button type="button" className="rgf-link" onClick={() => sendCode()} disabled={busy}>
                Send a new code
              </button>{' '}
              or{' '}
              <button
                type="button"
                className="rgf-link"
                onClick={() => {
                  setError(null);
                  setStep({ kind: 'choose' });
                }}
              >
                use another number
              </button>
            </p>
          </form>
        </>
      )}

      {step.kind === 'share' && (
        <>
          <h1 className="rgf-title">Bring your addresses?</h1>
          <p className="rgf-lede">You saved these at other Regantify stores. Tick the ones {step.answer.store.name} may use for your deliveries.</p>
          <div className="rgf-who">
            <span className="rgf-who-initial" aria-hidden="true">
              {(step.answer.customer.name.trim()[0] ?? 'Y').toUpperCase()}
            </span>
            <span>
              <span className="rgf-who-name">{step.answer.customer.name}</span>
              <br />
              <span className="rgf-who-sub">{step.answer.customer.email ?? step.answer.customer.phone ?? 'Regantify account'}</span>
            </span>
          </div>
          <ul className="rgf-slips">
            {step.answer.addresses.map((a) => {
              const on = picked.has(a.id);
              return (
                <li key={a.id} className={`rgf-slip${on ? ' is-on' : ''}`}>
                  <label>
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() =>
                        setPicked((cur) => {
                          const next = new Set(cur);
                          if (next.has(a.id)) next.delete(a.id);
                          else next.add(a.id);
                          return next;
                        })
                      }
                    />
                    <span>
                      <span className="rgf-slip-head">
                        <span className="rgf-slip-label">{a.label}</span>
                        <span className="rgf-slip-from">saved at {a.savedAt}</span>
                      </span>
                      <span className="rgf-slip-body">
                        {[a.address, a.city, a.district].filter(Boolean).join(', ')}
                      </span>
                      <span className="rgf-slip-who">
                        {a.recipientName}, {a.phone}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
          <button type="button" className="rgf-btn rgf-btn-primary" disabled={busy} onClick={() => finish(step.answer, [...picked])}>
            {picked.size > 0 ? `Continue to ${step.answer.store.name} with ${picked.size} address${picked.size === 1 ? '' : 'es'}` : `Continue to ${step.answer.store.name}`}
          </button>
          {error && <p className="rgf-error">{error}</p>}
          <p className="rgf-note">Only the ticked addresses are given to {step.answer.store.name}. Stores never see what you saved at other stores unless you tick it here.</p>
        </>
      )}

      {step.kind === 'going' && (
        <>
          <h1 className="rgf-title">Signing you in</h1>
          <p className="rgf-lede">Taking you back to {step.storeName}…</p>
        </>
      )}
    </main>
  );
}
