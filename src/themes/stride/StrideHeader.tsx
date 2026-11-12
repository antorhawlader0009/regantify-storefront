'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Phone, Truck } from 'lucide-react';
import { useCartStore, useCartHydrated } from '@/providers/cart-store-provider';
import { useCustomerAuthStore, useCustomerAuthHydrated } from '@/providers/customer-auth-store-provider';
import { getStoreSocialLinks, type SocialLinks } from '@/lib/socialLinksApi';
import { imageFromClipboard, usePhotoSearch } from '@/lib/photoSearch';
import { useVoiceSearch } from '@/lib/voiceSearch';
import { CoverFloating } from '@/lib/floatingCover';
import type { StoreHeaderProps } from '../storepal/components/StoreHeader';
import { getStoreSearchIndex, type StoreSearchProduct } from '../storepal/lib/storeNavApi';
import { useHeaderNav } from '../storepal/lib/headerNav';
import { useSiteBanner } from '../storepal/lib/siteBanner';
import { formatPrice as plainPrice } from '../storepal/lib/formatPrice';
import { ChatBubble } from '../storepal/components/ChatBubble';
import { LazyAuthDialog, LazyCheckoutDialog, LazyPhotoSearchPanel } from '../storepal/components/LazyWidgets';
import { useHeaderPresence } from '../storepal/lib/headerPresence';
import { PhotoSearchButton } from '../storepal/components/PhotoSearchPanel';
import { VoiceSearchButton, VoiceSearchStatus } from '../storepal/components/VoiceSearch';
import { AskAssistantButton } from '../storepal/components/AskAssistantButton';
import { useAssistantBridge } from '../storepal/lib/assistantBridge';
import { BodyPortal } from '../storepal/components/BodyPortal';
import { useAuthDialog } from '../storepal/lib/authDialog';
import { isExternalHref, menuItemHref, useStorePalDesign } from '../storepal/lib/designSettings';
import { useWishlist } from '../storepal/lib/wishlist';
import { StrideLanguageSwitch } from '../storepal/components/LanguageSwitch';
import { useRememberStorePage } from '../storepal/lib/accountReturn';
import { useStoreText, useFormatPrice } from '../storepal/lib/storeText';
import { searchProducts } from '../storepal/lib/searchMatch';
import type { StorefrontMenuItem } from '@/lib/storefrontApi';
import { bannerMessages } from '../playmate/PlaymateTopBar';
import { StrideCartDrawer } from './StrideCartDrawer';
import { ChevronDown } from 'lucide-react';
import { ArrowRight, BagIcon, CloseIcon, HeartIcon, MenuIcon, SearchIcon, UserIcon } from './icons';

/**
 * The template's wordmark (resources/views/layouts/app.blade.php .s-logo): the store's own logo picture, else its name in
 * heavy tight type. A store's name is shown as it is written.
 */
export function StrideLogo({ logoUrl, storeName, light = false, small = false }: { logoUrl?: string | null; storeName: string; light?: boolean; small?: boolean }) {
  const design = useStorePalDesign();
  const showLogo = !!logoUrl && (design.headerShowLogo ?? true);
  const showName = (design.headerShowStoreName ?? true) || !showLogo;
  return (
    <span className="inline-flex min-w-0 items-center gap-2 leading-none" data-rg="logo">
      {showLogo && (
        <Image src={logoUrl!} alt={storeName} width={360} height={144} sizes="170px" className={`block w-auto max-w-[170px] shrink-0 object-contain ${small ? 'h-7' : 'h-9'}`} />
      )}
      {showName && (
        <span
          className={`truncate font-bold uppercase tracking-[0.04em] ${small ? 'text-[24px]' : 'text-[30px] sm:text-[34px]'} ${light ? 'text-white' : 'text-[var(--st-navy)]'}`}
          style={{ fontFamily: 'var(--font-oswald), var(--font-bangla-store, var(--font-bangla)), Impact, sans-serif' }}
        >
          {storeName}
        </span>
      )}
    </span>
  );
}

/**
 * The template's top bar (components/TopBar.tsx): a navy bar, small white words each with a small icon (truck, percent badge,
 * shield), spread across the page on a computer and the first one centred on a phone. Carries only the store's own Site
 * Banner words (never the template's sample promises); no banner text means no bar.
 */
