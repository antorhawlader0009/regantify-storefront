'use client';

import { useState } from 'react';
import { joinProductWaitlist } from '@/lib/storefrontApi';
import { useStoreText } from '../lib/storeText';
import { phoneInput } from '@/lib/phoneInput';

/**
 * The "Notify me" form of a coming-soon product (TellMe idea 104): a phone number and an optional name, no code. When the product goes on
 * sale the store texts the number once. Replaces the price box and Buy buttons on the product page.
 */
export function ComingSoonNotify({
  subdomain,
  slug,
  until,
  restock = false,
  options,
}: {
  subdomain: string;
  slug: string;
  until?: string | null;
  restock?: boolean;
  /** One size/colour that is sold out (the rest may be in stock): the shopper waits for that one only. */
  options?: Record<string, string>;
}) {
  const t = useStoreText();
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await joinProductWaitlist(subdomain, slug, phone.trim(), name, restock ? 'RESTOCK' : 'COMING', options);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your number.');
    } finally {
      setBusy(false);
    }
  };

  const when = until ? new Date(until).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Dhaka' }) : null;

  return (
    <div className="mb-5 rounded-lg border border-line bg-canvas p-4">
      <p className="m-0 text-[14px] font-bold text-ink">
        {restock ? (options ? `${Object.values(options).join(' / ')}: ${t('Out of stock')}` : t('Out of stock')) : t('Coming soon')}
      </p>
      {!restock && when && <p className="m-0 mt-0.5 text-[12.5px] text-muted">{t('Expected')}: {when}</p>}
      {done ? (
        <p role="status" className="m-0 mt-2 text-[13px] text-success">
          {restock ? t('We will text you when it is back in stock.') : t('We will text you when it is here.')}
        </p>
      ) : (
        <form onSubmit={submit} className="mt-2 space-y-2">
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder={t('Your name (optional)')} className="h-10 w-full rounded-md border border-line bg-surface px-3 text-[13px] text-ink" />
          <input value={phone} onChange={(e) => setPhone(phoneInput(e.target.value))} inputMode="tel" required placeholder="01XXXXXXXXX" className="h-10 w-full rounded-md border border-line bg-surface px-3 text-[13px] text-ink" />
          {error && <p className="m-0 text-[12px] text-accent-dark">{error}</p>}
          <button type="submit" disabled={busy} className="flex h-11 w-full items-center justify-center rounded-md bg-accent text-[14px] font-bold text-white hover:bg-accent-dark disabled:opacity-60">
            {restock ? t('Tell me when it is back') : t('Notify me')}
          </button>
        </form>
      )}
    </div>
  );
}
