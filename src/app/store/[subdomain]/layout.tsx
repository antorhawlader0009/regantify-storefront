import type { Metadata } from 'next';
import { getStoreInfo, StoreNotFoundError } from '@/lib/storefrontApi';
import { resolveTheme } from '@/lib/theme';
import { ThemeProvider } from '@/providers/theme-provider';
import { VisitBeacon } from '@/components/VisitBeacon';
import { GdprPrompt } from '@/themes/storepal/components/GdprPrompt';
import { CustomCodeInjector } from '@/themes/storepal/components/CustomCodeInjector';
import type { StorefrontCustomCode, StorefrontGdprPrompt } from '@/lib/storefrontApi';

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
  const { subdomain } = await params;
  try {
    const store = await getStoreInfo(subdomain);
    if (!store.faviconUrl) return {};
    return { icons: { icon: store.faviconUrl } };
  } catch {
    return {};
  }
}

/** Turns a free-text font-family name (Vendor.brandHeadingFont/brandBodyFont) into a Google Fonts stylesheet URL, best-effort — same helper as landing pages' own googleFontsHref (src/landing/LandingPageView.tsx), duplicated rather than shared since the two live in different route trees and this is a two-line pure function. A vendor who types a name Google Fonts doesn't have just gets the theme's own fallback font, never a broken page. */
function googleFontsHref(fontNames: (string | null | undefined)[]): string | null {
  const unique = Array.from(new Set(fontNames.filter((n): n is string => !!n?.trim())));
  if (unique.length === 0) return null;
  const families = unique.map((n) => `family=${encodeURIComponent(n.trim()).replace(/%20/g, '+')}:wght@400;500;600;700`);
  return `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap`;
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
 * landing pages already do it (see googleFontsHref above) — a runtime
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
  const { subdomain } = await params;

  let theme = resolveTheme('MEDIUM');
  let storeExists = false;
  let accentColor: string | null | undefined;
  let bodyBackgroundColor: string | null | undefined;
  let headingFont: string | null | undefined;
  let bodyFont: string | null | undefined;
  let gdprPrompt: StorefrontGdprPrompt | null = null;
  let customCode: StorefrontCustomCode | null = null;
  try {
    const store = await getStoreInfo(subdomain);
    theme = resolveTheme(store.theme);
    storeExists = true;
    accentColor = store.accentColor;
    bodyBackgroundColor = store.bodyBackgroundColor;
    headingFont = store.brandHeadingFont;
    bodyFont = store.brandBodyFont;
    gdprPrompt = store.gdprPrompt ?? null;
    customCode = store.customCode ?? null;
  } catch (err) {
    if (!(err instanceof StoreNotFoundError)) throw err;
    // Store not found — leave the default theme; not-found.tsx handles
    // the actual 404 UI for this segment. storeExists stays false so we
    // never beacon a "visit" to a store that isn't real.
  }

  const brandStyle: React.CSSProperties = {
    ...(accentColor ? { '--color-accent': accentColor } as React.CSSProperties : {}),
    ...(bodyBackgroundColor ? { '--color-canvas': bodyBackgroundColor } as React.CSSProperties : {}),
    ...(headingFont ? { '--font-display': `"${headingFont}", var(--font-display)` } as React.CSSProperties : {}),
    ...(bodyFont ? { '--font-sans': `"${bodyFont}", var(--font-sans)` } as React.CSSProperties : {}),
  };
  const fontHref = googleFontsHref([headingFont, bodyFont]);

  return (
    <div data-theme={theme.toLowerCase()} style={brandStyle}>
      {fontHref && <link rel="stylesheet" href={fontHref} />}
      {/* Monthly Visit tracking (PLAN.md Step 5) — mounted here, not
          inside any theme's own tree, so every theme is counted equally.
          Renders nothing; see VisitBeacon's own doc comment. Only for a
          store that actually resolved — see storeExists above. */}
      {storeExists && <VisitBeacon subdomain={subdomain} />}
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
      {/* Store > GDPR Prompt — StorePal only by design, same as the AI
          chat widget; null unless the vendor turned it on. */}
      {theme === 'STOREPAL' && gdprPrompt && <GdprPrompt subdomain={subdomain} prompt={gdprPrompt} />}
      {/* Store > Design > Custom CSS / Head Scripts / JavaScript Code —
          StorePal only, like GDPR above. The CSS is server-rendered after
          the page so it wins over theme styles at equal specificity and
          never flashes unstyled; a literal "</style" in it is escaped so
          it can't close the tag early. Scripts go through the injector. */}
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
  );
}
