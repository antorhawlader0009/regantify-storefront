'use client';

import { Suspense, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { GDPR_CONSENT_EVENT } from '@/lib/gdprConsent';
import { listenForCartChanges } from '@/lib/ecommerceEvents';
import { grantGoogleTagManagerConsent, pushGtmPageView, setupStoreDataLayer } from '@/lib/googleTagManager';

/**
 * The store's dataLayer on EVERY store and template (2026-11-03, the owner's rule): page data, virtual_page_view on each
 * client-side page change, the GA4 ecommerce events (add_to_cart, begin_checkout, purchase...) and order_place, whether or
 * not the store set up Google Tag Manager in Store > Integrations. A container the store adds itself (Custom Code) reads the
 * same events. Respects the GDPR Prompt: nothing is pushed before the shopper accepts. Mounted once in the store layout;
 * renders nothing.
 */
export function StoreDataLayer({ subdomain, storeName, consentRequired }: { subdomain: string; storeName: string | null; consentRequired: boolean }) {
  if (typeof window !== 'undefined') {
    setupStoreDataLayer({ subdomain, storeName, consentRequired });
    listenForCartChanges(subdomain);
  }

  useEffect(() => {
    const onConsent = (e: Event) => {
      if ((e as CustomEvent<{ subdomain: string }>).detail?.subdomain !== subdomain) return;
      grantGoogleTagManagerConsent();
    };
    window.addEventListener(GDPR_CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(GDPR_CONSENT_EVENT, onConsent);
  }, [subdomain]);

  return (
    <Suspense fallback={null}>
      <PageViews />
    </Suspense>
  );
}

function PageViews() {
  const pathname = usePathname();
  const search = useSearchParams()?.toString();
  useEffect(() => {
    // A moment for the new page's <title>; the first page is already covered by the page data.
    const t = setTimeout(pushGtmPageView, 300);
    return () => clearTimeout(t);
  }, [pathname, search]);
  return null;
}
