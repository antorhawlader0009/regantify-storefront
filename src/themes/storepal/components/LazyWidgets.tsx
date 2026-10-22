'use client';

import dynamic from 'next/dynamic';

/**
 * StorePal's always-mounted extras, loaded as their own files after the page is up (PERFORMANCE-PLAN.md Step 11), so
 * their JavaScript is not part of what a phone must download and run before the page responds to a tap. Each of them
 * renders nothing on the server anyway (they decide in the browser: saved compare list, the store's AI availability,
 * the popup rules, the recent-orders feed), so the page looks the same; they just appear a moment later.
 * The chat bubble and the GDPR prompt are not here: both show at once on purpose.
 */
export const LazyCompareBar = dynamic(() => import('./CompareBar').then((m) => m.CompareBar), { ssr: false });
export const LazyRecentBuyersPopup = dynamic(() => import('./RecentBuyersPopup').then((m) => m.RecentBuyersPopup), { ssr: false });
export const LazyPopupCampaigns = dynamic(() => import('./PopupCampaigns').then((m) => m.PopupCampaigns), { ssr: false });
export const LazyAiAssistantWidget = dynamic(() => import('./AiAssistantWidget').then((m) => m.AiAssistantWidget), { ssr: false });
export const LazyPhotoSearchPanel = dynamic(() => import('./PhotoSearchPanel').then((m) => m.PhotoSearchPanel), { ssr: false });
