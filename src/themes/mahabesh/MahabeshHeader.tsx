'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Phone } from 'lucide-react';
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
import { MahabeshLanguageSwitch } from '../storepal/components/LanguageSwitch';
import { useRememberStorePage } from '../storepal/lib/accountReturn';
import { useStoreText, useFormatPrice } from '../storepal/lib/storeText';
import { searchProducts } from '../storepal/lib/searchMatch';
import type { StorefrontMenuItem } from '@/lib/storefrontApi';
import { bannerMessages } from '../playmate/PlaymateTopBar';
import { MahabeshCartDrawer } from './MahabeshCartDrawer';
import { ArrowRight, BagIcon, CloseIcon, HeartIcon, MenuIcon, SearchIcon, UserIcon } from './icons';

/**
 * The template's wordmark (resources/views/layouts/app.blade.php .s-logo): the store's own logo picture, else its name in
 * heavy tight type. A store's name is shown as it is written.
 */
export function MahabeshLogo({ logoUrl, storeName, light = false, small = false }: { logoUrl?: string | null; storeName: string; light?: boolean; small?: boolean }) {
  const design = useStorePalDesign();
  const showLogo = !!logoUrl && (design.headerShowLogo ?? true);
  const showName = (design.headerShowStoreName ?? true) || !showLogo;
  return (
    <span className="inline-flex min-w-0 items-center gap-2 leading-none" data-rg="logo">
      {showLogo && (
        <Image src={logoUrl!} alt={storeName} width={360} height={144} sizes="170px" className={`block w-auto max-w-[170px] shrink-0 object-contain ${small ? 'h-7' : 'h-9'}`} />
      )}
      {showName && (
        <span className={`truncate font-extrabold tracking-[-0.04em] ${small ? 'text-[20px]' : 'text-[22px] sm:text-[24px]'} ${light ? 'text-white' : 'text-ink'}`}>
          {storeName}
        </span>
      )}
    </span>
  );
}

/**
 * The template's announcement strip (.s-announce): a black bar, white 13px words with a small blue dot before each, scrolling
 * slowly (paused on hover), or still and centred when there is one message. Carries only the store's own Site Banner words;
 * no banner text means no bar.
 */
function MahabeshTopBar() {
  const banner = useSiteBanner();
  const messages = useMemo(() => (banner ? bannerMessages(banner.html) : []), [banner]);
  if (!banner || messages.length === 0) return null;
  const still = messages.length === 1;
  const group = (hidden: boolean) => (
    <div className={`flex gap-16 whitespace-nowrap px-8 py-[9px] ${still ? 'w-full justify-center' : ''}`} aria-hidden={hidden || undefined}>
      {messages.map((m, idx) => (
        <span key={idx} className="mh-announce-item whitespace-pre-wrap [&_a]:underline" dangerouslySetInnerHTML={{ __html: m }} />
      ))}
    </div>
  );
  return (
    <div
      data-rg="announcement-bar"
      role="region"
      aria-label="Announcements"
      className="mh-announce overflow-hidden bg-black text-[13px] font-medium text-white"
      style={banner.background ? { backgroundColor: banner.background } : undefined}
    >
      <div className={`flex ${still ? 'w-full' : 'mh-announce-track w-max'}`}>
        {group(false)}
        {!still && group(true)}
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
    <span className="absolute right-[1px] top-[3px] box-content flex h-[18px] min-w-[18px] items-center justify-center rounded-[9px] border-2 border-white bg-[var(--mh-brand)] px-[5px] text-[10.5px] font-bold leading-[18px] text-white">
      {n}
    </span>
  );
}

/**
 * Mahabesh's header (resources/views/layouts/app.blade.php): the black announcement strip, then a sticky white bar with
 * the logo, a wide pill search field and the round icon buttons (account with the first name, wishlist, cart with a blue
 * count), then a line of category pills with a blue dot under the open one; phones get a burger, the logo in the middle and
 * a left-hand menu. It does everything StorePal's header does (StoreHeader.tsx): store banner, product and category
 * suggestions, voice and photo search, ask-the-assistant, language switch, header phone, the cart drawer, checkout and
 * sign-in dialogs and the chat button. The pill search field opens the same search panel as StorePal's (one place for the
 * suggestions, voice and photo search).
 */
