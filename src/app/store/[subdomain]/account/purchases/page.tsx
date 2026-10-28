'use client';

import { use } from 'react';
import { useStoreTheme } from '@/providers/theme-provider';
import { AccountOrdersView as MediumAccountOrdersView } from '@/themes/medium/views/account/AccountOrdersView';
import { AccountOrdersView as MinimalAccountOrdersView } from '@/themes/minimal/views/account/AccountOrdersView';
import { PurchasesView as StorepalPurchasesView } from '@/themes/storepal/views/account/PurchasesView';
import { storeSubdomain } from '@/lib/storeAddress';

/** Account > My purchases (StorePal); the other templates have no such page yet and show their orders list. */
export default function CustomerPurchasesPage({ params }: { params: Promise<{ subdomain: string }> }) {
  const subdomain = storeSubdomain(use(params).subdomain);
  const theme = useStoreTheme();

  if (theme === 'STOREPAL') return <StorepalPurchasesView subdomain={subdomain} />;
  if (theme === 'MINIMAL') return <MinimalAccountOrdersView subdomain={subdomain} />;
  return <MediumAccountOrdersView subdomain={subdomain} />;
}
