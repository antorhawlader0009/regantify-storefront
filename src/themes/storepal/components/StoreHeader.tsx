'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQueryState } from 'nuqs';
import Link from 'next/link';
import Image from 'next/image';
import { Search, ShoppingBag, User, ChevronDown, X, Menu, Heart } from 'lucide-react';
import { useCartStore, useCartHydrated } from '@/providers/cart-store-provider';
import { useCustomerAuthStore, useCustomerAuthHydrated } from '@/providers/customer-auth-store-provider';
import { getStoreSocialLinks, type SocialLinks } from '@/lib/socialLinksApi';
import { getStoreSearchIndex, type StoreSearchProduct } from '../lib/storeNavApi';
import { formatPrice } from '../lib/formatPrice';
import { WhatsAppBubble } from './WhatsAppBubble';
import { AiAssistantWidget } from './AiAssistantWidget';
import type { StorefrontCategoryDetail, StorefrontMenuItem } from '@/lib/storefrontApi';
import { isExternalHref, menuItemHref, useStorePalDesign } from '../lib/designSettings';
import { useWishlist } from '../lib/wishlist';

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
  // Store > Social — only ever read here for whatsappUrl (see
  // WhatsAppBubble below); everywhere else that needs the full set
  // (StoreFooter's icon row) still gets it as its own prop. Same
  // prop-or-fetch convention as logoUrl: omit entirely on pages with no
  // server-fetched copy already in scope and this component fetches it
  // itself client-side.
  socialLinks?: SocialLinks;
  // Real subcategories per category name (Category.parentId, PUBLIC
  // only — see StorefrontService.getStoreProducts). Optional because
  // several pages that render this header (account/*, checkout) never
  // fetch categoryDetails at all — those simply get a chevron-only nav
  // with no dropdown, same as before this prop existed.
  categoryDetails?: StorefrontCategoryDetail[];
}

// Store > Design > Site Banner. With nothing saved it's the reference
// site's top bar: a repeating set of delivery promises scrolling
// left-to-right, forever — see storepal.com.bd's header. Built
// as a duplicated-content marquee (the content is rendered three times
// back to back, and the whole strip is animated left by exactly
// one-third of its width — see globals.css's .storepal-marquee
// keyframes) so the loop has no visible seam, a standard CSS-only
// marquee technique.
const ANNOUNCEMENTS = ['Cash On Delivery All Over Bangladesh', 'Guaranteed Pre-order Delivery in 20-25 Days'];

// The vendor's banner is their own RichTextEditor HTML, same trust
// level as Store > Footer's aboutBlurb. "Delete" on the dashboard hides
// the strip entirely.
function SiteBanner() {
  const design = useStorePalDesign();
  if (!design.bannerEnabled) return null;
  const marquee = design.bannerStyle === 'MARQUEE';
  const html = design.bannerContent;
  // TipTap saves runs of spaces as plain spaces (its editor shows them via
  // white-space: pre-wrap), so the banner must preserve whitespace too or
  // the vendor's spacing collapses to one space. `pre` keeps the marquee
  // on one line; the static strip can still wrap.
  const items: { key: string; node: React.ReactNode }[] = html
    ? [
        {
          key: 'vendor',
          node: (
            <span
              className={`${marquee ? 'whitespace-pre' : 'whitespace-pre-wrap'} [&_p]:m-0 [&_p]:inline [&_p+p]:ml-16`}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ),
        },
      ]
    : ANNOUNCEMENTS.map((text) => ({ key: text, node: text }));
  const repeated = marquee ? [0, 1, 2].flatMap((copy) => items.map((item) => ({ ...item, key: `${copy}-${item.key}` }))) : items;
  return (
    <div
      className="bg-canvas overflow-hidden border-b border-line"
      style={design.bannerBackgroundColor ? { backgroundColor: design.bannerBackgroundColor } : undefined}
    >
      <div
        className={
          marquee
            ? 'storepal-marquee flex items-center gap-16 py-2.5 whitespace-nowrap'
            : 'max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-center gap-x-10 gap-y-1 text-center'
        }
      >
        {repeated.map((item) => (
          <span key={item.key} className="text-[13px] font-semibold text-ink shrink-0">
            {item.node}
          </span>
        ))}
      </div>
    </div>
  );
}

