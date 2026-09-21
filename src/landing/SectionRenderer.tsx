import type { StorefrontLandingPageProduct, StorefrontLandingPageSection } from '@/lib/storefrontApi';
import { SectionShell } from './SectionShell';
import { HeadingSection, TextSection, ImageSection, SpacerSection, ButtonSection } from './sections/Basic';
import { HeroSliderSection, BannerVideoSection, TwoColumnSection } from './sections/Hero';
import { SelectProductsSection, PriceOfferSection, CountdownTimerSection, StickyOrderBarSection } from './sections/Products';
import { CustomerReviewsSection, TrustBadgesSection, StatsSection } from './sections/Social';
import { FeatureGridSection, FaqSection, CarouselSection } from './sections/Content';
import { CheckoutFormSection, LeadFormSection } from './sections/Checkout';
import type {
  BannerVideoProps,
  ButtonProps,
  CarouselProps,
  CheckoutFormProps,
  CountdownTimerProps,
  CustomerReviewsProps,
  FaqProps,
  FeatureGridProps,
  HeadingProps,
  HeroSliderProps,
  ImageProps,
  LeadFormProps,
  PriceOfferProps,
  SelectProductsProps,
  SpacerProps,
  StatsProps,
  StickyOrderBarProps,
  TextProps,
  TrustBadgesProps,
  TwoColumnProps,
} from './types';

/**
 * Dispatches one section entry to its own component, by `type` — the
 * single shared, theme-independent render tree landing-plan.md §6 calls
 * for ("one shared `landing/` render tree in storefront/src/ consumes
 * the section JSON directly", not per-theme). Every section is wrapped in
 * SectionShell for the two concerns every section type shares: the
 * optional `style` slot and per-device visibility (Step 11).
 *
 * `productsById` is the page-level product-resolution map built once by
 * LandingPageView (see StorefrontService.getStoreLandingPage's own
 * comment on the backend) — passed down rather than re-resolved per
 * section so a page with many product-referencing sections only pays for
 * one lookup.
 *
 * An unrecognized `type` (e.g. a section saved by a newer build this
 * deployment doesn't know about yet) renders nothing rather than
 * crashing the whole page — same defensive-render discipline the rest of
 * storefront already applies to missing/unexpected data.
 */
export function SectionRenderer({
  section,
  subdomain,
  slug,
  productsById,
}: {
  section: StorefrontLandingPageSection;
  subdomain: string;
  slug: string;
  productsById: Map<string, StorefrontLandingPageProduct>;
}) {
  const props = section.props ?? {};
  const style = (props as { style?: import('./types').SectionStyle }).style;

  const content = (() => {
    switch (section.type) {
      case 'heading':
        return <HeadingSection props={props as unknown as HeadingProps} />;
      case 'text':
        return <TextSection props={props as unknown as TextProps} />;
      case 'image':
        return <ImageSection props={props as unknown as ImageProps} />;
      case 'spacer':
        return <SpacerSection props={props as unknown as SpacerProps} />;
      case 'button':
        return <ButtonSection props={props as unknown as ButtonProps} />;
      case 'hero-slider':
        return <HeroSliderSection props={props as unknown as HeroSliderProps} />;
      case 'banner-video':
        return <BannerVideoSection props={props as unknown as BannerVideoProps} />;
      case 'two-column':
        return <TwoColumnSection props={props as unknown as TwoColumnProps} />;
      case 'select-products':
        return <SelectProductsSection props={props as unknown as SelectProductsProps} productsById={productsById} />;
      case 'price-offer':
        return <PriceOfferSection props={props as unknown as PriceOfferProps} productsById={productsById} />;
      case 'countdown-timer':
        return <CountdownTimerSection props={props as unknown as CountdownTimerProps} />;
      case 'sticky-order-bar':
        return <StickyOrderBarSection props={props as unknown as StickyOrderBarProps} productsById={productsById} />;
      case 'customer-reviews':
        return <CustomerReviewsSection props={props as unknown as CustomerReviewsProps} />;
      case 'trust-badges':
        return <TrustBadgesSection props={props as unknown as TrustBadgesProps} />;
      case 'stats':
        return <StatsSection props={props as unknown as StatsProps} />;
      case 'faq':
        return <FaqSection props={props as unknown as FaqProps} />;
      case 'feature-grid':
        return <FeatureGridSection props={props as unknown as FeatureGridProps} />;
      case 'carousel':
        return <CarouselSection props={props as unknown as CarouselProps} />;
      case 'checkout-form': {
        const checkoutProps = props as unknown as CheckoutFormProps;
        const products = (checkoutProps.productIds ?? [])
          .map((id) => productsById.get(id))
          .filter((p): p is StorefrontLandingPageProduct => !!p);
        return <CheckoutFormSection props={checkoutProps} subdomain={subdomain} products={products} />;
      }
      case 'lead-form':
        return <LeadFormSection props={props as unknown as LeadFormProps} subdomain={subdomain} slug={slug} />;
      default:
        return null;
    }
  })();

  if (content === null) return null;

  // sticky-order-bar is fixed-position by design (see its own component)
  // — wrapping it in SectionShell's plain <section> is still correct
  // (SectionShell applies no positioning of its own), but it does NOT get
  // an `id` (a fixed bar has no natural in-page scroll anchor).
  return (
    <SectionShell style={style} visibility={section.visibility} id={section.id}>
      {content}
    </SectionShell>
  );
}
