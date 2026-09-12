import { StoreHeader } from './StoreHeader';
import { StoreFooter } from './StoreFooter';
import { AccountSidebar } from './AccountSidebar';

interface AccountLayoutProps {
  subdomain: string;
  storeName: string;
  categories?: string[];
  children: React.ReactNode;
}

/** Wraps every logged-in account page (Orders, Coupons, Change Address, Change Password) — matches the reference screenshots' shared sidebar layout.
 *
 * `categories` defaults to empty: account pages are client components
 * (they read cart/customer-auth state from localStorage) rendered from
 * a 'use client' route with only `subdomain` in scope — there's no
 * server-fetched category list available here the way the home/product
 * pages have (see storefrontApi.ts, which only runs server-side). The
 * category strip under the header simply doesn't render in that case
 * (StoreHeader already handles an empty list gracefully) — Medium's own
 * equivalent account pages don't show a category nav at all, so this is
 * no worse, just closer to the reference screenshots' full header when
 * a caller does have categories to pass. */
export function AccountLayout({ subdomain, storeName, categories = [], children }: AccountLayoutProps) {
  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <StoreHeader subdomain={subdomain} storeName={storeName} categories={categories} />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full flex flex-col sm:flex-row gap-8">
        <AccountSidebar subdomain={subdomain} />
        <div className="flex-1 min-w-0">{children}</div>
      </main>
      <StoreFooter subdomain={subdomain} storeName={storeName} />
    </div>
  );
}
