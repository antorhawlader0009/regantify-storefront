'use client';

import { useEffect, useState } from 'react';
import { Truck } from 'lucide-react';
import { apiOrigin } from '@/lib/checkoutApi';
import { loadBdLocations } from '@/lib/bdLocations';
import { formatExpectedDate } from '@/lib/expectedDate';
import { useStorePalDesign } from '../lib/designSettings';
import { formatPrice as plainPrice } from '../lib/formatPrice';
import { bnDigits, useFormatPrice } from '../lib/storeText';
import { trackFeature } from '@/lib/featureUse';

/** Where the chosen district is remembered, so the next product (and the checkout) starts with it. */
export const DELIVERY_DISTRICT_KEY = 'storepal-delivery-district:';

interface Quote {
  zone: 'DHAKA' | 'AROUND_DHAKA' | 'OUTSIDE_DHAKA';
  refusal: string | null;
  charge: number;
  estimatedDate: string | null;
  freeShippingOver: number | null;
}

const ZONE_EN = { DHAKA: 'Inside Dhaka', AROUND_DHAKA: 'Around Dhaka', OUTSIDE_DHAKA: 'Outside Dhaka' };
const ZONE_BN = { DHAKA: 'ঢাকার ভেতর', AROUND_DHAKA: 'ঢাকার আশেপাশে', OUTSIDE_DHAKA: 'ঢাকার বাইরে' };

/**
 * Product page "Delivery: how much, when?" (TellMe idea 68). The shopper picks a district and sees the zone, the delivery charge and
 * the expected date at once, or "we do not deliver there" when the store limits its area. Every number comes from the server
 * (`/v1/store/:subdomain/delivery-quote`), the same settings checkout uses, so the two agree. The district is remembered in this
 * browser: the next product shows it already, and checkout starts with it. Nothing is stored on the server.
 */
export function DeliveryCheck({ subdomain }: { subdomain: string }) {
  const formatPrice = useFormatPrice(plainPrice);
  const design = useStorePalDesign();
  const bn = design.storeLanguage === 'bn';
  const [districts, setDistricts] = useState<{ n: string; b: string }[]>([]);
  const [district, setDistrict] = useState('');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadBdLocations().then((d) => !cancelled && setDistricts(d.districts.map((x) => ({ n: x.n, b: x.b })))).catch(() => undefined);
    try {
      const saved = localStorage.getItem(DELIVERY_DISTRICT_KEY + subdomain);
      if (saved) setDistrict(saved);
    } catch {
      // Storage blocked: the shopper just picks again on the next product.
    }
    return () => {
      cancelled = true;
    };
  }, [subdomain]);

  useEffect(() => {
    if (!district) {
      setQuote(null);
      return;
    }
    let cancelled = false;
    setFailed(false);
    fetch(`${apiOrigin()}/v1/store/${subdomain}/delivery-quote?district=${encodeURIComponent(district)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('quote'))))
      .then((q: Quote) => !cancelled && setQuote(q))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [district, subdomain]);

  const choose = (value: string) => {
    setDistrict(value);
    if (value) trackFeature('DELIVERY_CHECK');
    try {
      if (value) localStorage.setItem(DELIVERY_DISTRICT_KEY + subdomain, value);
      else localStorage.removeItem(DELIVERY_DISTRICT_KEY + subdomain);
    } catch {
      // Not remembered; still works for this page.
    }
  };

  const zoneName = (z: Quote['zone']) => (bn ? ZONE_BN : ZONE_EN)[z];
  return (
    <div className="mt-3 rounded-md border border-line bg-canvas px-3.5 py-3 text-[13px] text-ink">
      <p className="m-0 mb-1.5 flex items-center gap-1.5 font-semibold">
        <Truck size={15} className="shrink-0" />
        {bn ? 'ডেলিভারি কত, কবে?' : 'Delivery: how much, and when?'}
      </p>
      <select
        value={district}
        onChange={(e) => choose(e.target.value)}
        aria-label={bn ? 'জেলা' : 'District'}
        className="w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-[13px] outline-none focus:border-ink"
      >
        <option value="">{bn ? 'আপনার জেলা বাছুন' : 'Choose your district'}</option>
        {districts.map((d) => (
          <option key={d.n} value={d.n}>
            {bn ? d.b : d.n}
          </option>
        ))}
      </select>
      {failed && <p className="m-0 mt-2 text-muted">{bn ? 'এখন দেখানো যাচ্ছে না। চেকআউটে দেখুন।' : 'Could not check right now. You will see it at checkout.'}</p>}
      {quote && quote.refusal && <p className="m-0 mt-2 font-semibold text-accent">{quote.refusal}</p>}
      {quote && !quote.refusal && (
        <p className="m-0 mt-2">
          {zoneName(quote.zone)}, {bn ? 'ডেলিভারি' : 'delivery'} <strong>{formatPrice(quote.charge)}</strong>
          {quote.estimatedDate && (
            <>
              , {bn ? 'আনুমানিক' : 'expected'} <strong>{formatExpectedDate(quote.estimatedDate, bn ? 'bn' : 'en')}</strong>
            </>
          )}
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
