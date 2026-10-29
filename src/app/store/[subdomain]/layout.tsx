import type { Metadata, Viewport } from 'next';
import { getStoreInfo, siteUrl, StoreNotFoundError, type StorefrontLmsForms } from '@/lib/storefrontApi';
import { resolveTheme } from '@/lib/theme';
import { ThemeProvider } from '@/providers/theme-provider';
import { VisitBeacon } from '@/components/VisitBeacon';
import { OrdersOffBar } from '@/components/OrdersOffBar';
import { WebVitalsBeacon } from '@/components/WebVitalsBeacon';
import { ShopperStoreScope } from '@/components/ShopperStoreScope';
import { GdprPrompt } from '@/themes/storepal/components/GdprPrompt';
import { StoreAwayBanner } from '@/themes/storepal/components/StoreAwayBanner';
import type { StorefrontStoreAway } from '@/lib/storeAway';
import { CustomCodeInjector } from '@/themes/storepal/components/CustomCodeInjector';
import { StoreCodeHooks } from '@/components/StoreCodeHooks';
import { StorePalDesignProvider } from '@/themes/storepal/lib/designSettings';
import { UsdPriceProvider } from '@/lib/usdPrice';
import { safeFontName, storeFontStyle, storeFontsHref } from '@/lib/storeFonts';
import type { BusinessHours } from '@/lib/businessHours';
import { LazyAiAssistantWidget, LazyPopupCampaigns, LazyRecentBuyersPopup } from '@/themes/storepal/components/LazyWidgets';
import { InstallAppBanner } from '@/themes/storepal/components/InstallAppBanner';
import { WishlistSync } from '@/themes/storepal/components/WishlistSync';
import { MetaPixel } from '@/components/MetaPixel';
import { GoogleAnalytics } from '@/components/GoogleAnalytics';
import { GoogleTagManager } from '@/components/GoogleTagManager';
import { TiktokPixel } from '@/components/TiktokPixel';
import type {
  StorefrontCustomCode,
  StorefrontDesignSettings,
  StorefrontGdprPrompt,
  StorefrontGoogleAnalytics,
  StorefrontGoogleTagManager,
  StorefrontMetaPixel,
  StorefrontPopupCampaign,
  StorefrontTiktokPixel,
} from '@/lib/storefrontApi';
import { storeParams } from '@/lib/storeRequest';
import { StoreQueryAdapter } from '@/components/StoreQueryAdapter';

// PERFORMANCE-PLAN.md Step 8: a store page reads no request data (the address travels in the path, see
// lib/storeAddress.ts), so Next keeps the rendered page and serves it again for up to a minute, the same window as the
// data it shows. A vendor's edit clears it at once through /api/revalidate (revalidateTag on the store's tags). Pages
// that read the request (tracking/payment links, the home page's query view) are still rendered every time.
// First tried 2026-10-16 and taken out the same day: the headers' nuqs search box (useSearchParams with no <Suspense>)
// failed on a kept page and product clicks showed a 500. On again 2026-10-24 with StoreQueryAdapter below, which reads
// the query without useSearchParams, so every theme's header works on a kept page without being edited.
// A store's own address ({sub}.ROOT_DOMAIN, custom domains) is a middleware rewrite, which Next 15.5 does not keep
// (it matches the page against the address before the rewrite); patches/next+15.5.28.patch fixes that. Updating Next
// means checking that patch still applies (npm install fails loudly when it doesn't).
export const revalidate = 60;

// No store is built ahead of time; each page is rendered on its first visit and then kept. Next only keeps the pages of
// a dynamic route when the route lists its params, so it lists none (every [slug] page below does the same).
export function generateStaticParams() {
  return [];
}

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ subdomain: string }>;
}

/**
 * Store > Branding's favicon (Vendor.faviconUrl) — set at this segment's
 * layout level (Next's metadata API merges this with every page/route's
 * own generateMetadata under /store/[subdomain]) so it applies to every
 * route for this vendor, not just the homepage. Falls back to omitting
 * `icons` entirely when unset, which lets Next/the browser fall through
 * to the platform's own default favicon (e.g. the root layout's, or the
 * browser's blank-page default) — same "nullable, falls back to
 * platform default" contract as this field's schema comment.
 */
