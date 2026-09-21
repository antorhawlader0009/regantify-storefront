'use client';

import { useEffect } from 'react';
import { recordLandingPageVisit } from '@/lib/checkoutApi';

// Same session-key-per-tab-group convention as the store-wide
// VisitBeacon.tsx (see its own comment) — namespaced by
// subdomain+slug so visiting two different landing pages in one browser
// session correctly counts as two visits.
function getOrCreateSessionKey(subdomain: string, slug: string): string {
  const key = `regantify-landing-session:${subdomain}:${slug}`;
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;
  const generated = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  sessionStorage.setItem(key, generated);
  return generated;
}

/**
 * Landing page visit beacon (landing-plan.md §6, §8) — fires once per
 * mount, capturing utm_source/utm_medium/utm_campaign from the page's own
 * URL (ad-driven traffic is the primary use case here, per landing-plan.md
 * §6) and the document referrer. Mounted once by LandingPageView, same
 * "renders nothing, never blocks the page, never throws" contract as the
 * store-wide VisitBeacon.
 */
export function LandingPageVisitBeacon({ subdomain, slug }: { subdomain: string; slug: string }) {
  useEffect(() => {
    try {
      const sessionKey = getOrCreateSessionKey(subdomain, slug);
      const params = new URLSearchParams(window.location.search);
      recordLandingPageVisit(subdomain, slug, {
        sessionKey,
        referrer: document.referrer || undefined,
        utmSource: params.get('utm_source') || undefined,
        utmMedium: params.get('utm_medium') || undefined,
        utmCampaign: params.get('utm_campaign') || undefined,
      });
    } catch {
      // sessionStorage can throw in some private-browsing modes — a
      // visit beacon is never worth breaking the page over, same
      // reasoning VisitBeacon.tsx's own try/catch gives.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subdomain, slug]);

  return null;
}
