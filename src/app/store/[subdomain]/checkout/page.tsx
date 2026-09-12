'use client';

import { use } from 'react';
import { useStoreTheme } from '@/providers/theme-provider';
import { CheckoutView as MediumCheckoutView } from '@/themes/medium/views/CheckoutView';
import { CheckoutView as MinimalCheckoutView } from '@/themes/minimal/views/CheckoutView';
import { CheckoutView as StorepalCheckoutView } from '@/themes/storepal/views/CheckoutView';

export default function CheckoutPage({ params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = use(params);
  const theme = useStoreTheme();

  if (theme === 'MINIMAL') return <MinimalCheckoutView subdomain={subdomain} />;
  if (theme === 'STOREPAL') return <StorepalCheckoutView subdomain={subdomain} />;
  return <MediumCheckoutView subdomain={subdomain} />;
}
