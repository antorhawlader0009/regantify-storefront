'use client';

import { useState } from 'react';
import { CONTENT_REPORT_REASONS, submitContentReport, type ContentReportKind, type ContentReportReason } from '@/lib/contentReportApi';
import { useStoreText } from '../lib/storeText';

/**
 * A small "Report" link under a shopper's review, an answered question, or an answer of the store's AI chat. It opens a short form (why, and
 * an optional note) right where it is. No account is needed and the store is never told who reported (STORE-APP-plan.md Step 4: Google
 * Play's user-generated and AI-generated content rules). An AI answer is reported with the exchange (`excerpt`), a review or a question
 * with its id.
 */
export function ReportButton({
  subdomain,
  kind,
  targetId,
  excerpt,
  label,
  className,
}: {
  subdomain: string;
  kind: ContentReportKind;
  targetId?: string;
  /** For an AI answer: what the shopper asked and what the assistant said. */
  excerpt?: string;
  /** The link's words; "Report" by default. */
  label?: string;
  className?: string;
}) {
  const t = useStoreText();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ContentReportReason | ''>('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done) return <p className={`m-0 text-[12px] text-muted ${className ?? ''}`}>{t('Thank you. The shop will look at it.')}</p>;

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={`text-[12px] text-muted underline underline-offset-2 hover:text-ink ${className ?? ''}`}>
        {label ?? t('Report')}
      </button>
    );
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) {
      setError(t('Please choose why you are reporting this.'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await submitContentReport(subdomain, { kind, targetId, reason, note: note.trim() || undefined, excerpt });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Could not send your report. Please try again.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={send} className={`mt-2 space-y-2 rounded-md border border-line bg-canvas p-3 text-[12.5px] ${className ?? ''}`}>
      <p className="m-0 font-semibold text-ink">{t('Why are you reporting this?')}</p>
      <div className="space-y-1">
        {CONTENT_REPORT_REASONS.map((r) => (
          <label key={r.id} className="flex cursor-pointer items-center gap-2 text-ink">
            <input type="radio" name={`report-${kind}-${targetId ?? 'ai'}`} checked={reason === r.id} onChange={() => setReason(r.id)} />
            {t(r.label)}
          </label>
        ))}
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value.slice(0, 500))}
        rows={2}
        maxLength={500}
        placeholder={t('Tell us more (optional)')}
        aria-label={t('Tell us more (optional)')}
        className="w-full rounded-md border border-line-strong bg-white px-2.5 py-1.5 text-[12.5px] outline-none focus:border-ink"
      />
      {error && <p className="m-0 text-accent">{error}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={busy} className="rounded-md bg-ink px-3.5 py-1.5 text-[12px] font-bold text-white disabled:opacity-60">
          {busy ? t('Sending…') : t('Send report')}
        </button>
        <button type="button" onClick={() => setOpen(false)} disabled={busy} className="text-[12px] text-muted hover:underline">
          {t('Cancel')}
        </button>
      </div>
    </form>
  );
}
