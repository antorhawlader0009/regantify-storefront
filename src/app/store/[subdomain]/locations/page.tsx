import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getStoreInfo, getStoreLocations, getStoreProducts, StoreNotFoundError, siteUrl } from '@/lib/storefrontApi';
import { resolveTheme } from '@/lib/theme';
import { safeJsonLd } from '@/lib/safeJsonLd';
import { LocationsView } from '@/themes/storepal/views/LocationsView';
import { socialMeta } from '@/lib/shareMeta';
import { storeParams } from '@/lib/storeRequest';

interface PageProps {
  params: Promise<{ subdomain: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subdomain } = await storeParams(params);
  try {
    const store = await getStoreInfo(subdomain);
    const path = `/store/${subdomain}/locations`;
    const title = `Our shops - ${store.storeName}`;
    return { title, alternates: { canonical: await siteUrl(path) }, ...socialMeta({ store, title, url: await siteUrl(path), locale: store.designSettings?.storeLanguage }) };
  } catch {
    return { title: 'Our shops' };
  }
}

/**
 * Store > Content > Shop Locations: the store's shops, each opening on Google Maps. The data is for every template; StorePal is the first
 * with a view, so another template is a 404 until it gets one. A store with no shops is a 404 too. Each shop is also given to Google as
 * a Store with its address (and pin when known), so searches near a branch can find it.
 */
export default async function LocationsPage({ params }: PageProps) {
  const { subdomain } = await storeParams(params);
  let store;
  try {
    store = await getStoreInfo(subdomain);
  } catch (err) {
    if (err instanceof StoreNotFoundError) notFound();
    throw err;
  }
  if (resolveTheme(store.theme) !== 'STOREPAL') notFound();
  const items = await getStoreLocations(subdomain);
  if (items.length === 0) notFound();
  const { categories } = await getStoreProducts(subdomain).catch(() => ({ categories: [] as string[] }));
  const jsonLd = items.map((l) => ({
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: `${store.storeName} - ${l.name}`,
    address: { '@type': 'PostalAddress', streetAddress: l.address, addressCountry: 'BD' },
    hasMap: l.openUrl,
    ...(l.phone ? { telephone: l.phone } : {}),
    ...(l.lat !== null && l.lon !== null ? { geo: { '@type': 'GeoCoordinates', latitude: l.lat, longitude: l.lon } } : {}),
    parentOrganization: { '@type': 'Organization', name: store.storeName },
  }));
  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <LocationsView subdomain={subdomain} storeName={store.storeName} categories={categories} items={items} />
    </>
  );
}
