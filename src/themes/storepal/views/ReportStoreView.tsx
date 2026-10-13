'use client';

import { useState } from 'react';
import Link from 'next/link';
import { StoreHeader } from '../components/StoreHeader';
import { StoreFooter } from '../components/StoreFooter';
import { submitStoreReport, type StoreReportReason } from '@/lib/storefrontApi';

const REASONS: Array<{ id: StoreReportReason; label: string }> = [
  { id: 'FAKE_PRODUCTS', label: 'Fake or misleading products' },
  { id: 'NOT_DELIVERED', label: 'I paid and nothing arrived' },
  { id: 'SCAM', label: 'It looks like a scam' },
  { id: 'ABUSE', label: 'Abusive or illegal content' },
  { id: 'OTHER', label: 'Something else' },
];

/** /report: "Report this store" (super-admin-plan.md Step 17). No account needed; the store is not told who reported it. */
export function ReportStoreView({ subdomain, storeName, categories }: { subdomain: string; storeName: string; categories: string[] }) {
  const [reason, setReason] = useState<StoreReportReason | ''>('');
  const [note, setNote] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) {
      setError('Please choose what the problem is.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await submitStoreReport(subdomain, { reason, note: note.trim() || undefined, phone: phone.trim() || undefined });
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <StoreHeader subdomain={subdomain} storeName={storeName} categories={categories} />
      <main className="mx-auto max-w-xl px-4 py-10 sm:px-6">
        <h1 className="mb-1 text-center text-[28px] font-bold">Report this store</h1>
        <p className="mb-8 text-center text-[13px] text-muted">Tell the Regantify team about a problem with {storeName}. The store is not told who reported it.</p>
        {done ? (
          <div className="rounded-xl border border-line bg-white p-6 text-center">
            <p className="text-[15px] font-semibold">Thank you. We got your report.</p>
            <p className="mt-1 text-[13px] text-muted">The Regantify team will look into it.</p>
            <Link href={`/store/${subdomain}`} className="mt-4 inline-block text-[13px] font-medium text-accent hover:text-accent-dark">
              Back to the store
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5 rounded-xl border border-line bg-white p-6">
            <fieldset>
              <legend className="mb-2 text-[13px] font-semibold">What is the problem?</legend>
              <div className="space-y-2">
                {REASONS.map((r) => (
                  <label key={r.id} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-[14px] ${reason === r.id ? 'border-accent bg-accent/5' : 'border-line'}`}>
                    <input type="radio" name="reason" checked={reason === r.id} onChange={() => setReason(r.id)} />
                    {r.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="block text-[13px] font-semibold">
              Tell us more {reason === 'OTHER' ? '' : '(optional)'}
              <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={4} className="mt-1.5 w-full rounded-lg border border-line px-3 py-2 text-[14px] font-normal focus:border-accent focus:outline-none" />
            </label>
            <label className="block text-[13px] font-semibold">
              Your phone number (optional, so we can call you back)
              <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" maxLength={16} placeholder="01XXXXXXXXX" className="mt-1.5 w-full rounded-lg border border-line px-3 py-2 text-[14px] font-normal focus:border-accent focus:outline-none" />
            </label>
            {error && <p className="text-[13px] text-red-600">{error}</p>}
            <button type="submit" disabled={busy} className="w-full rounded-lg bg-ink py-3 text-[14px] font-semibold text-white disabled:opacity-60">
              {busy ? 'Sending…' : 'Send report'}
            </button>
          </form>
        )}
      </main>
      <StoreFooter subdomain={subdomain} storeName={storeName} />
    </div>
  );
}
