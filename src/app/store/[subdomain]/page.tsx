import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getStoreProducts,
  getStoreReviews,
  getStoreCampaigns,
  getStoreLandingPage,
  LandingPageNotFoundError,
  StoreNotFoundError,
  siteUrl,
} from '@/lib/storefrontApi';
import { resolveTheme } from '@/lib/theme';
import { safeJsonLd } from '@/lib/safeJsonLd';
import { HomeView as MediumHomeView } from '@/themes/medium/views/HomeView';
import { HomeView as MinimalHomeView } from '@/themes/minimal/views/HomeView';
import { HomeView as StorepalHomeView } from '@/themes/storepal/views/HomeView';
import { visibleInListings } from '@/themes/storepal/lib/backorder';
import { LandingPageView } from '@/landing/LandingPageView';
import { StoreChrome } from '@/landing/StoreChrome';

// The reserved "use as homepage" sentinel (LandingPage.slug's own schema
// comment, landing-plan.md §6) — a vendor can publish at most one
// LandingPage with this literal slug (enforced by the model's own
// @@unique([vendorId, slug])), and when one exists PUBLISHED, it
// overrides this route entirely instead of the normal product-grid
// homepage below. This is the "resolution order check against the
// existing homepage route" landing-plan.md §6 calls for: this file is
// the one place that decision is made, so a vendor can never end up with
// both a homepage-override landing page AND the regular homepage
// simultaneously reachable at the same URL.
const HOMEPAGE_LANDING_SLUG = '/';

interface PageProps {
  params: Promise<{ subdomain: string }>;
  searchParams: Promise<{ category?: string; q?: string; coupon?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subdomain } = await params;

  // Homepage-override check (see HOMEPAGE_LANDING_SLUG's own comment) —
  // tried first so a vendor's landing-page SEO fields (metaTitle/
  // metaDescription/coverImageUrl) win over the generic store metadata
  // below whenever one is set as the homepage.
  try {
    const { store, landingPage } = await getStoreLandingPage(subdomain, HOMEPAGE_LANDING_SLUG);
    const canonicalPath = `/store/${subdomain}`;
    const title = landingPage.metaTitle || `${landingPage.title} — ${store.storeName}`;
    return {
      title,
      description: landingPage.metaDescription || undefined,
      keywords: landingPage.metaKeywords || undefined,
      alternates: { canonical: canonicalPath },
      openGraph: {
        title,
        description: landingPage.metaDescription || undefined,
        url: await siteUrl(canonicalPath),
        siteName: store.storeName,
        type: 'website',
        images: landingPage.coverImageUrl ? [landingPage.coverImageUrl] : undefined,
      },
    };
  } catch (err) {
    if (!(err instanceof LandingPageNotFoundError) && !(err instanceof StoreNotFoundError)) throw err;
    // No homepage-override landing page (the common case) — fall through
    // to the normal store metadata below.
  }

  // Store > Branding fallback (Vendor.brandCoverImageUrl/brandMetaTitle/
  // brandMetaDescription) — one level below the homepage-override landing
  // page above (which already returned by now if one exists), one level
  // above the fully-generic "Shop {storeName} online" fallback further
  // below. A vendor who's set these on Store > Branding gets their own
  // title/description/cover image on Facebook/Google for their homepage
  // even without building a homepage-override landing page; a vendor who
  // hasn't set any of these falls all the way through to the generic copy.
  try {
    const { store } = await getStoreProducts(subdomain);
    const canonicalPath = `/store/${subdomain}`;
    const genericDescription = `Shop ${store.storeName} online — browse products, fast delivery, cash on delivery available.`;
    const title = store.brandMetaTitle || store.storeName;
    const description = store.brandMetaDescription || genericDescription;
    return {
      title,
      description,
      alternates: { canonical: canonicalPath },
      openGraph: {
        title,
        description,
        url: await siteUrl(canonicalPath),
        siteName: store.storeName,
        type: 'website',
        images: store.brandCoverImageUrl ? [store.brandCoverImageUrl] : undefined,
      },
    };
  } catch {
    return { title: 'Store not found' };
  }
}