export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { subdomain } = await storeParams(params);
  try {
    const store = await getStoreInfo(subdomain);
    const metadata: Metadata = {};
    if (store.faviconUrl) metadata.icons = { icon: store.faviconUrl };

    // Install as app: the store's own web manifest and home-screen icon (manifest.webmanifest, app-icon/[size]), on every
    // template. Built with siteUrl so they are on the address the shopper is using (the store's own one, or the path form).
    try {
      const appName = store.designSettings?.appName?.trim() || store.storeName;
      metadata.manifest = await siteUrl(`/store/${subdomain}/manifest.webmanifest`);
      // No favicon uploaded: the store's own app icon (its logo, else its first letter on the accent colour), never the platform's.
      const icon = store.faviconUrl || (await siteUrl(`/store/${subdomain}/app-icon/192`));
      metadata.icons = { icon, apple: await siteUrl(`/store/${subdomain}/app-icon/180`) };
      metadata.appleWebApp = { capable: true, title: appName, statusBarStyle: 'default' };
    } catch {
      // No usable host (a build step): no manifest link.
    }

    // Store > SEO. Relative URLs in a page's metadata (share pictures, icons) are resolved against the store's own address; the
    // root layout's base is the platform's root domain, which is the wrong host for a store on its own subdomain or domain.
    try {
      metadata.metadataBase = new URL(new URL(await siteUrl(`/store/${subdomain}`)).origin);
    } catch {
      // No usable host (a build step, say): keep the root layout's base.
    }
    const seo = store.seo;
    // Indexing switched off: every page says noindex (robots.txt disallows the whole store and the sitemap is gone too).
    if (seo && !seo.allowIndexing) metadata.robots = { index: false, follow: false };
    // " | Store name" after page titles (people who search the store by name find it); pages that already carry their own
    // full title ask for `absolute`. The default is the title of a page that gives none.
    const defaultTitle = store.brandMetaTitle?.trim() || store.storeName;
    metadata.title = seo?.appendStoreName === false ? defaultTitle : { default: defaultTitle, template: `%s | ${store.storeName}` };
    // Google Search Console / Bing Webmaster ownership codes (only the code itself, cleaned by the server).
    if (seo?.googleVerification) metadata.verification = { google: seo.googleVerification };
    // Store > Integrations > Facebook Pixel's domain verification code, as
    // <meta name="facebook-domain-verification">. StorePal only, like the
    // pixel itself; the server keeps it to [A-Za-z0-9_-].
    const other: Record<string, string> = {};
    const verification = store.metaPixel?.domainVerificationCode;
    if (verification) other['facebook-domain-verification'] = verification;
    if (seo?.bingVerification) other['msvalidate.01'] = seo.bingVerification;
    if (Object.keys(other).length > 0) metadata.other = other;
    return metadata;
  } catch {
    return {};
  }
}

/** The browser bar's colour on phones (and in the installed app): the store's accent colour. */
export async function generateViewport({ params }: LayoutProps): Promise<Viewport> {
  const { subdomain } = await storeParams(params);
  const store = await getStoreInfo(subdomain).catch(() => null);
  const color = store?.accentColor && /^#[0-9a-f]{6}$/i.test(store.accentColor) ? store.accentColor : null;
  return color ? { themeColor: color } : {};
}

