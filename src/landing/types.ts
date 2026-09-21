// Storefront-side mirror of client/src/lib/landingSections.ts, itself the
// client's mirror of the shared contract at the workspace root,
// `landing-page-sections.md`. All three are kept in sync by hand (same
// convention CLAUDE.md already documents for storefrontApi.ts's types
// across repos) — see that file for the authoritative prop shapes,
// defaults and render notes.
//
// This file only declares the per-type PROPS shapes the render tree
// reads. Envelope fields (id/type/visibility) are
// StorefrontLandingPageSection in lib/storefrontApi.ts.

export interface SectionStyle {
  backgroundColor?: string;
  backgroundImageUrl?: string;
  paddingTop?: number;
  paddingBottom?: number;
}

export interface HeadingProps {
  text: string;
  level: 'h1' | 'h2' | 'h3';
  align: 'left' | 'center' | 'right';
  style?: SectionStyle;
}

export interface TextProps {
  html: string;
  align?: 'left' | 'center' | 'right';
  style?: SectionStyle;
}

export interface ImageProps {
  imageUrl: string;
  alt: string;
  link?: string;
  fit: 'cover' | 'contain';
  style?: SectionStyle;
}

export interface SpacerProps {
  heightPx: number;
  showLine?: boolean;
  lineStyle?: 'solid' | 'dashed';
}

export interface ButtonProps {
  label: string;
  link: string;
  variant: 'primary' | 'secondary' | 'outline';
  align: 'left' | 'center' | 'right';
  openInNewTab?: boolean;
}

export interface HeroSlide {
  imageUrl: string;
  headline: string;
  subheadline?: string;
  ctaLabel?: string;
  ctaLink?: string;
}

export interface HeroSliderProps {
  slides: HeroSlide[];
  autoplayMs?: number;
  style?: SectionStyle;
}

export interface BannerVideoProps {
  videoUrl: string;
  posterImageUrl?: string;
  overlayText?: string;
  autoplay: boolean;
  muted: boolean;
  loop: boolean;
  style?: SectionStyle;
}

export type TwoColumnSide = { kind: 'image'; imageUrl: string; alt?: string } | { kind: 'html'; html: string };

export interface TwoColumnProps {
  left: TwoColumnSide;
  right: TwoColumnSide;
  stackOnMobile: boolean;
  style?: SectionStyle;
}

export interface SelectProductsProps {
  productIds: string[];
  layout: 'single' | 'grid' | 'carousel';
  showPrice: boolean;
  showStock: boolean;
  columns?: 2 | 3 | 4;
  style?: SectionStyle;
}

export interface PriceOfferProps {
  productId?: string;
  wasPrice: number;
  nowPrice: number;
  ctaLabel: string;
  ctaLink: string;
  backgroundImageUrl?: string;
  style?: SectionStyle;
}

export interface CountdownTimerProps {
  endsAt: string;
  style_: 'boxes' | 'inline';
  expiredBehavior: 'hide' | 'showMessage';
  expiredMessage?: string;
  style?: SectionStyle;
}

export interface StickyOrderBarProps {
  productId?: string;
  ctaLabel: string;
  ctaLink: string;
  showAfterScrollPx: number;
}

export interface CustomerReview {
  name: string;
  avatarUrl?: string;
  text: string;
  rating?: 1 | 2 | 3 | 4 | 5;
  timeAgo?: string;
  reactionCounts?: { love?: number; wow?: number; sad?: number };
}

export interface CustomerReviewsProps {
  reviews: CustomerReview[];
  title?: string;
  style?: SectionStyle;
}

export interface TrustBadgesProps {
  badges: Array<{ imageUrl: string; label?: string }>;
  title?: string;
  style?: SectionStyle;
}

export interface StatsProps {
  stats: Array<{ value: string; label: string }>;
  style?: SectionStyle;
}

export interface FaqProps {
  items: Array<{ question: string; answer: string }>;
  title?: string;
  style?: SectionStyle;
}

export interface FeatureGridProps {
  title?: string;
  items: Array<{ imageUrl: string; title: string; description?: string }>;
  columns?: 2 | 3 | 4;
  hoverReveal: boolean;
  style?: SectionStyle;
}

export interface CarouselProps {
  items: Array<{ imageUrl: string; caption?: string; link?: string }>;
  autoplayMs?: number;
  style?: SectionStyle;
}

export interface CheckoutFormProps {
  productIds: string[];
  codOnly: boolean;
  collectFields: {
    name: true;
    phone: true;
    address: true;
    district: boolean;
    shippingOption: boolean;
  };
  fraudCheckEnabled: boolean;
  style?: SectionStyle;
}

export interface LeadFormProps {
  collectFields: { name: true; phone: true; email: boolean };
  destination: 'vendor-dashboard' | 'whatsapp';
  whatsappNumber?: string;
  successMessage?: string;
  style?: SectionStyle;
}
