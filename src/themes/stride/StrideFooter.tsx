'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Facebook, Instagram, Linkedin, Mail, MapPin, MessageCircle, Phone, Twitter, Youtube } from 'lucide-react';
import { getStoreSocialLinks, type SocialLinks, type StoreFooterConfig } from '@/lib/socialLinksApi';
import { missingDemoPages } from '@/lib/demoPages';
import { AboutAppLink, GetAppLink } from '@/components/GetAppLink';
import type { StoreFooterProps } from '../storepal/components/StoreFooter';
import { DeveloperCredit, FooterCallBar } from '../storepal/components/StoreFooter';
import {
  getGiftCardSale,
  getStoreContactInfo,
  getStoreHasBlog,
  getStoreHasFaq,
  getStoreHasLocations,
  getStorePages,
  type StoreContactInfo,
  type StorefrontPageSummary,
} from '../storepal/lib/storeNavApi';
import { useHeaderNav } from '../storepal/lib/headerNav';
import { useStorePalDesign } from '../storepal/lib/designSettings';
import { useStoreText } from '../storepal/lib/storeText';
import { highlightIcon } from '../storepal/lib/highlightIcons';
import { ReputationStrip } from '../storepal/components/ReputationStrip';
import { BusinessHoursTable } from '../storepal/components/BusinessHoursTable';
import { FooterLocation } from '../storepal/components/FooterLocation';
import { APP_STORE_BADGE, GOOGLE_PLAY_BADGE } from '../storepal/lib/appBadges';
import { StrideLogo } from './StrideHeader';

const PLATFORMS: { key: keyof SocialLinks; label: string; Icon: typeof Facebook }[] = [
  { key: 'facebookUrl', label: 'Facebook', Icon: Facebook },
  { key: 'instagramUrl', label: 'Instagram', Icon: Instagram },
  { key: 'twitterUrl', label: 'X (Twitter)', Icon: Twitter },
  { key: 'youtubeUrl', label: 'YouTube', Icon: Youtube },
  { key: 'linkedinUrl', label: 'LinkedIn', Icon: Linkedin },
  { key: 'whatsappUrl', label: 'WhatsApp', Icon: MessageCircle },
];

type FooterLink = { label: string; url: string };