export default async function StorePage({ params, searchParams }: PageProps) {
  const { subdomain } = await params;
  const { category: activeCategory, q: search, coupon: couponLink } = await searchParams;

  // Homepage-override check — same resolution-order reasoning as
  // generateMetadata above. A PUBLISHED LandingPage at slug "/" takes
  // over this entire route; only once that lookup 404s (no override set)
  // does this fall through to the regular product-grid homepage.
  try {
    const landingData = await getStoreLandingPage(subdomain, HOMEPAGE_LANDING_SLUG);
    if (landingData.landingPage.displayMode === 'WITH_STORE_CHROME') {
      const { categories } = await getStoreProducts(subdomain).catch(() => ({ categories: [] as string[] }));
      return (
        <StoreChrome
          theme={landingData.store.theme}
          subdomain={subdomain}
          storeName={landingData.store.storeName}
          categories={categories}
        >
          <LandingPageView subdomain={subdomain} data={landingData} />
        </StoreChrome>
      );
    }
    return <LandingPageView subdomain={subdomain} data={landingData} />;
  } catch (err) {
    if (!(err instanceof LandingPageNotFoundError) && !(err instanceof StoreNotFoundError)) throw err;
    // No homepage-override landing page — fall through to the regular
    // homepage below. A StoreNotFoundError here gets re-thrown as a
    // real 404 by the getStoreProducts call immediately below anyway,
    // so swallowing it here just avoids doing that check twice.
  }

  let data;
  try {
    data = await getStoreProducts(subdomain);
  } catch (err) {
    if (err instanceof StoreNotFoundError) notFound();
    throw err;
  }

  const reviews = await getStoreReviews(subdomain);
  const { store, products, categories, categoryDetails } = data;
  const storeJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: store.storeName,
    url: await siteUrl(`/store/${subdomain}`),
  };

  const viewProps = {
    subdomain,
    storeName: store.storeName,
    products,
    categories,
    reviews,
    activeCategory,
    search,
  };

  // Store > Logo / Social — only StorePal's HomeView accepts these
  // props today (see that view's own HomeViewProps); passed separately
  // rather than folded into viewProps above so Medium/Minimal's spread
  // stays exactly the shape their own HomeViewProps expects.
  const socialLinks = {
    facebookUrl: store.facebookUrl,
    instagramUrl: store.instagramUrl,
    twitterUrl: store.twitterUrl,
    youtubeUrl: store.youtubeUrl,
    tiktokUrl: store.tiktokUrl,
    linkedinUrl: store.linkedinUrl,
    whatsappUrl: store.whatsappUrl,
  };

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: safeJsonLd(storeJsonLd) }}
      />
      {await (async () => {
        const theme = resolveTheme(store.theme);
        if (theme === 'MINIMAL') return <MinimalHomeView {...viewProps} />;
        if (theme === 'STOREPAL') {
          // Campaigns still power StorePal's Marketing > Campaigns
          // landing pages (see storefront/[subdomain]/campaigns/[slug]);
          // the homepage hero itself now cycles through Store >
          // Categories' cover photos instead (see HeroBanner's doc
          // comment) via categoryDetails below.
          const campaigns = await getStoreCampaigns(subdomain);
          return (
            <StorepalHomeView
              {...viewProps}
              // Store > Stock Settings' "Show out-of-stock products in
              // shop pages" off — StorePal-only, like couponLink below.
              products={visibleInListings(viewProps.products, store.stockSettings)}
              logoUrl={store.logoUrl}
              socialLinks={socialLinks}
              footerConfig={store.footerConfig}
              campaigns={campaigns}
              categoryDetails={categoryDetails}
              // "Create custom link for this coupon" — only StorePal
              // reads this (see [[theme-scope-storepal-only]]);
              // Medium/Minimal's own viewProps spread never includes
              // it, so a shared /store/:subdomain?coupon=... link is a
              // no-op there.
              couponLink={couponLink}
            />
          );
        }
        return <MediumHomeView {...viewProps} />;
      })()}
    </>
  );
}
