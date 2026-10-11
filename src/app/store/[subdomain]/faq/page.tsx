import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getStoreFaq, getStoreProducts, StoreNotFoundError, siteUrl } from '@/lib/storefrontApi';
import { resolveTheme } from '@/lib/theme';
import { safeJsonLd } from '@/lib/safeJsonLd';
import { FaqView } from '@/themes/storepal/views/FaqView';

interface PageProps {
  params: Promise<{ subdomain: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subdomain } = await params;
  try {
    const { store } = await getStoreFaq(subdomain);
    const path = `/store/${subdomain}/faq`;
    return { title: `FAQ — ${store.storeName}`, alternates: { canonical: path }, openGraph: { title: `FAQ — ${store.storeName}`, url: await siteUrl(path), siteName: store.storeName, type: 'website' } };
  } catch {
    return { title: 'FAQ' };
  }
}

const plain = (html: string) => html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

// Store > Content > FAQ (TellMe idea 122). StorePal only: any other theme is a 404. The page carries FAQPage structured data so Google can show the answers.
export default async function FaqPage({ params }: PageProps) {
  const { subdomain } = await params;
  let data;
  try {
    data = await getStoreFaq(subdomain);
  } catch (err) {
    if (err instanceof StoreNotFoundError) notFound();
    throw err;
  }
  if (resolveTheme(data.store.theme) !== 'STOREPAL') notFound();
  const { categories } = await getStoreProducts(subdomain).catch(() => ({ categories: [] as string[] }));
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: data.items.map((i) => ({ '@type': 'Question', name: i.question, acceptedAnswer: { '@type': 'Answer', text: plain(i.answer) } })),
  };
  return (
    <>
      {data.items.length > 0 && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
        />
      )}
      <FaqView subdomain={subdomain} storeName={data.store.storeName} categories={categories} items={data.items} />
    </>
  );
}
