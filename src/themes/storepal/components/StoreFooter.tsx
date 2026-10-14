'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Instagram, Twitter, Youtube, Linkedin, MessageCircle, ChevronDown } from 'lucide-react';
import { ReputationStrip } from './ReputationStrip';
import { getStoreSocialLinks, type SocialLinks, type StoreFooterConfig } from '@/lib/socialLinksApi';
import { getGiftCardSale, getStoreHasBlog, getStoreHasFaq, getStorePages, getStorePaymentMethods, type StorefrontPageSummary } from '../lib/storeNavApi';
import { resolveFooterTemplate } from '@/lib/footerTemplates';
import { useStoreText } from '../lib/storeText';
import { BusinessHoursTable } from './BusinessHoursTable';
import { APP_STORE_BADGE, GOOGLE_PLAY_BADGE } from '../lib/appBadges';

interface StoreFooterProps {
  subdomain: string;
  storeName: string;
  // A short "about" blurb shown in the footer's rightmost column on the
  // reference site — sourced from the vendor's own "About Us" Store >
  // Pages content when one exists (see reference screenshot: the
  // footer repeats the same copy as the About Us page itself), falling
  // back to a generic line when the vendor hasn't written one yet. This
  // is raw RichTextEditor HTML (same as Page.content) when passed, not
  // plain text — see how it's rendered below. Only used as a fallback
  // when Store > Footer's own aboutBlurb isn't set — see footerConfig.
  aboutBlurb?: string | null;
  // Store > Logo — see Vendor.logoUrl. When set, replaces the plain-
  // text wordmark below with the vendor's uploaded image. Same prop-
  // or-fetch convention as socialLinks below.
  logoUrl?: string | null;
  // Store > Social's saved links (see Vendor.facebookUrl etc). Pages
  // that already have server-fetched StorefrontInfo (home, product,
  // cart, checkout) should pass these straight through; pages that
  // don't (account/*, which are client components with only
  // subdomain/storeName in scope — see useStoreDisplayName's own
  // comment on why) can omit this and the footer fetches them itself
  // client-side (see getStoreSocialLinks) rather than every one of
  // those callers duplicating that fetch.
  socialLinks?: SocialLinks;
  // Store > Footer — same prop-or-fetch convention as socialLinks above.
  // undefined (not fetched yet) is distinct from null (fetched, vendor
  // never configured one) — see the fetch effect below.
  footerConfig?: StoreFooterConfig | null;
}

// Ordered platform list — each maps a Vendor field to its icon and a
// human label (for aria-label only; the reference footer shows icons
// without visible text). WhatsApp uses MessageCircle since lucide-react
// has no brand-specific WhatsApp glyph.
const PLATFORMS: { key: keyof SocialLinks; label: string; Icon: typeof Facebook }[] = [
  { key: 'facebookUrl', label: 'Facebook', Icon: Facebook },
  { key: 'instagramUrl', label: 'Instagram', Icon: Instagram },
  { key: 'twitterUrl', label: 'X (Twitter)', Icon: Twitter },
  { key: 'youtubeUrl', label: 'YouTube', Icon: Youtube },
  { key: 'linkedinUrl', label: 'LinkedIn', Icon: Linkedin },
  { key: 'whatsappUrl', label: 'WhatsApp', Icon: MessageCircle },
];

/** "System Design & Developed By : Reganto IT Solution" in the bottom bar. The vendor can hide it in Store > Footer. */
function DeveloperCredit() {
  return (
    <span>
      System Design &amp; Developed By :{' '}
      <a href="https://regantoitsolution.com/" target="_blank" rel="noopener noreferrer" className="font-medium text-accent hover:text-accent-dark">
        Reganto IT Solution
      </a>
    </span>
  );
}

