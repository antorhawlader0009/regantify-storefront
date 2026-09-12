'use client';

import { use } from 'react';
import { ForgotPasswordView } from '@/themes/storepal/views/account/ForgotPasswordView';

// New in this task, no Medium/Minimal equivalent yet — see
// account/coupons/page.tsx's own comment on why this isn't
// theme-branched.
export default function CustomerForgotPasswordPage({ params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = use(params);
  return <ForgotPasswordView subdomain={subdomain} />;
}
