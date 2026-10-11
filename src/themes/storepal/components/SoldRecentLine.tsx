'use client';

import { Flame } from 'lucide-react';
import type { StorefrontProduct } from '@/lib/storefrontApi';
import { bnDigits } from '../lib/storeText';
import { useStorePalDesign } from '../lib/designSettings';

/** Fewest buyers worth saying out loud: "1 bought" would put shoppers off. */
export const MIN_SOCIAL_PROOF = 5;

/** "42 bought in the last 7 days" (TellMe idea 63): the nightly real count, from 5 up, only when the store picked a window. */
export function soldRecentText(product: Pick<StorefrontProduct, 'soldRecent'>, days: number | undefined, language: string | undefined): string | null {
  const n = product.soldRecent ?? 0;
  if (!days || n < MIN_SOCIAL_PROOF) return null;
  return language === 'bn' ? `গত ${bnDigits(days)} দিনে ${bnDigits(n)} জন কিনেছে` : `${n} bought in the last ${days} days`;
}

export function SoldRecentLine({ product }: { product: Pick<StorefrontProduct, 'soldRecent'> }) {
  const design = useStorePalDesign();
  const text = soldRecentText(product, design.socialProofDays, design.storeLanguage);
  if (!text) return null;
  return (
    <p className="m-0 mt-2 flex items-center gap-1.5 text-[12.5px] font-semibold text-accent-dark">
      <Flame size={14} className="shrink-0" aria-hidden />
      {text}
    </p>
  );
}
