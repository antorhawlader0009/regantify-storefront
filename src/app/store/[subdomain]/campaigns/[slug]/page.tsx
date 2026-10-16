import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getStoreCampaign, StoreNotFoundError, CampaignNotFoundError, siteUrl } from '@/lib/storefrontApi';
import { resolveTheme } from '@/lib/theme';
import { CampaignView as MediumCampaignView } from '@/themes/medium/views/CampaignView';
import { CampaignView as StorepalCampaignView } from '@/themes/storepal/views/CampaignView';
import { socialMeta } from '@/lib/shareMeta';
import { storeParams } from '@/lib/storeRequest';

// Rendered on the first visit and then kept, like the rest of the store (PERFORMANCE-PLAN.md Step 8, see the store layout).
export function generateStaticParams() {
  return [];
}

interface PageProps {
  params: Promise<{ subdomain: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subdomain, slug } = await storeParams(params);
  try {
    const { campaign, store } = await getStoreCampaign(subdomain, slug);
    const description = `Shop the ${campaign.name} campaign from ${store.storeName}.`;
    const canonicalPath = `/store/${subdomain}/campaigns/${slug}`;
    return {
      title: campaign.name,
      description,
      alternates: { canonical: await siteUrl(canonicalPath) },
      ...socialMeta({ store, title: campaign.name, description, url: await siteUrl(canonicalPath), image: campaign.coverPhotoUrl, locale: store.designSettings?.storeLanguage }),
    };
  } catch {
    return { title: 'Campaign not found' };
  }
}

// Campaigns are built for the Medium and StorePal themes — a store on
// Minimal genuinely 404s here rather than falling back to some improvised
// Minimal rendering, since this was deliberately never built for Minimal.
export default async function CampaignPage({ params }: PageProps) {
  const { subdomain, slug } = await storeParams(params);

  let data;
  try {
    data = await getStoreCampaign(subdomain, slug);
  } catch (err) {
    if (err instanceof StoreNotFoundError || err instanceof CampaignNotFoundError) notFound();
    throw err;
  }

  const { store, campaign, products, categories } = data;

  const theme = resolveTheme(store.theme);
  if (theme !== 'MEDIUM' && theme !== 'STOREPAL') {
    notFound();
  }

  const View = theme === 'STOREPAL' ? StorepalCampaignView : MediumCampaignView;
  return (
    <View
      subdomain={subdomain}
      storeName={store.storeName}
      categories={categories}
      campaignName={campaign.name}
      coverPhotoUrl={campaign.coverPhotoUrl}
      products={products}
    />
  );
}
