'use client';

import { use } from 'react';
import { CouponsView } from '@/themes/storepal/views/account/CouponsView';

// "Your Coupons" — new in this task, no Medium/Minimal equivalent exists
// yet (see StorePal theme's own build notes), so this route isn't
// theme-branched the way every other account/* route is: it always
// renders StorePal's view regardless of which theme the store has
// selected, the same way a brand-new feature with only one theme's
// design to go on would.
export default function CustomerCouponsPage({ params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = use(params);
  return <CouponsView subdomain={subdomain} />;
}
