'use client';

import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { LogoutConfirm } from './LogoutConfirm';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, KeyRound, LogIn, LogOut, MapPin, Package, ShoppingBag, Ticket, UserRound, type LucideIcon } from 'lucide-react';
import { useCustomerAuthHydrated, useCustomerAuthStore, useCustomerLogout } from '@/providers/customer-auth-store-provider';
import { useStoreText } from '../lib/storeText';
import { useWishlist } from '../lib/wishlist';

/** Where the phone chip row was scrolled to, kept for the tab so the next account page starts there. */
const CHIP_SCROLL_KEY = 'storepal-account-chips';

interface AccountSidebarProps {
  subdomain: string;
}

interface NavItem {
  label: string;
  path: string;
  Icon: LucideIcon;
}

// The account dialog's menu in two groups (redesign 2026-10-29): what the shopper bought or saved, then their own details.
const GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Shopping',
    items: [
      { label: 'Orders', path: 'account/orders', Icon: Package },
      // Everything bought here, with a review button for delivered products.
      { label: 'My purchases', path: 'account/purchases', Icon: ShoppingBag },
      // The saved products (the header's heart opens this too).
      { label: 'Wishlist', path: 'account/wishlist', Icon: Heart },
      { label: 'Coupons', path: 'account/coupons', Icon: Ticket },
    ],
  },
  {
    title: 'Account settings',
    items: [
      { label: 'Profile', path: 'account/profile', Icon: UserRound },
      { label: 'My Addresses', path: 'account/address', Icon: MapPin },
      { label: 'Change Password', path: 'account/change-password', Icon: KeyRound },
    ],
  },
];

/** The first letter of the name for the round avatar (any script). */
function initialOf(name: string | undefined): string {
  const first = name?.trim()?.[0];
  return first ? first.toUpperCase() : '';
}

