'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { BellRing, CheckCircle2, MessageCircleQuestion, X } from 'lucide-react';
import { apiOrigin } from '@/lib/checkoutApi';

/*
 * LMS store forms on StorePal product pages (LMS-plan.md Step 9):
 * "Notify me when it's back" on sold-out products, "Call me back" on every
 * product, and "Request a price" on price-on-request products. Each sends
 * one request to the store's LMS as a lead. Same visual language as the
 * product page's backorder popup (surface card, accent button), so it
 * reads as part of the shop, not a bolt-on.
 */

export type StoreFormType = 'notify-me' | 'call-back' | 'price-request';

const CONSENT = "We'll use your number only to contact you about this request.";

const COPY: Record<StoreFormType, { title: string; intro: (product: string) => string; submit: string; done: (name: string, phone: string, product: string) => string }> = {
  'notify-me': {
    title: "Tell me when it's back",
    intro: (product) => `${product} is sold out right now. Leave your number and we'll message you as soon as it's back.`,
    submit: 'Notify me',
    done: (_name, phone, product) => `Done. We'll message ${phone} when ${product} is back.`,
  },
  'call-back': {
    title: 'Ask us a question',
    intro: () => "Leave your number and we'll call you back.",
    submit: 'Call me back',
    done: (name, phone) => `Thanks, ${name}. We'll call you on ${phone}.`,
  },
  'price-request': {
    title: 'Request a price',
    intro: (product) => `Tell us how many ${product} you need and we'll send you the price.`,
    submit: 'Send request',
    done: (name, phone) => `Thanks, ${name}. We'll send the price to ${phone}.`,
  },
};

/** 017… with or without +88 and spaces: the same numbers the LMS accepts. */
function bdPhone(raw: string): string | null {
  const digits = raw.replace(/[\s-]/g, '').replace(/^\+?88/, '');
  return /^01[3-9]\d{8}$/.test(digits) ? digits : null;
}

function pageUtm(): Record<string, string> {
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']) {
    const v = params.get(k);
    if (v) utm[k] = v;
  }
  return utm;
}

