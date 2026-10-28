'use client';

import { useEffect, useState } from 'react';
import { apiOrigin } from '@/lib/visitSession';

const TEXT = {
  en: 'Orders are off right now. Please contact the shop owner.',
  bn: 'এই মুহূর্তে অর্ডার নেওয়া বন্ধ আছে। দোকানের মালিকের সাথে যোগাযোগ করুন।',
};

/**
 * The red strip at the top of every store page while the store takes no new orders (2026-10-28, the owner's rule): its wallet
 * is below -৳100 from unpaid platform fees (server finance/wallet-debt.ts), or another stop such as a passed verification
 * deadline. Store pages are kept in the page cache, so the browser asks `GET /v1/store/:subdomain/ordering` itself; nothing
 * shows while it answers or if it fails. Shared by every template (mounted in the store layout); checkout refuses the order too.
 */
export function OrdersOffBar({ subdomain, lang = 'en' }: { subdomain: string; lang?: 'en' | 'bn' }) {
  const [off, setOff] = useState(false);

  useEffect(() => {
    let live = true;
    fetch(`${apiOrigin()}/v1/store/${encodeURIComponent(subdomain)}/ordering`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { open?: boolean } | null) => live && setOff(d?.open === false))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [subdomain]);

  if (!off) return null;
  return (
    <div role="alert" className="w-full bg-red-600 px-4 py-2.5 text-center text-[13.5px] font-semibold text-white">
      {TEXT[lang]}
    </div>
  );
}
