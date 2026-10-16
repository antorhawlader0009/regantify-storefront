'use client';

import { use } from 'react';
import { useStoreTheme } from '@/providers/theme-provider';
import { ForgotPasswordView } from '@/themes/storepal/views/account/ForgotPasswordView';
import { AuthPage } from '@/themes/storepal/views/account/AuthPage';
import { storeSubdomain } from '@/lib/storeAddress';

// Shared by every theme (no Medium/Minimal equivalent), so only StorePal is
// switched over to its dialog; the other themes keep the page they had.
export default function CustomerForgotPasswordPage({ params }: { params: Promise<{ subdomain: string }> }) {
  const subdomain = storeSubdomain(use(params).subdomain);
  const theme = useStoreTheme();
  if (theme === 'STOREPAL') return <AuthPage subdomain={subdomain} mode="forgot" />;
  return <ForgotPasswordView subdomain={subdomain} />;
}
