'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

/*
 * Dollar prices for gift senders abroad, shared by every template. The store types its own rate (taka per 1 US dollar,
 * Store > Delivery Charge > Gift option); nothing is fetched live. The price is only a guide: the shopper always pays in
 * taka and their card converts it. Shown on its own to a visitor whose browser is not on Bangladesh time, and at checkout
 * whenever "This is a gift" is ticked (`always`), so a sender abroad on a Dhaka-set phone still sees it there.
 */

const UsdRateContext = createContext<number | null>(null);

export function UsdPriceProvider({ rate, children }: { rate: number | null | undefined; children: ReactNode }) {
  return <UsdRateContext.Provider value={rate && rate > 0 ? rate : null}>{children}</UsdRateContext.Provider>;
}

/** True after mount when the browser's time zone is not Bangladesh's (false on the server, so the first render matches). */
function useAbroad(): boolean {
  const [abroad, setAbroad] = useState(false);
  useEffect(() => {
    try {
      const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setAbroad(!!zone && zone !== 'Asia/Dhaka' && zone !== 'Asia/Dacca');
    } catch {
      setAbroad(false);
    }
  }, []);
  return abroad;
}

/** "≈ US$12.40" for a taka amount, or null when the store has no rate or the visitor is in Bangladesh (unless `always`). */
export function useUsdPrice(always = false): (bdt: number | string | null | undefined) => string | null {
  const rate = useContext(UsdRateContext);
  const abroad = useAbroad();
  return (bdt) => {
    const n = Number(bdt);
    if (!rate || !(always || abroad) || !Number.isFinite(n) || n <= 0) return null;
    return `≈ US$${(n / rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
}
