'use client';

import { useEffect, useState } from 'react';
import { Palmtree } from 'lucide-react';
import { formatReturnDay, stillAway, type StorefrontStoreAway } from '@/lib/storeAway';
import { useStorePalDesign } from '../lib/designSettings';
import { useStoreText } from '../lib/storeText';

/**
 * Store > Store Away (holiday mode): a strip above every StorePal page while the store is away, with the
 * vendor's message and the day it's back. Mounted by the store layout inside StorePalDesignProvider.
 * The store-info answer is cached, so once mounted it hides itself if the return day has already come.
 */
export function StoreAwayBanner({ away }: { away: StorefrontStoreAway }) {
  const [current, setCurrent] = useState<StorefrontStoreAway | null>(away);
  const { storeLanguage } = useStorePalDesign();
  const t = useStoreText();

  useEffect(() => setCurrent(stillAway(away)), [away]);
  if (!current) return null;

  const day = current.returnDate ? formatReturnDay(current.returnDate, storeLanguage === 'bn' ? 'bn' : 'en') : null;
  const status =
    current.mode === 'BROWSE_ONLY'
      ? day
        ? `${t('Orders are paused until')} ${day}.`
        : t('Orders are paused for now.')
      : day
        ? `${t('You can still order. Delivery starts from')} ${day}.`
        : t('You can still order. Delivery starts when we are back.');

  return (
    <div role="status" className="bg-amber-50 border-b border-amber-200 text-ink">
      <div className="mx-auto flex max-w-7xl items-start gap-2.5 px-4 py-2.5 text-[13px] sm:items-center sm:justify-center">
        <Palmtree size={16} className="mt-0.5 shrink-0 text-amber-700 sm:mt-0" aria-hidden />
        <p className="m-0">
          <span className="font-semibold">{current.message || t('We are away for a few days.')}</span> <span>{status}</span>
        </p>
      </div>
    </div>
  );
}
