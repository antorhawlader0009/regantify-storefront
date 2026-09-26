// A parcel's courier tracking as the shopper sees it — mirrors
// server/src/courier/customer-tracking.ts (pathao-plan.md Step 13). Only
// the courier's name, the tracking ID and a coarse stage; never the
// courier's raw status, fees or errors.
export type CourierTrackingStage = 'booked' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'returned';

export interface CourierTracking {
  provider: 'PATHAO' | 'STEADFAST' | 'REDX';
  providerName: string;
  trackingId: string;
  stage: CourierTrackingStage;
  /** A hiccup worth telling the shopper ("A delivery attempt didn't work out…"), or null. */
  notice: string | null;
  updatedAt: string | null;
}

export const COURIER_TRACKING_STEPS: Array<{ stage: CourierTrackingStage; label: string }> = [
  { stage: 'booked', label: 'Booked' },
  { stage: 'picked_up', label: 'Picked up' },
  { stage: 'in_transit', label: 'In transit' },
  { stage: 'out_for_delivery', label: 'Out for delivery' },
  { stage: 'delivered', label: 'Delivered' },
];

export function courierStageLabel(stage: CourierTrackingStage): string {
  if (stage === 'returned') return 'Returned';
  return COURIER_TRACKING_STEPS.find((s) => s.stage === stage)?.label ?? stage;
}
