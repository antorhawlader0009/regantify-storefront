'use client';

import { useEffect, useState } from 'react';
import { useStorePalDesign } from './designSettings';

export interface SiteBannerState {
  /** The vendor's own RichTextEditor HTML (same trust level as Store > Footer's aboutBlurb). */
  html: string;
  background: string | null;
  marquee: boolean;
}

/**
 * Store > Design > Site Banner, with the scheduled banners (TellMe idea 110): the one whose time is on now replaces the
 * usual banner, decided in the browser from the time of the visit because the store's page is cached. Null when there
 * is nothing to show (the banner shows only what the seller wrote; no built-in promises). Shared by every
 * StorePal-family header (StorePal's strip, PlayMate's top bar).
 */
export function useSiteBanner(): SiteBannerState | null {
  const design = useStorePalDesign();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!design.bannerSchedule || design.bannerSchedule.length === 0) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, [design.bannerSchedule]);
  const scheduled =
    now === null
      ? null
      : ([...(design.bannerSchedule ?? [])]
          .filter((b) => (!b.startAt || Date.parse(b.startAt) <= now) && (!b.endAt || Date.parse(b.endAt) > now))
          // Two running at once: the one that started last.
          .sort((a, b) => (b.startAt ? Date.parse(b.startAt) : 0) - (a.startAt ? Date.parse(a.startAt) : 0))[0] ?? null);
  if (!scheduled && !design.bannerEnabled) return null;
  const html = scheduled ? scheduled.content : design.bannerContent;
  if (!html || !html.trim()) return null;
  return {
    html,
    background: scheduled?.backgroundColor || design.bannerBackgroundColor || null,
    marquee: (scheduled?.style ?? design.bannerStyle) === 'MARQUEE',
  };
}
