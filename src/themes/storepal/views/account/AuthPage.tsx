'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCustomerAuthHydrated, useCustomerAuthStore } from '@/providers/customer-auth-store-provider';
import { StoreHeader } from '../../components/StoreHeader';
import { StoreFooter } from '../../components/StoreFooter';
import { useStoreDisplayName } from '../../lib/useStoreDisplayName';
import { useAuthDialog, type AuthDialogMode } from '../../lib/authDialog';

/**
 * The /account/login, /account/signup and /account/forgot-password addresses on
 * StorePal. There are no such pages any more, only the dialog (components/AuthDialog.tsx, mounted by
 * the header), so these routes, which links and bookmarks still point to,
 * open it over the store chrome. Signed in (already, or just now) goes to
 * My Orders; closing the dialog without signing in goes back to the store.
 */
export function AuthPage({ subdomain, mode }: { subdomain: string; mode: AuthDialogMode }) {
  const router = useRouter();
  const storeName = useStoreDisplayName(subdomain);
  const authHydrated = useCustomerAuthHydrated();
  const customer = useCustomerAuthStore((s) => s.customer);
  const open = useAuthDialog((s) => s.open);
  const openLogin = useAuthDialog((s) => s.openLogin);
  const openSignup = useAuthDialog((s) => s.openSignup);
  const openForgot = useAuthDialog((s) => s.openForgot);
  const closeDialog = useAuthDialog((s) => s.close);
  const wasOpen = useRef(false);

  // Signed in (already, or just now): close the dialog and go to My Orders. Otherwise open it.
  useEffect(() => {
    if (!authHydrated) return;
    if (customer) {
      closeDialog();
      router.replace(`/store/${subdomain}/account/orders`);
      return;
    }
    if (mode === 'signup') openSignup();
    else if (mode === 'forgot') openForgot();
    else openLogin();
  }, [authHydrated, customer, mode, openLogin, openSignup, openForgot, closeDialog, router, subdomain]);

  // Closed without signing in: back to the store.
  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      return;
    }
    if (wasOpen.current && !customer) {
      wasOpen.current = false;
      router.replace(`/store/${subdomain}`);
    }
  }, [open, customer, router, subdomain]);

  // Never leave the dialog open behind us when this page goes away.
  useEffect(() => closeDialog, [closeDialog]);

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <StoreHeader subdomain={subdomain} storeName={storeName} categories={[]} />
      <main className="flex-1" />
      <StoreFooter subdomain={subdomain} storeName={storeName} />
    </div>
  );
}
