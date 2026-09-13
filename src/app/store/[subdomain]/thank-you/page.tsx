'use client';

import { use } from 'react';
import { useStoreTheme } from '@/providers/theme-provider';
import { ThankYouView } from '@/themes/storepal/views/ThankYouView';

// Only StorePal's checkout redirects here (see useCheckout.ts's
// post-order router.push) — Medium/Minimal still redirect straight to
// /orders, which already renders their own "Order placed successfully"
// confirmation banner (see themes/medium/views/OrdersView.tsx), so this
// route only ever needs to render StorePal's own view. Guarded anyway
// (falls back to /orders) in case a stale bookmark/back-navigation from
// a since-changed theme ever lands here under a different theme.
export default function ThankYouPage({ params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = use(params);
  const theme = useStoreTheme();

  if (theme !== 'STOREPAL') {
    if (typeof window !== 'undefined') {
      window.location.replace(`/store/${subdomain}/orders`);
    }
    return null;
  }

  return <ThankYouView subdomain={subdomain} />;
}