/** A footer link column: always open from the small breakpoint up, a tap-to-open section on phones so the footer stays short. */
function FooterSection({ title, upper, children }: { title: string; upper?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-line sm:border-0 pb-3 sm:pb-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between text-left sm:pointer-events-none sm:cursor-default sm:mb-3"
      >
        <span className={`text-[15px] font-semibold text-ink ${upper ? 'uppercase' : ''}`}>{title}</span>
        <ChevronDown size={16} className={`sm:hidden text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`${open ? 'block mt-3' : 'hidden'} sm:block sm:mt-0`}>{children}</div>
    </div>
  );
}

/** The store's official badge (appBadges.ts), unchanged, linking to the app's page. Both are shown at the same height. */
function AppBadge({ href, src, alt }: { href: string; src: string; alt: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-block hover:opacity-90">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} height={40} className="block h-10 w-auto" />
    </a>
  );
}

/**
 * Store > Footer's configurable, template-driven footer — see
 * FooterConfig in the server's schema.prisma and footerTemplates.ts's
 * registry mirror for the full design. Structure (which columns, in
 * what order, which optional blocks) is fully configurable via the
 * vendor's saved FooterConfig; visual styling (colors/fonts/spacing)
 * stays StorePal's own, same "vendor content injected into each theme's
 * own chrome" pattern Store > Social/Store > Pages already use here.
 *
 * BACKWARD COMPATIBILITY: a vendor who's never saved a FooterConfig
 * (footerConfig resolves to null/undefined after the fetch below) sees
 * the exact hardcoded 3-column footer this component always rendered
 * before this feature — see the `!footerConfig` branch below, which is
 * a verbatim copy of that original markup, not a "CLASSIC template"
 * render (which would additionally include the copyright bar's exact
 * old wording etc. — keeping this as a literal fork removes any risk of
 * template-registry logic drifting and silently changing a live store's
 * appearance).
 */
export function StoreFooter({
  subdomain,
  storeName,
  aboutBlurb,
  logoUrl: logoUrlProp,
  socialLinks: socialLinksProp,
  footerConfig: footerConfigProp,
}: StoreFooterProps) {
  const t = useStoreText();
  // The payment methods this store's checkout really offers ("We accept" row).
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [fetched, setFetched] = useState<{
    logoUrl?: string | null;
    socialLinks: SocialLinks;
    footerConfig: StoreFooterConfig | null;
  } | null>(null);
  // Store > Pages' published list — still fetched independently of
  // footerConfig.infoLinks: a vendor with no FooterConfig (the common
  // case today) needs this for the original hardcoded INFORMATION
  // column below.
  const [pages, setPages] = useState<StorefrontPageSummary[]>([]);
  // Store > Magazine (TellMe idea 106): a "Magazine" link once there is a published post.
  const [hasBlog, setHasBlog] = useState(false);
  // Store FAQ (TellMe idea 122): a "FAQ" link once a question is switched on.
  const [hasFaq, setHasFaq] = useState(false);
  // Gift cards sold online (TellMe idea 135): a "Gift cards" link while the store sells them.
  const [hasGiftCards, setHasGiftCards] = useState(false);

  const haveAllProps = socialLinksProp && logoUrlProp !== undefined && footerConfigProp !== undefined;

  useEffect(() => {
    if (haveAllProps) return; // Caller already has everything — no need to fetch.
    getStoreSocialLinks(subdomain).then((data) =>
      setFetched({ logoUrl: data.logoUrl, socialLinks: data, footerConfig: data.footerConfig ?? null }),
    );
  }, [subdomain, haveAllProps]);

  useEffect(() => {
    getStorePages(subdomain).then(setPages);
    getStoreHasBlog(subdomain).then(setHasBlog);
    getStoreHasFaq(subdomain).then(setHasFaq);
    getGiftCardSale(subdomain).then((c) => setHasGiftCards(!!c?.enabled && c.amounts.length > 0));
    getStorePaymentMethods(subdomain).then(setPaymentMethods);
  }, [subdomain]);

  const socialLinks = socialLinksProp ?? fetched?.socialLinks ?? {};
  const logoUrl = logoUrlProp ?? fetched?.logoUrl ?? null;
  const footerConfig = footerConfigProp !== undefined ? footerConfigProp : fetched?.footerConfig;
  const activePlatforms = PLATFORMS.filter((p) => socialLinks[p.key]?.trim());

  const Logo = logoUrl ? (
    <span className="relative block h-10 w-40 mb-4">
      <Image src={logoUrl} alt={storeName} fill sizes="160px" className="object-contain object-left" />
    </span>
  ) : (
    <span className="font-display font-extrabold text-3xl text-ink tracking-tight block mb-4">{storeName}</span>
  );

  const SocialIcons = activePlatforms.length > 0 && (
    <>
      <p className="text-[13px] font-semibold text-ink mt-6 mb-2">{t('Social Link')}</p>
      <div className="flex gap-2.5">
        {activePlatforms.map(({ key, label, Icon }) => (
          <a
            key={key}
            href={socialLinks[key]!}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="w-8 h-8 rounded flex items-center justify-center bg-ink text-white hover:bg-accent transition-colors"
          >
            <Icon size={15} />
          </a>
        ))}
      </div>
    </>
  );

  // "We accept": worked out from the checkout's real payment methods, never typed in by the seller, so it can't
  // show a method the shopper can't use. A saved footer can switch it off; a store with no saved footer shows it.
  const paymentVisible = !footerConfig || footerConfig.showPaymentIcons;
  const PaymentStrip = paymentVisible && paymentMethods.length > 0 && (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-6">
      <p className="text-[13px] font-semibold text-ink mb-2">{t('We accept')}</p>
      <div className="flex flex-wrap gap-1.5">
        {paymentMethods.map((label) => (
          <span key={label} className="px-2.5 py-1 rounded border border-line-strong bg-surface text-[12px] font-semibold text-ink">
            {t(label)}
          </span>
        ))}
      </div>
    </div>
  );
  const trackLink = { label: t('Track order'), url: `/store/${subdomain}/orders` };

  // Not yet configured — original hardcoded 3-column footer, unchanged
  // from before Store > Footer existed. See this component's own
  // "BACKWARD COMPATIBILITY" doc comment above.
  if (!footerConfig) {
    return (
      <footer className="bg-canvas border-t border-line mt-8">
        <ReputationStrip />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid gap-8 sm:grid-cols-3">
          <div>
            {Logo}
            {SocialIcons}
          </div>

          <FooterSection title={t('INFORMATION')}>
            <div className="flex flex-col gap-2.5 text-[13px]">
                <Link href={trackLink.url} className="text-accent hover:text-accent-dark transition-colors w-fit">
                  {trackLink.label}
                </Link>
                {pages.map((page) => (
                  <Link
                    key={page.slug}
                    href={`/store/${subdomain}/page/${page.slug}`}
                    className="text-accent hover:text-accent-dark transition-colors w-fit"
                  >
                    {page.title}
                  </Link>
                ))}
                {hasBlog && (
                  <Link href={`/store/${subdomain}/blog`} className="text-accent hover:text-accent-dark transition-colors w-fit">
                    {t('Magazine')}
                  </Link>
                )}
                {hasFaq && (
                  <Link href={`/store/${subdomain}/faq`} className="text-accent hover:text-accent-dark transition-colors w-fit">
                    {t('FAQ')}
                  </Link>
                )}
                {hasGiftCards && (
                  <Link href={`/store/${subdomain}/gift-card`} className="text-accent hover:text-accent-dark transition-colors w-fit">
                    {t('Gift cards')}
                  </Link>
                )}
            </div>
          </FooterSection>

          {aboutBlurb?.trim() && (
            <div>
              <div
                className="text-[13px] text-muted leading-relaxed [&_p]:mb-2 line-clamp-6"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: aboutBlurb }}
              />
            </div>
          )}
        </div>

        {PaymentStrip}

        <div className="border-t border-line">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 text-[13px] text-muted flex flex-col items-center gap-1 sm:flex-row sm:justify-between">
            <span>
              © {new Date().getFullYear()} Copyright <span className="text-ink font-medium">{storeName}</span>
            </span>
            <DeveloperCredit />
          </div>
        </div>
      </footer>
    );
  }

  // Configured — structure driven by the vendor's saved template/content,
  // rendered with StorePal's own visual chrome.
  const def = resolveFooterTemplate(footerConfig.template);
  const blurbHtml = footerConfig.aboutBlurb?.trim() || aboutBlurb?.trim();

  const LogoColumn = (
    <div>
      {Logo}
      {footerConfig.showSocialIcons && SocialIcons}
      {def.logoCarriesAbout && blurbHtml && (
        <div
          className="text-[13px] text-muted leading-relaxed [&_p]:mb-2 line-clamp-6 mt-4"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: blurbHtml }}
        />
      )}
    </div>
  );

  const MenuColumn = footerConfig.menuLinks.length > 0 && (
    <FooterSection title={footerConfig.menuTitle} upper>
      <div className="flex flex-col gap-2.5 text-[13px]">
        {footerConfig.menuLinks.map((link, i) => (
          <Link key={i} href={link.url} className="text-accent hover:text-accent-dark transition-colors w-fit">
            {link.label}
          </Link>
        ))}
      </div>
    </FooterSection>
  );

  // Falls back to the auto-populated Store > Pages list when the vendor
  // hasn't curated any infoLinks of their own yet — same list the
  // unconfigured branch above always showed, so switching TO a template
  // for the first time doesn't blank out this column.
  const infoItems =
    footerConfig.infoLinks.length > 0
      ? footerConfig.infoLinks
      : [trackLink, ...pages.map((p) => ({ label: p.title, url: `/store/${subdomain}/page/${p.slug}` })), ...(hasBlog ? [{ label: t('Magazine'), url: `/store/${subdomain}/blog` }] : []), ...(hasFaq ? [{ label: t('FAQ'), url: `/store/${subdomain}/faq` }] : [])];
  const InfoColumn = infoItems.length > 0 && (
    <FooterSection title={footerConfig.infoTitle} upper>
      <div className="flex flex-col gap-2.5 text-[13px]">
        {infoItems.map((link, i) => (
          <Link key={i} href={link.url} className="text-accent hover:text-accent-dark transition-colors w-fit">
            {link.label}
          </Link>
        ))}
      </div>
    </FooterSection>
  );

  const AboutColumn = !def.logoCarriesAbout && blurbHtml && (
    <div>
      <div
        className="text-[13px] text-muted leading-relaxed [&_p]:mb-2 line-clamp-6"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: blurbHtml }}
      />
    </div>
  );

  // Contact info and app download links (each can be hidden), a column of its own at the left whatever the template.
  const contactLines = [footerConfig.contactAddress, footerConfig.contactPhone, footerConfig.contactEmail].filter((v): v is string => Boolean(v?.trim()));
  const showContact = Boolean(footerConfig.showContact) && contactLines.length > 0;
  const showApps = Boolean(footerConfig.showApps) && Boolean(footerConfig.playStoreUrl?.trim() || footerConfig.appStoreUrl?.trim());
  const ContactColumn = (showContact || showApps) && (
    <div>
      {showContact && (
        <>
          <p className="text-[15px] font-semibold text-ink mb-3 uppercase">{footerConfig.contactTitle || 'Contact Info'}</p>
          <div className="flex flex-col gap-2.5 text-[13px] text-muted">
            {footerConfig.contactAddress?.trim() && <p className="m-0 whitespace-pre-line">{footerConfig.contactAddress}</p>}
            {footerConfig.contactPhone?.trim() && (
              <a href={`tel:${footerConfig.contactPhone.split(/[,/]/)[0].replace(/[^\d+]/g, '')}`} className="w-fit hover:text-ink">
                {footerConfig.contactPhone}
              </a>
            )}
            {footerConfig.contactEmail?.trim() && (
              <a href={`mailto:${footerConfig.contactEmail}`} className="w-fit hover:text-ink">
                {footerConfig.contactEmail}
              </a>
            )}
          </div>
        </>
      )}
      {showApps && (
        <div className={showContact ? 'mt-5' : ''}>
          <p className="text-[14px] font-semibold text-ink mb-2">{footerConfig.appsTitle || 'Download Now'}</p>
          <div className="flex flex-wrap gap-2">
            {footerConfig.playStoreUrl?.trim() && <AppBadge href={footerConfig.playStoreUrl} src={GOOGLE_PLAY_BADGE} alt="Get it on Google Play" />}
            {footerConfig.appStoreUrl?.trim() && <AppBadge href={footerConfig.appStoreUrl} src={APP_STORE_BADGE} alt="Download on the App Store" />}
          </div>
        </div>
      )}
    </div>
  );

  const columnContent: Record<string, React.ReactNode> = {
    contact: ContactColumn,
    logo: LogoColumn,
    menu: MenuColumn,
    info: InfoColumn,
    about: AboutColumn,
  };
  const visibleColumns = ['contact', ...def.columns].filter((c) => columnContent[c]);
  // Fixed Tailwind class per count (1-4) rather than an inline
  // gridTemplateColumns — keeps this a plain utility-class grid like
  // every other layout in this theme, at the cost of only supporting up
  // to 4 columns (every current template registry entry has at most 4).
  const gridColsClass =
    { 1: 'sm:grid-cols-1', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-4' }[
      Math.min(Math.max(visibleColumns.length, 1), 4) as 1 | 2 | 3 | 4
    ];

  return (
    <footer className={`${def.background === 'band' ? 'bg-canvas' : 'bg-surface'} border-t border-line mt-8`}>
      <ReputationStrip />
      <div className={`max-w-6xl mx-auto px-4 sm:px-6 py-10 grid gap-8 ${gridColsClass}`}>
        {visibleColumns.map((c) => (
          <div key={c}>{columnContent[c]}</div>
        ))}
      </div>

      {PaymentStrip}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-6">
        <BusinessHoursTable />
      </div>

      <div className="border-t border-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 text-[13px] text-muted flex flex-col items-center gap-1 sm:flex-row sm:justify-between">
          <span>
            © {new Date().getFullYear()} Copyright <span className="text-ink font-medium">{storeName}</span>
          </span>
          <Link href={`/store/${subdomain}/report`} className="text-muted underline underline-offset-2 hover:text-ink transition-colors">
            {t('Report this store')}
          </Link>
          {footerConfig.showCredit !== false && <DeveloperCredit />}
        </div>
      </div>
    </footer>
  );
}
