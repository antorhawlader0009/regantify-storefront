'use client';

import { useEffect, useState } from 'react';
import { Tag } from 'lucide-react';
import { fetchDiscountOffers, type DiscountOffer } from '@/lib/checkoutApi';
import { offerBenefit, offerConditions, offerCoversProduct } from '../lib/offers';
import { useStoreText } from '../lib/storeText';

/**
 * Marketing > Discounts on the StorePal product page: the automatic discounts
 * this product can get (store-wide, or limited to it or its category), so a
 * shopper knows about "10% off over ৳1000" before the cart. These apply on
 * their own at checkout, so no code is shown. Renders nothing when there are none.
 */
export function ProductOffers({
  subdomain,
  product,
}: {
  subdomain: string;
  product: { id: string; category?: string | null; secondaryCategories?: string[] };
}) {
  const t = useStoreText();
  const [offers, setOffers] = useState<DiscountOffer[]>([]);
  useEffect(() => {
    let cancelled = false;
    fetchDiscountOffers(subdomain).then((all) => {
      if (!cancelled) setOffers(all.filter((o) => offerCoversProduct(o, product)));
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subdomain, product.id]);

  if (offers.length === 0) return null;
  return (
    <div className="mt-4 rounded-lg border border-line bg-surface p-4">
      <p className="mb-2 flex items-center gap-1.5 text-[13.5px] font-bold text-ink">
        <Tag size={14} className="text-accent" aria-hidden />
        {t('Available offers')}
      </p>
      <ul className="space-y-1.5">
        {offers.map((o) => {
          const conditions = offerConditions(o);
          return (
            <li key={o.id} className="text-[13px] text-ink">
              <span className="font-semibold text-success">{offerBenefit(o)}</span>
              {conditions && <span className="text-muted"> {conditions}</span>}
              <span className="text-muted"> · {o.name}</span>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-[12px] text-muted">{t('Applied automatically at checkout.')}</p>
    </div>
  );
}
