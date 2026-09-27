'use client';

import { useEffect } from 'react';
import type { StorefrontGoogleAnalytics } from '@/lib/storefrontApi';
import { GDPR_CONSENT_EVENT } from '@/lib/gdprConsent';
import { listenForCartChanges } from '@/lib/ecommerceEvents';
import { grantGoogleAnalyticsConsent, setupGoogleAnalytics } from '@/lib/googleAnalytics';

interface GoogleAnalyticsProps {
  subdomain: string;
  googleAnalytics: StorefrontGoogleAnalytics | null;
  consentRequired: boolean;
}

/**
 * Store > Integrations > Google Analytics 4 — mounted once in
 * store/[subdomain]/layout.tsx, StorePal stores only (see
 * lib/googleAnalytics.ts for page views and consent). Renders nothing.
 */
export function GoogleAnalytics(props: GoogleAnalyticsProps) {
  // During render, not in an effect: page components' own effects (e.g.
  // a product page's view_item) run before this component's effects and
  // must already see the settings. Same for the cart listeners, so a
  // click right after hydration isn't missed.
  if (typeof window !== 'undefined') {
    setupGoogleAnalytics({
      subdomain: props.subdomain,
      googleAnalytics: props.googleAnalytics,
      consentRequired: props.consentRequired,
    });
    listenForCartChanges(props.subdomain);
  }

  const { subdomain } = props;
  useEffect(() => {
    const onConsent = (e: Event) => {
      if ((e as CustomEvent<{ subdomain: string }>).detail?.subdomain !== subdomain) return;
      grantGoogleAnalyticsConsent();
    };
    window.addEventListener(GDPR_CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(GDPR_CONSENT_EVENT, onConsent);
  }, [subdomain]);

  return null;
}
