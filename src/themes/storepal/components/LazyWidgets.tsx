'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { AiAssistantWidget } from './AiAssistantWidget';
import { AiAssistantBubble } from './AiAssistantBubble';

/**
 * StorePal's always-mounted extras, loaded as their own files after the page is up (PERFORMANCE-PLAN.md Step 11), so
 * their JavaScript is not part of what a phone must download and run before the page responds to a tap. Each of them
 * renders nothing on the server anyway (they decide in the browser: saved compare list, the store's AI availability,
 * the popup rules, the recent-orders feed), so the page looks the same; they just appear a moment later.
 * The chat bubble shows at once on purpose (LazyAiAssistantWidget below), and the GDPR prompt is not here.
 */
export const LazyCompareBar = dynamic(() => import('./CompareBar').then((m) => m.CompareBar), { ssr: false });
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
