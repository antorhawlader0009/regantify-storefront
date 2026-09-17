import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getStorePage, getStoreProducts, StoreNotFoundError, StorePageNotFoundError, siteUrl } from '@/lib/storefrontApi';
import { resolveTheme } from '@/lib/theme';
import { PageView as MediumPageView } from '@/themes/medium/views/PageView';
import { PageView as MinimalPageView } from '@/themes/minimal/views/PageView';
import { PageView as StorepalPageView } from '@/themes/storepal/views/PageView';

interface PageProps {
  params: Promise<{ subdomain: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subdomain, slug } = await params;
  try {
    const { store, page } = await getStorePage(subdomain, slug);
    const canonicalPath = `/store/${subdomain}/page/${slug}`;
    return {
      title: `${page.title} — ${store.storeName}`,
      alternates: { canonical: canonicalPath },
      openGraph: { title: page.title, url: await siteUrl(canonicalPath), siteName: store.storeName, type: 'website' },
    };
  } catch {
    return { title: 'Page not found' };
  }
}

// Store > Pages' public rendering (About Us, Contact Us, Privacy
// Policy, etc — see the reference StorePal screenshots). Unlike
// Campaigns (Medium-only), this works under every theme — a vendor's
// written page content should render regardless of which storefront
// look they've picked, so this fetches the same category list every
// other page uses purely to give each theme's own StoreHeader its
// category nav, exactly like the cart/checkout pages already do.
export default async function StorePagePage({ params }: PageProps) {
  const { subdomain, slug } = await params;

  let pageData;
  try {
    pageData = await getStorePage(subdomain, slug);
  } catch (err) {
    if (err instanceof StoreNotFoundError || err instanceof StorePageNotFoundError) notFound();
    throw err;
  }

  const { store, page } = pageData;
  const { categories } = await getStoreProducts(subdomain).catch(() => ({ categories: [] as string[] }));

  const viewProps = { subdomain, storeName: store.storeName, categories, title: page.title, content: page.content };

  const theme = resolveTheme(store.theme);
  if (theme === 'MINIMAL') return <MinimalPageView {...viewProps} />;
  if (theme === 'STOREPAL') return <StorepalPageView {...viewProps} />;
  return <MediumPageView {...viewProps} />;
}
