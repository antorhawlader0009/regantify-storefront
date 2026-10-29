'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQueryState } from 'nuqs';
import Link from 'next/link';
import Image from 'next/image';
import { Search, ShoppingBag, User, ChevronDown, X, Menu, Heart, Phone } from 'lucide-react';
import { useCartStore, useCartHydrated } from '@/providers/cart-store-provider';
import { useCustomerAuthStore, useCustomerAuthHydrated } from '@/providers/customer-auth-store-provider';
import { getStoreSocialLinks, type SocialLinks } from '@/lib/socialLinksApi';
import { getStoreSearchIndex, type StoreSearchProduct } from '../lib/storeNavApi';
import { formatPrice as plainPrice } from '../lib/formatPrice';
import { ChatBubble } from './ChatBubble';
import { LazyPhotoSearchPanel } from './LazyWidgets';
import { useHeaderPresence } from '../lib/headerPresence';
import { PhotoSearchButton } from './PhotoSearchPanel';
import { imageFromClipboard, usePhotoSearch } from '@/lib/photoSearch';
import { useVoiceSearch } from '@/lib/voiceSearch';
import { VoiceSearchButton, VoiceSearchStatus } from './VoiceSearch';
import { AskAssistantButton } from './AskAssistantButton';
import { useAssistantBridge } from '../lib/assistantBridge';
import { CartDrawer } from './CartDrawer';
import { CheckoutDialog } from './CheckoutDialog';
import { AuthDialog } from './AuthDialog';
import { RegantifyLoginCatcher } from './RegantifySignIn';
import { MarqueeTrack } from './MarqueeTrack';
import { useCartDrawer } from '../lib/cartDrawer';
import { useStripHidden } from '../lib/floatingScroll';
import { useAuthDialog } from '../lib/authDialog';
import type { StorefrontCategoryDetail, StorefrontMenuItem } from '@/lib/storefrontApi';
import { isExternalHref, menuItemHref, useStorePalDesign } from '../lib/designSettings';
import { useWishlist } from '../lib/wishlist';
import { LanguageSwitch } from './LanguageSwitch';
import { useRememberStorePage } from '../lib/accountReturn';
import { useStoreText, useFormatPrice } from '../lib/storeText';
import { searchProducts } from '../lib/searchMatch';
import { CoverFloating } from '@/lib/floatingCover';

// The category / site menu bars scroll sideways; a soft fade at the right edge shows there is more (a name used to be cut
// mid-word with no hint). The fade sits over the bar's own right padding, so a bar that fits shows no fade on its items.
// Dropdowns open through a portal, outside the bar, so the mask never clips them.
const MENU_FADE = '[mask-image:linear-gradient(to_right,#000_calc(100%-40px),transparent)]';

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
  // ChatBubble below); everywhere else that needs the full set
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
  // The product page passes its product's name so the chat bubble can open
  // the chat with "I'd like to know about this product: name, link" typed in.
  chatProductName?: string;
}

// Store > Design > Site Banner. It shows only what the seller wrote (or scheduled). It used to fall back to two
// built-in delivery promises, which made claims on every store that had written nothing; with no text it is now hidden.

