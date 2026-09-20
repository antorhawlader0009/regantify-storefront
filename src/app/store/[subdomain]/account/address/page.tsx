'use client';

import { use } from 'react';
import { ChangeAddressView } from '@/themes/storepal/views/account/ChangeAddressView';

// New in this task, no Medium/Minimal equivalent yet — see
// account/coupons/page.tsx's own comment on why this isn't
// theme-branched.
//no
export default function CustomerAddressPage({ params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = use(params);
  return <ChangeAddressView subdomain={subdomain} />;
}
