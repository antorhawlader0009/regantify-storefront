'use client';

import { use } from 'react';
import { useStoreTheme } from '@/providers/theme-provider';
import { PaymentCallbackView } from '@/themes/storepal/views/PaymentCallbackView';

// Only StorePal's checkout offers "Online Payment" (see
// themes/storepal/views/CheckoutView.tsx's Payment Method choice) — so
// only StorePal's checkout ever sends a shopper's browser to PayStation
// with a callback_url pointing here (see PaymentsService.initiateForOrder).
// Medium/Minimal have no Online Payment option and so never generate a
// link to this route; guarded anyway (falls back to the store home) in
// case a stale bookmark/back-navigation from a since-changed theme ever
// lands here under a different theme.
export default function PaymentCallbackPage({ params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = use(params);
  const theme = useStoreTheme();

  if (theme !== 'STOREPAL') {
    if (typeof window !== 'undefined') {
      window.location.replace(`/store/${subdomain}`);
    }
    return null;
  }

  return <PaymentCallbackView subdomain={subdomain} />;
}
