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
 * White header with a dominant search bar (the convention shoppers
 * expect from a real e-commerce site — startech.com.bd, daraz.com.bd)
 * and a solid dark category strip underneath. Client component because
 * it reads/writes URL search params interactively (via nuqs) and reads
 * live cart count — but it only ever navigates via the URL, so
 * filtering/rendering stays server-side in page.tsx.
 */
export function StoreHeader({ subdomain, storeName, categories }: StoreHeaderProps) {
  const [activeCategory, setActiveCategory] = useQueryState('category', { shallow: false });
  const [search, setSearch] = useQueryState('q', { defaultValue: '', shallow: false });
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const hydrated = useCartHydrated();
  const cartCount = useCartStore((s) =>
    s.lines.filter((l) => l.subdomain === subdomain).reduce((sum, l) => sum + l.quantity, 0),
  );
  const authHydrated = useCustomerAuthHydrated();
  const customer = useCustomerAuthStore((s) => s.customer);

  return (
    <header className="sticky top-0 z-20 bg-surface shadow-card">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-3 sm:gap-5 py-3.5">
          <Link href={`/store/${subdomain}`} className="shrink-0">
            <span className="font-display text-xl sm:text-2xl text-ink tracking-tight">{storeName}</span>
          </Link>

          <div className="hidden sm:flex flex-1 items-center relative max-w-xl">
            <Search className="absolute left-3.5 text-muted pointer-events-none" size={16} />
            <input
              type="text"
              defaultValue={search}
              onChange={(e) => setSearch(e.target.value || null)}
              placeholder="Search products, brands and categories"
              className="w-full pl-10 pr-4 py-2.5 rounded-md border border-line bg-canvas text-[13.5px] outline-none
                transition-[background-color,border-color,box-shadow] duration-150
                focus:border-accent focus:bg-surface focus:ring-2 focus:ring-accent/15"
            />
          </div>

          <div className="flex items-center gap-1 ml-auto shrink-0">
            <button
              onClick={() => setMobileSearchOpen((v) => !v)}
              className="sm:hidden p-2 text-ink rounded-md hover:bg-canvas transition-colors"
              aria-label="Search"
            >
              {mobileSearchOpen ? <X size={19} /> : <Search size={19} />}
            </button>

            <Link
              href={authHydrated && customer ? `/store/${subdomain}/account/orders` : `/store/${subdomain}/account/login`}
              className="flex items-center gap-2 px-3 py-2 text-ink hover:bg-canvas rounded-md transition-colors"
              aria-label="Account"
            >
              <User size={20} strokeWidth={1.75} />
              <span className="hidden md:inline text-[13px] font-medium">
                {authHydrated && customer ? customer.fullName.split(' ')[0] : 'Login'}
              </span>
            </Link>

            <Link
              href={`/store/${subdomain}/cart`}
              className="relative flex items-center gap-2 px-3 py-2 text-ink hover:bg-canvas rounded-md transition-colors"
              aria-label="Cart"
            >
              <ShoppingBag size={20} strokeWidth={1.75} />
              <span className="hidden md:inline text-[13px] font-medium">Cart</span>
              {hydrated && cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-white text-[10px] font-bold shadow-sm">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {mobileSearchOpen && (
          <div className="sm:hidden pb-3.5 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" size={15} />
            <input
              type="text"
              defaultValue={search}
              onChange={(e) => setSearch(e.target.value || null)}
              placeholder="Search products"
              autoFocus
              className="w-full pl-9 pr-3.5 py-2.5 rounded-md border border-line bg-canvas text-[13.5px] outline-none focus:border-accent focus:bg-surface focus:ring-2 focus:ring-accent/15"
            />
          </div>
        )}
      </div>

      {categories.length > 0 && (
        <div className="bg-ink">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-0.5 overflow-x-auto">
            <Menu size={14} className="text-white/45 shrink-0 mr-1.5" />
            <button
              onClick={() => setActiveCategory(null)}
              className={`relative px-3 py-2.5 text-[12.5px] font-medium whitespace-nowrap transition-colors ${
                activeCategory === null ? 'text-white' : 'text-white/70 hover:text-white'
              }`}
            >
              All Categories
              {activeCategory === null && <span className="absolute left-3 right-3 bottom-0 h-[2px] bg-accent rounded-full" />}
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`relative px-3 py-2.5 text-[12.5px] font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat ? 'text-white' : 'text-white/70 hover:text-white'
                }`}
              >
                {cat}
                {activeCategory === cat && <span className="absolute left-3 right-3 bottom-0 h-[2px] bg-accent rounded-full" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
