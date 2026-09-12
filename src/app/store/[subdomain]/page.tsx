import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getStoreProducts, getStoreReviews, getStoreCampaigns, StoreNotFoundError, siteUrl } from '@/lib/storefrontApi';
import { resolveTheme } from '@/lib/theme';
import { safeJsonLd } from '@/lib/safeJsonLd';
import { HomeView as MediumHomeView } from '@/themes/medium/views/HomeView';
import { HomeView as MinimalHomeView } from '@/themes/minimal/views/HomeView';
import { HomeView as StorepalHomeView } from '@/themes/storepal/views/HomeView';

interface PageProps {
  params: Promise<{ subdomain: string }>;
  searchParams: Promise<{ category?: string; q?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subdomain } = await params;
  try {
    const { store } = await getStoreProducts(subdomain);
    const description = `Shop ${store.storeName} online — browse products, fast delivery, cash on delivery available.`;
    const canonicalPath = `/store/${subdomain}`;
    return {
      title: store.storeName,
      description,
      alternates: { canonical: canonicalPath },
      openGraph: {
        title: store.storeName,
        description,
        url: siteUrl(canonicalPath),
        siteName: store.storeName,
        type: 'website',
      },
    };
  } catch {
    return { title: 'Store not found' };
  }
}

export default async function StorePage({ params, searchParams }: PageProps) {
  const { subdomain } = await params;
  const { category: activeCategory, q: search } = await searchParams;

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
    url: siteUrl(`/store/${subdomain}`),
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
              logoUrl={store.logoUrl}
              socialLinks={socialLinks}
              campaigns={campaigns}
              categoryDetails={categoryDetails}
            />
          );
        }
        return <MediumHomeView {...viewProps} />;
      })()}
    </>
  );
}