/**
 * Applies the vendor's chosen storefront theme (see StoreTheme,
 * Store > Theme on the dashboard) as a `data-theme` attribute wrapping
 * every route under /store/[subdomain] — globals.css's
 * [data-theme="minimal"] block then overrides every color/font/shadow
 * token for that whole subtree, so Medium and Minimal pages can share
 * the exact same utility classes (bg-canvas, text-ink, ...) and simply
 * render with the right theme's values. Also provides the resolved
 * theme via ThemeProvider so 'use client' routes (checkout, order
 * tracking, account/*) — which can't reach the server-only API_URL env
 * var themselves — know which component tree to render without a
 * second fetch (see providers/theme-provider.tsx).
 *
 * Store > Branding's accentColor/bodyBackgroundColor are applied here too,
 * as inline `--color-accent`/`--color-canvas` custom properties on this
 * same wrapper div — the EXACT variable names every theme's globals.css
 * already defines per [data-theme] block (see that file's own `@theme`/
 * [data-theme='...'] rules), so every theme's existing bg-accent/
 * text-accent/bg-canvas utility classes pick these up automatically via
 * plain CSS inheritance/specificity (an inline style on this element
 * outranks the attribute-selector rule that set the theme default),
 * with zero per-theme changes needed. Unset (null) fields are simply
 * omitted from the style object, which leaves the theme's own default in
 * effect. brandHeadingFont/brandBodyFont are injected the same way
 * landing pages already do it (lib/storeFonts.ts, which also sets the wrapper's own font-family) — a runtime
 * Google Fonts <link>, since next/font/google requires a static import
 * and can't load an arbitrary vendor-typed family name. Reuses the same
 * getStoreInfo call generateMetadata above already makes (Next.js
 * dedupes identical fetches within one render pass — see
 * storefrontApi.ts's own comment on this), so branding never costs a
 * second round trip beyond what this segment already fetches.
 *
 * A missing/unknown store still renders here (resolveTheme defaults to
 * MEDIUM) — the actual "store not found" decision and UI stay with each
 * page/not-found.tsx as before; this layout only ever adds a wrapper
 * div, never blocks rendering.
 */
