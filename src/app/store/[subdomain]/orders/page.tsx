'use client';

import { use } from 'react';
import { useStoreTheme } from '@/providers/theme-provider';
import { OrdersView as MediumOrdersView } from '@/themes/medium/views/OrdersView';
import { OrdersView as MinimalOrdersView } from '@/themes/minimal/views/OrdersView';
import { TrackLookupView } from '@/themes/storepal/views/TrackLookupView';

export default function TrackOrderPage({ params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = use(params);
  const theme = useStoreTheme();

  // StorePal has its own tracking screen (tracking-plan.md Step 4): the order number + phone
  // lookup with the timeline, the courier block, live refresh and Bangla/English. Medium and
  // Minimal keep their own views exactly as they were.
  if (theme === 'MINIMAL') return <MinimalOrdersView subdomain={subdomain} />;
  if (theme === 'STOREPAL') return <TrackLookupView subdomain={subdomain} />;
  return <MediumOrdersView subdomain={subdomain} />;
}
