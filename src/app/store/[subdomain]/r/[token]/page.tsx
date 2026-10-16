import type { Metadata } from 'next';
import { getStoreInfo } from '@/lib/storefrontApi';
import { RecoverCartView } from '@/themes/storepal/views/RecoverCartView';
import { storeParams } from '@/lib/storeRequest';

// A one-person page (its token is the proof of access): always rendered for the request, never kept in the page cache
// (PERFORMANCE-PLAN.md Step 8), so no token ends up stored on the server's disk.
export const dynamic = 'force-dynamic';

// The cart recovery link from the abandoned-checkout reminder SMS (TellMe idea 40). Theme-independent like the tracking
// and payment links: one page for every store. The token is the proof of access, so the page stays out of search results
// and never sends the address as a referrer. The cart itself is fetched in the browser, fresh each time.
export const metadata: Metadata = {
  title: 'Your cart',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

export default async function RecoverCartPage({ params }: { params: Promise<{ subdomain: string; token: string }> }) {
  const { subdomain, token } = await storeParams(params);
  const store = await getStoreInfo(subdomain);
  return <RecoverCartView subdomain={subdomain} token={token} storeName={store.storeName} logoUrl={store.logoUrl ?? null} />;
}
