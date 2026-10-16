'use client';

import { use } from 'react';
import { ChangeAddressView } from '@/themes/storepal/views/account/ChangeAddressView';
import { storeSubdomain } from '@/lib/storeAddress';

// New in this task, no Medium/Minimal equivalent yet — see
// account/coupons/page.tsx's own comment on why this isn't
// theme-branched.
//no
export default function CustomerAddressPage({ params }: { params: Promise<{ subdomain: string }> }) {
  const subdomain = storeSubdomain(use(params).subdomain);
  return <ChangeAddressView subdomain={subdomain} />;
}
