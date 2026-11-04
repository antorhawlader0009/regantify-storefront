'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
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
import { PlaymateCartDrawer } from './PlaymateCartDrawer';
import { BodyPortal } from '../storepal/components/BodyPortal';
import { useAuthDialog } from '../storepal/lib/authDialog';
import { isExternalHref, menuItemHref, useStorePalDesign } from '../storepal/lib/designSettings';
import { useWishlist } from '../storepal/lib/wishlist';
import { LanguageSwitch } from '../storepal/components/LanguageSwitch';
import { useRememberStorePage } from '../storepal/lib/accountReturn';
import { useStoreText, useFormatPrice } from '../storepal/lib/storeText';
import { searchProducts } from '../storepal/lib/searchMatch';
import type { StorefrontMenuItem } from '@/lib/storefrontApi';
import { CartIcon, ChevronDown, CloseIcon, HeartIcon, MenuIcon, SearchIcon, UserIcon } from './icons';
import { bannerMessages, PmTopBarView } from './PlaymateTopBar';

/** The store's name as PlayMate's wordmark: bold, in the store colour, or the store's own logo when it has one. */
export function PlaymateLogo({ logoUrl, storeName, small = false }: { logoUrl?: string | null; storeName: string; small?: boolean }) {
  const design = useStorePalDesign();
  const showLogo = !!logoUrl && (design.headerShowLogo ?? true);
  const showName = (design.headerShowStoreName ?? true) || !showLogo;
  return (
    <span className="inline-flex min-w-0 items-center gap-2" data-rg="logo">
      {showLogo && (
        <Image src={logoUrl!} alt={storeName} width={360} height={144} sizes="160px" className={`block w-auto shrink-0 object-contain ${small ? 'h-8' : 'h-10'}`} />
      )}
      {showName && (
        <span className={`truncate font-extrabold leading-none tracking-tight text-accent ${small ? 'text-[20px]' : 'text-[24px] sm:text-[26px]'}`}>{storeName}</span>
      )}
    </span>
  );
}

