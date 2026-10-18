import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getStoreContact, getStoreFaq, getStoreProducts, StoreNotFoundError, siteUrl } from '@/lib/storefrontApi';
import { resolveTheme } from '@/lib/theme';
import { ContactView } from '@/themes/storepal/views/ContactView';
import { socialMeta } from '@/lib/shareMeta';
import { storeParams } from '@/lib/storeRequest';

interface PageProps {
  params: Promise<{ subdomain: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subdomain } = await storeParams(params);
  try {
    const { store } = await getStoreFaq(subdomain);
    const path = `/store/${subdomain}/contact`;
    return { title: 'Contact us', alternates: { canonical: await siteUrl(path) }, ...socialMeta({ store, title: `Contact ${store.storeName}`, url: await siteUrl(path), locale: store.designSettings?.storeLanguage }) };
  } catch {
    return { title: 'Contact us' };
  }
}

// The contact page (StorePal only: any other theme is a 404, like the FAQ). The FAQ call only reads the store's name and theme, cached with the other
// store pages; the contact call carries the form switch and the WhatsApp / phone / address cards.
export default async function ContactPage({ params }: PageProps) {
  const { subdomain } = await storeParams(params);
  let data;
  try {
    data = await getStoreFaq(subdomain);
  } catch (err) {
    if (err instanceof StoreNotFoundError) notFound();
    throw err;
  }
  if (resolveTheme(data.store.theme) !== 'STOREPAL') notFound();
  const [page, products] = await Promise.all([getStoreContact(subdomain).catch(() => null), getStoreProducts(subdomain).catch(() => ({ categories: [] as string[] }))]);
  if (!page) notFound();
  return <ContactView subdomain={subdomain} storeName={data.store.storeName} categories={products.categories} page={page} />;
}