/** One Store > Design menu link (header left/right, site menu, mobile menu). */
function MenuLink({
  item,
  subdomain,
  loggedIn,
  className,
  onClick,
}: {
  item: StorefrontMenuItem;
  subdomain: string;
  loggedIn: boolean;
  className: string;
  onClick?: () => void;
}) {
  const href = menuItemHref(item, subdomain, loggedIn);
  if (!href) return null;
  if (isExternalHref(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className} onClick={onClick}>
        {item.label}
      </a>
    );
  }
  return (
    <Link href={href} className={className} onClick={onClick}>
      {item.label}
    </Link>
  );
}

export function StoreHeader({
  subdomain,
  storeName,
  categories,
  logoUrl: logoUrlProp,
  socialLinks: socialLinksProp,
  categoryDetails = [],
}: StoreHeaderProps) {
  const [activeCategory, setActiveCategory] = useQueryState('category', { shallow: false });
  const [search, setSearch] = useQueryState('q', { defaultValue: '', shallow: false });
  const [searchDraft, setSearchDraft] = useState(search);
  const [fetchedLogoUrl, setFetchedLogoUrl] = useState<string | null>(null);
  const [fetchedSocialLinks, setFetchedSocialLinks] = useState<SocialLinks>({});
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
    // Skip the fetch entirely if the caller already gave us everything —
    // most pages pass at least one of these (see each prop's own doc
    // comment on why), and a fetch that would only fill in an already-
    // covered field is wasted work.
    if (logoUrlProp !== undefined && socialLinksProp !== undefined) return;
    getStoreSocialLinks(subdomain).then((branding) => {
      if (logoUrlProp === undefined) setFetchedLogoUrl(branding.logoUrl ?? null);
      if (socialLinksProp === undefined) setFetchedSocialLinks(branding);
    });
  }, [subdomain, logoUrlProp, socialLinksProp]);

  const logoUrl = logoUrlProp !== undefined ? logoUrlProp : fetchedLogoUrl;
  const socialLinks = socialLinksProp !== undefined ? socialLinksProp : fetchedSocialLinks;

  const hydrated = useCartHydrated();
  const cartCount = useCartStore((s) =>
    s.lines.filter((l) => l.subdomain === subdomain).reduce((sum, l) => sum + l.quantity, 0),
  );
  const authHydrated = useCustomerAuthHydrated();
  const customer = useCustomerAuthStore((s) => s.customer);
  const loggedIn = authHydrated && !!customer;

  // Store > Design > Header Editor / Layout Settings menus, and the
  // wishlist from Product Card Display Options.
  const design = useStorePalDesign();
  const wishlist = useWishlist(subdomain);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const hasTopMenu = design.headerLeftMenu.length > 0 || design.headerRightMenu.length > 0;
  const hasSiteMenu = design.siteMenu.length > 0;
  const hasMobileMenu = design.mobileMenu.length > 0;

  // Live "type to see matches" dropdown (reference site: typing "shoe"
  // shows matching Categories + a handful of products with thumb/price
  // before you've even hit Enter — Enter still lands on the full
  // "Results for ..." grid, unchanged, via the existing q query param).
  // The product list itself isn't in scope here (StoreHeader renders on
  // pages — cart, checkout, account — that never fetch the catalog), so
  // it's fetched client-side once, lazily, the same way logoUrl above
  // falls back to a client fetch when no prop is passed.
  const [searchIndex, setSearchIndex] = useState<StoreSearchProduct[] | null>(null);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const mobileSearchBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchIndex !== null) return;
    getStoreSearchIndex(subdomain).then(setSearchIndex);
  }, [subdomain, searchIndex]);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (searchBoxRef.current?.contains(target)) return;
      if (mobileSearchBoxRef.current?.contains(target)) return;
      setSuggestionsOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  const draftLower = searchDraft.trim().toLowerCase();
  const matchedCategories = useMemo(() => {
    if (!draftLower) return [];
    return categories.filter((c) => c.toLowerCase().includes(draftLower)).slice(0, 3);
  }, [categories, draftLower]);
  const matchedProducts = useMemo(() => {
    if (!draftLower || !searchIndex) return [];
    return searchIndex.filter((p) => p.name.toLowerCase().includes(draftLower)).slice(0, 6);
  }, [searchIndex, draftLower]);
  const showSuggestions = suggestionsOpen && draftLower.length > 0 && (matchedCategories.length > 0 || matchedProducts.length > 0);

  const goToSearch = (value: string) => {
    setSuggestionsOpen(false);
    setSearch(value.trim() || null);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    goToSearch(searchDraft);
  };

  const handleClearSearch = () => {
    setSearchDraft('');
    setSuggestionsOpen(false);
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
      <SiteBanner />

      {hasTopMenu && (
        <div className="hidden sm:flex max-w-6xl mx-auto px-4 sm:px-6 pt-2.5 items-center justify-between gap-6">
          {[design.headerLeftMenu, design.headerRightMenu].map((menu, side) => (
            <nav key={side} className="flex items-center gap-5 flex-wrap">
              {menu.map((item) => (
                <MenuLink
                  key={item.id}
                  item={item}
                  subdomain={subdomain}
                  loggedIn={loggedIn}
                  className="text-[12px] text-muted hover:text-accent transition-colors"
                />
              ))}
            </nav>
          ))}
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
        {hasMobileMenu && (
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="sm:hidden -ml-1 p-1 text-ink"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
        )}
        <Link href={`/store/${subdomain}`} className="shrink-0">
          {logoUrl ? (
            <span className="relative block h-9 w-32">
              <Image src={logoUrl} alt={storeName} fill sizes="128px" className="object-contain object-left" />
            </span>
          ) : (
            <span className="font-display font-extrabold text-2xl text-ink tracking-tight">{storeName}</span>
          )}
        </Link>

        <div ref={searchBoxRef} className="hidden sm:block relative flex-1 max-w-2xl">
          <form onSubmit={handleSearchSubmit} className="flex w-full">
            <div className="flex w-full rounded-lg overflow-hidden border border-line-strong">
              <input
                type="text"
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                onFocus={() => setSuggestionsOpen(true)}
                placeholder="Search Your Product By Product Name, Code…"
                className="flex-1 px-4 py-2.5 text-[13.5px] text-ink bg-surface outline-none"
                autoComplete="off"
              />
              {searchDraft && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="px-2 text-muted hover:text-ink flex items-center justify-center"
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              )}
              <button
                type="submit"
                className="px-4 bg-ink text-white flex items-center justify-center hover:bg-ink/90 transition-colors"
                aria-label="Search"
              >
                <Search size={17} />
              </button>
            </div>
          </form>

          {showSuggestions && (
            <div className="absolute left-0 right-0 top-full mt-1 z-30 rounded-lg border border-line bg-surface shadow-lg overflow-hidden">
              {matchedCategories.map((cat) => (
                <button
                  key={`cat-${cat}`}
                  type="button"
                  onClick={() => {
                    setSuggestionsOpen(false);
                    setSearchDraft('');
                    setActiveCategory(cat);
                  }}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left text-[13px] font-medium text-ink hover:bg-canvas transition-colors border-b border-line last:border-b-0"
                >
                  <span>{cat}</span>
                  <span className="text-[11px] text-muted">Category</span>
                </button>
              ))}
              {matchedProducts.map((p) => (
                <Link
                  key={p.slug}
                  href={`/store/${subdomain}/product/${p.slug}`}
                  onClick={() => setSuggestionsOpen(false)}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-canvas transition-colors border-b border-line last:border-b-0"
                >
                  <span className="relative w-9 h-9 shrink-0 rounded overflow-hidden bg-canvas border border-line">
                    {p.photoUrls[0] && (
                      <Image src={p.photoUrls[0]} alt={p.name} fill sizes="36px" className="object-cover" />
                    )}
                  </span>
                  <span className="flex-1 min-w-0 text-[13px] text-ink truncate">{p.name}</span>
                  <span className="text-[12.5px] font-semibold text-ink shrink-0">
                    {formatPrice(p.discountPrice ?? p.price)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 ml-auto shrink-0">
          {design.cardShowWishlist && (
            <Link
              href={`/store/${subdomain}/wishlist`}
              className="relative text-ink hover:text-accent transition-colors"
              aria-label="Wishlist"
            >
              <Heart size={21} strokeWidth={1.75} />
              {wishlist.slugs.length > 0 && (
                <span className="absolute -top-2 -right-2 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-ink text-white text-[10px] font-bold">
                  {wishlist.slugs.length}
                </span>
              )}
            </Link>
          )}
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

      <div ref={mobileSearchBoxRef} className="sm:hidden relative px-4 pb-3">
        <form onSubmit={handleSearchSubmit} className="flex w-full">
          <div className="flex w-full rounded-lg overflow-hidden border border-line-strong">
            <input
              type="text"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              onFocus={() => setSuggestionsOpen(true)}
              placeholder="Search products"
              className="flex-1 px-3.5 py-2.5 text-[13px] text-ink bg-surface outline-none"
              autoComplete="off"
            />
            {searchDraft && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="px-2 text-muted hover:text-ink flex items-center justify-center"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
            <button type="submit" className="px-3.5 bg-ink text-white flex items-center justify-center" aria-label="Search">
              <Search size={16} />
            </button>
          </div>
        </form>

        {showSuggestions && (
          <div className="absolute left-4 right-4 top-full mt-1 z-30 rounded-lg border border-line bg-surface shadow-lg overflow-hidden">
            {matchedCategories.map((cat) => (
              <button
                key={`cat-m-${cat}`}
                type="button"
                onClick={() => {
                  setSuggestionsOpen(false);
                  setSearchDraft('');
                  setActiveCategory(cat);
                }}
                className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-[13px] font-medium text-ink hover:bg-canvas transition-colors border-b border-line last:border-b-0"
              >
                <span>{cat}</span>
                <span className="text-[11px] text-muted">Category</span>
              </button>
            ))}
            {matchedProducts.map((p) => (
              <Link
                key={`m-${p.slug}`}
                href={`/store/${subdomain}/product/${p.slug}`}
                onClick={() => setSuggestionsOpen(false)}
                className="flex w-full items-center gap-3 px-3.5 py-2 text-left hover:bg-canvas transition-colors border-b border-line last:border-b-0"
              >
                <span className="relative w-9 h-9 shrink-0 rounded overflow-hidden bg-canvas border border-line">
                  {p.photoUrls[0] && (
                    <Image src={p.photoUrls[0]} alt={p.name} fill sizes="36px" className="object-cover" />
                  )}
                </span>
                <span className="flex-1 min-w-0 text-[13px] text-ink truncate">{p.name}</span>
                <span className="text-[12.5px] font-semibold text-ink shrink-0">
                  {formatPrice(p.discountPrice ?? p.price)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Layout Settings > Site Menu replaces the category strip on
          larger screens; phones keep the strip. */}
      {hasSiteMenu && (
        <div className="hidden sm:block border-t border-line">
          <nav className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-6 overflow-x-auto py-3">
            {design.siteMenu.map((item) => (
              <MenuLink
                key={item.id}
                item={item}
                subdomain={subdomain}
                loggedIn={loggedIn}
                className="text-[13px] font-medium whitespace-nowrap text-ink hover:text-accent transition-colors"
              />
            ))}
          </nav>
        </div>
      )}

      {categories.length > 0 && (
        <div className={`border-t border-line ${hasSiteMenu ? 'sm:hidden' : ''}`}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-6 overflow-x-auto py-3">
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

      {/* Rendered from the header (not each page/view) so they show up on
          every StorePal page with no risk of a new view forgetting to add
          them — StoreHeader is the one component every StorePal view
          already renders (home, product, cart, checkout, thank-you,
          pages, account/*). */}
      {hasMobileMenu && mobileMenuOpen && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setMobileMenuOpen(false)} />
          <nav className="absolute inset-y-0 left-0 w-[80%] max-w-[300px] bg-surface overflow-y-auto shadow-popover">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-line">
              <span className="text-[15px] font-bold text-ink">Menu</span>
              <button onClick={() => setMobileMenuOpen(false)} aria-label="Close menu" className="text-ink">
                <X size={20} />
              </button>
            </div>
            {design.mobileMenu.map((item) => (
              <MenuLink
                key={item.id}
                item={item}
                subdomain={subdomain}
                loggedIn={loggedIn}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 text-[14px] font-medium text-ink border-b border-line hover:bg-canvas hover:text-accent"
              />
            ))}
          </nav>
        </div>
      )}

      <WhatsAppBubble socialLinks={socialLinks} />
      <AiAssistantWidget subdomain={subdomain} />
    </header>
  );
}
