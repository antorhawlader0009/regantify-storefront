'use client';

import { useState } from 'react';
import { rescheduleDeliveryByLink, type TrackedOrder } from '@/lib/checkoutApi';
import type { TrackLang } from '@/lib/trackingI18n';

const TEXT = {
  en: {
    title: 'We could not deliver your parcel',
    sub: 'When should we try again? Pick a day. The store will be told.',
    picked: (d: string) => `Thank you. You asked for delivery on ${d}. The store has been told.`,
    again: 'Pick another day',
    failed: 'Could not save the day. Please try again.',
  },
  bn: {
    title: 'আপনার পার্সেল ডেলিভারি করা যায়নি',
    sub: 'কবে আবার পাঠাব? একটা দিন বেছে নিন। দোকান জানতে পারবে।',
    picked: (d: string) => `ধন্যবাদ। আপনি ${d} তারিখে ডেলিভারি চেয়েছেন। দোকানকে জানানো হয়েছে।`,
    again: 'অন্য দিন বাছুন',
    failed: 'দিনটা সেভ করা যায়নি। আবার চেষ্টা করুন।',
  },
} as const;

const dayLabel = (day: string, lang: TrackLang) =>
  new Date(`${day}T00:00:00Z`).toLocaleDateString(lang === 'bn' ? 'bn-BD-u-nu-latn' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });

/**
 * "Pick a new delivery day" on the tracking page after a failed delivery attempt (TellMe idea 106). The server decides when it shows
 * (`order.reschedule.canPick`): the latest report from the courier is a failed attempt, the order has not ended and fewer than 3 days were
 * picked. One tap on a day saves it with the tracking token as proof; the store is told and rebooks the courier itself.
 */
export function RescheduleCard({ subdomain, order, lang, onChanged }: { subdomain: string; order: TrackedOrder; lang: TrackLang; onChanged?: (order: TrackedOrder) => void }) {
  const t = TEXT[lang === 'bn' ? 'bn' : 'en'];
  const state = order.reschedule;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [just, setJust] = useState<string | null>(null);

  if (just) {
    return (
      <p role="status" className="rounded-lg border border-line bg-canvas px-4 py-3 text-[13px] text-ink">
        {t.picked(dayLabel(just, lang))}
      </p>
    );
  }
  if (!state?.canPick || state.days.length === 0 || !order.trackingToken) return null;
  const token = order.trackingToken;

  const pick = async (day: string) => {
    setBusy(true);
    setError(null);
    try {
      const next = await rescheduleDeliveryByLink(subdomain, token, day);
      setJust(day);
      onChanged?.(next);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t.failed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
      <p className="m-0 text-[14px] font-semibold text-ink">{t.title}</p>
      <p className="m-0 mt-0.5 text-[12.5px] text-muted">{t.sub}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {state.days.map((d) => (
          <button key={d} type="button" disabled={busy} onClick={() => void pick(d)} className="min-h-[40px] rounded-full border border-line bg-surface px-4 text-[13px] font-medium text-ink hover:border-ink disabled:opacity-60">
            {dayLabel(d, lang)}
          </button>
        ))}
      </div>
      {error && (
        <p role="alert" className="m-0 mt-2 text-[12.5px] text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
