'use client';

import { use } from 'react';
import { useStoreTheme } from '@/providers/theme-provider';
import { OrdersView as MediumOrdersView } from '@/themes/medium/views/OrdersView';
import { OrdersView as MinimalOrdersView } from '@/themes/minimal/views/OrdersView';

export default function TrackOrderPage({ params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = use(params);
  const theme = useStoreTheme();

  // StorePal has no order-tracking screenshot of its own to match, and
  // this page's content (invoice/phone lookup, status timeline) is
  // entirely generic — Medium's own build (fully CSS-variable driven,
  // see globals.css's [data-theme='storepal'] block) already renders
  // correctly under every theme's tokens, so StorePal reuses it as-is
  // rather than a near-duplicate rebuild with nothing to differentiate.
  return theme === 'MINIMAL' ? <MinimalOrdersView subdomain={subdomain} /> : <MediumOrdersView subdomain={subdomain} />;
}
