'use client';

import { use } from 'react';
import { useStoreTheme } from '@/providers/theme-provider';
import { AccountOrdersView as MediumAccountOrdersView } from '@/themes/medium/views/account/AccountOrdersView';
import { AccountOrdersView as MinimalAccountOrdersView } from '@/themes/minimal/views/account/AccountOrdersView';
import { AccountOrdersView as StorepalAccountOrdersView } from '@/themes/storepal/views/account/AccountOrdersView';

export default function CustomerOrdersPage({ params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = use(params);
  const theme = useStoreTheme();

  if (theme === 'MINIMAL') return <MinimalAccountOrdersView subdomain={subdomain} />;
  if (theme === 'STOREPAL') return <StorepalAccountOrdersView subdomain={subdomain} />;
  return <MediumAccountOrdersView subdomain={subdomain} />;
}
