import { resolveTheme, type StoreTheme } from '@/lib/theme';
import { StoreHeader as MediumStoreHeader } from '@/themes/medium/components/StoreHeader';
import { StoreFooter as MediumStoreFooter } from '@/themes/medium/components/StoreFooter';
import { StoreHeader as MinimalStoreHeader } from '@/themes/minimal/components/StoreHeader';
import { StoreFooter as MinimalStoreFooter } from '@/themes/minimal/components/StoreFooter';
import { StoreHeader as StorepalStoreHeader } from '@/themes/storepal/components/StoreHeader';
import { StoreFooter as StorepalStoreFooter } from '@/themes/storepal/components/StoreFooter';

/**
 * WITH_STORE_CHROME landing pages (landing-plan.md §6) render with the
 * vendor's normal storefront header/footer around the landing/ render
 * tree — "for a landing page meant to feel like part of the regular
 * store" (LandingPageDisplayMode's own schema comment). Picks the
 * matching header/footer pair for the vendor's resolved theme, same
 * per-theme dispatch page/[slug]/page.tsx already does for Store > Pages
 * — reused here rather than duplicated, since Store > Pages' PageView
 * components only ever pass subdomain/storeName/categories to their own
 * header (no logo/social props), the same minimal set this wrapper needs.
 */
export function StoreChrome({
  theme,
  subdomain,
  storeName,
  categories,
  children,
}: {
  theme: StoreTheme | string | null | undefined;
  subdomain: string;
  storeName: string;
  categories: string[];
  children: React.ReactNode;
}) {
  const resolved = resolveTheme(theme);

  if (resolved === 'MINIMAL') {
    return (
      <div className="min-h-screen bg-canvas text-ink" data-theme="minimal">
        <MinimalStoreHeader subdomain={subdomain} storeName={storeName} categories={categories} />
        {children}
        <MinimalStoreFooter subdomain={subdomain} storeName={storeName} />
      </div>
    );
  }

  if (resolved === 'STOREPAL') {
    return (
      <div className="min-h-screen bg-canvas text-ink" data-theme="storepal">
        <StorepalStoreHeader subdomain={subdomain} storeName={storeName} categories={categories} />
        {children}
        <StorepalStoreFooter subdomain={subdomain} storeName={storeName} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-ink" data-theme="medium">
      <MediumStoreHeader subdomain={subdomain} storeName={storeName} categories={categories} />
      {children}
      <MediumStoreFooter subdomain={subdomain} storeName={storeName} />
    </div>
  );
}
