'use client';

import { useEffect } from 'react';
import type { StorefrontTiktokPixel } from '@/lib/storefrontApi';
import { GDPR_CONSENT_EVENT } from '@/lib/gdprConsent';
import { listenForCartChanges } from '@/lib/ecommerceEvents';
import {
  clearLandingTiktokPixel,
  grantTiktokPixelConsent,
  setLandingTiktokPixel,
  setupTiktokPixel,
  trackTiktokPageView,
} from '@/lib/tiktokPixel';

interface TiktokPixelProps {
  subdomain: string;
  tiktokPixel: StorefrontTiktokPixel | null;
  consentRequired: boolean;
}

/**
 * Store > Integrations > TikTok Pixel — mounted once in
 * store/[subdomain]/layout.tsx for every StorePal store, even one without
 * a store pixel, since a landing page can have its own (see
 * lib/tiktokPixel.ts). Renders nothing; loads nothing until a page
 * actually has a pixel and the shopper has consented.
 */
export function TiktokPixel(props: TiktokPixelProps) {
  // During render, not in an effect: page components' own effects (e.g.
  // a product page's ViewContent) run before this component's effects and
  // must already see the settings.
  if (typeof window !== 'undefined') {
    setupTiktokPixel({
      subdomain: props.subdomain,
      tiktokPixel: props.tiktokPixel,
      consentRequired: props.consentRequired,
    });
    listenForCartChanges(props.subdomain);
  }

  const { subdomain } = props;

  // The first page's view, deferred a tick so a landing page's own pixel
  // (TiktokPixelLanding, set in its effect) is in place first. Later
  // navigations are counted by TikTok's pixel itself.
  useEffect(() => {
    const timer = setTimeout(trackTiktokPageView, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onConsent = (e: Event) => {
      if ((e as CustomEvent<{ subdomain: string }>).detail?.subdomain !== subdomain) return;
      grantTiktokPixelConsent();
    };
    window.addEventListener(GDPR_CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(GDPR_CONSENT_EVENT, onConsent);
  }, [subdomain]);

  return null;
}

/**
 * Rendered by LandingPageView: while a landing page is on screen, events
 * go to its own pixel (LandingPage.tiktokPixelId), or to the store's pixel
 * when it has none. Does nothing on non-StorePal stores, where
 * <TiktokPixel> isn't mounted.
 */
export function TiktokPixelLanding({ pixelId }: { pixelId: string | null | undefined }) {
  useEffect(() => {
    setLandingTiktokPixel(pixelId ?? null);
    return () => clearLandingTiktokPixel();
  }, [pixelId]);
  return null;
}
