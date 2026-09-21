// Client-side (browser) fetch helper for Store > Social's public links
// — used only by client-component pages (account/*, which read cart/
// customer-auth state from localStorage) that don't already have a
// server-fetched StorefrontInfo in scope (see storefrontApi.ts, which
// only runs server-side). Same host-detection pattern as
// checkoutApi.ts/customerAuthApi.ts; see either file's header comment
// for why this can't use the server-only API_URL.
function apiOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL;
  if (configured) return configured.replace(/\/$/, '');
  if (typeof window === 'undefined') return 'http://localhost:4000';
  return `${window.location.protocol}//${window.location.hostname}:4000`;
}

export interface SocialLinks {
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  twitterUrl?: string | null;
  youtubeUrl?: string | null;
  tiktokUrl?: string | null;
  linkedinUrl?: string | null;
  whatsappUrl?: string | null;
}

// Store > Footer — same shape as StorefrontFooterConfig in
// storefrontApi.ts, duplicated here rather than imported since this file
// is the CLIENT-side (browser fetch) counterpart used by pages that
// don't have a server-fetched StorefrontInfo in scope (see this file's
// own header comment) — kept in lockstep by hand, same convention as
// every other type in this file.
export interface StoreFooterLink {
  label: string;
  url: string;
}

export interface StoreFooterConfig {
  template: string;
  menuTitle: string;
  menuLinks: StoreFooterLink[];
  infoTitle: string;
  infoLinks: StoreFooterLink[];
  aboutBlurb: string | null;
  showSocialIcons: boolean;
  showSubscribeBlock: boolean;
  subscribeHeading: string;
  subscribeSubheading: string;
  showPaymentIcons: boolean;
  paymentIcons: string[];
}

// Store > Logo — bundled into the same fetch/shape as social links
// below since both live on the same public /v1/store/:subdomain
// response; no separate round trip needed for account pages that need
// one but not the other.
export interface StoreBranding extends SocialLinks {
  logoUrl?: string | null;
  // Store > Footer — null when the vendor's never saved one (see
  // FooterConfig's own "singleton, optional" schema comment); the
  // StoreFooter component falls back to its own hardcoded content in
  // that case, same as every other caller of this config.
  footerConfig?: StoreFooterConfig | null;
}

const EMPTY_LINKS: StoreBranding = {};

/**
 * Public store-info lookup, but this file only ever reads the logo +
 * social-link + footer-config fields off it — a page with its own
 * server-fetched StorefrontInfo (home, product, cart, checkout) should
 * pass those fields straight through as a prop instead of calling this,
 * since that's already the same data with no extra round trip. Falls
 * back to an empty object rather than throwing: a footer with no logo/
 * social icons is a fine degraded state, not worth blocking the page over.
 */
export async function getStoreSocialLinks(subdomain: string): Promise<StoreBranding> {
  try {
    const res = await fetch(`${apiOrigin()}/v1/store/${subdomain}`);
    if (!res.ok) return EMPTY_LINKS;
    const data = await res.json();
    return {
      logoUrl: data.logoUrl ?? null,
      facebookUrl: data.facebookUrl ?? null,
      instagramUrl: data.instagramUrl ?? null,
      twitterUrl: data.twitterUrl ?? null,
      youtubeUrl: data.youtubeUrl ?? null,
      tiktokUrl: data.tiktokUrl ?? null,
      linkedinUrl: data.linkedinUrl ?? null,
      whatsappUrl: data.whatsappUrl ?? null,
      footerConfig: data.footerConfig ?? null,
    };
  } catch {
    return EMPTY_LINKS;
  }
}
