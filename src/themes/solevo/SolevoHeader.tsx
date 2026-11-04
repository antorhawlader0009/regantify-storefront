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
import { BodyPortal } from '../storepal/components/BodyPortal';
import { useAuthDialog } from '../storepal/lib/authDialog';
import { isExternalHref, menuItemHref, useStorePalDesign } from '../storepal/lib/designSettings';
import { useWishlist } from '../storepal/lib/wishlist';
import { SolevoLanguageSwitch } from '../storepal/components/LanguageSwitch';
import { useRememberStorePage } from '../storepal/lib/accountReturn';
import { useStoreText, useFormatPrice } from '../storepal/lib/storeText';
import { searchProducts } from '../storepal/lib/searchMatch';
import type { StorefrontMenuItem } from '@/lib/storefrontApi';
import { bannerMessages } from '../playmate/PlaymateTopBar';
import { SolevoCartDrawer } from './SolevoCartDrawer';
import { ArrowRight, BagIcon, CloseIcon, HeartIcon, MenuIcon, SearchIcon, UserIcon } from './icons';

/**
 * The template's wordmark (templete/solevo Logo.tsx): a serif, tracked name, or the store's own logo picture. A store's
 * name is shown as it is written (the template's split "SOLE" + copper "VO" is the demo store's own name).
 */
export function SolevoLogo({ logoUrl, storeName, light = false, small = false }: { logoUrl?: string | null; storeName: string; light?: boolean; small?: boolean }) {
  const design = useStorePalDesign();
  const showLogo = !!logoUrl && (design.headerShowLogo ?? true);
  const showName = (design.headerShowStoreName ?? true) || !showLogo;
  return (
    <span className="inline-flex min-w-0 items-center gap-2 leading-none" data-rg="logo">
      {showLogo && (
        <Image src={logoUrl!} alt={storeName} width={360} height={144} sizes="160px" className={`block w-auto shrink-0 object-contain ${small ? 'h-8' : 'h-10'}`} />
      )}
      {showName && (
        <span
          className={`truncate font-display font-semibold uppercase tracking-wide ${small ? 'text-[22px]' : 'text-[26px] sm:text-[30px]'} ${light ? 'text-white' : 'text-ink'}`}
        >
          {storeName}
        </span>
      )}
    </span>
  );
}

/**
 * The template's dark announcement bar (templete/solevo AnnouncementBar.tsx), carrying only the store's own Site Banner
 * words: all the messages side by side with the copper stars between them on a computer, one at a time on a phone, and a
 * close that holds for the visit. No banner text means no bar.
 */
function SolevoTopBar({ subdomain }: { subdomain: string }) {
  const banner = useSiteBanner();
  const t = useStoreText();
  const [i, setI] = useState(0);
  const [gone, setGone] = useState(false);
  const closeKey = `solevo-topbar-closed:${subdomain}`;
  const messages = useMemo(() => (banner ? bannerMessages(banner.html) : []), [banner]);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(closeKey) === '1') setGone(true);
    } catch {
      /* private mode: the bar just stays */
    }
  }, [closeKey]);
  useEffect(() => {
    if (gone || messages.length < 2) return;
    const timer = setInterval(() => setI((v) => (v + 1) % messages.length), 4000);
    return () => clearInterval(timer);
  }, [gone, messages.length]);

  if (!banner || gone || messages.length === 0) return null;
  const node = (html: string) => (
    <span className="whitespace-pre-wrap [&_a]:text-[var(--sv-gold)] [&_b]:text-[var(--sv-gold)] [&_strong]:text-[var(--sv-gold)]" dangerouslySetInnerHTML={{ __html: html }} />
  );
  return (
    <div
      data-rg="announcement-bar"
      role="region"
      aria-label={t('Close')}
      className="relative bg-[#111111] text-[10px] font-medium uppercase tracking-wider text-white sm:text-[11px]"
      style={banner.background ? { backgroundColor: banner.background } : undefined}
    >
      <div className="sv-wrap relative flex min-h-9 items-center justify-center gap-4 px-10 py-2 text-center">
        <span className="hidden items-center gap-3 lg:flex">
          {messages.map((m, idx) => (
            <span key={idx} className="inline-flex items-center gap-3">
              {idx > 0 && <span className="text-[var(--sv-gold)]">✦</span>}
              {node(m)}
            </span>
          ))}
        </span>
        <span className="inline-flex items-center gap-2 lg:hidden" aria-live="polite">
          <span className="text-[var(--sv-gold)]">✦</span>
          <span key={i} className="sv-fade-in">
            {node(messages[i % messages.length])}
          </span>
          <span className="text-[var(--sv-gold)]">✦</span>
        </span>
        <button
          type="button"
          onClick={() => {
            setGone(true);
            try {
              sessionStorage.setItem(closeKey, '1');
            } catch {
              /* ignore */
            }
          }}
          aria-label={t('Close')}
          className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center text-white/80 transition hover:text-white sm:right-4"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
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
    <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--sv-gold)] px-1 text-[9px] font-semibold text-white">{n}</span>
  );
}