// The vendor's banner is their own RichTextEditor HTML, same trust
// level as Store > Footer's aboutBlurb. "Delete" on the dashboard hides
// the strip entirely.
function SiteBanner() {
  const design = useStorePalDesign();
  // Scheduled banners (TellMe idea 110): the one whose time is on now replaces the usual banner. Decided here in the browser, from the
  // time of the visit, because the store's page is cached and a start or an end must not wait for the cache. Until the page has loaded, and
  // for a visit with nothing scheduled, the usual banner shows.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!design.bannerSchedule || design.bannerSchedule.length === 0) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, [design.bannerSchedule]);
  const scheduled =
    now === null
      ? null
      : ([...(design.bannerSchedule ?? [])]
          .filter((b) => (!b.startAt || Date.parse(b.startAt) <= now) && (!b.endAt || Date.parse(b.endAt) > now))
          // Two running at once: the one that started last.
          .sort((a, b) => (b.startAt ? Date.parse(b.startAt) : 0) - (a.startAt ? Date.parse(a.startAt) : 0))[0] ?? null);
  if (!scheduled && !design.bannerEnabled) return null;
  const marquee = (scheduled?.style ?? design.bannerStyle) === 'MARQUEE';
  const html = scheduled ? scheduled.content : design.bannerContent;
  const background = scheduled?.backgroundColor || design.bannerBackgroundColor;
  // TipTap saves runs of spaces as plain spaces (its editor shows them via
  // white-space: pre-wrap), so the banner must preserve whitespace too or
  // the vendor's spacing collapses to one space. `pre` keeps the marquee
  // on one line; the static strip can still wrap.
  if (!html || !html.trim()) return null;
  const items: { key: string; node: React.ReactNode }[] = [
    {
      key: 'vendor',
      node: (
        <span
          className={`${marquee ? 'whitespace-pre' : 'whitespace-pre-wrap'} [&_p]:m-0 [&_p]:inline [&_p+p]:ml-16`}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ),
    },
  ];
  return (
    <div
      data-rg="announcement-bar"
      className="bg-canvas overflow-hidden border-b border-line"
      style={background ? { backgroundColor: background } : undefined}
    >
      {marquee ? (
        <MarqueeTrack items={items.map((item) => item.node)} />
      ) : (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-center gap-x-10 gap-y-1 text-center">
          {items.map((item) => (
            <span key={item.key} className="text-[13px] font-semibold text-ink shrink-0">
              {item.node}
            </span>
          ))}
        </div>
      )}
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
  chatProductName,
  categoryDetails = [],
}: StoreHeaderProps) {
  const formatPrice = useFormatPrice(plainPrice);
  const t = useStoreText();
  // The account dialog's × returns to the last store page (lib/accountReturn.ts).
  useRememberStorePage(subdomain);
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
  // Phones have no hover, so a finger never "leaves": the list closes on a tap anywhere else and on any scroll (the page or
  // the category strip). A tap on the open category itself is handled by its button (it toggles).
  useEffect(() => {
    if (openCategory === null) return;
    const close = () => setOpenCategory(null);
    // A tap also filters the products, and the page changing height can fire a scroll at once: that one doesn't count.
    const openedAt = Date.now();
    const onScroll = () => {
      if (Date.now() - openedAt > 400) close();
    };
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Element | null;
      if (target?.closest('[role="menu"]') || target?.closest(`[data-cat-trigger="${CSS.escape(openCategory)}"]`)) return;
      close();
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [openCategory]);
  // Whether the last press was a finger: touch opens/closes the list by tapping, a mouse by hovering.
  const lastPointerTouch = useRef(false);
  // The AI chat widget lives in the store layout (a call survives page changes) and shows only while a header is here.
  useEffect(() => {
    useHeaderPresence.getState().enter();
    return () => useHeaderPresence.getState().leave();
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
  const openCartDrawer = useCartDrawer((s) => s.openDrawer);
  const openLogin = useAuthDialog((s) => s.openLogin);
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
  // Store > Design > Header Editor: logo size (MEDIUM is the old fixed size) and the cart total beside the bag.
  // The logo is as wide as the picture itself (up to the old box width), so a square logo leaves no gap before the name.
  const logoBox = { SMALL: 'h-7 max-w-24', MEDIUM: 'h-9 max-w-32', LARGE: 'h-12 max-w-44' }[design.headerLogoSize ?? 'MEDIUM'] ?? 'h-9 max-w-32';
  const logoText = { SMALL: 'text-xl', MEDIUM: 'text-2xl', LARGE: 'text-3xl' }[design.headerLogoSize ?? 'MEDIUM'] ?? 'text-2xl';
  // Logo picture and store name: both by default. With no logo uploaded, or with both switched off, the name still shows,
  // so the link to the home page is never empty.
  const showLogo = !!logoUrl && (design.headerShowLogo ?? true);
  const showName = (design.headerShowStoreName ?? true) || !showLogo;
  const logoTextWithLogo = { SMALL: 'text-base', MEDIUM: 'text-lg', LARGE: 'text-2xl' }[design.headerLogoSize ?? 'MEDIUM'] ?? 'text-lg';
  const cartTotal = useCartStore((s) =>
    s.lines.filter((l) => l.subdomain === subdomain).reduce((sum, l) => sum + l.unitPrice * l.quantity, 0),
  );

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
  // Phones: the search sits behind a search icon in the top row (the user's request, 2026-10-27). Opened, it takes the
  // top row (logo and icons hide) with a close button; closed, the header is as before. Computers always show it.
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  // Phones: the category strip hides on scroll down, back on scroll up (never while a category menu or the search is open).
  const stripHidden = useStripHidden(mobileSearchOpen || openCategory !== null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (mobileSearchOpen) mobileSearchInputRef.current?.focus();
  }, [mobileSearchOpen]);
  const closeMobileSearch = () => {
    setMobileSearchOpen(false);
    setSuggestionsOpen(false);
  };
  // The voice call asking the shopper to use the photo button: on a phone that button is inside the search, so it opens.
  const photoHintAt = usePhotoSearch((s) => s.hintAt);
  useEffect(() => {
    if (photoHintAt && window.matchMedia('(max-width: 639px)').matches) setMobileSearchOpen(true);
  }, [photoHintAt]);

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
    return searchProducts(categories.map((name) => ({ name })), draftLower).slice(0, 3).map((c) => c.name);
  }, [categories, draftLower]);
  const matchedProducts = useMemo(() => {
    if (!draftLower || !searchIndex) return [];
    return searchProducts(searchIndex, draftLower).slice(0, 6);
  }, [searchIndex, draftLower]);
  const showSuggestions = suggestionsOpen && draftLower.length > 0 && (matchedCategories.length > 0 || matchedProducts.length > 0);
  // Typed words that match nothing: offer to ask the AI assistant instead (only while it can answer).
  const assistantAvailable = useAssistantBridge((s) => s.available);
  const showAskAssistant =
    assistantAvailable && suggestionsOpen && draftLower.length > 1 && searchIndex !== null && matchedCategories.length === 0 && matchedProducts.length === 0;
  const AskAssistantPanel = (
    <div className="p-3">
      <p className="text-[12.5px] text-muted mb-2">
        {t('No product matches')} “{searchDraft.trim()}”
      </p>
      <AskAssistantButton
        words={searchDraft}
        onAsk={() => setSuggestionsOpen(false)}
        className="w-full inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-accent text-white text-[13px] font-medium hover:bg-accent-dark transition-colors"
      />
    </div>
  );
  // Before anything is typed: the store's categories and its first few products, so an empty search box still helps.
  const emptyProducts = useMemo(() => (searchIndex ?? []).slice(0, 4), [searchIndex]);
  const showStarter = suggestionsOpen && draftLower.length === 0 && (categories.length > 0 || emptyProducts.length > 0);
  const StarterPanel = (
    <div className="p-3 space-y-3">
      {categories.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted mb-1.5">{t('Browse categories')}</p>
          <div className="flex flex-wrap gap-1.5">
            {categories.slice(0, 8).map((cat) => (
              <button
                key={`starter-${cat}`}
                type="button"
                onClick={() => {
                  setSuggestionsOpen(false);
                  setActiveCategory(cat);
                }}
                className="px-2.5 py-1 rounded-full border border-line-strong text-[12.5px] text-ink hover:border-accent hover:text-accent transition-colors"
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}
      {emptyProducts.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted mb-1">{t('Products')}</p>
          {emptyProducts.map((p) => (
            <Link
              key={`starter-p-${p.slug}`}
              href={`/store/${subdomain}/product/${p.slug}`}
              onClick={() => setSuggestionsOpen(false)}
              className="flex items-center gap-3 py-1.5 hover:text-accent"
            >
              <span className="relative w-8 h-8 shrink-0 rounded overflow-hidden bg-canvas border border-line">
                {p.photoUrls[0] && <Image src={p.photoUrls[0]} alt={p.name} fill sizes="32px" className="object-cover" />}
              </span>
              <span className="flex-1 min-w-0 text-[13px] text-ink truncate">{p.name}</span>
              <span className="text-[12.5px] font-semibold text-ink shrink-0">{formatPrice(p.discountPrice ?? p.price)}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );

  const goToSearch = (value: string) => {
    setSuggestionsOpen(false);
    // Back to the top, where the results start (StoreQueryAdapter scrolls when asked).
    setSearch(value.trim() || null, { scroll: true });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    goToSearch(searchDraft);
  };

  // A picture pasted into the search box searches by photo (lib/photoSearch.ts); pasted text works as before.
  const searchByPhoto = usePhotoSearch((s) => s.search);
  const handleSearchPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const file = imageFromClipboard(e);
    if (!file) return;
    e.preventDefault();
    setSuggestionsOpen(false);
    void searchByPhoto(subdomain, file);
  };

  const handleClearSearch = () => {
    setSearchDraft('');
    setSuggestionsOpen(false);
  };

  // Search by voice (lib/voiceSearch.ts): the words fill the box while the shopper talks, then the normal search runs.
  const voice = useVoiceSearch({
    onInterim: (text) => setSearchDraft(text),
    onText: (text) => {
      setSearchDraft(text);
      setSuggestionsOpen(false);
      goToSearch(text);
    },
  });

  // The category nav is a flat list on the reference site except
  // entries that have real subcategories (Category.parentId, see
  // StorefrontService.getStoreProducts), which open a dropdown of those
  // subcategories on hover. Only categories with at least one child get
  // the chevron; the parent label itself still filters by its own name
  // when clicked, same as any other category.
  const visibleCategories = categories.slice(0, 9);
  const childrenByCategory = new Map(categoryDetails.map((c) => [c.name, c.children ?? []]));

  // The banner sits above the sticky part, so it scrolls away and only the logo/search/cart stay pinned (a header
  // with the banner pinned too used up a big share of a phone screen).
  return (
    <>
    <SiteBanner />
    <header data-rg="header" className="sticky top-0 z-20 bg-surface">
      {hasTopMenu && (
        <div className="hidden sm:flex max-w-6xl mx-auto px-4 sm:px-6 pt-2.5 items-center justify-between gap-6">
          {[design.headerLeftMenu, design.headerRightMenu].map((menu, side) => (
            <nav key={side} data-rg="top-menu" className="flex items-center gap-5 flex-wrap">
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

      <div className={`max-w-6xl mx-auto px-4 sm:px-6 py-4 items-center gap-4 ${mobileSearchOpen ? 'hidden sm:flex' : 'flex'}`}>
        {hasMobileMenu && (
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="sm:hidden -ml-1 p-1 text-ink"
            aria-label={t('Open menu')}
          >
            <Menu size={22} />
          </button>
        )}
        {/* On wider screens the logo side and the icons side get equal room, so the search bar sits in the middle. */}
        {/* Never narrower than the logo and name (the search bar gives way instead), so they don't run under it. */}
        <div className="min-w-0 flex items-center sm:flex-1 sm:basis-0 sm:min-w-fit">
        <Link href={`/store/${subdomain}`} data-rg="logo" className="min-w-0 flex items-center gap-2.5 sm:shrink-0">
          {showLogo && (
            <Image
              src={logoUrl!}
              alt={storeName}
              width={400}
              height={160}
              sizes="200px"
              className={`block shrink-0 w-auto object-contain object-left ${logoBox}`}
            />
          )}
          {showName && (
            <span className={`font-display font-extrabold ${showLogo ? logoTextWithLogo : logoText} text-ink tracking-tight truncate max-w-[9rem] sm:max-w-none`}>
              {storeName}
            </span>
          )}
        </Link>
        </div>

        <div ref={searchBoxRef} data-rg="search" className="hidden sm:block relative min-w-0 flex-[4] max-w-2xl">
          <form onSubmit={handleSearchSubmit} className="flex w-full">
            <div className="flex w-full rounded-lg overflow-hidden border border-line-strong">
              <input
                type="text"
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                onFocus={() => setSuggestionsOpen(true)}
                onPaste={handleSearchPaste}
                placeholder={t('Search Your Product By Product Name, Code…')}
                className="flex-1 min-w-0 px-4 py-2.5 text-[13.5px] text-ink bg-surface outline-none"
                autoComplete="off"
              />
              {searchDraft && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="px-2 text-muted hover:text-ink flex items-center justify-center"
                  aria-label={t('Clear search')}
                >
                  <X size={15} />
                </button>
              )}
              <VoiceSearchButton voice={voice} onStart={() => setSuggestionsOpen(false)} className="px-2.5 text-muted hover:text-ink flex items-center justify-center" />
              <PhotoSearchButton subdomain={subdomain} className="px-3 text-muted hover:text-ink flex items-center justify-center" />
              <button
                type="submit"
                className="px-4 bg-ink text-white flex items-center justify-center hover:bg-ink/90 transition-colors"
                aria-label={t('Search')}
              >
                <Search size={17} />
              </button>
            </div>
          </form>

          <VoiceSearchStatus voice={voice} />
          {showStarter && (
            <div className="absolute left-0 right-0 top-full mt-1 z-30 rounded-lg border border-line bg-surface shadow-lg overflow-hidden">
              {StarterPanel}
            </div>
          )}
          {showAskAssistant && (
            <div className="absolute left-0 right-0 top-full mt-1 z-30 rounded-lg border border-line bg-surface shadow-lg overflow-hidden">
              {AskAssistantPanel}
            </div>
          )}
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
                  <span className="text-[11px] text-muted">{t('Category')}</span>
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

        <div className="ml-auto flex items-center justify-end gap-4 shrink-0 sm:flex-1 sm:basis-0">
        {/* "Call Us Now" + number (Store > Design > Header Editor; off by default). */}
        {design.headerPhoneEnabled && design.headerPhone?.trim() && (
          <a
            href={`tel:${design.headerPhone.split(/[,/]/)[0].replace(/[^\d+]/g, '')}`}
            className="hidden lg:flex items-center gap-2.5 shrink-0 text-ink hover:text-accent transition-colors"
          >
            <Phone size={22} strokeWidth={1.75} aria-hidden />
            <span className="leading-tight">
              <span className="block text-[11px] text-muted">{design.headerPhoneLabel?.trim() || t('Call Us Now')}</span>
              <span className="block text-[13px] font-semibold">{design.headerPhone}</span>
            </span>
          </a>
        )}

        <div className="flex items-center gap-4 shrink-0">
          {/* Phones: the search behind an icon (it opens in place of this row). */}
          <button
            type="button"
            onClick={() => setMobileSearchOpen(true)}
            className="sm:hidden text-ink hover:text-accent transition-colors"
            aria-label={t('Search')}
            aria-expanded={mobileSearchOpen}
          >
            <Search size={21} strokeWidth={1.75} />
          </button>
          {/* The phone number is a call button on small screens, where the full "Call Us Now" block has no room. */}
          {design.headerPhoneEnabled && design.headerPhone?.trim() && (
            <a
              href={`tel:${design.headerPhone.split(/[,/]/)[0].replace(/[^\d+]/g, '')}`}
              className="lg:hidden text-ink hover:text-accent transition-colors"
              aria-label={design.headerPhoneLabel?.trim() || t('Call Us Now')}
            >
              <Phone size={21} strokeWidth={1.75} />
            </a>
          )}
          <LanguageSwitch />
          {design.cardShowWishlist && (
            <Link
              href={`/store/${subdomain}/account/wishlist`}
              className="relative text-ink hover:text-accent transition-colors"
              aria-label={t('Wishlist')}
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
            onClick={(e) => {
              // Signed out: the login dialog instead of a login page (the href is only a fallback).
              if (authHydrated && customer) return;
              e.preventDefault();
              openLogin();
            }}
            className="text-ink hover:text-accent transition-colors"
            aria-label={authHydrated && customer ? `${t('My account')}: ${customer.fullName}` : t('Account')}
            title={authHydrated && customer ? customer.fullName : undefined}
          >
            {authHydrated && customer ? (
              // Signed in: the shopper's initial in the store's colour with a green dot, so it is plain that they are logged in.
              <span className="relative flex h-[30px] w-[30px] items-center justify-center rounded-full bg-accent text-[13px] font-bold uppercase text-white ring-2 ring-accent/20">
                {customer.fullName.trim().charAt(0) || <User size={16} strokeWidth={2} />}
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#22c55e] ring-2 ring-surface" aria-hidden />
              </span>
            ) : (
              <User size={21} strokeWidth={1.75} />
            )}
          </Link>

          {/* Opens the slide-in cart (the href is only a fallback for open-in-new-tab / no JS). */}
          <Link
            href={`/store/${subdomain}/cart`}
            onClick={(e) => {
              e.preventDefault();
              openCartDrawer();
            }}
            className="relative flex items-center gap-2 text-ink hover:text-accent transition-colors"
            aria-label={t('Cart')}
            data-rg="cart-button"
          >
            <ShoppingBag size={21} strokeWidth={1.75} />
            {design.headerShowCartTotal && hydrated && cartCount > 0 && (
              <span className="hidden sm:inline text-[13px] font-semibold">{formatPrice(cartTotal)}</span>
            )}
            {hydrated && cartCount > 0 && (
              <span className="absolute -top-2 -right-2 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-ink text-white text-[10px] font-bold">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
        </div>
      </div>

      {mobileSearchOpen && (
      <div ref={mobileSearchBoxRef} data-rg="search" className="sm:hidden relative flex items-center gap-2 px-4 py-3">
        <button
          type="button"
          onClick={closeMobileSearch}
          className="-ml-1 shrink-0 p-1 text-ink hover:text-accent transition-colors"
          aria-label={t('Close search')}
        >
          <X size={22} />
        </button>
        <form onSubmit={handleSearchSubmit} className="flex min-w-0 flex-1">
          <div className="flex w-full rounded-lg overflow-hidden border border-line-strong">
            <input
              ref={mobileSearchInputRef}
              type="text"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              onFocus={() => setSuggestionsOpen(true)}
              onPaste={handleSearchPaste}
              placeholder={t('Search products')}
              className="flex-1 px-3.5 py-2.5 text-[13px] text-ink bg-surface outline-none"
              autoComplete="off"
            />
            {searchDraft && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="px-2 text-muted hover:text-ink flex items-center justify-center"
                aria-label={t('Clear search')}
              >
                <X size={14} />
              </button>
            )}
            <VoiceSearchButton voice={voice} onStart={() => setSuggestionsOpen(false)} className="px-2 text-muted hover:text-ink flex items-center justify-center" />
            <PhotoSearchButton subdomain={subdomain} className="px-2.5 text-muted hover:text-ink flex items-center justify-center" />
            <button type="submit" className="px-3.5 bg-ink text-white flex items-center justify-center" aria-label={t('Search')}>
              <Search size={16} />
            </button>
          </div>
        </form>

        <VoiceSearchStatus voice={voice} className="left-4 right-4" />
        {showStarter && (
          <div className="absolute left-4 right-4 top-full mt-1 z-30 rounded-lg border border-line bg-surface shadow-lg overflow-hidden">
            {StarterPanel}
          </div>
        )}
        {showAskAssistant && (
          <div className="absolute left-4 right-4 top-full mt-1 z-30 rounded-lg border border-line bg-surface shadow-lg overflow-hidden">
            {AskAssistantPanel}
          </div>
        )}
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
                <span className="text-[11px] text-muted">{t('Category')}</span>
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
      )}

      {/* Layout Settings > Site Menu replaces the category strip on
          larger screens; phones keep the strip. */}
      {hasSiteMenu && (
        <div className="hidden sm:block border-t border-line">
          <nav data-rg="menu" className={`max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-6 overflow-x-auto py-3 ${MENU_FADE}`}>
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
        // Phones: the strip folds away while the shopper scrolls down and comes back on scroll up (the user's request,
        // 2026-10-27; useStripHidden in lib/floatingScroll.ts, which ignores the page's own jump). Computers always show it.
        <div
          className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none sm:grid-rows-[1fr] ${
            stripHidden ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'
          } ${hasSiteMenu ? 'sm:hidden' : ''}`}
        >
        <div className={`min-h-0 overflow-hidden border-line ${stripHidden ? 'border-t-0 sm:border-t' : 'border-t'}`}>
          <div className={`max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-6 overflow-x-auto py-3 ${MENU_FADE}`}>
            {visibleCategories.map((cat) => {
              const children = childrenByCategory.get(cat) ?? [];
              const hasDropdown = children.length > 0;
              return (
                <div
                  key={cat}
                  data-cat-trigger={cat}
                  className="relative"
                  onPointerEnter={hasDropdown ? (e) => e.pointerType === 'mouse' && openDropdown(cat, e.currentTarget) : undefined}
                  onPointerLeave={hasDropdown ? (e) => e.pointerType === 'mouse' && scheduleClose() : undefined}
                >
                  <button
                    onPointerDown={(e) => {
                      lastPointerTouch.current = e.pointerType !== 'mouse';
                    }}
                    onClick={(e) => {
                      setActiveCategory(cat);
                      // A finger tap opens the list, and a second tap on the same category closes it.
                      if (hasDropdown && lastPointerTouch.current) {
                        if (openCategory === cat) setOpenCategory(null);
                        else openDropdown(cat, e.currentTarget.parentElement as HTMLElement);
                      }
                    }}
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
                        onPointerEnter={(e) => {
                          if (e.pointerType === 'mouse' && closeTimer.current) clearTimeout(closeTimer.current);
                        }}
                        onPointerLeave={(e) => e.pointerType === 'mouse' && scheduleClose()}
                        // Kept inside the screen: on a phone a category near the right edge would push the list off the side,
                        // so it moves left as far as needed (8 px from each edge) and long names wrap.
                        ref={(el) => {
                          if (!el) return;
                          const room = window.innerWidth - 8;
                          // Measured at the left edge first, where it has the whole width (a fixed box shrinks to the room it has).
                          el.style.left = '8px';
                          const left = Math.max(8, Math.min(menuRect.left, room - el.offsetWidth));
                          el.style.left = `${left}px`;
                        }}
                        style={{ left: menuRect.left, top: menuRect.top, maxWidth: 'calc(100vw - 16px)' }}
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
                            className={`block w-full sm:whitespace-nowrap px-4 py-2 text-left text-[13px] font-medium transition-colors ${
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
        </div>
      )}

      {/* Rendered from the header (not each page/view) so they show up on
          every StorePal page with no risk of a new view forgetting to add
          them — StoreHeader is the one component every StorePal view
          already renders (home, product, cart, checkout, thank-you,
          pages, account/*). */}
      {hasMobileMenu && mobileMenuOpen && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <CoverFloating />
          <div className="absolute inset-0 bg-ink/40" onClick={() => setMobileMenuOpen(false)} />
          <nav className="absolute inset-y-0 left-0 w-[80%] max-w-[300px] bg-surface overflow-y-auto shadow-popover">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-line">
              <span className="text-[15px] font-bold text-ink">{t('Menu')}</span>
              <button onClick={() => setMobileMenuOpen(false)} aria-label={t('Close menu')} className="text-ink">
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

      <ChatBubble socialLinks={socialLinks} productName={chatProductName} />
      <LazyPhotoSearchPanel subdomain={subdomain} storeName={storeName} />
      <CartDrawer subdomain={subdomain} />
      <CheckoutDialog subdomain={subdomain} />
      <AuthDialog subdomain={subdomain} />
      <RegantifyLoginCatcher />
    </header>
    </>
  );
}
