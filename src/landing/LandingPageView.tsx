import type { StorefrontLandingPageData } from '@/lib/storefrontApi';
import { SectionRenderer } from './SectionRenderer';
import { LandingPageVisitBeacon } from './LandingPageVisitBeacon';
import { ChatButton } from './ChatButton';

/** Turns a free-text font-family name (LandingPage.headingFont/bodyFont — landing-page-sections.md's own note: "plain free-text ... handed to a CSS font-family/Google Fonts lookup at render time, not a constrained internal choice") into a Google Fonts URL, best-effort. A vendor who types a name Google Fonts doesn't have just gets the browser's own fallback chain below, never a broken page. */
function googleFontsHref(fontNames: string[]): string | null {
  const unique = Array.from(new Set(fontNames.filter((n): n is string => !!n?.trim())));
  if (unique.length === 0) return null;
  const families = unique.map((n) => `family=${encodeURIComponent(n.trim()).replace(/%20/g, '+')}:wght@400;600;700`);
  return `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap`;
}

/**
 * Renders one published landing page (landing-plan.md §6, §8) — the
 * single shared, theme-independent tree every FULL_PAGE/WITH_STORE_CHROME
 * landing page goes through regardless of the vendor's MEDIUM/MINIMAL/
 * STOREPAL storefront theme. The calling route (page.tsx) decides whether
 * to also render StoreHeader/StoreFooter around this (WITH_STORE_CHROME)
 * or not (FULL_PAGE) — this component itself never renders either, it's
 * purely the section stack + page-level chrome (fonts, custom CSS, chat
 * button, visit beacon).
 */
export function LandingPageView({ subdomain, data }: { subdomain: string; data: StorefrontLandingPageData }) {
  const { landingPage, products } = data;
  const productsById = new Map(products.map((p) => [p.id, p]));

  const fontHref = googleFontsHref([landingPage.headingFont ?? '', landingPage.bodyFont ?? '']);
  const bodyFontFamily = landingPage.bodyFont ? `"${landingPage.bodyFont}", sans-serif` : undefined;
  const headingFontFamily = landingPage.headingFont ? `"${landingPage.headingFont}", sans-serif` : undefined;

  return (
    <div className="bg-white" style={{ fontFamily: bodyFontFamily }}>
      {fontHref && <link rel="stylesheet" href={fontHref} />}
      {headingFontFamily && (
        <style>{`#landing-page-${landingPage.id} h1, #landing-page-${landingPage.id} h2, #landing-page-${landingPage.id} h3 { font-family: ${headingFontFamily}; }`}</style>
      )}
      {landingPage.customCss && (
        // Store > Landing Pages > Advanced > Custom CSS — scoped to this
        // page only per landing-page-sections.md's own framing ("Custom
        // CSS stays available under Advanced for power users, scoped to
        // that page only"). Trusted as-is: this is vendor-authored
        // content entered in the authenticated builder, same trust level
        // Page.content's HTML already gets — never shopper-supplied.
        // eslint-disable-next-line react/no-danger
        <style dangerouslySetInnerHTML={{ __html: landingPage.customCss }} />
      )}

      <div id={`landing-page-${landingPage.id}`}>
        {landingPage.sections.map((section) => (
          <SectionRenderer
            key={section.id}
            section={section}
            subdomain={subdomain}
            slug={landingPage.slug}
            productsById={productsById}
          />
        ))}
      </div>

      {landingPage.chatButtonEnabled && landingPage.chatButtonLink && (
        <ChatButton link={landingPage.chatButtonLink} imageUrl={landingPage.chatButtonImageUrl} />
      )}

      <LandingPageVisitBeacon subdomain={subdomain} slug={landingPage.slug} />
    </div>
  );
}