function LinkList({ title, links }: { title: string; links: FooterLink[] }) {
  if (links.length === 0) return null;
  const cls = 'text-[11px] text-neutral-300 transition hover:text-white';
  return (
    <div>
      <h4 className="mb-3 text-[10px] font-extrabold uppercase tracking-wider text-white">{title}</h4>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={`${l.label}-${l.url}`}>
            {/^https?:\/\//i.test(l.url) ? (
              <a href={l.url} target="_blank" rel="noopener noreferrer" className={cls}>
                {l.label}
              </a>
            ) : (
              <Link href={l.url} className={cls}>
                {l.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Stride's footer (resources/views/layouts/app.blade.php .s-footer): black, the light "Got a question?" band on top, the
 * store's logo and words with round bordered social icons, link columns (Shop, Customer Service, Company), the store's
 * highlights as a last column, and a centred copyright line over a thin line. It shows everything StorePal's footer does:
 * reputation numbers, contact lines, app badges, shop hours, the "Find us" map, the pages (with the demo pages a store has
 * not written yet), track order, contact, FAQ, shops, gift cards, magazine, the store's own footer links, the report link,
 * the app links and the credit. The template's sample columns and its "Prices in Bangladeshi Taka" line are not drawn: a
 * store shows only links to pages it has.
 */
export function StrideFooter({ subdomain, storeName, aboutBlurb, logoUrl: logoUrlProp, socialLinks: socialLinksProp, footerConfig: footerConfigProp }: StoreFooterProps) {
  const t = useStoreText();
  const design = useStorePalDesign();
  const { categories } = useHeaderNav(subdomain, [], []);
  const [fetched, setFetched] = useState<{ logoUrl?: string | null; socialLinks: SocialLinks; footerConfig: StoreFooterConfig | null } | null>(null);
  const [pages, setPages] = useState<StorefrontPageSummary[]>([]);
  const [pagesLoaded, setPagesLoaded] = useState(false);
  const [hasBlog, setHasBlog] = useState(false);
  const [hasFaq, setHasFaq] = useState(false);
  const [contact, setContact] = useState<StoreContactInfo | null>(null);
  const [hasLocations, setHasLocations] = useState(false);
  const [hasGiftCards, setHasGiftCards] = useState(false);

  const haveAllProps = socialLinksProp && logoUrlProp !== undefined && footerConfigProp !== undefined;
  useEffect(() => {
    if (haveAllProps) return;
    getStoreSocialLinks(subdomain).then((data) => setFetched({ logoUrl: data.logoUrl, socialLinks: data, footerConfig: data.footerConfig ?? null }));
  }, [subdomain, haveAllProps]);
  useEffect(() => {
    getStorePages(subdomain).then((list) => {
      setPages(list);
      setPagesLoaded(true);
    });
    getStoreHasBlog(subdomain).then(setHasBlog);
    getStoreHasFaq(subdomain).then(setHasFaq);
    getStoreContactInfo(subdomain).then(setContact);
    getStoreHasLocations(subdomain).then(setHasLocations);
    getGiftCardSale(subdomain).then((c) => setHasGiftCards(!!c?.enabled && c.amounts.length > 0));
  }, [subdomain]);

  const socialLinks = socialLinksProp ?? fetched?.socialLinks ?? {};
  const logoUrl = logoUrlProp ?? fetched?.logoUrl ?? null;
  const config = footerConfigProp !== undefined ? footerConfigProp : (fetched?.footerConfig ?? null);
  const platforms = config && config.showSocialIcons === false ? [] : PLATFORMS.filter((p) => socialLinks[p.key]?.trim());
  const base = `/store/${subdomain}`;

  const demoLang = design.storeLanguage === 'bn' ? 'bn' : 'en';
  const demoLinks = pagesLoaded && !config ? missingDemoPages(pages).map((d) => ({ kind: d.kind, label: d.title[demoLang], url: `${base}/page/${d.slug}` })) : [];

  const shopLinks: FooterLink[] = [
    ...categories.slice(0, 6).map((name) => ({ label: name, url: `${base}?category=${encodeURIComponent(name)}` })),
    { label: t('All products'), url: `${base}/products` },
  ];
  const serviceLinks: FooterLink[] = [
    { label: t('Track order'), url: `${base}/orders` },
    ...(contact ? [{ label: t('Contact us'), url: `${base}/contact` }] : []),
    ...(hasFaq ? [{ label: t('FAQ'), url: `${base}/faq` }] : []),
    ...(hasLocations ? [{ label: t('Our shops'), url: `${base}/locations` }] : []),
    ...(hasGiftCards ? [{ label: t('Gift cards'), url: `${base}/gift-card` }] : []),
    ...demoLinks.filter((l) => l.kind === 'DELIVERY' || l.kind === 'RETURN').map(({ label, url }) => ({ label, url })),
  ];
  const companyLinks: FooterLink[] = [
    ...(config ? config.infoLinks : pages.map((p) => ({ label: p.title, url: `${base}/page/${p.slug}` }))),
    ...demoLinks.filter((l) => l.kind !== 'DELIVERY' && l.kind !== 'RETURN').map(({ label, url }) => ({ label, url })),
    ...(hasBlog ? [{ label: t('Magazine'), url: `${base}/blog` }] : []),
  ];
  const menuLinks: FooterLink[] = config ? [...config.menuLinks, ...(config.extraLinks ?? [])] : [];

  const perks = design.homeHighlights.slice(0, 4);
  const about = (config?.aboutBlurb ?? aboutBlurb)?.trim();
  const contactLines = config?.showContact
    ? [
        config.contactPhone ? { icon: Phone, text: config.contactPhone, href: `tel:${config.contactPhone.replace(/[^\d+]/g, '')}` } : null,
        config.contactEmail ? { icon: Mail, text: config.contactEmail, href: `mailto:${config.contactEmail}` } : null,
        config.contactAddress ? { icon: MapPin, text: config.contactAddress, href: null } : null,
      ].filter((l): l is { icon: typeof Phone; text: string; href: string | null } => !!l)
    : [];
  const defaultCallPhone = contact?.phone?.label || (design.headerPhoneEnabled ? design.headerPhone : '') || '';
  const defaultWhatsapp = contact?.whatsapp?.url || socialLinks.whatsappUrl || '';
  const showApps = !!config?.showApps && !!(config.playStoreUrl?.trim() || config.appStoreUrl?.trim());

  return (
    <footer data-rg="footer" className="mt-14 bg-[var(--st-footer)] text-white">
      {(!config || config.showCallBar !== false) && (
        <FooterCallBar
          title={config?.callBarTitle}
          text={config?.callBarText}
          phone={config?.callBarPhone || config?.contactPhone || defaultCallPhone}
          whatsapp={config?.callBarWhatsapp}
          design={config?.callBarStyle}
          fallbackWhatsapp={defaultWhatsapp}
          look="stride"
        />
      )}
      <ReputationStrip />
      <div className={`st-wrap grid grid-cols-2 gap-x-6 gap-y-9 py-10 sm:grid-cols-3 lg:gap-x-10 ${perks.length > 0 ? 'lg:grid-cols-[1.3fr_1fr_1.3fr_1fr_1.2fr]' : 'lg:grid-cols-[1.4fr_1fr_1.3fr_1fr]'}`}>
        <div className="col-span-2 sm:col-span-3 lg:col-span-1">
          {logoUrl ? (
            <span className="inline-block rounded bg-white p-3 text-ink">
              <StrideLogo logoUrl={logoUrl} storeName={storeName} />
            </span>
          ) : (
            <StrideLogo logoUrl={logoUrl} storeName={storeName} light />
          )}
          {about && <div className="mt-4 max-w-xs text-[12px] leading-relaxed text-neutral-300 [&_p]:m-0" dangerouslySetInnerHTML={{ __html: about }} />}
          {contactLines.length > 0 && (
            <ul className="mt-4 space-y-1.5">
              {contactLines.map(({ icon: Icon, text, href }) => (
                <li key={text} className="flex items-start gap-2 text-[11px] text-neutral-300">
                  <Icon size={15} className="mt-1 shrink-0 text-white" aria-hidden />
                  {href ? (
                    <a href={href} className="hover:text-white">
                      {text}
                    </a>
                  ) : (
                    <span>{text}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
          {platforms.length > 0 && (
            <div className="mt-6 flex gap-4">
              {platforms.map(({ key, label, Icon }) => (
                <a key={key} href={socialLinks[key]!} target="_blank" rel="noopener noreferrer" aria-label={label} className="flex h-9 w-9 items-center justify-center text-white transition hover:text-[var(--st-lime)]">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          )}
          {showApps && (
            <div className="mt-5 flex flex-wrap gap-2">
              {config!.playStoreUrl?.trim() && (
                <a href={config!.playStoreUrl} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={GOOGLE_PLAY_BADGE} alt="Get it on Google Play" className="h-10 w-auto" />
                </a>
              )}
              {config!.appStoreUrl?.trim() && (
                <a href={config!.appStoreUrl} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={APP_STORE_BADGE} alt="Download on the App Store" className="h-10 w-auto" />
                </a>
              )}
            </div>
          )}
        </div>
        <LinkList title={t('Shop')} links={shopLinks} />
        <LinkList title={t('Customer Service')} links={serviceLinks} />
        <LinkList title={config?.menuTitle || t('Company')} links={[...companyLinks, ...menuLinks]} />
        {perks.length > 0 && (
          <ul className="col-span-2 space-y-4 sm:col-span-3 lg:col-span-1">
            {perks.map((perk) => {
              const Icon = highlightIcon(perk.icon);
              return (
                <li key={perk.id} className="flex items-center gap-3">
                  <Icon className="h-7 w-7 shrink-0 text-white" strokeWidth={1.5} aria-hidden />
                  <div>
                    <p className="text-[13px] font-semibold text-white">{t(perk.title)}</p>
                    {perk.text && <p className="text-xs text-[#94a3b8]">{t(perk.text)}</p>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="st-wrap grid gap-6 pb-8 md:grid-cols-2">
        <BusinessHoursTable />
        <FooterLocation address={config?.contactAddress || contact?.basedIn} upper />
      </div>

      <div className="border-t border-white/10">
        <div className="st-wrap flex flex-col items-center justify-center gap-3 pb-24 pt-4 text-[10px] uppercase tracking-wider text-neutral-400 sm:pb-4">
          <p className="text-center">
            © {new Date().getFullYear()} {storeName}. {t('All rights reserved.')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
            <Link href={`${base}/report`} className="underline underline-offset-2 hover:text-white">
              {t('Report this store')}
            </Link>
            <GetAppLink subdomain={subdomain} label={t('Get the Regantify app')} className="font-medium text-[#cbd5e1] hover:text-white" />
            <AboutAppLink label={t('About this app')} className="font-medium text-[#cbd5e1] hover:text-white" />
            {config?.showCredit !== false && <DeveloperCredit />}
          </div>
        </div>
      </div>
    </footer>
  );
}