export function MahabeshHeader({
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
  const onShopAll = /\/products\/?$/.test(pathname || '') && !activeCategory;

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
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
  // No menu of its own: the template's links (its nav is the shop's collections), each opening the product list with that
  // choice made: all products, the first four categories, then Sale.
  const defaultLinks = menuItems.length === 0 ? [{ label: t('Sale'), href: `/store/${subdomain}/products?show=sale` }] : [];
  const phone = design.headerPhoneEnabled ? design.headerPhone?.trim() : '';
  const telHref = phone ? `tel:${phone.split(/[,/]/)[0].replace(/[^\d+]/g, '')}` : '';
  const navCls = 'relative whitespace-nowrap rounded-full px-3.5 py-2 text-[14px] font-medium text-[#62646b] transition hover:bg-[var(--mh-well)] hover:text-black';
  const drawerLink = 'flex w-full items-center justify-between border-b border-[var(--mh-line)] px-1 py-[11px] text-left text-base font-semibold text-black hover:text-[var(--mh-brand)]';

  return (
    <>
      <MahabeshTopBar />
      <header data-rg="header" className="sticky top-0 z-40 border-b border-[var(--mh-line)] bg-white/95 backdrop-blur-[10px]">
        <div className="mh-wrap grid h-[60px] grid-cols-[auto_1fr_auto] items-center gap-2 lg:h-[72px] lg:gap-7">
          <button type="button" className="mh-icon-btn lg:hidden" aria-label={t('Menu')} onClick={() => setMenuOpen(true)}>
            <MenuIcon className="h-[19px] w-[19px]" />
          </button>
          <Link href={`/store/${subdomain}`} className="min-w-0 justify-self-center lg:justify-self-start" onClick={closeAll}>
            <MahabeshLogo logoUrl={logoUrl} storeName={storeName} />
          </Link>

          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label={t('Search')}
            aria-haspopup="dialog"
            data-rg="search"
            className="hidden h-[46px] w-full max-w-[620px] items-center gap-2.5 justify-self-center rounded-full border-[1.5px] border-[var(--mh-line)] bg-[var(--mh-well)] pl-[18px] pr-1.5 text-left transition hover:border-black lg:flex"
          >
            <SearchIcon className="h-4 w-4 shrink-0 text-[#62646b]" />
            <span className="flex-1 truncate text-[15px] text-[#9a9ca3]">{t('Search products…')}</span>
            <span className="grid h-[34px] place-items-center rounded-full bg-black px-4 text-[13.5px] font-semibold text-white">{t('Search')}</span>
          </button>

          <div className="col-start-3 flex items-center gap-1 justify-self-end lg:col-start-auto">
            <button type="button" onClick={() => setSearchOpen(true)} aria-label={t('Search')} aria-haspopup="dialog" className="mh-icon-btn lg:hidden">
              <SearchIcon className="h-[19px] w-[19px]" />
            </button>
            {phone && (
              <a href={telHref} className="mh-icon-btn hidden sm:grid" aria-label={design.headerPhoneLabel?.trim() || t('Call Us Now')} title={phone}>
                <Phone size={18} strokeWidth={1.8} />
              </a>
            )}
            <span className="hidden px-1 sm:block">
              <MahabeshLanguageSwitch />
            </span>
            <Link
              href={loggedIn ? `/store/${subdomain}/account/orders` : `/store/${subdomain}/account/login`}
              onClick={(e) => {
                if (loggedIn) return;
                e.preventDefault();
                openLogin();
              }}
              className="hidden h-[42px] items-center gap-2 rounded-full pl-1.5 pr-3 text-[14px] font-semibold text-black transition hover:bg-[var(--mh-well)] lg:inline-flex"
              aria-label={loggedIn ? `${t('My account')}: ${customer!.fullName}` : t('Account')}
              title={loggedIn ? customer!.fullName : undefined}
            >
              <span className="grid h-[30px] w-[30px] place-items-center">
                <UserIcon className="h-[18px] w-[18px]" />
              </span>
              <span className="max-w-[110px] truncate">{loggedIn ? customer!.fullName.trim().split(' ')[0] : t('Log in')}</span>
            </Link>
            {design.cardShowWishlist && (
              <Link href={`/store/${subdomain}/wishlist`} aria-label={`${t('Wishlist')} (${wishlist.slugs.length})`} className="mh-icon-btn hidden sm:grid">
                <HeartIcon className="h-[19px] w-[19px]" />
                <CountBadge n={wishlist.slugs.length} />
              </Link>
            )}
            <Link href={`/store/${subdomain}/cart`} aria-label={`${t('Cart')} (${hydrated ? cartCount : 0})`} data-rg="cart-button" className="mh-icon-btn">
              <BagIcon className="h-[19px] w-[19px]" />
              <CountBadge n={hydrated ? cartCount : 0} />
            </Link>
          </div>
        </div>

        <nav className="hidden border-t border-[var(--mh-line)] lg:block" aria-label="Categories" data-rg="category-strip">
          <div className="mh-wrap mh-no-scrollbar flex h-[46px] items-center gap-0.5 overflow-x-auto">
            <Link href={`/store/${subdomain}/products`} className={`${navCls} ${onShopAll ? 'mh-nav-active' : ''}`}>
              {t('All products')}
            </Link>
            {categories.slice(0, 8).map((name) => (
              <Link key={name} href={categoryHref(name)} className={`${navCls} ${activeCategory === name ? 'mh-nav-active' : ''}`}>
                {name}
              </Link>
            ))}
            {menuItems.slice(0, 6).map((item, i) => (
              <MenuLink key={`${item.label}-${i}`} item={item} subdomain={subdomain} loggedIn={loggedIn} className={navCls} />
            ))}
            {defaultLinks.map((l) => (
              <Link key={l.href} href={l.href} className={`${navCls} ml-auto`}>
                {l.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      {/* The phone menu and search modal sit outside the header: its blur (backdrop-filter) would make their fixed position
          measure against the header instead of the screen, so they opened invisibly. */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <CoverFloating />
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-dvh w-[85%] max-w-xs flex-col overflow-y-auto bg-white p-6">
            <div className="mb-6 flex items-center justify-between">
              <MahabeshLogo logoUrl={logoUrl} storeName={storeName} small />
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
                      {t('Sale')}
                    </Link>
                  </li>
                </>
              )}
            </ul>
            <div className="mt-auto space-y-1 pt-8 text-sm font-medium text-ink/80">
              <button
                type="button"
                className="flex w-full items-center gap-2 py-2.5 hover:text-[var(--mh-brand)]"
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
                <Link href={`/store/${subdomain}/wishlist`} onClick={closeAll} className="flex w-full items-center gap-2 py-2.5 hover:text-[var(--mh-brand)]">
                  <HeartIcon className="h-4 w-4" />
                  {t('Wishlist')} ({wishlist.slugs.length})
                </Link>
              )}
              <Link href={`/store/${subdomain}/cart`} onClick={closeAll} className="flex w-full items-center gap-2 py-2.5 hover:text-[var(--mh-brand)]">
                <BagIcon className="h-4 w-4" />
                {t('Cart')} ({hydrated ? cartCount : 0})
              </Link>
              {phone && (
                <a href={telHref} className="flex w-full items-center gap-2 py-2.5 hover:text-[var(--mh-brand)]">
                  <Phone size={16} />
                  {phone}
                </a>
              )}
              <div className="pt-3">
                <MahabeshLanguageSwitch />
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
            <form onSubmit={submitSearch} role="search" className="relative flex items-center gap-3 border-b border-[var(--mh-line)] px-4 py-3.5 sm:px-5">
              <SearchIcon className="h-5 w-5 shrink-0 text-[var(--mh-brand)]" />
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
                    <Link key={name} href={categoryHref(name)} onClick={closeAll} className="rounded-full bg-[var(--mh-soft)] px-3 py-1 text-xs font-semibold text-[var(--mh-brand)] hover:bg-[var(--mh-peach)]">
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
                      className="mh-btn-dark mx-auto mt-3"
                    />
                  )}
                </div>
              )}
              {results.length > 0 && (
                <ul className="divide-y divide-[var(--mh-line)] pb-2" role="listbox" aria-label={t('Results')}>
                  {results.map((p, i) => (
                    <li key={p.slug} role="option" aria-selected={cursor === i}>
                      <Link
                        href={`/store/${subdomain}/product/${p.slug}`}
                        onClick={closeAll}
                        onMouseEnter={() => setCursor(i)}
                        className={`flex w-full items-center gap-4 px-4 py-3 text-left transition sm:px-5 ${cursor === i ? 'bg-[var(--mh-panel)]' : 'hover:bg-[var(--mh-panel)]'}`}
                      >
                        <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-[var(--mh-peach)]">
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
              className="flex items-center justify-center gap-2 border-t border-[var(--mh-line)] bg-[var(--mh-panel)] px-5 py-3.5 text-xs font-semibold transition hover:text-[var(--mh-brand)]"
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
        <MahabeshCartDrawer subdomain={subdomain} />
        <LazyCheckoutDialog subdomain={subdomain} />
        <LazyAuthDialog subdomain={subdomain} />
      </BodyPortal>
    </>
  );
}
