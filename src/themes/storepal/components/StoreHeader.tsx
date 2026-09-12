'use client';

import { useEffect, useState } from 'react';
import { useQueryState } from 'nuqs';
import Link from 'next/link';
import Image from 'next/image';
import { Search, ShoppingBag, User, ChevronDown } from 'lucide-react';
import { useCartStore, useCartHydrated } from '@/providers/cart-store-provider';
import { useCustomerAuthStore, useCustomerAuthHydrated } from '@/providers/customer-auth-store-provider';
import { getStoreSocialLinks } from '@/lib/socialLinksApi';

interface StoreHeaderProps {
  subdomain: string;
  storeName: string;
  categories: string[];
  // Store > Logo — see Vendor.logoUrl. When set, replaces the plain-
  // text wordmark below with the vendor's uploaded image. Omit this
  // prop entirely (rather than passing null) on pages without their
  // own server-fetched StorefrontInfo (account/*, cart, checkout) —
  // the header then fetches it itself client-side, same prop-or-fetch
  // convention as StoreFooter's own logoUrl/socialLinks.
  logoUrl?: string | null;
}

// The reference site's top bar scrolls a repeating set of delivery
// promises left-to-right, forever — see storepal.com.bd's header. Built
// as a duplicated-content marquee (the content is rendered three times
// back to back, and the whole strip is animated left by exactly
// one-third of its width — see globals.css's .storepal-marquee
// keyframes) so the loop has no visible seam, a standard CSS-only
// marquee technique.
const ANNOUNCEMENTS = ['Cash On Delivery All Over Bangladesh', 'Guaranteed Pre-order Delivery in 20-25 Days'];

function AnnouncementBar() {
  const items = [...ANNOUNCEMENTS, ...ANNOUNCEMENTS, ...ANNOUNCEMENTS];
  return (
    <div className="bg-canvas overflow-hidden border-b border-line">
      <div className="storepal-marquee flex items-center gap-16 py-2.5 whitespace-nowrap">
        {items.map((text, i) => (
          <span key={i} className="text-[13px] font-semibold text-ink shrink-0">
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}

export function StoreHeader({ subdomain, storeName, categories, logoUrl: logoUrlProp }: StoreHeaderProps) {
  const [activeCategory, setActiveCategory] = useQueryState('category');
  const [search, setSearch] = useQueryState('q', { defaultValue: '' });
  const [searchDraft, setSearchDraft] = useState(search);
  const [fetchedLogoUrl, setFetchedLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (logoUrlProp !== undefined) return; // Caller already has it — no need to fetch.
    getStoreSocialLinks(subdomain).then((branding) => setFetchedLogoUrl(branding.logoUrl ?? null));
  }, [subdomain, logoUrlProp]);

  const logoUrl = logoUrlProp !== undefined ? logoUrlProp : fetchedLogoUrl;

  const hydrated = useCartHydrated();
  const cartCount = useCartStore((s) =>
    s.lines.filter((l) => l.subdomain === subdomain).reduce((sum, l) => sum + l.quantity, 0),
  );
  const authHydrated = useCustomerAuthHydrated();
  const customer = useCustomerAuthStore((s) => s.customer);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchDraft.trim() || null);
  };

  // The category nav is a flat list on the reference site except a
  // couple of entries that open a dropdown of subcategories on hover.
  // Without a real subcategory hierarchy exposed by this storefront API
  // yet (Category.parentId exists on the backend, but getStoreProducts
  // only ever returns a flat distinct-category-name list — see
  // StorefrontService), the first two categories get the visual
  // "with dropdown" chevron purely for fidelity; clicking one still
  // just filters by that one category name, same as any other.
  const visibleCategories = categories.slice(0, 9);

  return (
    <header className="sticky top-0 z-20 bg-surface">
      <AnnouncementBar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
        <Link href={`/store/${subdomain}`} className="shrink-0">
          {logoUrl ? (
            <span className="relative block h-9 w-32">
              <Image src={logoUrl} alt={storeName} fill sizes="128px" className="object-contain object-left" />
            </span>
          ) : (
            <span className="font-display font-extrabold text-2xl text-ink tracking-tight">{storeName}</span>
          )}
        </Link>

        <form onSubmit={handleSearchSubmit} className="hidden sm:flex flex-1 max-w-2xl">
          <div className="flex w-full rounded-lg overflow-hidden border border-line-strong">
            <input
              type="text"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              placeholder="Search Your Product By Product Name, Code…"
              className="flex-1 px-4 py-2.5 text-[13.5px] text-ink bg-surface outline-none"
            />
            <button
              type="submit"
              className="px-4 bg-ink text-white flex items-center justify-center hover:bg-ink/90 transition-colors"
              aria-label="Search"
            >
              <Search size={17} />
            </button>
          </div>
        </form>

        <div className="flex items-center gap-4 ml-auto shrink-0">
          <Link
            href={authHydrated && customer ? `/store/${subdomain}/account/orders` : `/store/${subdomain}/account/login`}
            className="text-ink hover:text-accent transition-colors"
            aria-label="Account"
          >
            <User size={21} strokeWidth={1.75} />
          </Link>

          <Link href={`/store/${subdomain}/cart`} className="relative text-ink hover:text-accent transition-colors" aria-label="Cart">
            <ShoppingBag size={21} strokeWidth={1.75} />
            {hydrated && cartCount > 0 && (
              <span className="absolute -top-2 -right-2 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-ink text-white text-[10px] font-bold">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      <form onSubmit={handleSearchSubmit} className="sm:hidden px-4 pb-3">
        <div className="flex w-full rounded-lg overflow-hidden border border-line-strong">
          <input
            type="text"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder="Search products"
            className="flex-1 px-3.5 py-2.5 text-[13px] text-ink bg-surface outline-none"
          />
          <button type="submit" className="px-3.5 bg-ink text-white flex items-center justify-center" aria-label="Search">
            <Search size={16} />
          </button>
        </div>
      </form>

      {categories.length > 0 && (
        <div className="border-t border-line">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-6 overflow-x-auto py-3">
            <button
              onClick={() => setActiveCategory(null)}
              className={`text-[13px] font-medium whitespace-nowrap transition-colors ${
                activeCategory === null ? 'text-accent' : 'text-muted hover:text-ink'
              }`}
            >
              50% OFF
            </button>
            {visibleCategories.map((cat, i) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex items-center gap-1 text-[13px] font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat ? 'text-accent' : 'text-ink hover:text-accent'
                }`}
              >
                {cat}
                {i < 2 && <ChevronDown size={13} strokeWidth={2.5} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
