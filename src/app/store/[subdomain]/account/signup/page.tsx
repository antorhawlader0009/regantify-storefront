'use client';

import { use } from 'react';
import { useStoreTheme } from '@/providers/theme-provider';
import { SignupView as MediumSignupView } from '@/themes/medium/views/account/SignupView';
import { SignupView as MinimalSignupView } from '@/themes/minimal/views/account/SignupView';
import { SignupView as StorepalSignupView } from '@/themes/storepal/views/account/SignupView';

export default function CustomerSignupPage({ params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = use(params);
  const theme = useStoreTheme();

  if (theme === 'MINIMAL') return <MinimalSignupView subdomain={subdomain} />;
  if (theme === 'STOREPAL') return <StorepalSignupView subdomain={subdomain} />;
  return <MediumSignupView subdomain={subdomain} />;
}
