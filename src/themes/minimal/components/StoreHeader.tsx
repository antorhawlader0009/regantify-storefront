'use client';

import { useState } from 'react';
import { useQueryState } from 'nuqs';
import Link from 'next/link';
import { Search, ShoppingBag, Menu, X, User } from 'lucide-react';
import { useCartStore, useCartHydrated } from '@/providers/cart-store-provider';
import { useCustomerAuthStore, useCustomerAuthHydrated } from '@/providers/customer-auth-store-provider';

interface StoreHeaderProps {
  subdomain: string;
  storeName: string;
  categories: string[];
}

/**
 * Minimal's header is the opposite of Medium's: no dominant search bar,
 * no dark category strip underneath — just the store name set large in
 * the display serif, a quiet row of category links, and small icon-only
 * actions. Search is tucked behind a toggle rather than always-open,
 * since a boutique storefront doesn't need to compete for attention the
 * way a dense marketplace header does. Same client-side URL-param
 * filtering as Medium (via nuqs) — only the presentation differs.
 */
export function StoreHeader({ subdomain, storeName, categories }: StoreHeaderProps) {
  const [activeCategory, setActiveCategory] = useQueryState('category');
  const [search, setSearch] = useQueryState('q', { defaultValue: '' });
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const hydrated = useCartHydrated();
  const cartCount = useCartStore((s) =>
    s.lines.filter((l) => l.subdomain === subdomain).reduce((sum, l) => sum + l.quantity, 0),
  );
  const authHydrated = useCustomerAuthHydrated();
  const customer = useCustomerAuthStore((s) => s.customer);

  return (
    <header className="sticky top-0 z-20 bg-surface/95 backdrop-blur-sm border-b border-line">
      <div className="max-w-5xl mx-auto px-5 sm:px-8">
        <div className="flex items-center justify-between py-5 sm:py-7">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="sm:hidden p-1.5 -ml-1.5 text-ink"
            aria-label="Menu"
          >
            {menuOpen ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
          </button>

          <Link href={`/store/${subdomain}`} className="sm:mx-0 mx-auto">
            <span className="font-display text-[22px] sm:text-[26px] text-ink tracking-tight italic">{storeName}</span>
          </Link>

          <div className="flex items-center gap-4 sm:gap-6">
            <button
              onClick={() => setSearchOpen((v) => !v)}
              className="text-ink hover:text-accent transition-colors"
              aria-label="Search"
            >
              {searchOpen ? <X size={19} strokeWidth={1.5} /> : <Search size={19} strokeWidth={1.5} />}
            </button>

            <Link
              href={authHydrated && customer ? `/store/${subdomain}/account/orders` : `/store/${subdomain}/account/login`}
              className="hidden sm:flex items-center gap-1.5 text-ink hover:text-accent transition-colors"
              aria-label="Account"
            >
              <User size={19} strokeWidth={1.5} />
              <span className="text-[12.5px] tracking-wide">
                {authHydrated && customer ? customer.fullName.split(' ')[0] : 'Account'}
              </span>
            </Link>

            <Link
              href={`/store/${subdomain}/cart`}
              className="relative text-ink hover:text-accent transition-colors"
              aria-label="Cart"
            >
              <ShoppingBag size={19} strokeWidth={1.5} />
              {hydrated && cartCount > 0 && (
                <span className="absolute -top-2 -right-2 flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full bg-ink text-white text-[9.5px] font-medium">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {searchOpen && (
          <div className="pb-5 relative border-t border-line pt-4">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 mt-2 text-muted pointer-events-none" size={15} strokeWidth={1.5} />
            <input
              type="text"
              defaultValue={search}
              onChange={(e) => setSearch(e.target.value || null)}
              placeholder="Search the store"
              autoFocus
              className="w-full pl-6 pr-2 py-2 bg-transparent border-b border-line text-[14px] outline-none
                transition-colors focus:border-ink placeholder:text-muted"
            />
          </div>
        )}

        {categories.length > 0 && (
          <nav className={`${menuOpen ? 'flex' : 'hidden'} sm:flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-7 pb-5 sm:pb-4 overflow-x-auto`}>
            <button
              onClick={() => {
                setActiveCategory(null);
                setMenuOpen(false);
              }}
              className={`text-left sm:text-center px-0 py-1.5 sm:py-0 text-[12.5px] tracking-[0.02em] whitespace-nowrap transition-colors ${
                activeCategory === null ? 'text-ink font-medium' : 'text-muted hover:text-ink'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setMenuOpen(false);
                }}
                className={`text-left sm:text-center px-0 py-1.5 sm:py-0 text-[12.5px] tracking-[0.02em] whitespace-nowrap transition-colors ${
                  activeCategory === cat ? 'text-ink font-medium' : 'text-muted hover:text-ink'
                }`}
              >
                {cat}
              </button>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
