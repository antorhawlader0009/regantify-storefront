'use client';

import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Check, Share2 } from 'lucide-react';
import { useCartHydrated, useCartStore } from '@/providers/cart-store-provider';
import { encodeCartLink } from '@/lib/cartLink';
import { trackFeature } from '@/lib/featureUse';

/**
 * "Share cart" (TellMe idea 77) as a round icon: the cart as a link (slugs, options, quantities), through the phone's share sheet or copied.
 * Lines with the shopper's own text or a pick-your-own box cannot go in a link, and the server looks everything up again when the link is
 * opened. Used in the cart drawer's head and the checkout's "Your cart" box; hidden while nothing in the cart can be shared.
 */
export function ShareCartButton({ subdomain, label, copiedLabel }: { subdomain: string; label: string; copiedLabel: string }) {
  const hydrated = useCartHydrated();
  const lines = useCartStore(useShallow((s) => s.lines.filter((l) => l.subdomain === subdomain && !l.customValues && !l.bundlePicks)));
  const [shared, setShared] = useState(false);
  if (!hydrated || lines.length === 0) return null;

  const share = async () => {
    trackFeature('CART_SHARE');
    // Path mode (/store/<sub>/...) keeps that prefix; on the store's own domain the link sits at the root.
    const base = window.location.pathname.startsWith(`/store/${subdomain}`) ? `/store/${subdomain}` : '';
    const url = `${window.location.origin}${base}/cart-link/${encodeCartLink(lines)}`;
    try {
      if (navigator.share) await navigator.share({ url });
      else await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2500);
    } catch {
      // The shopper closed the share sheet or the clipboard is blocked: nothing to do.
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => void share()}
        aria-label={shared ? copiedLabel : label}
        title={shared ? copiedLabel : label}
        className={`rounded-full p-2 transition-colors hover:bg-canvas focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${
          shared ? 'text-success' : 'text-ink hover:text-accent'
        }`}
      >
        {shared ? <Check size={19} strokeWidth={2.5} /> : <Share2 size={19} />}
      </button>
      <span className="sr-only" aria-live="polite">
        {shared ? copiedLabel : ''}
      </span>
    </>
  );
}
