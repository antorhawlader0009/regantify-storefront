'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Instagram, Twitter, Youtube, Linkedin, MessageCircle } from 'lucide-react';
import { getStoreSocialLinks, type SocialLinks, type StoreFooterConfig } from '@/lib/socialLinksApi';
import { getGiftCardSale, getStoreHasBlog, getStoreHasFaq, getStorePages, type StorefrontPageSummary } from '../lib/storeNavApi';
import { resolveFooterTemplate, PAYMENT_ICON_LABELS } from '@/lib/footerTemplates';
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
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
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
  }, [subdomain]);

  const socialLinks = socialLinksProp ?? fetched?.socialLinks ?? {};
  const logoUrl = logoUrlProp ?? fetched?.logoUrl ?? null;
  const footerConfig = footerConfigProp !== undefined ? footerConfigProp : fetched?.footerConfig;
  const activePlatforms = PLATFORMS.filter((p) => socialLinks[p.key]?.trim());

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    // No newsletter backend exists yet — this simply acknowledges the
    // submission client-side, matching the reference site's own
    // minimal footer (no confirmation email flow shown there either).
    setSubscribed(true);
    setEmail('');
  };

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

  // Not yet configured — original hardcoded 3-column footer, unchanged
  // from before Store > Footer existed. See this component's own
  // "BACKWARD COMPATIBILITY" doc comment above.
  if (!footerConfig) {
    return (
      <footer className="bg-canvas border-t border-line mt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid gap-8 sm:grid-cols-3">
          <div>
            {Logo}
            <form onSubmit={handleSubscribe} className="flex max-w-xs">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('Your Email')}
                className="flex-1 px-3.5 py-2.5 text-[13px] bg-surface border border-line-strong rounded-l-md outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-accent hover:bg-accent-dark text-white text-[13px] font-bold rounded-r-md transition-colors"
              >
                subscribe
              </button>
            </form>
            {subscribed && <p className="mt-2 text-[12px] text-success">{t('Thanks for subscribing!')}</p>}
            {SocialIcons}
          </div>

          {(pages.length > 0 || hasBlog || hasFaq || hasGiftCards) && (
            <div>
              <p className="text-[15px] font-semibold text-ink mb-3">{t('INFORMATION')}</p>
              <div className="flex flex-col gap-2.5 text-[13px]">
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
            </div>
          )}

          <div>
            {aboutBlurb?.trim() ? (
              <div
                className="text-[13px] text-muted leading-relaxed [&_p]:mb-2 line-clamp-6"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: aboutBlurb }}
              />
            ) : (
              <p className="text-[13px] text-muted leading-relaxed">
                {storeName} is more than just a store. We&apos;re a lifestyle brand that celebrates individuality and
                self-expression.
              </p>
            )}
          </div>
        </div>

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
      {def.supportsSubscribe && footerConfig.showSubscribeBlock && (
        <>
          <form onSubmit={handleSubscribe} className="flex max-w-xs">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('Your Email')}
              className="flex-1 px-3.5 py-2.5 text-[13px] bg-surface border border-line-strong rounded-l-md outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-accent hover:bg-accent-dark text-white text-[13px] font-bold rounded-r-md transition-colors"
            >
              subscribe
            </button>
          </form>
          {subscribed && <p className="mt-2 text-[12px] text-success">{t('Thanks for subscribing!')}</p>}
        </>
      )}
      {footerConfig.showSocialIcons && SocialIcons}
      {def.logoCarriesAbout &&
        (blurbHtml ? (
          <div
            className="text-[13px] text-muted leading-relaxed [&_p]:mb-2 line-clamp-6 mt-4"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: blurbHtml }}
          />
        ) : (
          <p className="text-[13px] text-muted leading-relaxed mt-4">
            {storeName} is more than just a store. We&apos;re a lifestyle brand that celebrates individuality and
            self-expression.
          </p>
        ))}
    </div>
  );

  const MenuColumn = footerConfig.menuLinks.length > 0 && (
    <div>
      <p className="text-[15px] font-semibold text-ink mb-3 uppercase">{footerConfig.menuTitle}</p>
      <div className="flex flex-col gap-2.5 text-[13px]">
        {footerConfig.menuLinks.map((link, i) => (
          <Link key={i} href={link.url} className="text-accent hover:text-accent-dark transition-colors w-fit">
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );

  // Falls back to the auto-populated Store > Pages list when the vendor
  // hasn't curated any infoLinks of their own yet — same list the
  // unconfigured branch above always showed, so switching TO a template
  // for the first time doesn't blank out this column.
  const infoItems =
    footerConfig.infoLinks.length > 0
      ? footerConfig.infoLinks
      : [...pages.map((p) => ({ label: p.title, url: `/store/${subdomain}/page/${p.slug}` })), ...(hasBlog ? [{ label: t('Magazine'), url: `/store/${subdomain}/blog` }] : []), ...(hasFaq ? [{ label: t('FAQ'), url: `/store/${subdomain}/faq` }] : [])];
  const InfoColumn = infoItems.length > 0 && (
    <div>
      <p className="text-[15px] font-semibold text-ink mb-3 uppercase">{footerConfig.infoTitle}</p>
      <div className="flex flex-col gap-2.5 text-[13px]">
        {infoItems.map((link, i) => (
          <Link key={i} href={link.url} className="text-accent hover:text-accent-dark transition-colors w-fit">
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );

  const AboutColumn = !def.logoCarriesAbout && (
    <div>
      {blurbHtml ? (
        <div
          className="text-[13px] text-muted leading-relaxed [&_p]:mb-2 line-clamp-6"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: blurbHtml }}
        />
      ) : (
        <p className="text-[13px] text-muted leading-relaxed">
          {storeName} is more than just a store. We&apos;re a lifestyle brand that celebrates individuality and
          self-expression.
        </p>
      )}
      {footerConfig.showPaymentIcons && footerConfig.paymentIcons.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-4">
          {footerConfig.paymentIcons.map((key) => (
            <span
              key={key}
              className="px-2 py-1 rounded border border-line-strong bg-surface text-[10px] font-semibold text-muted"
            >
              {PAYMENT_ICON_LABELS[key] ?? key}
            </span>
          ))}
        </div>
      )}
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
      <div className={`max-w-6xl mx-auto px-4 sm:px-6 py-10 grid gap-8 ${gridColsClass}`}>
        {visibleColumns.map((c) => (
          <div key={c}>{columnContent[c]}</div>
        ))}
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-6">
        <BusinessHoursTable />
      </div>

      <div className="border-t border-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 text-[13px] text-muted flex flex-col items-center gap-1 sm:flex-row sm:justify-between">
          <span>
            © {new Date().getFullYear()} Copyright <span className="text-ink font-medium">{storeName}</span>
          </span>
          {footerConfig.showCredit !== false && <DeveloperCredit />}
        </div>
      </div>
    </footer>
  );
}
