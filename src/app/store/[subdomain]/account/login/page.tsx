'use client';

import { use } from 'react';
import { useStoreTheme } from '@/providers/theme-provider';
import { LoginView as MediumLoginView } from '@/themes/medium/views/account/LoginView';
import { LoginView as MinimalLoginView } from '@/themes/minimal/views/account/LoginView';
import { LoginView as StorepalLoginView } from '@/themes/storepal/views/account/LoginView';
import { storeSubdomain } from '@/lib/storeAddress';

export default function CustomerLoginPage({ params }: { params: Promise<{ subdomain: string }> }) {
  const subdomain = storeSubdomain(use(params).subdomain);
  const theme = useStoreTheme();

  if (theme === 'MINIMAL') return <MinimalLoginView subdomain={subdomain} />;
  if (theme === 'STOREPAL') return <StorepalLoginView subdomain={subdomain} />;
  return <MediumLoginView subdomain={subdomain} />;
}
