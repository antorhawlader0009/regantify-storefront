'use client';

import { use } from 'react';
import { ChangePasswordView } from '@/themes/storepal/views/account/ChangePasswordView';

// New in this task, no Medium/Minimal equivalent yet — see
// account/coupons/page.tsx's own comment on why this isn't
// theme-branched.
export default function CustomerChangePasswordPage({ params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = use(params);
  return <ChangePasswordView subdomain={subdomain} />;
}
