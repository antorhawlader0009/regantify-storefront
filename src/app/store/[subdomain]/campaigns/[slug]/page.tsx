import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getStoreCampaign, StoreNotFoundError, CampaignNotFoundError, siteUrl } from '@/lib/storefrontApi';
import { resolveTheme } from '@/lib/theme';
import { CampaignView as MediumCampaignView } from '@/themes/medium/views/CampaignView';

interface PageProps {
  params: Promise<{ subdomain: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subdomain, slug } = await params;
  try {
    const { campaign, store } = await getStoreCampaign(subdomain, slug);
    const description = `Shop the ${campaign.name} campaign from ${store.storeName}.`;
    const canonicalPath = `/store/${subdomain}/campaigns/${slug}`;
    return {
      title: `${campaign.name} — ${store.storeName}`,
      description,
      alternates: { canonical: canonicalPath },
      openGraph: {
        title: campaign.name,
        description,
        url: await siteUrl(canonicalPath),
        siteName: store.storeName,
        type: 'website',
        images: campaign.coverPhotoUrl ? [{ url: campaign.coverPhotoUrl, width: 1200, height: 633 }] : undefined,
      },
    };
  } catch {
    return { title: 'Campaign not found' };
  }
}

// Campaigns are a Medium-theme-only feature (see CampaignView.tsx's own
// comment) — a store on Minimal theme genuinely 404s here rather than
// falling back to some improvised Minimal rendering, since this was
// deliberately never built for Minimal at all.
export default async function CampaignPage({ params }: PageProps) {
  const { subdomain, slug } = await params;

  let data;
  try {
    data = await getStoreCampaign(subdomain, slug);
  } catch (err) {
    if (err instanceof StoreNotFoundError || err instanceof CampaignNotFoundError) notFound();
    throw err;
  }

  const { store, campaign, products, categories } = data;

  if (resolveTheme(store.theme) !== 'MEDIUM') {
    notFound();
  }

  return (
    <MediumCampaignView
      subdomain={subdomain}
      storeName={store.storeName}
      categories={categories}
      campaignName={campaign.name}
      coverPhotoUrl={campaign.coverPhotoUrl}
      products={products}
    />
  );
}
