import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getStoreContact,
  getStoreInfo,
  getStorePage,
  getStorePageList,
  getStoreProducts,
  StoreNotFoundError,
  StorePageNotFoundError,
  siteUrl,
} from '@/lib/storefrontApi';
import { demoPageBySlug, demoPageHtml, pageCovers } from '@/lib/demoPages';
import { resolveTheme } from '@/lib/theme';
import { PageView as MediumPageView } from '@/themes/medium/views/PageView';
import { PageView as MinimalPageView } from '@/themes/minimal/views/PageView';
import { PageView as StorepalPageView } from '@/themes/storepal/views/PageView';
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
  const canonicalPath = `/store/${subdomain}/page/${slug}`;
  try {
    const { store, page } = await getStorePage(subdomain, slug);
    return {
      title: page.title,
      alternates: { canonical: await siteUrl(canonicalPath) },
      ...socialMeta({ store, title: page.title, url: await siteUrl(canonicalPath), locale: store.designSettings?.storeLanguage }),
    };
  } catch {
    // A demo page (lib/demoPages.ts) has a title but is never indexed: it is sample text, not the store's own policy.
    const demo = await loadDemoPage(subdomain, slug).catch(() => null);
    if (demo) return { title: demo.title, robots: { index: false, follow: true } };
    return { title: 'Page not found' };
  }
}

/**
 * The sample page for a default address (about-us, delivery-policy, ...), or null when the slug is not one of them or the
 * store already published its own page of that kind. Filled with the store's name, its Contact page's phone and address
 * (only while that page is on) and its default return days.
 */
async function loadDemoPage(subdomain: string, slug: string) {
  const def = demoPageBySlug(slug);
  if (!def) return null;
  const [store, pages, contact] = await Promise.all([
    getStoreInfo(subdomain),
    getStorePageList(subdomain),
    getStoreContact(subdomain).catch(() => null),
  ]);
  if (pageCovers(def, pages)) return null;
  const lang = store.designSettings?.storeLanguage === 'bn' ? 'bn' : 'en';
  const onContact = contact?.enabled ? contact : null;
  const content = demoPageHtml(def.kind, lang, {
    storeName: store.storeName,
    phone: onContact?.phone?.label ?? null,
    address: onContact?.basedIn ?? null,
    returnDays: store.stockSettings?.defaultReturnDays ?? null,
  });
  return { store, title: def.title[lang], content };
}

// Store > Pages' public rendering (About Us, Contact Us, Privacy
// Policy, etc — see the reference StorePal screenshots). Unlike
// Campaigns (Medium-only), this works under every theme — a vendor's
// written page content should render regardless of which storefront
// look they've picked, so this fetches the same category list every
// other page uses purely to give each theme's own StoreHeader its
// category nav, exactly like the cart/checkout pages already do.
export default async function StorePagePage({ params }: PageProps) {
  const { subdomain, slug } = await storeParams(params);

  let found: { store: { storeName: string; theme: string | null }; title: string; content: string | null };
  try {
    const { store, page } = await getStorePage(subdomain, slug);
    found = { store, title: page.title, content: page.content };
  } catch (err) {
    if (err instanceof StoreNotFoundError) notFound();
    if (!(err instanceof StorePageNotFoundError)) throw err;
    // No page here: a default address the store has not written yet shows its demo text (lib/demoPages.ts).
    const demo = await loadDemoPage(subdomain, slug).catch(() => null);
    if (!demo) notFound();
    found = demo;
  }

  const { store } = found;
  const { categories } = await getStoreProducts(subdomain).catch(() => ({ categories: [] as string[] }));

  const viewProps = { subdomain, storeName: store.storeName, categories, title: found.title, content: found.content };

  const theme = resolveTheme(store.theme);
  if (theme === 'MINIMAL') return <MinimalPageView {...viewProps} />;
  if (theme === 'STOREPAL') return <StorepalPageView {...viewProps} />;
  return <MediumPageView {...viewProps} />;
}
