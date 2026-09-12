'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Instagram, Twitter, Youtube, Linkedin, MessageCircle } from 'lucide-react';
import { getStoreSocialLinks, type SocialLinks } from '@/lib/socialLinksApi';

interface StoreFooterProps {
  subdomain: string;
  storeName: string;
  // A short "about" blurb shown in the footer's rightmost column on the
  // reference site — sourced from the vendor's own "About Us" Store >
  // Pages content when one exists (see reference screenshot: the
  // footer repeats the same copy as the About Us page itself), falling
  // back to a generic line when the vendor hasn't written one yet. This
  // is raw RichTextEditor HTML (same as Page.content) when passed, not
  // plain text — see how it's rendered below.
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
}

// Store > Pages links the reference footer always shows — matched by
// slug against whatever pages a vendor has actually published (see
// Store > Pages on the dashboard). A page that doesn't exist for this
// vendor simply doesn't render its link, rather than pointing at a 404.
const INFO_LINKS: { label: string; slug: string }[] = [
  { label: 'ABOUT US', slug: 'about-us' },
  { label: 'CONTACT US', slug: 'contact-us' },
  { label: 'PRIVACY POLICY', slug: 'privacy-policy' },
  { label: 'Return, Refund & Exchange Policy', slug: 'return-refund-exchange-policy' },
];

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

export function StoreFooter({ subdomain, storeName, aboutBlurb, logoUrl: logoUrlProp, socialLinks: socialLinksProp }: StoreFooterProps) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [fetchedBranding, setFetchedBranding] = useState<SocialLinks & { logoUrl?: string | null } | null>(null);

  useEffect(() => {
    if (socialLinksProp && logoUrlProp !== undefined) return; // Caller already has both — no need to fetch.
    getStoreSocialLinks(subdomain).then(setFetchedBranding);
  }, [subdomain, socialLinksProp, logoUrlProp]);

  const socialLinks = socialLinksProp ?? fetchedBranding ?? {};
  const logoUrl = logoUrlProp ?? fetchedBranding?.logoUrl ?? null;
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

  return (
    <footer className="bg-canvas border-t border-line mt-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid gap-8 sm:grid-cols-3">
        <div>
          {logoUrl ? (
            <span className="relative block h-10 w-40 mb-4">
              <Image src={logoUrl} alt={storeName} fill sizes="160px" className="object-contain object-left" />
            </span>
          ) : (
            <span className="font-display font-extrabold text-3xl text-ink tracking-tight block mb-4">{storeName}</span>
          )}

          <form onSubmit={handleSubscribe} className="flex max-w-xs">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your Email"
              className="flex-1 px-3.5 py-2.5 text-[13px] bg-surface border border-line-strong rounded-l-md outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-accent hover:bg-accent-dark text-white text-[13px] font-bold rounded-r-md transition-colors"
            >
              subscribe
            </button>
          </form>
          {subscribed && <p className="mt-2 text-[12px] text-success">Thanks for subscribing!</p>}

          {activePlatforms.length > 0 && (
            <>
              <p className="text-[13px] font-semibold text-ink mt-6 mb-2">Social Link</p>
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
          )}
        </div>

        <div>
          <p className="text-[15px] font-semibold text-ink mb-3">INFORMATION</p>
          <div className="flex flex-col gap-2.5 text-[13px]">
            {INFO_LINKS.map((link) => (
              <Link
                key={link.slug}
                href={`/store/${subdomain}/page/${link.slug}`}
                className="text-accent hover:text-accent-dark transition-colors w-fit"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 text-center text-[13px] text-muted">
          © {new Date().getFullYear()} Copyright <span className="text-ink font-medium">{storeName}</span>
        </div>
      </div>
    </footer>
  );
}
