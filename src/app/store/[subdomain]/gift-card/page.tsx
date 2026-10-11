'use client';

import { use } from 'react';
import { useStoreTheme } from '@/providers/theme-provider';
import { GiftCardView } from '@/themes/storepal/views/GiftCardView';

// Gift cards sold on the store (TellMe idea 135). StorePal only: any other theme goes back to the store home.
export default function GiftCardPage({ params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = use(params);
  const theme = useStoreTheme();
  if (theme !== 'STOREPAL') {
    if (typeof window !== 'undefined') window.location.replace(`/store/${subdomain}`);
    return null;
  }
  return <GiftCardView subdomain={subdomain} />;
}
