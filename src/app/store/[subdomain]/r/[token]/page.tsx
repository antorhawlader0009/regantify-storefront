import type { Metadata } from 'next';
import { getStoreInfo } from '@/lib/storefrontApi';
import { RecoverCartView } from '@/themes/storepal/views/RecoverCartView';

// The cart recovery link from the abandoned-checkout reminder SMS (TellMe idea 40). Theme-independent like the tracking
// and payment links: one page for every store. The token is the proof of access, so the page stays out of search results
// and never sends the address as a referrer. The cart itself is fetched in the browser, fresh each time.
export const metadata: Metadata = {
  title: 'Your cart',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

export default async function RecoverCartPage({ params }: { params: Promise<{ subdomain: string; token: string }> }) {
  const { subdomain, token } = await params;
  const store = await getStoreInfo(subdomain);
  return <RecoverCartView subdomain={subdomain} token={token} storeName={store.storeName} logoUrl={store.logoUrl ?? null} />;
}
