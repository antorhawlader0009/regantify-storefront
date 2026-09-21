'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Instagram, Twitter, Youtube, Linkedin, MessageCircle } from 'lucide-react';
import { getStoreSocialLinks, type SocialLinks, type StoreFooterConfig } from '@/lib/socialLinksApi';
import { resolveFooterTemplate, PAYMENT_ICON_LABELS } from '@/lib/footerTemplates';

interface StoreFooterProps {
  subdomain: string;
  storeName: string;
  // Same prop-or-fetch convention as StorePal's StoreFooter — pages with
  // no server-fetched StorefrontInfo in scope simply omit these and this
  // component fetches them itself (see the effect below).
  logoUrl?: string | null;
  socialLinks?: SocialLinks;
  footerConfig?: StoreFooterConfig | null;
}

const PLATFORMS: { key: keyof SocialLinks; label: string; Icon: typeof Facebook }[] = [
  { key: 'facebookUrl', label: 'Facebook', Icon: Facebook },
  { key: 'instagramUrl', label: 'Instagram', Icon: Instagram },
  { key: 'twitterUrl', label: 'X (Twitter)', Icon: Twitter },
  { key: 'youtubeUrl', label: 'YouTube', Icon: Youtube },
  { key: 'linkedinUrl', label: 'LinkedIn', Icon: Linkedin },
  { key: 'whatsappUrl', label: 'WhatsApp', Icon: MessageCircle },
];

/**
 * Store > Footer's configurable, template-driven footer for the Medium
 * theme — same design as StorePal's StoreFooter (see that file's own doc
 * comment for the full reasoning); this copy renders with Medium's own
 * dark-block visual chrome instead. Structure (columns/blocks) is fully
 * configurable; colors/fonts/spacing stay Medium's own.
 *
 * BACKWARD COMPATIBILITY: no FooterConfig saved yet (the `!footerConfig`
 * branch below) renders the exact original hardcoded 3-column footer
 * (Shop / Delivery info, no logo/social/menu editing) this component
 * always rendered before this feature existed.
 */
