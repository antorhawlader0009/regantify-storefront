import type { Metadata } from 'next';
import { getStoreInfo } from '@/lib/storefrontApi';
import { PayLinkView } from '@/themes/storepal/views/PayLinkView';

// The payment link a vendor sends for an order they entered themselves (TellMe idea 19). Theme-independent like the
// tracking link: one page for every store. The token is the proof of access, so the page is kept out of search
// results and never sends the address as a referrer. What is to be paid is fetched in the browser, fresh each time.
export const metadata: Metadata = {
  title: 'Pay your advance',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

export default async function PayLinkPage({ params }: { params: Promise<{ subdomain: string; token: string }> }) {
  const { subdomain, token } = await params;
  const store = await getStoreInfo(subdomain);
  return <PayLinkView subdomain={subdomain} token={token} storeName={store.storeName} logoUrl={store.logoUrl ?? null} />;
}
