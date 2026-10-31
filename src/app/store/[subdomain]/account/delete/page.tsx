'use client';

import { use } from 'react';
import { DeleteAccountView } from '@/themes/storepal/views/account/DeleteAccountView';
import { storeSubdomain } from '@/lib/storeAddress';

// Delete my account (Google Play's account deletion rule): StorePal's account dialog, like the other account pages, so it is not
// theme-branched. This address is also the web link given to the store listing.
export default function CustomerDeleteAccountPage({ params }: { params: Promise<{ subdomain: string }> }) {
  const subdomain = storeSubdomain(use(params).subdomain);
  return <DeleteAccountView subdomain={subdomain} />;
}
