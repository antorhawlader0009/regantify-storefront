'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQueryState } from 'nuqs';
import Link from 'next/link';
import Image from 'next/image';
import { Search, ShoppingBag, User, ChevronDown } from 'lucide-react';
import { useCartStore, useCartHydrated } from '@/providers/cart-store-provider';
import { useCustomerAuthStore, useCustomerAuthHydrated } from '@/providers/customer-auth-store-provider';
import { getStoreSocialLinks } from '@/lib/socialLinksApi';
import type { StorefrontCategoryDetail } from '@/lib/storefrontApi';

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
  // Real subcategories per category name (Category.parentId, PUBLIC
  // only — see StorefrontService.getStoreProducts). Optional because
  // several pages that render this header (account/*, checkout) never
  // fetch categoryDetails at all — those simply get a chevron-only nav
  // with no dropdown, same as before this prop existed.
  categoryDetails?: StorefrontCategoryDetail[];
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

export function StoreHeader({
  subdomain,
  storeName,
  categories,
  logoUrl: logoUrlProp,
  categoryDetails = [],
}: StoreHeaderProps) {
  const [activeCategory, setActiveCategory] = useQueryState('category', { shallow: false });
  const [search, setSearch] = useQueryState('q', { defaultValue: '', shallow: false });
  const [searchDraft, setSearchDraft] = useState(search);
  const [fetchedLogoUrl, setFetchedLogoUrl] = useState<string | null>(null);
  // Which category's dropdown is currently open on hover — null when
  // none. Only categories with at least one PUBLIC subcategory (see
  // categoryDetails below) ever open one.
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  // Screen position of the currently-open category's own button, so the
  // dropdown panel below can render via a portal at `position: fixed`
  // instead of nested inside the category strip. The strip scrolls
  // horizontally (overflow-x-auto, for narrow screens) which clips any
  // normal absolutely-positioned child to its own box — an
  // `overflow-x-auto` element also clips the y-axis per the CSS spec, so
  // a plain `absolute` dropdown here gets cut off / rendered behind
  // whatever comes next in the page (e.g. the hero banner) instead of
  // floating above it.
  const [menuRect, setMenuRect] = useState<{ left: number; top: number } | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openDropdown = (name: string, target: HTMLElement) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    const rect = target.getBoundingClientRect();
    setMenuRect({ left: rect.left, top: rect.bottom });
    setOpenCategory(name);
  };
  // Small delay before closing so moving the mouse from the category
  // label down into the dropdown panel doesn't close it in transit.
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenCategory(null), 150);
  };
  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

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

  // The category nav is a flat list on the reference site except
  // entries that have real subcategories (Category.parentId, see
  // StorefrontService.getStoreProducts), which open a dropdown of those
  // subcategories on hover. Only categories with at least one child get
  // the chevron; the parent label itself still filters by its own name
  // when clicked, same as any other category.
  const visibleCategories = categories.slice(0, 9);
  const childrenByCategory = new Map(categoryDetails.map((c) => [c.name, c.children ?? []]));

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
            {visibleCategories.map((cat) => {
              const children = childrenByCategory.get(cat) ?? [];
              const hasDropdown = children.length > 0;
              return (
                <div
                  key={cat}
                  className="relative"
                  onMouseEnter={hasDropdown ? (e) => openDropdown(cat, e.currentTarget) : undefined}
                  onMouseLeave={hasDropdown ? scheduleClose : undefined}
                >
                  <button
                    onClick={() => setActiveCategory(cat)}
                    className={`flex items-center gap-1 text-[13px] font-medium whitespace-nowrap transition-colors ${
                      activeCategory === cat ? 'text-accent' : 'text-ink hover:text-accent'
                    }`}
                    aria-expanded={hasDropdown ? openCategory === cat : undefined}
                    aria-haspopup={hasDropdown ? 'menu' : undefined}
                  >
                    {cat}
                    {hasDropdown && <ChevronDown size={13} strokeWidth={2.5} />}
                  </button>

                  {hasDropdown &&
                    openCategory === cat &&
                    menuRect &&
                    createPortal(
                      <div
                        role="menu"
                        onMouseEnter={() => {
                          if (closeTimer.current) clearTimeout(closeTimer.current);
                        }}
                        onMouseLeave={scheduleClose}
                        style={{ left: menuRect.left, top: menuRect.top }}
                        className="fixed z-50 min-w-[200px] rounded-lg border border-line bg-surface py-1.5 shadow-lg"
                      >
                        {children.map((child) => (
                          <button
                            key={child.name}
                            role="menuitem"
                            onClick={() => {
                              setActiveCategory(child.name);
                              setOpenCategory(null);
                            }}
                            className={`block w-full whitespace-nowrap px-4 py-2 text-left text-[13px] font-medium transition-colors ${
                              activeCategory === child.name ? 'text-accent' : 'text-ink hover:bg-canvas hover:text-accent'
                            }`}
                          >
                            {child.name}
                          </button>
                        ))}
                      </div>,
                      document.body,
                    )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
