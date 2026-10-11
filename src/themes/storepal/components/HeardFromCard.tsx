'use client';

import { useState } from 'react';
import { answerHeardFromByLink, type TrackedOrder } from '@/lib/checkoutApi';
import type { TrackLang } from '@/lib/trackingI18n';

const TEXT = {
  en: { ask: 'How did you find us?', sub: 'One tap, optional. It only helps the store; your name is not kept with it.', thanks: 'Thank you!' },
  bn: { ask: 'আমাদের কীভাবে খুঁজে পেলেন?', sub: 'একটা ট্যাপ, ঐচ্ছিক। এটা শুধু দোকানের কাজে লাগে, আপনার নাম এর সাথে রাখা হয় না।', thanks: 'ধন্যবাদ!' },
} as const;

/**
 * "How did you hear about us?" on the thank-you and tracking page (TellMe idea 100). Optional and nothing waits for it: a few buttons, one tap,
 * saved once with the tracking token as proof. Only shows while the store has it on (`order.heardFrom.ask`). The answers are the store's own
 * words (up to 8) or the built-in six.
 */
export function HeardFromCard({ subdomain, order, lang, onChanged }: { subdomain: string; order: TrackedOrder; lang: TrackLang; onChanged?: (order: TrackedOrder) => void }) {
  const t = TEXT[lang === 'bn' ? 'bn' : 'en'];
  const [busy, setBusy] = useState(false);
  const [thanked, setThanked] = useState(false);
  const state = order.heardFrom;

  if (thanked) {
    return (
      <p role="status" className="rounded-lg border border-line bg-canvas px-4 py-3 text-[13px] text-ink">
        {t.thanks}
      </p>
    );
  }
  if (!state?.ask || !order.trackingToken) return null;
  const token = order.trackingToken;

  const pick = async (key: string) => {
    setBusy(true);
    try {
      const next = await answerHeardFromByLink(subdomain, token, key);
      setThanked(true);
      onChanged?.(next);
    } catch {
      // Optional question: a failed tap just leaves the buttons there.
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg border border-line bg-canvas px-4 py-3">
      <p className="m-0 text-[14px] font-semibold text-ink">{t.ask}</p>
      <p className="m-0 mt-0.5 text-[12px] text-muted">{t.sub}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {state.options.map((o) => (
          <button key={o.key} type="button" disabled={busy} onClick={() => void pick(o.key)} className="rounded-full border border-line bg-surface px-3.5 min-h-[38px] text-[13px] text-ink hover:border-ink disabled:opacity-60">
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
