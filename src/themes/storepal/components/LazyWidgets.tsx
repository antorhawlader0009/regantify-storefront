'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { AiAssistantWidget } from './AiAssistantWidget';
import { AiAssistantBubble } from './AiAssistantBubble';
import { useCheckoutDialog } from '../lib/checkoutDialog';
import { useAuthDialog } from '../lib/authDialog';

/**
 * StorePal's always-mounted extras, loaded as their own files after the page is up (PERFORMANCE-PLAN.md Step 11), so
 * their JavaScript is not part of what a phone must download and run before the page responds to a tap. Each of them
 * renders nothing on the server anyway (they decide in the browser: the store's AI availability,
 * the popup rules, the recent-orders feed), so the page looks the same; they just appear a moment later.
 * The chat bubble shows at once on purpose (LazyAiAssistantWidget below), and the GDPR prompt is not here.
 */
export const LazyRecentBuyersPopup = dynamic(() => import('./RecentBuyersPopup').then((m) => m.RecentBuyersPopup), { ssr: false });
export const LazyPopupCampaigns = dynamic(() => import('./PopupCampaigns').then((m) => m.PopupCampaigns), { ssr: false });
const loadAiAssistant = () => import('./AiAssistantWidget');
// Start fetching the chat's code as soon as this module runs in the browser (not after the page has rendered). Still a
// separate file, not in the first download.
if (typeof window !== 'undefined') void loadAiAssistant();

/**
 * The AI chat: a small bubble (AiAssistantBubble.tsx, part of the page's own code) shows at once while the full
 * widget's large file loads, then the widget takes its place. A tap on the early bubble opens the chat as soon as the
 * widget is in.
 */
export function LazyAiAssistantWidget(props: { subdomain: string; storeName: string }) {
  const [Widget, setWidget] = useState<typeof AiAssistantWidget | null>(null);
  useEffect(() => {
    let cancelled = false;
    void loadAiAssistant().then((m) => {
      if (!cancelled) setWidget(() => m.AiAssistantWidget);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  if (Widget) return <Widget {...props} />;
  return <AiAssistantBubble subdomain={props.subdomain} />;
}
export const LazyPhotoSearchPanel = dynamic(() => import('./PhotoSearchPanel').then((m) => m.PhotoSearchPanel), { ssr: false });

/**
 * Loads a module the moment `want` is true, and otherwise once the browser is idle after the page is up, so the
 * first tap on a button that needs it finds it already there. Until then the caller renders nothing. Once loaded it
 * stays loaded.
 */
function useLoadOnDemand<T>(want: boolean, load: () => Promise<T>): T | null {
  const [mod, setMod] = useState<T | null>(null);
  useEffect(() => {
    if (mod) return;
    let cancelled = false;
    const take = () => {
      void load().then((m) => {
        if (!cancelled) setMod(() => m);
      });
    };
    if (want) {
      take();
      return () => {
        cancelled = true;
      };
    }
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const id = w.requestIdleCallback ? w.requestIdleCallback(take, { timeout: 8000 }) : window.setTimeout(take, 4000);
    return () => {
      cancelled = true;
      if (w.cancelIdleCallback) w.cancelIdleCallback(id);
      else window.clearTimeout(id);
    };
  }, [want, mod, load]);
  return mod;
}

const loadCheckoutDialog = () => import('./CheckoutDialog');
const loadAuthDialog = () => import('./AuthDialog');

/**
 * The checkout dialog (with useCheckout, the address picker and the order form) is a large file most visitors never
 * open, so it is not part of the page's first download: it loads when the browser is idle, or at once when a
 * Checkout / Buy Now button opens it first. Both dialogs render nothing while closed, so the page looks the same.
 */
export function LazyCheckoutDialog({ subdomain }: { subdomain: string }) {
  const open = useCheckoutDialog((s) => s.open);
  const mod = useLoadOnDemand(open, loadCheckoutDialog);
  if (!mod) return null;
  return <mod.CheckoutDialog subdomain={subdomain} />;
}

/** The login / sign-up / forgot-password dialog, loaded the same way as the checkout dialog. */
export function LazyAuthDialog({ subdomain }: { subdomain: string }) {
  const open = useAuthDialog((s) => s.open);
  const mod = useLoadOnDemand(open, loadAuthDialog);
  if (!mod) return null;
  return <mod.AuthDialog subdomain={subdomain} />;
}