function StrideTopBar({ subdomain: sub }: { subdomain: string }) {
  const banner = useSiteBanner();
  const t = useStoreText();
  const messages = useMemo(() => (banner ? bannerMessages(banner.html) : []), [banner]);
  if (!banner || messages.length === 0) return null;
  return (
    <div
      data-rg="announcement-bar"
      role="region"
      aria-label="Announcements"
      className="st-topbar bg-[var(--st-navy)] text-[11px] font-medium uppercase tracking-wide text-white"
      style={banner.background ? { backgroundColor: banner.background } : undefined}
    >
      <div className="st-wrap flex items-center justify-between gap-4 py-2.5">
        {messages[1] ? (
          <span className="hidden items-center gap-2 md:flex">
            <Truck size={18} aria-hidden />
            <span className="[&_a]:underline" dangerouslySetInnerHTML={{ __html: messages[1] }} />
          </span>
        ) : (
          <span className="hidden md:block" />
        )}
        <span className="mx-auto text-center md:mx-0 [&_a]:underline [&_b]:text-[var(--st-lime)]" dangerouslySetInnerHTML={{ __html: messages[0] }} />
        {sub ? (
          <span className="hidden items-center gap-6 md:flex">
            <Link href={`/store/${sub}/orders`} className="hover:text-[var(--st-lime)]">
              {t('Track order')}
            </Link>
          </span>
        ) : (
          <span className="hidden md:block" />
        )}
      </div>
    </div>
  );
}

function MenuLink({ item, subdomain, loggedIn, className, onClick }: { item: StorefrontMenuItem; subdomain: string; loggedIn: boolean; className: string; onClick?: () => void }) {
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

function CountBadge({ n, always = false }: { n: number; always?: boolean }) {
  if (!always && n === 0) return null;
  return (
    <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--st-brand)] px-1 text-[9px] font-bold leading-none text-white">
      {n}
    </span>
  );
}

/**
 * Stride's header (resources/views/layouts/app.blade.php): the black announcement strip, then a sticky white bar with
 * the logo, a wide pill search field and the round icon buttons (account with the first name, wishlist, cart with a blue
 * count), then a line of category pills with a blue dot under the open one; phones get a burger, the logo in the middle and
 * a left-hand menu. It does everything StorePal's header does (StoreHeader.tsx): store banner, product and category
 * suggestions, voice and photo search, ask-the-assistant, language switch, header phone, the cart drawer, checkout and
 * sign-in dialogs and the chat button. The pill search field opens the same search panel as StorePal's (one place for the
 * suggestions, voice and photo search).
 */
