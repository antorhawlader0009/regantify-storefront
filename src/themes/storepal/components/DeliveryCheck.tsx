'use client';

import { useEffect, useState } from 'react';
import { Truck } from 'lucide-react';
import { apiOrigin } from '@/lib/checkoutApi';
import { BdAddressPicker } from '@/components/BdAddressPicker';
import { readSavedPlace, writeSavedPlace } from '@/lib/savedPlace';
import { formatExpectedDate } from '@/lib/expectedDate';
import { useStorePalDesign } from '../lib/designSettings';
import { formatPrice as plainPrice } from '../lib/formatPrice';
import { bnDigits, useFormatPrice } from '../lib/storeText';
import { trackFeature } from '@/lib/featureUse';

interface Quote {
  zone: 'DHAKA' | 'AROUND_DHAKA' | 'OUTSIDE_DHAKA';
  refusal: string | null;
  charge: number;
  estimatedDate: string | null;
  freeShippingOver: number | null;
}

const ZONE_EN = { DHAKA: 'Inside Dhaka', AROUND_DHAKA: 'Around Dhaka', OUTSIDE_DHAKA: 'Outside Dhaka' };
const ZONE_BN = { DHAKA: 'ঢাকার ভিতরে', AROUND_DHAKA: 'ঢাকার আশেপাশে', OUTSIDE_DHAKA: 'ঢাকার বাইরে' };

const LABELS = {
  en: {
    district: 'District',
    thana: 'Thana / Upazila',
    districtPlaceholder: 'Select your district and thana',
    thanaPlaceholder: 'Thana / Upazila',
    thanaNeedsDistrict: 'Choose a district first',
    other: 'Other (type it)',
    typeDistrict: 'Type your district',
    typeThana: 'Type your thana / upazila',
    place: 'Delivery: how much, and when?',
    search: 'Search',
  },
  bn: {
    district: 'জেলা',
    thana: 'থানা / উপজেলা',
    districtPlaceholder: 'আপনার জেলা ও থানা বাছুন',
    thanaPlaceholder: 'থানা / উপজেলা',
    thanaNeedsDistrict: 'আগে জেলা বাছুন',
    other: 'অন্যান্য (নিজে লিখুন)',
    typeDistrict: 'আপনার জেলা লিখুন',
    typeThana: 'আপনার থানা / উপজেলা লিখুন',
    place: 'ডেলিভারি কত, কবে?',
    search: 'খুঁজুন',
  },
};

/**
 * Product page "Delivery: how much, and when?" (TellMe idea 68). The shopper picks district and thana in the same one-field
 * picker as the checkout and sees the zone, the delivery charge and the expected date, or "we do not deliver there" when the
 * store limits its area. Every number comes from the server (`/v1/store/:subdomain/delivery-quote`), the same settings
 * checkout uses. The place is remembered in this browser (lib/savedPlace.ts): every product shows it, the checkout starts
 * with it, and a change made in either place shows in the other. Nothing is stored on the server.
 */
export function DeliveryCheck({ subdomain }: { subdomain: string }) {
  const formatPrice = useFormatPrice(plainPrice);
  const design = useStorePalDesign();
  const bn = design.storeLanguage === 'bn';
  const [district, setDistrict] = useState('');
  const [thana, setThana] = useState('');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const saved = readSavedPlace(subdomain);
    if (saved) {
      setDistrict(saved.district);
      setThana(saved.thana);
    }
  }, [subdomain]);

  useEffect(() => {
    if (!district.trim()) {
      setQuote(null);
      return;
    }
    let cancelled = false;
    setFailed(false);
    const qs = `district=${encodeURIComponent(district)}${thana.trim() ? `&thana=${encodeURIComponent(thana)}` : ''}`;
    fetch(`${apiOrigin()}/v1/store/${subdomain}/delivery-quote?${qs}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('quote'))))
      .then((q: Quote) => !cancelled && setQuote(q))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [district, thana, subdomain]);

  const save = (next: { district: string; thana: string }) => {
    if (next.district && next.district !== district) trackFeature('DELIVERY_CHECK');
    writeSavedPlace(subdomain, next);
  };

  const zoneName = (z: Quote['zone']) => (bn ? ZONE_BN : ZONE_EN)[z];
  return (
    <div className="mt-3 rounded-lg bg-canvas px-4 py-3.5 text-[13px] text-ink">
      <BdAddressPicker
        district={district}
        thana={thana}
        onDistrict={(value) => {
          setDistrict(value);
          save({ district: value, thana: '' });
        }}
        onThana={(value) => {
          setThana(value);
          save({ district, thana: value });
        }}
        lang={bn ? 'bn' : 'en'}
        labels={LABELS[bn ? 'bn' : 'en']}
        labelClassName="m-0 mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-ink"
        controlClassName="w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-[13px] outline-none focus:border-ink"
      />
      {failed && <p className="m-0 mt-2 text-muted">{bn ? 'এখন দেখানো যাচ্ছে না। চেকআউটে দেখুন।' : 'Could not check right now. You will see it at checkout.'}</p>}
      {quote && quote.refusal && <p className="m-0 mt-2 font-semibold text-accent">{quote.refusal}</p>}
      {quote && !quote.refusal && (
        <p className="m-0 mt-2 flex items-start gap-1.5 text-muted">
          <Truck size={14} className="mt-0.5 shrink-0" aria-hidden />
          <span>
            {zoneName(quote.zone)} {bn ? 'ডেলিভারি' : 'delivery'}: <strong className="text-ink">{formatPrice(quote.charge)}</strong>
            {quote.estimatedDate && (
              <>
                , {bn ? 'আনুমানিক' : 'expected'} <strong className="text-ink">{formatExpectedDate(quote.estimatedDate, bn ? 'bn' : 'en')}</strong>
              </>
            )}
          </span>
        </p>
      )}
      {quote && !quote.refusal && quote.freeShippingOver !== null && (
        <p className="m-0 mt-1 text-muted">
          {quote.freeShippingOver > 0
            ? bn
              ? `${bnDigits(quote.freeShippingOver)} টাকার বেশি অর্ডারে ফ্রি ডেলিভারি`
              : `Free delivery on orders over ${formatPrice(quote.freeShippingOver)}`
            : bn
              ? 'ফ্রি ডেলিভারি চলছে'
              : 'Free delivery right now'}
        </p>
      )}
    </div>
  );
}