export default async function StoreLayout({ children, params }: LayoutProps) {
  const { subdomain } = await storeParams(params);

  let theme = resolveTheme('MEDIUM');
  let storeExists = false;
  let accentColor: string | null | undefined;
  let bodyBackgroundColor: string | null | undefined;
  let headingFont: string | null | undefined;
  let bodyFont: string | null | undefined;
  let gdprPrompt: StorefrontGdprPrompt | null = null;
  let customCode: StorefrontCustomCode | null = null;
  let designSettings: StorefrontDesignSettings | null = null;
  let metaPixel: StorefrontMetaPixel | null = null;
  let googleAnalytics: StorefrontGoogleAnalytics | null = null;
  let googleTagManager: StorefrontGoogleTagManager | null = null;
  let tiktokPixel: StorefrontTiktokPixel | null = null;
  let showOutOfStockBadge = true;
  // "Tell me when it is back" on sold-out products: off unless the store turned it on (Stock Settings).
  let restockNotify = false;
  let lowStock: { limit: number; hideCount: boolean } | null = null;
  let businessHours: BusinessHours | null = null;
  let verifiedSeller: { since: string; dbid: string | null } | null = null;
  let lmsForms: StorefrontLmsForms | null = null;
  let popupCampaigns: StorefrontPopupCampaign[] = [];
  let storeAway: StorefrontStoreAway | null = null;
  // Dollar prices for gift senders abroad (lib/usdPrice.tsx): the store's own rate, null = off.
  let usdRate: number | null = null;
  let storeName = '';
  try {
    const store = await getStoreInfo(subdomain);
    theme = resolveTheme(store.theme);
    storeExists = true;
    storeName = store.storeName;
    accentColor = store.accentColor;
    bodyBackgroundColor = store.bodyBackgroundColor;
    headingFont = store.brandHeadingFont;
    bodyFont = store.brandBodyFont;
    gdprPrompt = store.gdprPrompt ?? null;
    customCode = store.customCode ?? null;
    designSettings = store.designSettings ?? null;
    metaPixel = store.metaPixel ?? null;
    googleAnalytics = store.googleAnalytics ?? null;
    googleTagManager = store.googleTagManager ?? null;
    tiktokPixel = store.tiktokPixel ?? null;
    showOutOfStockBadge = store.stockSettings?.showOutOfStockBadge !== false;
    restockNotify = store.stockSettings?.restockNotifyEnabled === true;
    // The "Only 3 left" message is off for a store that allows backorders.
    if (store.stockSettings?.lowStockMessageEnabled && !store.stockSettings.allowBackorder) {
      lowStock = { limit: store.stockSettings.lowStockMessageLimit ?? 5, hideCount: !!store.stockSettings.hideStockCount };
    } else if (store.stockSettings?.hideStockCount) {
      lowStock = { limit: 0, hideCount: true };
    }
    lmsForms = store.lmsForms ?? null;
    verifiedSeller = store.verifiedSeller ?? null;
    usdRate = store.giftOption?.usdRate ?? null;
    popupCampaigns = store.popupCampaigns ?? [];
    storeAway = store.storeAway ?? null;
    // Shop hours (TellMe idea 73): Store Away wins while it is on.
    businessHours = storeAway ? null : ((store.businessHours as BusinessHours | null | undefined) ?? null);
  } catch (err) {
    if (!(err instanceof StoreNotFoundError)) throw err;
    // Store not found — leave the default theme; not-found.tsx handles
    // the actual 404 UI for this segment. storeExists stays false so we
    // never beacon a "visit" to a store that isn't real.
  }

  const brandStyle: React.CSSProperties = {
    ...(accentColor ? { '--color-accent': accentColor } as React.CSSProperties : {}),
    ...(bodyBackgroundColor ? { '--color-canvas': bodyBackgroundColor } as React.CSSProperties : {}),
    // Store > Branding fonts (lib/storeFonts.ts): the body font on this wrapper, the heading font on headings and the store name.
    ...storeFontStyle(headingFont, bodyFont),
  };
  const fontHref = storeFontsHref([headingFont, bodyFont]);

  return (
    // The query hook every theme's header uses, safe on a kept page (see StoreQueryAdapter and revalidate above).
    <StoreQueryAdapter>
    {/* data-layout: Store > Design > Layout Settings (StorePal only) — see
        globals.css for what EXTENDED widens. */}
    <div
      data-theme={theme.toLowerCase()}
      data-layout={theme === 'STOREPAL' && designSettings?.layoutType === 'EXTENDED' ? 'extended' : undefined}
      data-brand-heading={safeFontName(headingFont) ? '' : undefined}
      style={brandStyle}
    >
      {/* A vendor-picked font: open the connection to Google Fonts early (PERFORMANCE-PLAN.md Step 11); `display=swap` is in
          the address, so text shows at once in the theme font and swaps when the font arrives. */}
      {fontHref && <link rel="preconnect" href="https://fonts.googleapis.com" />}
      {fontHref && <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />}
      {fontHref && <link rel="stylesheet" href={fontHref} />}
      {/* Which store a shopper's sign-in is for (security F-46). Renders nothing. */}
      <ShopperStoreScope subdomain={subdomain} />
      {/* Monthly Visit tracking (PLAN.md Step 5) — mounted here, not
          inside any theme's own tree, so every theme is counted equally.
          Renders nothing; see VisitBeacon's own doc comment. Only for a
          store that actually resolved — see storeExists above. */}
      {storeExists && <VisitBeacon subdomain={subdomain} />}
      {/* Real shoppers' page speed for Super Admin > System status (PERFORMANCE-PLAN.md Step 1). Renders nothing. */}
      {storeExists && <WebVitalsBeacon subdomain={subdomain} />}
      {/* Store > Integrations > Facebook Pixel — StorePal only, like GDPR
          Prompt below (landing pages included, since they render inside
          this layout). Waits for GDPR consent when the prompt is on. See
          lib/metaPixel.ts. */}
      {storeExists && theme === 'STOREPAL' && (
        <MetaPixel subdomain={subdomain} metaPixel={metaPixel} consentRequired={!!gdprPrompt} />
      )}
      {/* Store > Integrations > TikTok Pixel — same rule as the Meta pixel,
          and mounted even without a store pixel since a landing page can
          have its own. See lib/tiktokPixel.ts. */}
      {storeExists && theme === 'STOREPAL' && (
        <TiktokPixel subdomain={subdomain} tiktokPixel={tiktokPixel} consentRequired={!!gdprPrompt} />
      )}
      {/* Store > Integrations > Google Analytics 4 — same StorePal-only,
          consent-aware rule as the pixel above. Only mounted when the
          vendor set a Measurement ID. See lib/googleAnalytics.ts. */}
      {storeExists && theme === 'STOREPAL' && googleAnalytics && (
        <GoogleAnalytics subdomain={subdomain} googleAnalytics={googleAnalytics} consentRequired={!!gdprPrompt} />
      )}
      {/* Store > Integrations > Google Tag Manager — same StorePal-only,
          consent-aware rule. See lib/googleTagManager.ts. Google's
          <noscript> fallback only when the GDPR Prompt is off: a visitor
          without JavaScript can't be asked for consent. */}
      {storeExists && theme === 'STOREPAL' && googleTagManager && (
        <>
          <GoogleTagManager subdomain={subdomain} storeName={storeName || null} googleTagManager={googleTagManager} consentRequired={!!gdprPrompt} />
          {!gdprPrompt && (
            <noscript>
              <iframe
                src={`${googleTagManager.serverContainerUrl || 'https://www.googletagmanager.com'}/ns.html?id=${encodeURIComponent(googleTagManager.containerId)}`}
                height="0"
                width="0"
                style={{ display: 'none', visibility: 'hidden' }}
              />
            </noscript>
          )}
        </>
      )}
      <ThemeProvider theme={theme}>
        <UsdPriceProvider rate={usdRate}>
        {/* Red "orders are off" strip on every template while the store takes no new orders (wallet below -৳100 and so on). */}
        {storeExists && <OrdersOffBar subdomain={subdomain} lang={designSettings?.storeLanguage === 'bn' ? 'bn' : 'en'} />}
        {/* Store > Design settings for every StorePal component; see
            themes/storepal/lib/designSettings.tsx. */}
        {theme === 'STOREPAL' ? (
          <StorePalDesignProvider subdomain={subdomain} settings={designSettings} showOutOfStockBadge={showOutOfStockBadge} restockNotify={restockNotify} lowStock={lowStock} businessHours={businessHours} lmsForms={lmsForms} verifiedSeller={verifiedSeller}>
            <WishlistSync subdomain={subdomain} />
            {/* "Someone bought" popup (TellMe idea 123): off unless the store turned it on; real orders only. */}
            <LazyRecentBuyersPopup subdomain={subdomain} />
            {/* Store > Store Away (holiday mode): a strip above every page while the store is away. */}
            {storeAway && <StoreAwayBanner away={storeAway} />}
            {children}
            {/* The AI chat widget lives here, not in StoreHeader, so a voice call keeps going when the shopper opens
                another page (the layout stays mounted). It shows only where a StoreHeader is (headerPresence.ts). */}
            {storeExists && <LazyAiAssistantWidget subdomain={subdomain} storeName={storeName} />}
            {/* Install as app: not lazy, so its file is loaded early enough to catch the browser's one-time install event. */}
            {storeExists && <InstallAppBanner subdomain={subdomain} storeName={storeName} />}
          </StorePalDesignProvider>
        ) : (
          children
        )}
        </UsdPriceProvider>
      </ThemeProvider>
      {/* Store > GDPR Prompt — StorePal only by design, same as the AI
          chat widget; null unless the vendor turned it on. */}
      {theme === 'STOREPAL' && gdprPrompt && <GdprPrompt subdomain={subdomain} prompt={gdprPrompt} />}
      {/* Marketing > Campaigns > Popup — StorePal only, like the GDPR Prompt. Which popup shows where, when
          and to whom is worked out in the browser; see PopupCampaigns.tsx. */}
      {storeExists && theme === 'STOREPAL' && popupCampaigns.length > 0 && (
        <LazyPopupCampaigns subdomain={subdomain} popups={popupCampaigns} accentColor={accentColor ?? null} />
      )}
      {/* Store > Design > Custom CSS / Head Scripts / JavaScript Code —
          StorePal only, like GDPR above. The CSS is server-rendered after
          the page so it wins over theme styles at equal specificity and
          never flashes unstyled; a literal "</style" in it is escaped so
          it can't close the tag early. Scripts go through the injector. */}
      {/* The page type on <html>, window.Regantify and the shop events custom code can use (StorePal, like the code itself). */}
      {theme === 'STOREPAL' && <StoreCodeHooks subdomain={subdomain} />}
      {theme === 'STOREPAL' && customCode?.customCss && (
        <style
          data-store-custom="css"
          dangerouslySetInnerHTML={{ __html: customCode.customCss.replace(/<\/style/gi, '<\\/style') }}
        />
      )}
      {theme === 'STOREPAL' && customCode && (customCode.headScripts || customCode.headJs.length > 0 || customCode.bodyJs.length > 0) && (
        <CustomCodeInjector subdomain={subdomain} code={customCode} />
      )}
    </div>
    </StoreQueryAdapter>
  );
}
