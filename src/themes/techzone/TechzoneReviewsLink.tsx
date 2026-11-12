'use client';

import { RatingStars } from '@/components/RatingStars';
import { useStoreText } from '../storepal/lib/storeText';

/** Stars and "N reviews" under the product title; a tap opens the Reviews section (or the write-a-review box when there are none). */
export function TechzoneReviewsLink({ rating }: { rating?: { average: number; count: number } | null }) {
  const t = useStoreText();
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event('storepal:open-reviews'))} className="flex items-center gap-1.5 hover:text-[var(--tz-brand)]">
      {rating ? <RatingStars rating={rating} size={14} showCount={false} label={`${rating.average} / 5`} /> : null}
      {rating ? t('{n} reviews').replace('{n}', String(rating.count)) : t('Write a review')}
    </button>
  );
}
