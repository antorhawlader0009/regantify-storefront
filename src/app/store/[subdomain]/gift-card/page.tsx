'use client';

import { Suspense, use } from 'react';
import { useStoreTheme } from '@/providers/theme-provider';
import { GiftCardView } from '@/themes/storepal/views/GiftCardView';
import { storeSubdomain } from '@/lib/storeAddress';

// Gift cards sold on the store (TellMe idea 135). StorePal only: any other theme goes back to the store home.
export default function GiftCardPage({ params }: { params: Promise<{ subdomain: string }> }) {
  const subdomain = storeSubdomain(use(params).subdomain);
  const theme = useStoreTheme();
  if (theme !== 'STOREPAL') {
    if (typeof window !== 'undefined') window.location.replace(`/store/${subdomain}`);
    return null;
  }
  // The view reads the address bar's query (useSearchParams), which needs a Suspense boundary now that the page can be
  // rendered once and kept (PERFORMANCE-PLAN.md Step 8).
  return (
    <Suspense fallback={null}>
      <GiftCardView subdomain={subdomain} />
    </Suspense>
  );
}
