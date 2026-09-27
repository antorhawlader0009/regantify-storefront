'use client';

import { Suspense, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import type { StorefrontGoogleTagManager } from '@/lib/storefrontApi';
import { GDPR_CONSENT_EVENT } from '@/lib/gdprConsent';
import { listenForCartChanges } from '@/lib/ecommerceEvents';
import { grantGoogleTagManagerConsent, pushGtmPageView, setupGoogleTagManager } from '@/lib/googleTagManager';

interface GoogleTagManagerProps {
  subdomain: string;
  googleTagManager: StorefrontGoogleTagManager | null;
  consentRequired: boolean;
}

/**
 * Store > Integrations > Google Tag Manager — mounted once in
 * store/[subdomain]/layout.tsx, StorePal stores only (see
 * lib/googleTagManager.ts for page views and consent). Renders nothing.
 */
export function GoogleTagManager(props: GoogleTagManagerProps) {
  // During render, for the same reason as <GoogleAnalytics>.
  if (typeof window !== 'undefined') {
    setupGoogleTagManager({
      subdomain: props.subdomain,
      googleTagManager: props.googleTagManager,
      consentRequired: props.consentRequired,
    });
    listenForCartChanges(props.subdomain);
  }

  const { subdomain } = props;
  useEffect(() => {
    const onConsent = (e: Event) => {
      if ((e as CustomEvent<{ subdomain: string }>).detail?.subdomain !== subdomain) return;
      grantGoogleTagManagerConsent();
    };
    window.addEventListener(GDPR_CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(GDPR_CONSENT_EVENT, onConsent);
  }, [subdomain]);

  // useSearchParams needs a Suspense boundary in the App Router.
  return (
    <Suspense fallback={null}>
      <PageViewTracker />
    </Suspense>
  );
}

/**
 * virtual_page_view after every client-side navigation. Waits a moment
 * so the new page's <title> is in place; the first page is left to
 * gtm.js's own Container Loaded event (pushGtmPageView skips an unchanged
 * URL).
 */
function PageViewTracker() {
  const pathname = usePathname();
  const search = useSearchParams()?.toString();
  useEffect(() => {
    const timer = setTimeout(pushGtmPageView, 300);
    return () => clearTimeout(timer);
  }, [pathname, search]);
  return null;
}