/** PlayMate's purple announcement strip: the store's own Site Banner words, with a close that holds for the visit. */
function PlaymateTopBar({ subdomain }: { subdomain: string }) {
  const banner = useSiteBanner();
  const t = useStoreText();
  if (!banner) return null;
  const messages = bannerMessages(banner.html).map((html, i) => (
    <span key={i} className="whitespace-pre-wrap [&_a]:text-[var(--pm-yellow)] [&_b]:text-[var(--pm-yellow)] [&_strong]:text-[var(--pm-yellow)]" dangerouslySetInnerHTML={{ __html: html }} />
  ));
  return <PmTopBarView messages={messages} closeKey={`playmate-topbar-closed:${subdomain}`} closeLabel={t('Close')} background={banner.background} />;
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

/**
 * PlayMate's header (templete/playmate Header.tsx): purple top bar, the wordmark, "Shop by Category" with round
 * pictures, the store's own menu links, and round icon buttons; search opens as a centred panel and phones get a
 * side menu. It does everything StorePal's header does (StoreHeader.tsx): store banner, product and category
 * suggestions, voice and photo search, ask-the-assistant, language switch, header phone, wishlist, account, the cart
 * drawer, checkout and sign-in dialogs, chat button and side cart tab.
 */
export function PlaymateHeader({
  subdomain,
  storeName,
  categories: categoriesProp,
  logoUrl: logoUrlProp,
  socialLinks: socialLinksProp,
  chatProductName,
  categoryDetails: categoryDetailsProp = [],
}: StoreHeaderProps) {
  const { categories, categoryDetails } = useHeaderNav(subdomain, categoriesProp, categoryDetailsProp);
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

  const [drop, setDrop] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileCats, setMobileCats] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close the category menu on an outside click, and everything on Escape.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setDrop(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDrop(false);
        setSearchOpen(false);
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => {
    if (!mobileOpen && !searchOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen, searchOpen]);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  // The voice call asks the shopper to use the photo button: it is inside the search panel here, so the panel opens.
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
  const matchedCategories = useMemo(
    () => (q ? searchProducts(categories.map((name) => ({ name })), q).slice(0, 3).map((c) => c.name) : []),
    [categories, q],
  );
  const results = useMemo(() => {
    if (!searchIndex) return [];
    return q ? searchProducts(searchIndex, q).slice(0, 8) : searchIndex.slice(0, 4);
  }, [searchIndex, q]);
  const assistantAvailable = useAssistantBridge((s) => s.available);
  const nothingFound = q.length > 1 && searchIndex !== null && results.length === 0 && matchedCategories.length === 0;

  const closeAll = () => {
    setMobileOpen(false);
    setSearchOpen(false);
    setDrop(false);
  };
  const goToSearch = (value: string) => {
    const text = value.trim();
    closeAll();
    router.push(text ? `/store/${subdomain}?q=${encodeURIComponent(text)}` : `/store/${subdomain}/products`);
  };
  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    goToSearch(query);
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
  const detailOf = (name: string) => categoryDetails.find((c) => c.name === name);
  const categoryPhoto = (name: string) => detailOf(name)?.squarePhotoUrl || detailOf(name)?.coverPhotoUrl || null;
  const menuItems = [...design.headerLeftMenu, ...design.siteMenu, ...design.headerRightMenu];
  const phone = design.headerPhoneEnabled ? design.headerPhone?.trim() : '';
  const telHref = phone ? `tel:${phone.split(/[,/]/)[0].replace(/[^\d+]/g, '')}` : '';
  const triggerCls = 'inline-flex items-center gap-1 text-[12px] font-semibold uppercase tracking-wide text-ink transition hover:text-accent';
  const iconBtn = 'relative grid h-10 w-10 place-items-center rounded-full text-ink transition hover:bg-accent-light';

  const CategoryBubble = ({ name, size }: { name: string; size: string }) => {
    const photo = categoryPhoto(name);
    return (
      <span className={`relative shrink-0 overflow-hidden rounded-full bg-accent-light ${size}`}>
        {photo ? (
          <Image src={photo} alt="" fill sizes="40px" className="object-cover" />
        ) : (
          <span className="grid h-full w-full place-items-center text-[12px] font-bold uppercase text-accent">{name.slice(0, 1)}</span>
        )}
      </span>
    );
  };

  return (
    <>
      <PlaymateTopBar subdomain={subdomain} />
      <header data-rg="header" className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
        <div className="pm-wrap flex h-[66px] items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-2">
            <button type="button" className="-ml-1 rounded p-1.5 text-ink lg:hidden" aria-label={t('Menu')} onClick={() => setMobileOpen(true)}>
              <MenuIcon className="h-6 w-6" />
            </button>
            <Link href={`/store/${subdomain}`} className="min-w-0 rounded" onClick={closeAll}>
              <PlaymateLogo logoUrl={logoUrl} storeName={storeName} />
            </Link>
          </div>

          <nav ref={navRef} data-rg="menu" className="hidden items-center gap-7 lg:flex" aria-label="Main">
            {categories.length > 0 && (
              <div className="relative">
                <button type="button" className={triggerCls} aria-expanded={drop} onClick={() => setDrop((v) => !v)}>
                  {t('Shop by Category')}
                  <ChevronDown className={`h-3.5 w-3.5 transition ${drop ? 'rotate-180' : ''}`} />
                </button>
                {drop && (
                  <div role="menu" className="absolute left-0 top-full z-50 mt-3 max-h-[70vh] w-64 overflow-y-auto rounded-lg border border-line bg-white p-2 shadow-xl">
                    {categories.map((name) => (
                      <div key={name}>
                        <Link href={categoryHref(name)} onClick={() => setDrop(false)} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-ink hover:bg-accent-light">
                          <CategoryBubble name={name} size="h-8 w-8" />
                          {name}
                        </Link>
                        {(detailOf(name)?.children ?? []).map((child) => (
                          <Link
                            key={child.name}
                            href={categoryHref(child.name)}
                            onClick={() => setDrop(false)}
                            className="block rounded-md py-1.5 pl-14 pr-3 text-[13px] text-muted hover:bg-accent-light hover:text-accent"
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {menuItems.slice(0, 5).map((item, i) => (
              <MenuLink
                key={`${item.label}-${i}`}
                item={item}
                subdomain={subdomain}
                loggedIn={loggedIn}
                className="text-[12px] font-semibold uppercase tracking-wide text-ink transition hover:text-accent"
              />
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-0.5 sm:gap-2">
            <button type="button" className={iconBtn} aria-label={t('Search')} onClick={() => setSearchOpen(true)} data-rg="search">
              <SearchIcon className="h-[22px] w-[22px]" />
            </button>
            {phone && (
              <a href={telHref} className={`${iconBtn} hidden sm:grid`} aria-label={design.headerPhoneLabel?.trim() || t('Call Us Now')} title={phone}>
                <Phone size={20} strokeWidth={1.75} />
              </a>
            )}
            <span className="hidden sm:block">
              <LanguageSwitch />
            </span>
            <Link
              href={loggedIn ? `/store/${subdomain}/account/orders` : `/store/${subdomain}/account/login`}
              onClick={(e) => {
                if (loggedIn) return;
                e.preventDefault();
                openLogin();
              }}
              className={`${iconBtn} hidden sm:grid`}
              aria-label={loggedIn ? `${t('My account')}: ${customer!.fullName}` : t('Account')}
              title={loggedIn ? customer!.fullName : undefined}
            >
              {loggedIn ? (
                <span className="grid h-8 w-8 place-items-center rounded-full bg-accent text-[13px] font-bold uppercase text-white">
                  {customer!.fullName.trim().charAt(0) || <UserIcon className="h-4 w-4" />}
                </span>
              ) : (
                <UserIcon className="h-[22px] w-[22px]" />
              )}
            </Link>
            {design.cardShowWishlist && (
              <Link href={`/store/${subdomain}/wishlist`} className={iconBtn} aria-label={t('Wishlist')}>
                <HeartIcon className={`h-[22px] w-[22px] ${wishlist.slugs.length > 0 ? 'fill-red-500 text-red-500' : ''}`} />
                {wishlist.slugs.length > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                    {wishlist.slugs.length}
                  </span>
                )}
              </Link>
            )}
            <Link
              href={`/store/${subdomain}/cart`}
              className={iconBtn}
              aria-label={t('Cart')}
              data-rg="cart-button"
            >
              <CartIcon className="h-[22px] w-[22px]" />
              <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                {hydrated ? cartCount : 0}
              </span>
            </Link>
          </div>
        </div>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <CoverFloating />
            <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
            <aside className="absolute left-0 top-0 flex h-full w-[84%] max-w-sm flex-col overflow-y-auto bg-white p-5 shadow-2xl">
              <div className="mb-4 flex items-center justify-between gap-3">
                <PlaymateLogo logoUrl={logoUrl} storeName={storeName} small />
                <button type="button" className="rounded p-1.5" aria-label={t('Close')} onClick={() => setMobileOpen(false)}>
                  <CloseIcon className="h-6 w-6" />
                </button>
              </div>
              {categories.length > 0 && (
                <div className="border-b border-line">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between py-3.5 text-sm font-semibold uppercase tracking-wide"
                    onClick={() => setMobileCats((v) => !v)}
                    aria-expanded={mobileCats}
                  >
                    {t('Shop by Category')}
                    <ChevronDown className={`h-4 w-4 transition ${mobileCats ? 'rotate-180' : ''}`} />
                  </button>
                  {mobileCats && (
                    <div className="grid grid-cols-2 gap-2 pb-4">
                      {categories.map((name) => (
                        <Link key={name} href={categoryHref(name)} onClick={closeAll} className="flex items-center gap-2 rounded-lg bg-accent-light p-2 text-[13px] font-medium text-ink">
                          <CategoryBubble name={name} size="h-7 w-7" />
                          <span className="min-w-0 truncate">{name}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {(design.mobileMenu.length > 0 ? design.mobileMenu : menuItems).map((item, i) => (
                <MenuLink
                  key={`m-${item.label}-${i}`}
                  item={item}
                  subdomain={subdomain}
                  loggedIn={loggedIn}
                  onClick={closeAll}
                  className="border-b border-line py-3.5 text-sm font-semibold uppercase tracking-wide text-ink"
                />
              ))}
              <button
                type="button"
                className="flex w-full items-center justify-between border-b border-line py-3.5 text-sm font-semibold uppercase tracking-wide"
                onClick={() => {
                  setMobileOpen(false);
                  if (loggedIn) router.push(`/store/${subdomain}/account/orders`);
                  else openLogin();
                }}
              >
                {loggedIn ? customer!.fullName : t('Log in / Register')}
                <UserIcon className="h-4 w-4" />
              </button>
              {design.cardShowWishlist && (
                <Link
                  href={`/store/${subdomain}/wishlist`}
                  onClick={closeAll}
                  className="flex w-full items-center justify-between border-b border-line py-3.5 text-sm font-semibold uppercase tracking-wide"
                >
                  {t('Wishlist')} ({wishlist.slugs.length})
                  <HeartIcon className="h-4 w-4" />
                </Link>
              )}
              <Link
                href={`/store/${subdomain}/cart`}
                onClick={() => setMobileOpen(false)}
                className="flex w-full items-center justify-between border-b border-line py-3.5 text-sm font-semibold uppercase tracking-wide"
              >
                {t('Cart')} ({hydrated ? cartCount : 0})
                <CartIcon className="h-4 w-4" />
              </Link>
              {phone && (
                <a href={telHref} className="flex w-full items-center justify-between border-b border-line py-3.5 text-sm font-semibold tracking-wide">
                  {phone}
                  <Phone size={16} />
                </a>
              )}
              <div className="pt-4">
                <LanguageSwitch />
              </div>
            </aside>
          </div>
        )}

        {searchOpen && (
          <div className="fixed inset-0 z-50">
            <CoverFloating />
            <div className="absolute inset-0 bg-black/40" onClick={() => setSearchOpen(false)} />
            <div className="relative mx-auto mt-16 w-[92%] max-w-2xl rounded-2xl bg-white p-4 shadow-2xl sm:mt-24 sm:p-5">
              <form onSubmit={submitSearch} role="search" className="relative flex items-center gap-2 rounded-xl border border-line-strong px-4 py-3 focus-within:border-accent">
                <SearchIcon className="h-5 w-5 shrink-0 text-muted" />
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
                  className="w-full min-w-0 bg-transparent text-base text-ink outline-none placeholder:text-muted"
                  aria-label={t('Search')}
                />
                <VoiceSearchButton voice={voice} className="grid h-8 w-8 shrink-0 place-items-center text-muted hover:text-ink" />
                <PhotoSearchButton subdomain={subdomain} className="grid h-8 w-8 shrink-0 place-items-center text-muted hover:text-ink" />
                <button type="button" aria-label={t('Close')} onClick={() => setSearchOpen(false)} className="rounded p-1 text-ink">
                  <CloseIcon className="h-5 w-5" />
                </button>
                <VoiceSearchStatus voice={voice} />
              </form>

              {matchedCategories.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2 px-1">
                  {matchedCategories.map((name) => (
                    <Link key={name} href={categoryHref(name)} onClick={closeAll} className="rounded-full bg-accent-light px-3 py-1.5 text-[13px] font-medium text-accent">
                      {name}
                    </Link>
                  ))}
                </div>
              )}

              {!q && categories.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2 px-1">
                  {categories.slice(0, 8).map((name) => (
                    <Link key={name} href={categoryHref(name)} onClick={closeAll} className="rounded-full border border-line-strong px-3 py-1.5 text-[12.5px] text-ink hover:border-accent hover:text-accent">
                      {name}
                    </Link>
                  ))}
                </div>
              )}

              <p className="mt-4 px-1 text-xs font-semibold uppercase tracking-wide text-muted">{q ? t('Results') : t('Popular right now')}</p>
              <ul className="mt-2 max-h-[50vh] overflow-y-auto">
                {searchIndex === null && <li className="px-1 py-6 text-center text-sm text-muted">…</li>}
                {nothingFound && (
                  <li className="px-1 py-5 text-center text-sm text-muted">
                    {t('No product matches')} “{query.trim()}”
                    {assistantAvailable && (
                      <AskAssistantButton
                        words={query}
                        onAsk={() => setSearchOpen(false)}
                        className="mx-auto mt-3 flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-[13px] font-medium text-white hover:bg-accent-dark"
                      />
                    )}
                  </li>
                )}
                {results.map((p) => (
                  <li key={p.slug}>
                    <Link href={`/store/${subdomain}/product/${p.slug}`} onClick={closeAll} className="flex items-center gap-3 rounded-lg p-2 hover:bg-accent-light">
                      <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[var(--pm-card)]">
                        {p.photoUrls[0] && <Image src={p.photoUrls[0]} alt={p.name} fill sizes="56px" className="object-cover" />}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{p.name}</span>
                      <span className="text-sm font-bold text-ink">{formatPrice(p.discountPrice ?? p.price)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <button type="button" onClick={() => goToSearch(query)} className="pm-btn-primary mt-3 w-full">
                {q ? t('See all results') : t('All products')}
              </button>
            </div>
          </div>
        )}
      </header>

      <ChatBubble socialLinks={socialLinks} productName={chatProductName} />
      <LazyPhotoSearchPanel subdomain={subdomain} storeName={storeName} />
      <BodyPortal>
        <PlaymateCartDrawer subdomain={subdomain} />
        <LazyCheckoutDialog subdomain={subdomain} />
        <LazyAuthDialog subdomain={subdomain} />
      </BodyPortal>
    </>
  );
}