export function StrideHeader({
  subdomain,
  storeName,
  categories: categoriesProp,
  logoUrl: logoUrlProp,
  socialLinks: socialLinksProp,
  chatProductName,
  categoryDetails: categoryDetailsProp = [],
}: StoreHeaderProps) {
  const { categories } = useHeaderNav(subdomain, categoriesProp, categoryDetailsProp);
  const t = useStoreText();
  const formatPrice = useFormatPrice(plainPrice);
  const design = useStorePalDesign();
  const router = useRouter();
  useRememberStorePage(subdomain);

  // The AI chat widget lives in the store layout and shows only while a header is on the page.
  useEffect(() => {
    useHeaderPresence.getState().enter();
    return () => useHeaderPresence.getState().leave();
  }, []);

  const [fetchedLogoUrl, setFetchedLogoUrl] = useState<string | null>(null);
  const [fetchedSocialLinks, setFetchedSocialLinks] = useState<SocialLinks>({});
  useEffect(() => {
    if (logoUrlProp !== undefined && socialLinksProp !== undefined) return;
    getStoreSocialLinks(subdomain).then((branding) => {
      if (logoUrlProp === undefined) setFetchedLogoUrl(branding.logoUrl ?? null);
      if (socialLinksProp === undefined) setFetchedSocialLinks(branding);
    });
  }, [subdomain, logoUrlProp, socialLinksProp]);
  const logoUrl = logoUrlProp !== undefined ? logoUrlProp : fetchedLogoUrl;
  const socialLinks = socialLinksProp !== undefined ? socialLinksProp : fetchedSocialLinks;

  const hydrated = useCartHydrated();
  const cartCount = useCartStore((s) => s.lines.filter((l) => l.subdomain === subdomain).reduce((sum, l) => sum + l.quantity, 0));
  const openLogin = useAuthDialog((s) => s.openLogin);
  const authHydrated = useCustomerAuthHydrated();
  const customer = useCustomerAuthStore((s) => s.customer);
  const loggedIn = authHydrated && !!customer;
  const wishlist = useWishlist(subdomain);

  // Which strip pill is open: read from the address after mount (store pages are cached, so no search-params hook here).
  const pathname = usePathname();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  useEffect(() => {
    setActiveCategory(new URLSearchParams(window.location.search).get('category'));
  }, [pathname]);

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  // The template's two drop-down menus (Shop, Categories); one is open at a time and a click anywhere else closes it.
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const wrapRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpenMenu(null);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);
  useEffect(() => setOpenMenu(null), [pathname]);
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setMenuOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => {
    if (!menuOpen && !searchOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen, searchOpen]);
  useEffect(() => {
    if (!searchOpen) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [searchOpen]);

  // The voice call asks the shopper to use the photo button: it is inside the search modal here, so the modal opens.
  const photoHintAt = usePhotoSearch((s) => s.hintAt);
  useEffect(() => {
    if (photoHintAt) setSearchOpen(true);
  }, [photoHintAt]);

  // The product list for the suggestions is fetched once the search is opened (lib/storeNavApi.ts keeps it for the visit).
  const [searchIndex, setSearchIndex] = useState<StoreSearchProduct[] | null>(null);
  useEffect(() => {
    if (searchIndex !== null || !searchOpen) return;
    let cancelled = false;
    getStoreSearchIndex(subdomain).then((list) => {
      if (!cancelled) setSearchIndex(list);
    });
    return () => {
      cancelled = true;
    };
  }, [subdomain, searchIndex, searchOpen]);

  const q = query.trim().toLowerCase();
  const matchedCategories = useMemo(() => (q ? searchProducts(categories.map((name) => ({ name })), q).slice(0, 3).map((c) => c.name) : []), [categories, q]);
  const allMatches = useMemo(() => (searchIndex && q ? searchProducts(searchIndex, q) : []), [searchIndex, q]);
  const results = useMemo(() => {
    if (!searchIndex) return [];
    return q ? allMatches.slice(0, 6) : searchIndex.slice(0, 5);
  }, [searchIndex, q, allMatches]);
  useEffect(() => setCursor(-1), [q]);
  const assistantAvailable = useAssistantBridge((s) => s.available);
  const nothingFound = q.length > 1 && searchIndex !== null && results.length === 0 && matchedCategories.length === 0;

  const closeAll = () => {
    setMenuOpen(false);
    setSearchOpen(false);
    setOpenMenu(null);
  };
  const goToSearch = (value: string) => {
    const text = value.trim();
    closeAll();
    router.push(text ? `/store/${subdomain}?q=${encodeURIComponent(text)}` : `/store/${subdomain}/products`);
  };
  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    const picked = cursor >= 0 ? results[cursor] : undefined;
    if (picked) {
      closeAll();
      router.push(`/store/${subdomain}/product/${picked.slug}`);
    } else goToSearch(query);
  };
  const onSearchKey = (e: React.KeyboardEvent) => {
    if (!results.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => (c + 1) % results.length);
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => (c <= 0 ? results.length - 1 : c - 1));
    }
  };
  const searchByPhoto = usePhotoSearch((s) => s.search);
  const voice = useVoiceSearch({
    onInterim: (text) => setQuery(text),
    onText: (text) => {
      setQuery(text);
      goToSearch(text);
    },
  });

  const categoryHref = (name: string) => `/store/${subdomain}?category=${encodeURIComponent(name)}`;
  const menuItems = [...design.headerLeftMenu, ...design.siteMenu, ...design.headerRightMenu];
  const onShopAll = /\/products\/?$/.test(pathname || '') && !activeCategory;
  // Template links: New In, the store's own first categories (the template's Men / Women / Kids), then Sale; the store's own menu
  // links after them.
  const navLinks = [
    { label: t('New In'), href: `/store/${subdomain}/products?show=new` },
    ...categories.slice(0, 3).map((name) => ({ label: name, href: categoryHref(name), active: activeCategory === name })),
    { label: t('Sale'), href: `/store/${subdomain}/products?show=sale` },
  ];
  const phone = design.headerPhoneEnabled ? design.headerPhone?.trim() : '';
  const telHref = phone ? `tel:${phone.split(/[,/]/)[0].replace(/[^\d+]/g, '')}` : '';
  const navCls = (active?: boolean) => `max-w-[160px] shrink-0 truncate whitespace-nowrap text-[12px] font-semibold uppercase tracking-wider transition hover:text-neutral-500 ${active ? 'underline underline-offset-[10px]' : ''}`;
  const drawerLink = 'flex w-full items-center justify-between border-b border-neutral-100 py-4 text-left text-sm font-semibold uppercase tracking-wider';
  const iconLink = 'relative';
  const badge = 'absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--st-navy)] px-1 text-[10px] font-bold leading-none text-white';
  const searchPill = (cls: string) => (
    <button
      type="button"
      onClick={() => setSearchOpen(true)}
      aria-label={t('Search')}
      aria-haspopup="dialog"
      data-rg="search"
      className={`items-center overflow-hidden rounded-full border border-neutral-300 text-left transition hover:border-[var(--st-navy)] ${cls}`}
    >
      <span className="min-w-0 flex-1 truncate py-2.5 pl-5 pr-3 text-xs text-neutral-500">{t('Search products…')}</span>
      <span className="flex items-center self-stretch border-l border-neutral-300 px-4">
        <SearchIcon className="h-[18px] w-[18px]" />
      </span>
    </button>
  );

  return (
    <>
      <StrideTopBar subdomain={subdomain} />
      <header ref={wrapRef} data-rg="header" className="sticky top-0 z-40 border-b border-neutral-100 bg-white">
        <div className="st-wrap relative flex h-[68px] items-center justify-between gap-4 lg:h-[76px]">
          <button type="button" className="lg:hidden" aria-label={t('Menu')} onClick={() => setMenuOpen(true)}>
            <MenuIcon className="h-6 w-6" />
          </button>
          <Link href={`/store/${subdomain}`} className="min-w-0 max-lg:absolute max-lg:left-1/2 max-lg:-tranneutral-x-1/2" onClick={closeAll}>
            <StrideLogo logoUrl={logoUrl} storeName={storeName} />
          </Link>

          <nav className="hidden min-w-0 items-center gap-4 overflow-hidden lg:flex xl:gap-7" aria-label="Main" data-rg="category-strip">
            {navLinks.map((l) => (
              <Link key={l.href} href={l.href} className={navCls('active' in l ? l.active : false)}>
                {l.label}
              </Link>
            ))}
            {menuItems.slice(0, 2).map((item, i) => (
              <MenuLink key={`${item.label}-${i}`} item={item} subdomain={subdomain} loggedIn={loggedIn} className={navCls()} />
            ))}
          </nav>

          <div className="flex items-center gap-4 sm:gap-5">
            {searchPill('hidden w-52 lg:flex xl:w-80')}
            <button type="button" aria-label={t('Search')} className="lg:hidden" onClick={() => setSearchOpen(true)}>
              <SearchIcon className="h-[22px] w-[22px]" />
            </button>
            {phone && (
              <a href={telHref} className={`${iconLink} hidden sm:block`} aria-label={design.headerPhoneLabel?.trim() || t('Call Us Now')} title={phone}>
                <Phone size={20} strokeWidth={1.8} />
              </a>
            )}
            <span className="hidden sm:block">
              <StrideLanguageSwitch />
            </span>
            <Link
              href={loggedIn ? `/store/${subdomain}/account/orders` : `/store/${subdomain}/account/login`}
              onClick={(e) => {
                if (loggedIn) return;
                e.preventDefault();
                openLogin();
              }}
              className={`${iconLink} hidden sm:block`}
              aria-label={loggedIn ? `${t('My account')}: ${customer!.fullName}` : t('Account')}
              title={loggedIn ? customer!.fullName : undefined}
            >
              <UserIcon className="h-[22px] w-[22px]" />
              {loggedIn && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white" />}
            </Link>
            {design.cardShowWishlist && (
              <Link href={`/store/${subdomain}/wishlist`} aria-label={`${t('Wishlist')} (${wishlist.slugs.length})`} className={`${iconLink} hidden sm:block`}>
                <HeartIcon className={`h-[22px] w-[22px] ${wishlist.slugs.length > 0 ? 'fill-current' : ''}`} />
                {wishlist.slugs.length > 0 && <span className={badge}>{wishlist.slugs.length}</span>}
              </Link>
            )}
            <Link href={`/store/${subdomain}/cart`} aria-label={`${t('Cart')} (${hydrated ? cartCount : 0})`} data-rg="cart-button" className={iconLink}>
              <BagIcon className="h-[22px] w-[22px]" />
              <span className={badge}>{hydrated ? cartCount : 0}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* The phone menu and search modal sit outside the header: its blur (backdrop-filter) would make their fixed position
          measure against the header instead of the screen, so they opened invisibly. */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <CoverFloating />
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-dvh w-72 max-w-[85%] flex-col overflow-y-auto bg-white p-5 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <StrideLogo logoUrl={logoUrl} storeName={storeName} small />
              <button type="button" onClick={() => setMenuOpen(false)} aria-label={t('Close')}>
                <CloseIcon className="h-6 w-6" />
              </button>
            </div>
            <ul className="space-y-1">
              {(design.mobileMenu.length > 0 ? design.mobileMenu : menuItems).map((item, i) => (
                <li key={`m-${item.label}-${i}`}>
                  <MenuLink item={item} subdomain={subdomain} loggedIn={loggedIn} onClick={closeAll} className={drawerLink} />
                </li>
              ))}
              {design.mobileMenu.length === 0 && menuItems.length === 0 && (
                <>
                  <li>
                    <Link href={`/store/${subdomain}`} onClick={closeAll} className={drawerLink}>
                      {t('Home')}
                    </Link>
                  </li>
                  <li>
                    <Link href={`/store/${subdomain}/products`} onClick={closeAll} className={drawerLink}>
                      {t('All products')}
                    </Link>
                  </li>
                  {categories.map((name) => (
                    <li key={name}>
                      <Link href={categoryHref(name)} onClick={closeAll} className={drawerLink}>
                        {name}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link href={`/store/${subdomain}/products?show=sale`} onClick={closeAll} className={drawerLink}>
                      {t('Deals')}
                    </Link>
                  </li>
                </>
              )}
            </ul>
            <div className="mt-auto space-y-1 pt-8 text-sm font-medium text-ink/80">
              <button
                type="button"
                className="flex w-full items-center gap-2 py-2.5 hover:text-[var(--st-brand)]"
                onClick={() => {
                  setMenuOpen(false);
                  if (loggedIn) router.push(`/store/${subdomain}/account/orders`);
                  else openLogin();
                }}
              >
                <UserIcon className="h-4 w-4" />
                {loggedIn ? customer!.fullName : t('Log in / Register')}
              </button>
              {design.cardShowWishlist && (
                <Link href={`/store/${subdomain}/wishlist`} onClick={closeAll} className="flex w-full items-center gap-2 py-2.5 hover:text-[var(--st-brand)]">
                  <HeartIcon className="h-4 w-4" />
                  {t('Wishlist')} ({wishlist.slugs.length})
                </Link>
              )}
              <Link href={`/store/${subdomain}/cart`} onClick={closeAll} className="flex w-full items-center gap-2 py-2.5 hover:text-[var(--st-brand)]">
                <BagIcon className="h-4 w-4" />
                {t('Cart')} ({hydrated ? cartCount : 0})
              </Link>
              {phone && (
                <a href={telHref} className="flex w-full items-center gap-2 py-2.5 hover:text-[var(--st-brand)]">
                  <Phone size={16} />
                  {phone}
                </a>
              )}
              <div className="pt-3">
                <StrideLanguageSwitch />
              </div>
            </div>
          </aside>
        </div>
      )}

      {searchOpen && (
        <div className="fixed inset-0 z-[65] flex items-start justify-center px-3 pt-[8vh] sm:px-6" onKeyDown={onSearchKey}>
          <CoverFloating />
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={() => setSearchOpen(false)} />
          <div role="dialog" aria-modal="true" aria-label={t('Search')} className="relative flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <form onSubmit={submitSearch} role="search" className="relative flex items-center gap-3 border-b border-[var(--st-line)] px-4 py-3.5 sm:px-5">
              <SearchIcon className="h-5 w-5 shrink-0 text-[var(--st-brand)]" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onPaste={(e) => {
                  const file = imageFromClipboard(e);
                  if (!file) return;
                  e.preventDefault();
                  setSearchOpen(false);
                  void searchByPhoto(subdomain, file);
                }}
                placeholder={t('Search products…')}
                aria-label={t('Search')}
                autoComplete="off"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink/40 sm:text-base"
              />
              <VoiceSearchButton voice={voice} className="grid h-8 w-8 shrink-0 place-items-center text-ink/60 hover:text-ink" />
              <PhotoSearchButton subdomain={subdomain} className="grid h-8 w-8 shrink-0 place-items-center text-ink/60 hover:text-ink" />
              <button type="button" onClick={() => setSearchOpen(false)} aria-label={t('Close')} className="rounded-full p-1 transition hover:bg-black/5">
                <CloseIcon className="h-5 w-5" />
              </button>
              <VoiceSearchStatus voice={voice} />
            </form>

            <div className="overflow-y-auto">
              {(matchedCategories.length > 0 || (!q && categories.length > 0)) && (
                <div className="flex flex-wrap gap-2 px-4 pt-4 sm:px-5">
                  {(q ? matchedCategories : categories.slice(0, 8)).map((name) => (
                    <Link key={name} href={categoryHref(name)} onClick={closeAll} className="rounded-full bg-[var(--st-soft)] px-3 py-1 text-xs font-semibold text-[var(--st-brand)] hover:bg-[var(--st-peach)]">
                      {name}
                    </Link>
                  ))}
                </div>
              )}
              <p className="px-4 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-ink/50 sm:px-5" aria-live="polite">
                {!q ? t('Popular right now') : searchIndex === null ? t('Searching…') : results.length ? `${t('Results')} (${allMatches.length})` : ''}
              </p>
              {searchIndex === null && <p className="px-5 py-6 text-center text-sm text-ink/50">…</p>}
              {nothingFound && (
                <div className="px-5 py-10 text-center">
                  <p className="text-sm font-semibold">
                    {t('No product matches')} “{query.trim()}”
                  </p>
                  {assistantAvailable && (
                    <AskAssistantButton
                      words={query}
                      onAsk={() => setSearchOpen(false)}
                      className="st-btn mx-auto mt-3"
                    />
                  )}
                </div>
              )}
              {results.length > 0 && (
                <ul className="divide-y divide-[var(--st-line)] pb-2" role="listbox" aria-label={t('Results')}>
                  {results.map((p, i) => (
                    <li key={p.slug} role="option" aria-selected={cursor === i}>
                      <Link
                        href={`/store/${subdomain}/product/${p.slug}`}
                        onClick={closeAll}
                        onMouseEnter={() => setCursor(i)}
                        className={`flex w-full items-center gap-4 px-4 py-3 text-left transition sm:px-5 ${cursor === i ? 'bg-[var(--st-panel)]' : 'hover:bg-[var(--st-panel)]'}`}
                      >
                        <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-[var(--st-peach)]">
                          {p.photoUrls[0] && <Image src={p.photoUrls[0]} alt={p.name} fill sizes="64px" className="object-cover" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">{p.name}</span>
                        </span>
                        <span className="shrink-0 text-right text-sm font-bold">{formatPrice(p.discountPrice ?? p.price)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button
              type="button"
              onClick={() => goToSearch(query)}
              className="flex items-center justify-center gap-2 border-t border-[var(--st-line)] bg-[var(--st-panel)] px-5 py-3.5 text-xs font-semibold transition hover:text-[var(--st-brand)]"
            >
              {q && allMatches.length > 0 ? `${t('See all results')} (${allMatches.length})` : q ? t('See all results') : t('All products')}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      <ChatBubble socialLinks={socialLinks} productName={chatProductName} />
      <LazyPhotoSearchPanel subdomain={subdomain} storeName={storeName} />
      <BodyPortal>
        <StrideCartDrawer subdomain={subdomain} />
        <LazyCheckoutDialog subdomain={subdomain} />
        <LazyAuthDialog subdomain={subdomain} />
      </BodyPortal>
    </>
  );
}
