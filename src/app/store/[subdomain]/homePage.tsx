import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getStoreProducts,
  getStoreReviews,
  getStoreCampaigns,
  getStoreBlog,
  getStoreFaq,
  getStoreSocialFeed,
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
import { socialMeta } from '@/lib/shareMeta';
import { storeParams } from '@/lib/storeRequest';

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

/** The home page's query: ?category= / ?brand= listings, ?q= search results and ?coupon= links. */
export type HomeQuery = { category?: string; q?: string; coupon?: string; brand?: string };

interface HomeProps {
  params: Promise<{ subdomain: string }>;
  query: HomeQuery;
}

// PERFORMANCE-PLAN.md Step 8: the store home is rendered from here by two routes. page.tsx is the plain home page (no
// query), which Next keeps and serves again; browse/page.tsx renders the same page for a request WITH one of the query
// keys (middleware.ts sends those there) and reads the query, so it is rendered fresh. Same metadata and content rules
// for both, so a listing's own title and canonical (Store SEO) work exactly as before.
export async function homeMetadata({ params, query }: HomeProps): Promise<Metadata> {
  const { subdomain } = await storeParams(params);

  // Homepage-override check (see HOMEPAGE_LANDING_SLUG's own comment) —
  // tried first so a vendor's landing-page SEO fields (metaTitle/
  // metaDescription/coverImageUrl) win over the generic store metadata
  // below whenever one is set as the homepage.
  try {
    const { store, landingPage } = await getStoreLandingPage(subdomain, HOMEPAGE_LANDING_SLUG);
    const canonicalPath = `/store/${subdomain}`;
    const title = landingPage.metaTitle || `${landingPage.title} — ${store.storeName}`;
    return {
      title: { absolute: title },
      description: landingPage.metaDescription || undefined,
      keywords: landingPage.metaKeywords || undefined,
      alternates: { canonical: await siteUrl(canonicalPath) },
      ...socialMeta({ store, title, description: landingPage.metaDescription, url: await siteUrl(canonicalPath), image: landingPage.coverImageUrl, locale: store.designSettings?.storeLanguage }),
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
    // A category or brand listing (?category= / ?brand=) is a page of its own for search engines (people search "phones in
    // Dhaka"), so it gets its own title and canonical instead of being folded into the home page. Search results (?q=) and
    // coupon links are not pages worth listing.
    const { category, brand, q, coupon } = query;
    const listing = category?.trim() || brand?.trim() || null;
    const listingQuery = category?.trim() ? `?category=${encodeURIComponent(category.trim())}` : brand?.trim() ? `?brand=${encodeURIComponent(brand.trim())}` : '';
    const homeTitle = store.brandMetaTitle || store.storeName;
    const title = listing ? `${listing} | ${store.storeName}` : homeTitle;
    const description = listing
      ? `Shop ${listing} at ${store.storeName}. Browse products, fast delivery, cash on delivery available.`
      : store.brandMetaDescription || `Shop ${store.storeName} online — browse products, fast delivery, cash on delivery available.`;
    const canonical = (await siteUrl(canonicalPath)) + listingQuery;
    return {
      // The home page's title is the vendor's own words: the layout's " | Store name" is added to listings only.
      title: listing ? listing : { absolute: homeTitle },
      description,
      alternates: { canonical },
      robots: q?.trim() || coupon ? { index: false, follow: true } : undefined,
      ...socialMeta({ store, title, description, url: canonical, locale: store.designSettings?.storeLanguage }),
    };
  } catch {
    return { title: 'Store not found' };
  }
}

export async function HomePage({ params, query }: HomeProps) {
  const { subdomain } = await storeParams(params);
  const { category: activeCategory, q: search, coupon: couponLink, brand: activeBrand } = query;

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
  // Structured data for the home page: who the store is (Organization, with its logo and social profiles) and the site's name
  // (WebSite). Google reads the WebSite name to show the right site name above the result, and the domain as an alternate name,
  // so a search for the store's name finds it by that name. Only the plain home page carries it, not category or search views.
  const homeUrl = await siteUrl(`/store/${subdomain}`);
  const profiles = [store.facebookUrl, store.instagramUrl, store.twitterUrl, store.youtubeUrl, store.tiktokUrl, store.linkedinUrl].filter((u): u is string => Boolean(u && /^https?:\/\//.test(u)));
  let domainName: string | null = null;
  try {
    domainName = new URL(homeUrl).hostname;
  } catch {
    domainName = null;
  }
  const storeJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${homeUrl}#organization`,
        name: store.storeName,
        url: homeUrl,
        logo: store.logoUrl || undefined,
        sameAs: profiles.length > 0 ? profiles : undefined,
      },
      {
        '@type': 'WebSite',
        '@id': `${homeUrl}#website`,
        url: homeUrl,
        name: store.storeName,
        alternateName: domainName && domainName.toLowerCase() !== store.storeName.toLowerCase() ? domainName : undefined,
        publisher: { '@id': `${homeUrl}#organization` },
      },
    ],
  };
  const isPlainHome = !activeCategory && !activeBrand && !search?.trim();

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
      {isPlainHome && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: safeJsonLd(storeJsonLd) }}
        />
      )}
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
          // Store > Magazine (TellMe idea 106): the latest posts for the home section; none on any hiccup.
          const blog = await getStoreBlog(subdomain, 5).catch(() => ({ posts: [], total: 0 }));
          // Store FAQ (TellMe idea 122): the questions for the home section; none on any hiccup.
          const faq = await getStoreFaq(subdomain).catch(() => ({ items: [] }));
          // Social Feed (SOCIAL-FEED-plan.md): the YouTube channel and newest videos; nothing on any hiccup.
          const socialFeed = await getStoreSocialFeed(subdomain).catch(() => null);
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
              faqItems={faq.items}
              socialFeed={socialFeed}
              blogPosts={blog.posts}
              blogTotal={blog.total}
              categoryDetails={categoryDetails}
              siteCoverUrl={store.brandSiteCoverUrl}
              siteCoverOnly={store.brandSiteCoverOnly}
              // A store with no public product yet shows the drawn sample shop and the setup steps (store-empty-preview.md).
              setup={data.setup}
              // "Create custom link for this coupon" — only StorePal
              // reads this (see [[theme-scope-storepal-only]]);
              // Medium/Minimal's own viewProps spread never includes
              // it, so a shared /store/:subdomain?coupon=... link is a
              // no-op there.
              couponLink={couponLink}
              // Store > Design menu items of type Brand — StorePal-only, like couponLink.
              activeBrand={activeBrand}
            />
          );
        }
        return <MediumHomeView {...viewProps} />;
      })()}
    </>
  );
}
