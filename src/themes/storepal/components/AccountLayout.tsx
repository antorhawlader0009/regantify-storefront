'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { LogoutConfirm } from './LogoutConfirm';
import { useRouter } from 'next/navigation';
import { LogOut, X } from 'lucide-react';
import { StoreHeader } from './StoreHeader';
import { AccountSidebar } from './AccountSidebar';
import { GoogleConnectBadge } from './GoogleConnectBadge';
import { AccountBackdrop } from './AccountBackdrop';
import { CoverFloating } from '@/lib/floatingCover';
import { useStoreText } from '../lib/storeText';
import { closeAccountDialog } from '../lib/accountReturn';
import { useCustomerAuthHydrated, useCustomerAuthStore, useCustomerLogout } from '@/providers/customer-auth-store-provider';

interface AccountLayoutProps {
  subdomain: string;
  storeName: string;
  categories?: string[];
  children: React.ReactNode;
}

/**
 * Every logged-in account page (Orders, My purchases, Wishlist, Coupons, My Addresses, Change Password) opens as a dialog over the
 * store (2026-10-29, the owner's request): a large centred box on a computer, the whole screen on a phone, with the
 * title and a × at the top. × (or Esc) returns to the store page the shopper came from (lib/accountReturn.ts), else the
 * store's home. Each section is still its own address, so links, the back button and a refresh keep working; the menu
 * moves between them inside the dialog. The store header and the shop's products stay behind the dimmed backdrop so it still reads as the store.
 *
 * `categories` defaults to empty: account pages are client components rendered from a 'use client' route with only
 * `subdomain` in scope, so there is no server-fetched category list here (StoreHeader handles an empty list).
 */
export function AccountLayout({ subdomain, storeName, categories = [], children }: AccountLayoutProps) {
  const t = useStoreText();
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);
  // "Hi, Rahim" under the title once the shopper is known (signed in, after the stored session is read).
  const hydrated = useCustomerAuthHydrated();
  const customerName = useCustomerAuthStore((s) => s.customer?.fullName);
  const firstName = hydrated ? customerName?.trim().split(/\s+/)[0] : undefined;
  const signedIn = hydrated && !!customerName;
  const logout = useCustomerLogout();
  // "Log out?" is asked first (LogoutConfirm).
  const [askLogout, setAskLogout] = useState(false);
  const cancelLogout = useCallback(() => setAskLogout(false), []);
  const close = useCallback(() => closeAccountDialog(router, subdomain), [router, subdomain]);

  // Esc closes; the page behind doesn't scroll while the dialog is open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [close]);

  // Focus starts on the dialog itself, so keyboard and screen-reader users land inside it (without a focus ring on ×).
  useEffect(() => {
    dialogRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <StoreHeader subdomain={subdomain} storeName={storeName} categories={categories} />
      <CoverFloating />
      {/* The shop's products stay visible behind the dimmed backdrop; only the floating chat buttons are hidden (CoverFloating). */}
      <AccountBackdrop subdomain={subdomain} storeName={storeName} />
      <LogoutConfirm
        open={askLogout}
        onCancel={cancelLogout}
        onConfirm={() => {
          setAskLogout(false);
          logout();
        }}
      />
      <div className="fixed inset-0 z-50 flex items-stretch justify-center sm:items-center sm:p-6">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={close} aria-hidden />
        <div
          ref={dialogRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby="account-dialog-title"
          className="relative flex h-full w-full flex-col overflow-hidden bg-canvas shadow-[0_24px_80px_-12px_rgba(16,24,40,0.45)] outline-none sm:h-[min(88vh,820px)] sm:max-w-5xl sm:rounded-2xl"
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3 sm:px-6 sm:py-4">
            <div className="min-w-0">
              <h1 id="account-dialog-title" className="m-0 text-[17px] font-bold text-ink">
                {t('My account')}
              </h1>
              {firstName && <p className="m-0 truncate text-[12.5px] text-muted">{t('Hi, {name}').replace('{name}', firstName)}</p>}
            </div>
            {/* Phones: Log Out sits here (the side menu, with its own Log Out, is a chip row there). Then "Connect Google" for a
                phone account, "Google connected" once attached. */}
            <div className="ml-auto flex min-w-0 items-center gap-2">
              {signedIn && (
                <button
                  type="button"
                  onClick={() => setAskLogout(true)}
                  className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-line px-3 text-[12.5px] font-semibold text-red-600 transition-colors hover:border-red-300 hover:bg-red-50 sm:hidden"
                >
                  <LogOut size={15} strokeWidth={2} aria-hidden />
                  {t('Log Out')}
                </button>
              )}
              <GoogleConnectBadge />
            </div>
            <button
              type="button"
              onClick={close}
              aria-label={t('Close')}
              className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-canvas focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              <X size={22} strokeWidth={2.25} />
            </button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
            <AccountSidebar subdomain={subdomain} />
            <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-8 sm:py-7">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
