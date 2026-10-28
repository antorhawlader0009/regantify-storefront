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
    <nav className="flex flex-col gap-1 w-full sm:w-48 shrink-0">
      {NAV_ITEMS.map((item) => {
        const href = item.href(subdomain);
        const active = pathname === href;
        return (
          <Link
            key={item.label}
            href={href}
            className={`px-1 py-2 text-[14px] transition-colors ${
              active ? 'text-accent font-semibold' : 'text-ink hover:text-accent'
            }`}
          >
            {t(item.label)}
          </Link>
        );
      })}
      <button onClick={logout} className="px-1 py-2 text-[14px] text-ink hover:text-accent transition-colors text-left">
        {t('Log Out')}
      </button>
    </nav>
  );
}
