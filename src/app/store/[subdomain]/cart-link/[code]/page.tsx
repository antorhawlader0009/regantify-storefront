import type { Metadata } from 'next';
import { getStoreInfo } from '@/lib/storefrontApi';
import { SharedCartView } from '@/themes/storepal/views/SharedCartView';

// A shared cart link (TellMe idea 77), for every theme like the recovery and tracking links. The cart is in the link and is
// looked up fresh in the browser, so the page is not worth indexing.
export const metadata: Metadata = {
  title: 'Your cart',
  robots: { index: false, follow: false },
};

export default async function SharedCartPage({
  params,
  searchParams,
}: {
  params: Promise<{ subdomain: string; code: string }>;
  searchParams: Promise<{ coupon?: string }>;
}) {
  const { subdomain, code } = await params;
  const { coupon } = await searchParams;
  const store = await getStoreInfo(subdomain);
  return <SharedCartView subdomain={subdomain} code={code} coupon={coupon} storeName={store.storeName} logoUrl={store.logoUrl ?? null} />;
}