export function AccountSidebar({ subdomain }: AccountSidebarProps) {
  const t = useStoreText();
  const pathname = usePathname() ?? '';
  const logout = useCustomerLogout();
  // "Log out?" is asked first (LogoutConfirm).
  const [askLogout, setAskLogout] = useState(false);
  const cancelLogout = useCallback(() => setAskLogout(false), []);
  const hydrated = useCustomerAuthHydrated();
  const customer = useCustomerAuthStore((s) => s.customer);
  const { slugs } = useWishlist(subdomain);
  const signedIn = hydrated && !!customer;

  // Phones: the chip row starts where it was on the last account page (each page draws the dialog again), then the open
  // section's chip slides into the middle, so a chip that was off to the side comes into view.
  const rowRef = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    try {
      row.scrollLeft = Number(sessionStorage.getItem(CHIP_SCROLL_KEY) ?? 0) || 0;
    } catch {
      // Storage blocked: start at the beginning.
    }
    const chip = row.querySelector<HTMLElement>('[aria-current="page"]');
    if (!chip) return;
    // Measured against the row itself (offsetLeft would count from the nearest positioned parent instead).
    const target = row.scrollLeft + (chip.getBoundingClientRect().left - row.getBoundingClientRect().left) - (row.clientWidth - chip.offsetWidth) / 2;
    const frame = requestAnimationFrame(() => row.scrollTo({ left: Math.max(0, target), behavior: 'smooth' }));
    return () => cancelAnimationFrame(frame);
  }, [pathname]);
  const rememberRow = () => {
    try {
      if (rowRef.current) sessionStorage.setItem(CHIP_SCROLL_KEY, String(rowRef.current.scrollLeft));
    } catch {
      // Storage blocked: nothing to remember.
    }
  };

  const itemLink = (item: NavItem, phone: boolean) => {
    const href = `/store/${subdomain}/${item.path}`;
    const active = pathname === href || pathname.endsWith(`/${item.path}`);
    const count = item.path === 'account/wishlist' && hydrated && slugs.length > 0 ? slugs.length : null;
    if (phone) {
      return (
        <Link
          key={item.path}
          href={href}
          aria-current={active ? 'page' : undefined}
          className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-[13px] transition-colors ${
            active ? 'border-accent bg-accent text-white font-semibold' : 'border-line bg-surface text-ink hover:border-accent hover:text-accent'
          }`}
        >
          <item.Icon size={15} strokeWidth={2} aria-hidden />
          {t(item.label)}
          {count !== null && (
            <span className={`rounded-full px-1.5 text-[11px] font-semibold ${active ? 'bg-white/25 text-white' : 'bg-canvas text-muted'}`}>{count}</span>
          )}
        </Link>
      );
    }
    return (
      <Link
        key={item.path}
        href={href}
        aria-current={active ? 'page' : undefined}
        className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] transition-colors ${
          active ? 'bg-accent/10 font-semibold text-accent' : 'text-ink hover:bg-canvas hover:text-accent'
        }`}
      >
        {active && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-accent" aria-hidden />}
        <item.Icon size={18} strokeWidth={active ? 2.25 : 1.9} className={active ? 'text-accent' : 'text-muted group-hover:text-accent'} aria-hidden />
        <span className="flex-1 truncate">{t(item.label)}</span>
        {count !== null && (
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${active ? 'bg-accent text-white' : 'bg-canvas text-muted'}`}>{count}</span>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Phones: one row of icon chips that scrolls sideways, so the content is not pushed down. */}
      <nav
        ref={rowRef}
        onScroll={rememberRow}
        aria-label={t('My account')}
        className="flex shrink-0 gap-2 overflow-x-auto border-b border-line bg-surface px-4 py-2.5 [scrollbar-width:none] sm:hidden"
      >
        {/* Log Out is in the dialog's header on phones (AccountLayout), not in this row. */}
        {GROUPS.flatMap((g) => g.items).map((item) => itemLink(item, true))}
      </nav>

      {/* Larger screens: a column with the shopper's card on top, the two groups, and Log Out at the bottom. */}
      <nav
        aria-label={t('My account')}
        className="hidden w-60 shrink-0 flex-col overflow-y-auto border-r border-line bg-surface sm:flex"
      >
        <div className="border-b border-line p-4">
          {signedIn ? (
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-[17px] font-bold text-white">
                {initialOf(customer?.fullName) || <UserRound size={20} aria-hidden />}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[14.5px] font-semibold text-ink">{customer?.fullName}</span>
                {(customer?.phone || customer?.email) && (
                  <span className="block truncate text-[12.5px] text-muted">{customer?.phone || customer?.email}</span>
                )}
              </span>
            </div>
          ) : (
            <div>
              <p className="m-0 mb-3 text-[13px] leading-snug text-muted">{t('Log in to see your orders, addresses and more.')}</p>
              <Link
                href={`/store/${subdomain}/account/login`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-3 py-2 text-[13px] font-semibold text-white hover:opacity-90"
              >
                <LogIn size={15} aria-hidden />
                {t('Sign in')}
              </Link>
            </div>
          )}
        </div>

        <div className="flex-1 px-2.5 py-3">
          {GROUPS.map((group, i) => (
            <div key={group.title} className={i > 0 ? 'mt-4' : ''}>
              <p className="m-0 mb-1 px-3 text-[11px] font-semibold uppercase tracking-wide text-muted">{t(group.title)}</p>
              <div className="flex flex-col gap-0.5">{group.items.map((item) => itemLink(item, false))}</div>
            </div>
          ))}
        </div>

        {signedIn && (
          <div className="border-t border-line p-2.5">
            <button
              type="button"
              onClick={() => setAskLogout(true)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[14px] text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut size={18} strokeWidth={1.9} aria-hidden />
              {t('Log Out')}
            </button>
          </div>
        )}
      </nav>
      <LogoutConfirm
        open={askLogout}
        onCancel={cancelLogout}
        onConfirm={() => {
          setAskLogout(false);
          logout();
        }}
      />
    </>
  );
}
