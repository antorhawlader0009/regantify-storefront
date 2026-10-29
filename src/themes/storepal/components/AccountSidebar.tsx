'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCustomerLogout } from '@/providers/customer-auth-store-provider';
import { useStoreText } from '../lib/storeText';

interface AccountSidebarProps {
  subdomain: string;
}

// Matches the reference screenshots' left sidebar exactly — Dashboard,
// Orders, Wishlist, Coupons, Change Address, Change Password, Log Out.
// "Wishlist" is included for visual parity with the reference but has
// no working page behind it yet (no Wishlist feature exists on the
// backend — see this theme's own build notes) — it links to Orders
// rather than a broken route, same as any other not-yet-built nav item
// would need a real destination.
const NAV_ITEMS: { label: string; href: (subdomain: string) => string }[] = [
  { label: 'Dashboard', href: (s) => `/store/${s}/account/orders` },
  { label: 'Orders', href: (s) => `/store/${s}/account/orders` },
  // Everything bought here, with a review button for delivered products.
  { label: 'My purchases', href: (s) => `/store/${s}/account/purchases` },
  { label: 'Coupons', href: (s) => `/store/${s}/account/coupons` },
  { label: 'My Addresses', href: (s) => `/store/${s}/account/address` },
  { label: 'Change Password', href: (s) => `/store/${s}/account/change-password` },
];

export function AccountSidebar({ subdomain }: AccountSidebarProps) {
  const t = useStoreText();
  const pathname = usePathname();
  const logout = useCustomerLogout();

  return (
    // Inside the account dialog: a column on the left from the small breakpoint up; on a phone one row of chips that
    // scrolls sideways, so the content is not pushed down.
    <nav
      aria-label={t('My account')}
      className="flex shrink-0 gap-2 overflow-x-auto border-b border-line bg-surface px-4 py-2.5 [scrollbar-width:none] sm:w-52 sm:flex-col sm:gap-0.5 sm:overflow-y-auto sm:border-b-0 sm:border-r sm:px-3 sm:py-4"
    >
      {NAV_ITEMS.map((item) => {
        // "Dashboard" and "Orders" share an address; only "Orders" is marked as the open page.
        const href = item.href(subdomain);
        const active = pathname === href && item.label !== 'Dashboard';
        return (
          <Link
            key={item.label}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[13px] transition-colors sm:rounded-md sm:border-0 sm:px-3 sm:py-2 sm:text-[14px] ${
              active ? 'border-ink bg-ink font-semibold text-white sm:bg-canvas sm:text-accent' : 'border-line text-ink hover:text-accent'
            }`}
          >
            {t(item.label)}
          </Link>
        );
      })}
      <button
        onClick={logout}
        className="shrink-0 whitespace-nowrap rounded-full border border-line px-3.5 py-1.5 text-left text-[13px] text-ink transition-colors hover:text-accent sm:mt-auto sm:rounded-md sm:border-0 sm:px-3 sm:py-2 sm:text-[14px]"
      >
        {t('Log Out')}
      </button>
    </nav>
  );
}