/**
 * Solevo's header (templete/solevo Header.tsx): a sticky white bar with the serif wordmark, the main links in small uppercase
 * in the middle, and plain line icons (search, account, wishlist, bag) with copper count badges; search opens as a
 * modal near the top of the page and phones get a left-hand menu. It does everything StorePal's header does
 * (StoreHeader.tsx): store banner, product and category suggestions, voice and photo search, ask-the-assistant,
 * language switch, header phone, the cart drawer, checkout and sign-in dialogs and the chat button.
 */
export function SolevoHeader({
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
  const defaultLinks =
    menuItems.length === 0
      ? [
          { label: t('All products'), href: `/store/${subdomain}/products` },
          ...categories.slice(0, 4).map((name) => ({ label: name, href: categoryHref(name) })),
          { label: t('Sale'), href: `/store/${subdomain}/products?show=sale` },
        ]
      : [];
  const phone = design.headerPhoneEnabled ? design.headerPhone?.trim() : '';
  const telHref = phone ? `tel:${phone.split(/[,/]/)[0].replace(/[^\d+]/g, '')}` : '';
  const navCls = 'relative py-1 text-[11px] font-medium uppercase tracking-wider text-ink/80 transition hover:text-[var(--sv-gold)]';
  const drawerLink = 'block w-full border-b border-black/5 py-3 text-left text-sm font-medium uppercase tracking-wider text-ink';

  return (
    <>
      <SolevoTopBar subdomain={subdomain} />
      <header data-rg="header" className="sticky top-0 z-40 border-b border-black/5 bg-white/95 backdrop-blur">
        <div className="sv-wrap flex h-[64px] items-center justify-between gap-3 sm:h-[68px] lg:h-[76px]">
          <button type="button" className="-ml-1 p-1 lg:hidden" aria-label={t('Menu')} onClick={() => setMenuOpen(true)}>
            <MenuIcon className="h-6 w-6" />
          </button>

          <Link href={`/store/${subdomain}`} className="min-w-0" onClick={closeAll}>
            <SolevoLogo logoUrl={logoUrl} storeName={storeName} />
          </Link>

          <nav data-rg="menu" className="hidden items-center gap-5 lg:flex xl:gap-8" aria-label="Main">
            {menuItems.slice(0, 6).map((item, i) => (
              <MenuLink key={`${item.label}-${i}`} item={item} subdomain={subdomain} loggedIn={loggedIn} className={navCls} />
            ))}
            {defaultLinks.map((l) => (
              <Link key={l.href} href={l.href} className={navCls}>
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-3.5 sm:gap-5">
            <button type="button" onClick={() => setSearchOpen(true)} aria-label={t('Search')} aria-haspopup="dialog" data-rg="search" className="transition hover:text-[var(--sv-gold)]">
              <SearchIcon className="h-[22px] w-[22px]" />
            </button>
            {phone && (
              <a href={telHref} className="hidden transition hover:text-[var(--sv-gold)] sm:block" aria-label={design.headerPhoneLabel?.trim() || t('Call Us Now')} title={phone}>
                <Phone size={20} strokeWidth={1.6} />
              </a>
            )}
            <span className="hidden sm:block">
              <SolevoLanguageSwitch />
            </span>
            <Link
              href={loggedIn ? `/store/${subdomain}/account/orders` : `/store/${subdomain}/account/login`}
              onClick={(e) => {
                if (loggedIn) return;
                e.preventDefault();
                openLogin();
              }}
              className="hidden transition hover:text-[var(--sv-gold)] sm:block"
              aria-label={loggedIn ? `${t('My account')}: ${customer!.fullName}` : t('Account')}
              title={loggedIn ? customer!.fullName : undefined}
            >
              {loggedIn ? (
                <span className="grid h-[26px] w-[26px] place-items-center rounded-full bg-[var(--sv-gold)] text-[12px] font-bold uppercase text-white">
                  {customer!.fullName.trim().charAt(0) || '?'}
                </span>
              ) : (
                <UserIcon className="h-[22px] w-[22px]" />
              )}
            </Link>
            {design.cardShowWishlist && (
              <Link href={`/store/${subdomain}/wishlist`} aria-label={`${t('Wishlist')} (${wishlist.slugs.length})`} className="relative transition hover:text-[var(--sv-gold)]">
                <HeartIcon className="h-[22px] w-[22px]" />
                <CountBadge n={wishlist.slugs.length} />
              </Link>
            )}
            <Link href={`/store/${subdomain}/cart`} aria-label={`${t('Cart')} (${hydrated ? cartCount : 0})`} data-rg="cart-button" className="relative transition hover:text-[var(--sv-gold)]">
              <BagIcon className="h-[22px] w-[22px]" />
              <CountBadge n={hydrated ? cartCount : 0} always />
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
          <aside className="absolute left-0 top-0 flex h-dvh w-[85%] max-w-xs flex-col overflow-y-auto bg-white p-6">
            <div className="mb-6 flex items-center justify-between">
              <SolevoLogo logoUrl={logoUrl} storeName={storeName} small />
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
            <div className="mt-auto space-y-1 pt-8 text-xs font-medium uppercase tracking-wider text-ink/80">
              <button
                type="button"
                className="flex w-full items-center gap-2 py-2.5 hover:text-[var(--sv-gold)]"
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
                <Link href={`/store/${subdomain}/wishlist`} onClick={closeAll} className="flex w-full items-center gap-2 py-2.5 hover:text-[var(--sv-gold)]">
                  <HeartIcon className="h-4 w-4" />
                  {t('Wishlist')} ({wishlist.slugs.length})
                </Link>
              )}
              <Link href={`/store/${subdomain}/cart`} onClick={closeAll} className="flex w-full items-center gap-2 py-2.5 hover:text-[var(--sv-gold)]">
                <BagIcon className="h-4 w-4" />
                {t('Cart')} ({hydrated ? cartCount : 0})
              </Link>
              {phone && (
                <a href={telHref} className="flex w-full items-center gap-2 py-2.5 hover:text-[var(--sv-gold)]">
                  <Phone size={16} />
                  {phone}
                </a>
              )}
              <div className="pt-3">
                <SolevoLanguageSwitch />
              </div>
            </div>
          </aside>
        </div>
      )}

      {searchOpen && (
        <div className="fixed inset-0 z-[65] flex items-start justify-center px-3 pt-[8vh] sm:px-6" onKeyDown={onSearchKey}>
          <CoverFloating />
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={() => setSearchOpen(false)} />
          <div role="dialog" aria-modal="true" aria-label={t('Search')} className="relative flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
            <form onSubmit={submitSearch} role="search" className="relative flex items-center gap-3 border-b border-black/10 px-4 py-3.5 sm:px-5">
              <SearchIcon className="h-5 w-5 shrink-0 text-ink/60" />
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
                    <Link key={name} href={categoryHref(name)} onClick={closeAll} className="rounded-full bg-[var(--sv-sand)] px-3 py-1 text-[11px] font-semibold hover:bg-[var(--sv-tan)]">
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
                      className="sv-btn-dark mx-auto mt-3"
                    />
                  )}
                </div>
              )}
              {results.length > 0 && (
                <ul className="divide-y divide-black/5 pb-2" role="listbox" aria-label={t('Results')}>
                  {results.map((p, i) => (
                    <li key={p.slug} role="option" aria-selected={cursor === i}>
                      <Link
                        href={`/store/${subdomain}/product/${p.slug}`}
                        onClick={closeAll}
                        onMouseEnter={() => setCursor(i)}
                        className={`flex w-full items-center gap-4 px-4 py-3 text-left transition sm:px-5 ${cursor === i ? 'bg-[var(--sv-sand)]' : 'hover:bg-[var(--sv-sand)]'}`}
                      >
                        <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-[var(--sv-card)]">
                          {p.photoUrls[0] && <Image src={p.photoUrls[0]} alt={p.name} fill sizes="64px" className="object-cover mix-blend-multiply" />}
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
              className="flex items-center justify-center gap-2 border-t border-black/10 bg-[var(--sv-panel)] px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider transition hover:text-[var(--sv-gold)]"
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
        <SolevoCartDrawer subdomain={subdomain} />
        <LazyCheckoutDialog subdomain={subdomain} />
        <LazyAuthDialog subdomain={subdomain} />
      </BodyPortal>
    </>
  );
}
