'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { rateDeliveryByLink, type TrackedOrder } from '@/lib/checkoutApi';
import type { TrackLang } from '@/lib/trackingI18n';

const TEXT = {
  en: { ask: 'How was the delivery?', sub: 'Tap a star. It is about the delivery, not the product.', comment: 'Anything to add? (optional)', send: 'Send', thanks: 'Thank you for rating the delivery.', yours: 'Your delivery rating' },
  bn: { ask: 'ডেলিভারি কেমন ছিল?', sub: 'একটা তারায় ট্যাপ করুন। এটা ডেলিভারির জন্য, পণ্যের জন্য নয়।', comment: 'কিছু বলার থাকলে লিখুন (ঐচ্ছিক)', send: 'পাঠান', thanks: 'ডেলিভারি রেটিং দেওয়ার জন্য ধন্যবাদ।', yours: 'আপনার ডেলিভারি রেটিং' },
} as const;

/**
 * "How was the delivery?" on the tracking page (TellMe idea 89): five stars and an optional line, once, only after a Completed online order.
 * The server decides (`order.deliveryRating.canRate`) and the tracking token proves who is asking. Not a product review.
 */
export function DeliveryRatingCard({ subdomain, order, lang, onChanged }: { subdomain: string; order: TrackedOrder; lang: TrackLang; onChanged?: (order: TrackedOrder) => void }) {
  const t = TEXT[lang === 'bn' ? 'bn' : 'en'];
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const given = order.deliveryRating?.rating ?? null;

  if (given !== null) {
    return (
      <p role="status" className="rounded-lg border border-line bg-canvas px-4 py-3 text-[13px] text-ink">
        {t.yours}: {'★'.repeat(given)}
        {'☆'.repeat(5 - given)} · {t.thanks}
      </p>
    );
  }
  if (!order.deliveryRating?.canRate || !order.trackingToken) return null;
  const token = order.trackingToken;

  const send = async () => {
    if (stars < 1) return;
    setBusy(true);
    setError(null);
    try {
      onChanged?.(await rateDeliveryByLink(subdomain, token, stars, comment));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your rating. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg border border-line bg-canvas px-4 py-3">
      <p className="m-0 text-[14px] font-semibold text-ink">{t.ask}</p>
      <p className="m-0 mt-0.5 text-[12px] text-muted">{t.sub}</p>
      <div className="mt-2 flex gap-1" role="radiogroup" aria-label={t.ask}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={stars === n} aria-label={`${n}`} onClick={() => setStars(n)} className="p-1">
            <Star size={28} className={n <= stars ? 'fill-amber-400 text-amber-400' : 'text-muted'} />
          </button>
        ))}
      </div>
      {stars > 0 && (
        <div className="mt-2">
          <input
            value={comment}
            maxLength={200}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t.comment}
            className="h-10 w-full rounded-md border border-line bg-surface px-3 text-[13px] text-ink"
          />
          <button type="button" onClick={() => void send()} disabled={busy} className="mt-2 flex h-10 items-center rounded-md bg-accent px-5 text-[13.5px] font-bold text-white disabled:opacity-60">
            {t.send}
          </button>
        </div>
      )}
      {error && <p className="m-0 mt-2 text-[12px] text-red-600">{error}</p>}
    </div>
  );
}