export function StoreLeadFormDialog({
  type,
  subdomain,
  productId,
  productName,
  quantity = 1,
  onClose,
}: {
  type: StoreFormType;
  subdomain: string;
  productId: string;
  productName: string;
  quantity?: number;
  onClose: () => void;
}) {
  const copy = COPY[type];
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [qty, setQty] = useState(String(quantity));
  const [message, setMessage] = useState('');
  const [time, setTime] = useState('ANY');
  const [website, setWebsite] = useState(''); // honeypot
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const local = bdPhone(phone);
    if (!name.trim()) return setError('Enter your name.');
    if (!local) return setError('Enter a Bangladeshi mobile number: 11 digits starting with 01.');
    const q = Number(qty);
    if (type === 'price-request' && (!Number.isInteger(q) || q < 1)) return setError('Enter how many you need.');
    setState('sending');
    try {
      const res = await fetch(`${apiOrigin()}/v1/store/${encodeURIComponent(subdomain)}/lms-forms/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: local,
          productId,
          ...(type === 'price-request' ? { quantity: q } : {}),
          ...(message.trim() ? { message: message.trim() } : {}),
          ...(type === 'call-back' ? { preferredTime: time } : {}),
          utm: pageUtm(),
          website,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const text = Array.isArray(body?.message) ? body.message[0] : body?.message;
        setError(res.status === 429 ? (text ?? "We already have your request and we'll be in touch soon.") : (text ?? "That didn't go through. Try again."));
        setState('idle');
        return;
      }
      setState('done');
    } catch {
      setError("That didn't go through. Check your connection and try again.");
      setState('idle');
    }
  };

  const input = 'w-full rounded-md border border-line bg-surface px-3 py-2.5 text-[14px] text-ink placeholder:text-muted focus:border-accent focus:outline-none';

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 px-0 sm:items-center sm:px-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="store-lead-form-title"
        className="w-full max-w-md rounded-t-xl bg-surface p-5 shadow-popover sm:rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex items-start justify-between gap-3">
          <p id="store-lead-form-title" className="m-0 text-[16px] font-bold text-ink">
            {copy.title}
          </p>
          <button type="button" onClick={onClose} aria-label="Close" className="-mr-1 -mt-1 rounded p-1 text-muted hover:text-ink">
            <X size={18} />
          </button>
        </div>

        {state === 'done' ? (
          <div className="py-2">
            <p className="flex items-start gap-2 text-[14px] leading-relaxed text-ink">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-success" />
              {copy.done(name.trim(), bdPhone(phone) ?? phone, productName)}
            </p>
            <button onClick={onClose} className="mt-5 w-full rounded-md border border-line py-2.5 text-[13px] font-semibold text-ink hover:bg-line/60">
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3" noValidate>
            <p className="m-0 text-[13.5px] leading-relaxed text-muted">{copy.intro(productName)}</p>
            <input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name" maxLength={120} autoFocus />
            <input
              className={input}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Mobile number, e.g. 01712345678"
              inputMode="tel"
              autoComplete="tel"
              maxLength={20}
            />
            {type === 'price-request' && (
              <label className="flex items-center gap-3 text-[13px] text-ink">
                How many
                <input
                  className={`${input} !w-28`}
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  inputMode="numeric"
                />
              </label>
            )}
            {type !== 'notify-me' && (
              <textarea
                className={`${input} resize-none`}
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={1000}
                placeholder={type === 'call-back' ? 'Your question (optional)' : 'Anything else we should know (optional)'}
              />
            )}
            {type === 'call-back' && (
              <label className="flex items-center gap-3 text-[13px] text-ink">
                Best time to call
                <select className={`${input} !w-auto`} value={time} onChange={(e) => setTime(e.target.value)}>
                  <option value="ANY">Any time</option>
                  <option value="MORNING">Morning</option>
                  <option value="AFTERNOON">Afternoon</option>
                  <option value="EVENING">Evening</option>
                </select>
              </label>
            )}
            {/* Honeypot: hidden from people and screen readers, filled by bots. */}
            <input
              type="text"
              name="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="absolute -left-[9999px] h-0 w-0 opacity-0"
            />

            {error && <p className="m-0 rounded border border-accent/20 bg-accent-light px-3 py-2 text-[13px] text-accent-dark">{error}</p>}

            <button
              type="submit"
              disabled={state === 'sending'}
              className="w-full rounded-md bg-accent py-3 text-[14px] font-bold text-white transition-colors hover:bg-accent-dark disabled:opacity-60"
            >
              {state === 'sending' ? 'Sending…' : copy.submit}
            </button>
            <p className="m-0 text-center text-[11.5px] text-muted">{CONSENT}</p>
          </form>
        )}
      </div>
    </div>
  );
}

/** The price box for a price-on-request product (replaces the price). */
export function PriceOnRequest() {
  return (
    <div className="mb-4 rounded-lg border border-accent/15 bg-accent-light p-4">
      <p className="m-0 text-[22px] font-bold tracking-tight text-ink">Price on request</p>
      <p className="m-0 mt-1 text-[13px] text-muted">Tell us how many you need and we'll send you the price.</p>
    </div>
  );
}

/** Replaces Add to Cart / Buy Now: "Request a price" or "Notify me when it's back". */
export function LeadFormButton({ type, onOpen }: { type: 'notify-me' | 'price-request'; onOpen: () => void }) {
  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-accent py-3 text-[14px] font-bold text-white shadow-sm transition-colors hover:bg-accent-dark"
      >
        {type === 'notify-me' && <BellRing size={16} />}
        {type === 'notify-me' ? "Notify me when it's back" : 'Request a price'}
      </button>
      {type === 'notify-me' && <p className="m-0 mt-2 text-center text-[12px] text-muted">We&apos;ll send you one message when it&apos;s in stock again.</p>}
    </div>
  );
}

/** Under Buy on every product: a quiet way to ask before buying. */
export function CallMeBackLink({ onOpen }: { onOpen: () => void }) {
  return (
    <p className="m-0 mt-3 flex items-center gap-1.5 text-[13px] text-muted">
      <MessageCircleQuestion size={15} className="shrink-0" />
      Have a question?
      <button type="button" onClick={onOpen} className="font-semibold text-ink underline underline-offset-2 hover:text-accent">
        Ask us to call you back
      </button>
    </p>
  );
}
