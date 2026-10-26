'use client';

import { useEffect } from 'react';
import { trackFeature, type FeatureKey } from '@/lib/featureUse';

/** Counts one visit to a page (IDEA-30, lib/featureUse.ts): once per visit session, renders nothing. Put it inside the page's view. */
export function TrackFeature({ feature }: { feature: FeatureKey }) {
  useEffect(() => {
    trackFeature(feature, { oncePerSession: true });
  }, [feature]);
  return null;
}
