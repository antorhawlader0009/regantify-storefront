'use client';

import { useEffect } from 'react';
import { useReportWebVitals } from 'next/web-vitals';
import { apiOrigin } from '@/lib/visitSession';

/**
 * Real shoppers' page speed (PERFORMANCE-PLAN.md Step 1): Next's Core Web Vitals (LCP, INP, CLS, FCP, TTFB) for this
 * page view, sent to the store's own API in one call when the page is hidden or left, for Super Admin > System status.
 * Only the numbers, the kind of page and phone or computer: no address, no product, nothing about the shopper.
 * Mounted once in store/[subdomain]/layout.tsx next to VisitBeacon, so every theme is measured. Renders nothing.
 */

type Item = { name: string; value: number; rating: string; page: string; device: string };

const METRICS = new Set(['LCP', 'INP', 'CLS', 'FCP', 'TTFB']);
let queue: Item[] = [];

/** "HOME" | "PRODUCT" | "LISTING" | "CHECKOUT" | "OTHER", from the path in either address form. */
function pageKind(): string {
  const path = window.location.pathname.replace(/^\/store\/[^/]+/, '') || '/';
  const first = path.split('/')[1] ?? '';
  if (path === '/') return 'HOME';
  if (first === 'product') return 'PRODUCT';
  if (first === 'collection' || first === 'campaigns' || first === 'blog') return 'LISTING';
  if (first === 'cart' || first === 'checkout' || first === 'payment-callback') return 'CHECKOUT';
  return 'OTHER';
}

function device(): string {
  try {
    return window.matchMedia('(max-width: 767px), (pointer: coarse)').matches ? 'MOBILE' : 'DESKTOP';
  } catch {
    return 'DESKTOP';
  }
}

function send(subdomain: string) {
  if (queue.length === 0) return;
  const items = queue.slice(0, 10);
  queue = [];
  try {
    void fetch(`${apiOrigin()}/v1/store/${subdomain}/vitals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // A speed number is never worth an error for the shopper.
  }
}

export function WebVitalsBeacon({ subdomain }: { subdomain: string }) {
  useReportWebVitals((metric) => {
    if (!METRICS.has(metric.name) || !Number.isFinite(metric.value)) return;
    // One number per metric per page view: a later report of the same metric (CLS and INP grow) replaces the earlier one.
    queue = queue.filter((q) => q.name !== metric.name);
    queue.push({ name: metric.name, value: Math.max(0, metric.value), rating: metric.rating, page: pageKind(), device: device() });
  });

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') send(subdomain);
    };
    const onLeave = () => send(subdomain);
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', onLeave);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', onLeave);
    };
  }, [subdomain]);

  return null;
}
