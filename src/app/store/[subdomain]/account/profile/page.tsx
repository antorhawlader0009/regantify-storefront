'use client';

import { use } from 'react';
import { useStoreTheme } from '@/providers/theme-provider';
import { ProfileView as MediumProfileView } from '@/themes/medium/views/account/ProfileView';
import { ProfileView as MinimalProfileView } from '@/themes/minimal/views/account/ProfileView';
import { ProfileView as StorepalProfileView } from '@/themes/storepal/views/account/ProfileView';

export default function CustomerProfilePage({ params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = use(params);
  const theme = useStoreTheme();

  if (theme === 'MINIMAL') return <MinimalProfileView subdomain={subdomain} />;
  if (theme === 'STOREPAL') return <StorepalProfileView subdomain={subdomain} />;
  return <MediumProfileView subdomain={subdomain} />;
}
