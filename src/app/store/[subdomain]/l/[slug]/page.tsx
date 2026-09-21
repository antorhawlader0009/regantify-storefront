import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getStoreLandingPage,
  getStoreProducts,
  LandingPageNotFoundError,
  StoreNotFoundError,
  siteUrl,
} from '@/lib/storefrontApi';
import { LandingPageView } from '@/landing/LandingPageView';
import { StoreChrome } from '@/landing/StoreChrome';

interface PageProps {
  params: Promise<{ subdomain: string; slug: string }>;
}

// "/" is the reserved homepage-override sentinel (LandingPage.slug's own
// schema comment, landing-plan.md §6) — it's served at the bare store
// root (see the sibling store/[subdomain]/page.tsx), never at
// /l/<something>, so a literal "/" segment here would be a malformed URL
// no link in this app ever generates. 404 rather than trying to look it
// up, same defensive-render posture as an unrecognized section type.
function isHomepageSentinel(slug: string) {
  return slug === '/' || slug === '';
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subdomain, slug } = await params;
  if (isHomepageSentinel(slug)) return { title: 'Not found' };

  try {
    const { store, landingPage } = await getStoreLandingPage(subdomain, slug);
    const canonicalPath = `/store/${subdomain}/l/${slug}`;
    const title = landingPage.metaTitle || `${landingPage.title} — ${store.storeName}`;
    const description = landingPage.metaDescription || undefined;
    return {
      title,
      description,
      keywords: landingPage.metaKeywords || undefined,
      alternates: { canonical: canonicalPath },
      openGraph: {
        title,
        description,
        url: await siteUrl(canonicalPath),
        siteName: store.storeName,
        type: 'website',
        images: landingPage.coverImageUrl ? [landingPage.coverImageUrl] : undefined,
      },
    };
  } catch {
    return { title: 'Page not found' };
  }
}

/**
 * Store > Landing Pages' public route (landing-plan.md §6, §8) —
 * /store/:subdomain/l/:slug for every landing page EXCEPT the one whose
 * slug is the homepage-override sentinel "/" (that one is served at the
 * bare store root instead — see store/[subdomain]/page.tsx's own
 * resolution-order check). FULL_PAGE renders LandingPageView with no
 * header/footer at all; WITH_STORE_CHROME wraps it in the vendor's
 * normal theme chrome via StoreChrome.
 */
export default async function LandingPagePage({ params }: PageProps) {
  const { subdomain, slug } = await params;
  if (isHomepageSentinel(slug)) notFound();

  let data;
  try {
    data = await getStoreLandingPage(subdomain, slug);
  } catch (err) {
    if (err instanceof StoreNotFoundError || err instanceof LandingPageNotFoundError) notFound();
    throw err;
  }

  if (data.landingPage.displayMode === 'WITH_STORE_CHROME') {
    // Only fetched for the chrome path — a FULL_PAGE landing page (the
    // common ad-driven case, per landing-plan.md's own framing) never
    // pays for this extra request at all.
    const { categories } = await getStoreProducts(subdomain).catch(() => ({ categories: [] as string[] }));
    return (
      <StoreChrome theme={data.store.theme} subdomain={subdomain} storeName={data.store.storeName} categories={categories}>
        <LandingPageView subdomain={subdomain} data={data} />
      </StoreChrome>
    );
  }

  return <LandingPageView subdomain={subdomain} data={data} />;
}