export function StoreFooter({ subdomain, storeName, logoUrl: logoUrlProp, socialLinks: socialLinksProp, footerConfig: footerConfigProp }: StoreFooterProps) {
  const [fetched, setFetched] = useState<{ logoUrl?: string | null; socialLinks: SocialLinks; footerConfig: StoreFooterConfig | null } | null>(null);
  const haveAllProps = socialLinksProp && logoUrlProp !== undefined && footerConfigProp !== undefined;

  useEffect(() => {
    if (haveAllProps) return;
    getStoreSocialLinks(subdomain).then((data) =>
      setFetched({ logoUrl: data.logoUrl, socialLinks: data, footerConfig: data.footerConfig ?? null }),
    );
  }, [subdomain, haveAllProps]);

  const socialLinks = socialLinksProp ?? fetched?.socialLinks ?? {};
  const logoUrl = logoUrlProp ?? fetched?.logoUrl ?? null;
  const footerConfig = footerConfigProp !== undefined ? footerConfigProp : fetched?.footerConfig;
  const activePlatforms = PLATFORMS.filter((p) => socialLinks[p.key]?.trim());

  if (!footerConfig) {
    return (
      <footer className="bg-ink text-white mt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid gap-8 sm:grid-cols-3">
          <div>
            <p className="font-display text-lg text-white mb-2">{storeName}</p>
            <p className="text-[12.5px] text-white/55 leading-relaxed max-w-xs">
              Cash on delivery available nationwide. Fast, reliable shipping on every order.
            </p>
          </div>

          <div>
            <p className="text-[11.5px] font-bold text-white mb-3 uppercase tracking-wider">Shop</p>
            <div className="flex flex-col gap-2.5 text-[12.5px] text-white/60">
              <Link href={`/store/${subdomain}`} className="hover:text-accent transition-colors w-fit">
                All products
              </Link>
              <Link href={`/store/${subdomain}/cart`} className="hover:text-accent transition-colors w-fit">
                Your cart
              </Link>
              <Link href={`/store/${subdomain}/orders`} className="hover:text-accent transition-colors w-fit">
                Track an order
              </Link>
            </div>
          </div>

          <div>
            <p className="text-[11.5px] font-bold text-white mb-3 uppercase tracking-wider">Delivery</p>
            <div className="flex flex-col gap-2.5 text-[12.5px] text-white/60">
              <span>Inside Dhaka — ৳70</span>
              <span>Outside Dhaka — ৳130</span>
              <span>Cash on delivery</span>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 text-[11.5px] text-white/35">
            © {new Date().getFullYear()} {storeName}
          </div>
        </div>
      </footer>
    );
  }

  const def = resolveFooterTemplate(footerConfig.template);
  const blurbHtml = footerConfig.aboutBlurb?.trim();

  const LogoColumn = (
    <div>
      {logoUrl ? (
        <span className="relative block h-9 w-36 mb-3">
          <Image src={logoUrl} alt={storeName} fill sizes="144px" className="object-contain object-left" />
        </span>
      ) : (
        <p className="font-display text-lg text-white mb-2">{storeName}</p>
      )}
      {def.logoCarriesAbout && (
        <div
          className="text-[12.5px] text-white/55 leading-relaxed max-w-xs [&_p]:mb-2"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: blurbHtml ?? 'Cash on delivery available nationwide. Fast, reliable shipping on every order.',
          }}
        />
      )}
      {footerConfig.showSocialIcons && activePlatforms.length > 0 && (
        <div className="flex gap-2 mt-4">
          {activePlatforms.map(({ key, label, Icon }) => (
            <a
              key={key}
              href={socialLinks[key]!}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="w-8 h-8 rounded flex items-center justify-center bg-white/10 text-white hover:bg-accent transition-colors"
            >
              <Icon size={14} />
            </a>
          ))}
        </div>
      )}
    </div>
  );

  const MenuColumn = footerConfig.menuLinks.length > 0 && (
    <div>
      <p className="text-[11.5px] font-bold text-white mb-3 uppercase tracking-wider">{footerConfig.menuTitle}</p>
      <div className="flex flex-col gap-2.5 text-[12.5px] text-white/60">
        {footerConfig.menuLinks.map((link, i) => (
          <Link key={i} href={link.url} className="hover:text-accent transition-colors w-fit">
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );

  const InfoColumn = footerConfig.infoLinks.length > 0 && (
    <div>
      <p className="text-[11.5px] font-bold text-white mb-3 uppercase tracking-wider">{footerConfig.infoTitle}</p>
      <div className="flex flex-col gap-2.5 text-[12.5px] text-white/60">
        {footerConfig.infoLinks.map((link, i) => (
          <Link key={i} href={link.url} className="hover:text-accent transition-colors w-fit">
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );

  const AboutColumn = !def.logoCarriesAbout && (
    <div>
      <div
        className="text-[12.5px] text-white/55 leading-relaxed max-w-xs [&_p]:mb-2"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: blurbHtml ?? 'Cash on delivery available nationwide. Fast, reliable shipping on every order.',
        }}
      />
      {footerConfig.showPaymentIcons && footerConfig.paymentIcons.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-4">
          {footerConfig.paymentIcons.map((key) => (
            <span key={key} className="px-2 py-1 rounded border border-white/15 text-[10px] font-semibold text-white/70">
              {PAYMENT_ICON_LABELS[key] ?? key}
            </span>
          ))}
        </div>
      )}
    </div>
  );

  const columnContent: Record<string, React.ReactNode> = { logo: LogoColumn, menu: MenuColumn, info: InfoColumn, about: AboutColumn };
  const visibleColumns = def.columns.filter((c) => columnContent[c]);
  const gridColsClass =
    { 1: 'sm:grid-cols-1', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-4' }[
      Math.min(Math.max(visibleColumns.length, 1), 4) as 1 | 2 | 3 | 4
    ];

  return (
    <footer className="bg-ink text-white mt-8">
      <div className={`max-w-6xl mx-auto px-4 sm:px-6 py-10 grid gap-8 ${gridColsClass}`}>
        {visibleColumns.map((c) => (
          <div key={c}>{columnContent[c]}</div>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 text-[11.5px] text-white/35">
          © {new Date().getFullYear()} {storeName}
        </div>
      </div>
    </footer>
  );
}
