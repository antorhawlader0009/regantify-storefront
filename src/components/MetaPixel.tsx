'use client';

import { Suspense, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import type { StorefrontMetaPixel } from '@/lib/storefrontApi';
import { GDPR_CONSENT_EVENT } from '@/lib/gdprConsent';
import { CART_ADD_EVENT, type CartLine } from '@/stores/cart-store';
import { trackMetaAddToCart } from '@/lib/metaPixelEvents';
import {
  clearLandingPixel,
  currentMetaPixelSubdomain,
  grantMetaPixelConsent,
  setLandingPixel,
  setupMetaPixel,
  trackMetaPageView,
} from '@/lib/metaPixel';

interface MetaPixelProps {
  subdomain: string;
  metaPixel: StorefrontMetaPixel | null;
  consentRequired: boolean;
}

/**
 * Store > Integrations > Facebook Pixel — mounted once in
 * store/[subdomain]/layout.tsx, StorePal stores only (see lib/metaPixel.ts
 * for which pages get which pixel). Renders nothing; loads nothing until
 * a page actually has a pixel and the shopper has consented.
 */
let cartListenerAdded = false;

/**
 * AddToCart for every cart add, whichever button did it. Registered once
 * per page load, from render rather than an effect inside the Suspense
 * boundary below, so an Add to Cart clicked while that part is still
 * loading isn't missed. trackMetaAddToCart itself checks the store and
 * consent (lib/metaPixel.ts), so the listener never needs removing.
 */
function listenForCartAdds() {
  if (cartListenerAdded) return;
  cartListenerAdded = true;
  window.addEventListener(CART_ADD_EVENT, (e) => {
    const line = (e as CustomEvent<CartLine>).detail;
    if (line?.subdomain === currentMetaPixelSubdomain()) trackMetaAddToCart(line);
  });
}

export function MetaPixel(props: MetaPixelProps) {
  // During render, not in an effect, and outside the Suspense boundary
  // below (whose content can render after the page itself has hydrated):
  // page components' own effects (e.g. a product page's ViewContent) run
  // before this component's effects and must already see the settings.
  if (typeof window !== 'undefined') {
    setupMetaPixel({
      subdomain: props.subdomain,
      metaPixel: props.metaPixel,
      consentRequired: props.consentRequired,
    });
    listenForCartAdds();
  }

  // useSearchParams needs a Suspense boundary in the App Router.
  return (
    <Suspense fallback={null}>
      <MetaPixelTracker {...props} />
    </Suspense>
  );
}

function MetaPixelTracker({ subdomain }: MetaPixelProps) {
  const pathname = usePathname();
  const search = useSearchParams()?.toString();

  // PageView on first load and on every client-side navigation (App
  // Router navigations don't reload the page). Deferred a tick so a
  // landing page's own pixel (MetaPixelLanding, set in its effect) is in
  // place first; the cleanup also stops React's dev double-run from
  // counting twice.
  useEffect(() => {
    const timer = setTimeout(trackMetaPageView, 0);
    return () => clearTimeout(timer);
  }, [pathname, search]);

  // The PageView for the page the shopper accepted cookies on was
  // dropped (no consent yet), so send it now.
  useEffect(() => {
    const onConsent = (e: Event) => {
      if ((e as CustomEvent<{ subdomain: string }>).detail?.subdomain !== subdomain) return;
      grantMetaPixelConsent();
      trackMetaPageView();
    };
    window.addEventListener(GDPR_CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(GDPR_CONSENT_EVENT, onConsent);
  }, [subdomain]);

  return null;
}

/**
 * Rendered by LandingPageView: while a landing page is on screen, events
 * go to its own pixel (LandingPage.metaPixelId), or to the store's pixel
 * when it has none. Does nothing on non-StorePal stores, where <MetaPixel>
 * isn't mounted.
 */
export function MetaPixelLanding({ pixelId }: { pixelId: string | null | undefined }) {
  useEffect(() => {
    setLandingPixel(pixelId ?? null);
    return () => clearLandingPixel();
  }, [pixelId]);
  return null;
}
