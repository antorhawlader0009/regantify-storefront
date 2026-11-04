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
import { PlaymateLogo } from './PlaymateHeader';

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
  return (
    <div>
      <h3 className="text-[12px] font-bold uppercase tracking-wide text-ink">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={`${l.label}-${l.url}`}>
            {/^https?:\/\//i.test(l.url) ? (
              <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-[12px] text-ink/80 transition hover:text-accent">
                {l.label}
              </a>
            ) : (
              <Link href={l.url} className="text-[12px] text-ink/80 transition hover:text-accent">
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
 * PlayMate's footer (templete/playmate Footer.tsx): light lavender, the wordmark with the store's words and social
 * icons, link columns (Shop, Customer Service, Company), the store's highlights as a perks column, and a bottom bar.
 * It shows everything StorePal's footer does: the call bar, reputation numbers, contact lines, app badges, shop hours,
 * the "Find us" map, the pages (with the demo pages a store has not written yet), track order, contact, FAQ, shops,
 * gift cards, magazine, the store's own footer links, the report link, the app links and the credit.
 */
export function PlaymateFooter({ subdomain, storeName, aboutBlurb, logoUrl: logoUrlProp, socialLinks: socialLinksProp, footerConfig: footerConfigProp }: StoreFooterProps) {
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
    <footer data-rg="footer" className="mt-10 bg-accent-light">
      {(!config || config.showCallBar !== false) && (
        <FooterCallBar
          title={config?.callBarTitle}
          text={config?.callBarText}
          phone={config?.callBarPhone || config?.contactPhone || defaultCallPhone}
          whatsapp={config?.callBarWhatsapp}
          fallbackWhatsapp={defaultWhatsapp}
          look="playmate"
        />
      )}
      <ReputationStrip />
      <div className="pm-wrap grid grid-cols-2 gap-x-6 gap-y-10 py-10 md:grid-cols-3 lg:grid-cols-[1.35fr_0.8fr_1fr_0.9fr_1.35fr] lg:gap-8">
        <div className="col-span-2 md:col-span-3 lg:col-span-1">
          <PlaymateLogo logoUrl={logoUrl} storeName={storeName} />
          {about && (
            <div className="mt-4 max-w-[260px] text-[12px] leading-relaxed text-ink/80 [&_p]:m-0" dangerouslySetInnerHTML={{ __html: about }} />
          )}
          {contactLines.length > 0 && (
            <ul className="mt-4 space-y-1.5">
              {contactLines.map(({ icon: Icon, text, href }) => (
                <li key={text} className="flex items-start gap-2 text-[12px] text-ink/80">
                  <Icon size={14} className="mt-0.5 shrink-0" aria-hidden />
                  {href ? (
                    <a href={href} className="hover:text-accent">
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
            <div className="mt-5 flex items-center gap-4">
              {platforms.map(({ key, label, Icon }) => (
                <a key={key} href={socialLinks[key]!} target="_blank" rel="noopener noreferrer" aria-label={label} className="rounded text-ink transition hover:text-accent">
                  <Icon className="h-[18px] w-[18px]" />
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
        <ul className="col-span-2 grid gap-4 sm:grid-cols-2 md:col-span-3 md:grid-cols-4 lg:col-span-1 lg:block lg:space-y-4 lg:border-l lg:border-ink/10 lg:pl-8">
          {perks.map((perk) => {
            const Icon = highlightIcon(perk.icon);
            return (
              <li key={perk.id} className="flex items-center gap-3">
                <Icon className="h-6 w-6 shrink-0 text-ink" strokeWidth={1.5} aria-hidden />
                <div>
                  <p className="text-[10.5px] font-bold uppercase tracking-wide text-ink">{t(perk.title)}</p>
                  {perk.text && <p className="text-[11px] text-ink/70">{t(perk.text)}</p>}
                </div>
              </li>
            );
          })}
        </ul>
        )}
      </div>

      <div className="pm-wrap grid gap-6 pb-8 md:grid-cols-2">
        <BusinessHoursTable />
        <FooterLocation address={config?.contactAddress || contact?.basedIn} upper />
      </div>

      <div className="border-t border-ink/10">
        <div className="pm-wrap flex flex-col items-center justify-between gap-3 pb-24 pt-5 text-[11px] text-ink/70 sm:flex-row sm:flex-wrap sm:pb-5">
          <p className="text-center">
            © {new Date().getFullYear()} {storeName}. {t('All rights reserved.')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
            <Link href={`${base}/report`} className="underline underline-offset-2 hover:text-ink">
              {t('Report this store')}
            </Link>
            <GetAppLink subdomain={subdomain} label={t('Get the Regantify app')} className="font-medium text-accent hover:text-accent-dark" />
            <AboutAppLink label={t('About this app')} className="font-medium text-accent hover:text-accent-dark" />
            {config?.showCredit !== false && <DeveloperCredit />}
          </div>
        </div>
      </div>
    </footer>
  );
}
