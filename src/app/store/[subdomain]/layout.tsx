import { getStoreInfo, StoreNotFoundError } from '@/lib/storefrontApi';
import { resolveTheme } from '@/lib/theme';
import { ThemeProvider } from '@/providers/theme-provider';
import { VisitBeacon } from '@/components/VisitBeacon';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ subdomain: string }>;
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
 * A missing/unknown store still renders here (resolveTheme defaults to
 * MEDIUM) — the actual "store not found" decision and UI stay with each
 * page/not-found.tsx as before; this layout only ever adds a wrapper
 * div, never blocks rendering.
 */
export default async function StoreLayout({ children, params }: LayoutProps) {
  const { subdomain } = await params;

  let theme = resolveTheme('MEDIUM');
  let storeExists = false;
  try {
    const store = await getStoreInfo(subdomain);
    theme = resolveTheme(store.theme);
    storeExists = true;
  } catch (err) {
    if (!(err instanceof StoreNotFoundError)) throw err;
    // Store not found — leave the default theme; not-found.tsx handles
    // the actual 404 UI for this segment. storeExists stays false so we
    // never beacon a "visit" to a store that isn't real.
  }

  return (
    <div data-theme={theme.toLowerCase()}>
      {/* Monthly Visit tracking (PLAN.md Step 5) — mounted here, not
          inside any theme's own tree, so every theme is counted equally.
          Renders nothing; see VisitBeacon's own doc comment. Only for a
          store that actually resolved — see storeExists above. */}
      {storeExists && <VisitBeacon subdomain={subdomain} />}
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </div>
  );
}
