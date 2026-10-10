'use client';

import { useEffect, useRef, useState } from 'react';
import type { TrackedOrder } from '@/lib/checkoutApi';

const REFRESH_MS = 60_000;

const FINAL_STATUSES = ['COMPLETED', 'CANCELLED', 'REFUNDED', 'RETURN', 'PAYMENT_FAILED', 'STOCK_OUT'];

/** An order that will not change any more, so there is nothing left to refresh. */
export function isFinishedOrder(order: TrackedOrder): boolean {
  if (FINAL_STATUSES.includes(order.status)) return true;
  const stage = order.courierTracking?.stage;
  return stage === 'delivered' || stage === 'returned';
}

/**
 * Keeps a tracking page current without a reload (tracking-plan.md Step 4): one fetch a minute
 * while the tab is visible and the order is still moving. A hidden tab makes no requests and
 * checks again the moment it comes back if the last check is older than a minute; a finished order
 * (delivered, cancelled, returned...) stops polling for good. A failed fetch is ignored and tried
 * again at the next tick, so a patchy mobile connection never breaks the page.
 */
export function useLiveOrder(initial: TrackedOrder, refetch: () => Promise<TrackedOrder>) {
  const [order, setOrder] = useState(initial);
  const [checkedAt, setCheckedAt] = useState(() => new Date());
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;
  const lastRef = useRef(Date.now());

  // A different order handed in (a new lookup) replaces what is shown.
  useEffect(() => {
    setOrder(initial);
    setCheckedAt(new Date());
    lastRef.current = Date.now();
  }, [initial]);

  const finished = isFinishedOrder(order);
  useEffect(() => {
    if (finished) return;
    let cancelled = false;
    const check = async () => {
      if (document.visibilityState !== 'visible') return;
      lastRef.current = Date.now();
      try {
        const next = await refetchRef.current();
        if (cancelled) return;
        setOrder(next);
        setCheckedAt(new Date());
      } catch {
        // try again at the next tick
      }
    };
    const timer = setInterval(check, REFRESH_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastRef.current >= REFRESH_MS) void check();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [finished]);

  // Shows an order the page already has in hand (the answer to "Cancel my order") without waiting for the next check.
  const replace = (next: TrackedOrder) => {
    setOrder(next);
    setCheckedAt(new Date());
    lastRef.current = Date.now();
  };

  return { order, checkedAt, finished, replace };
}
