import type { Metadata } from 'next';
import { getStoreInfo } from '@/lib/storefrontApi';
import { InstantCheckoutView } from '@/themes/storepal/views/InstantCheckoutView';
import { storeParams } from '@/lib/storeRequest';

// A one-person page (its token is the proof of access): always rendered for the request, never kept in the page cache
// (PERFORMANCE-PLAN.md Step 8), so no token ends up stored on the server's disk.
export const dynamic = 'force-dynamic';

// The instant checkout link (server/src/instant-checkout/): the products and the customer's details the shop prepared, one
// tap to the store's checkout already filled in. Theme-independent like the cart recovery link. Out of search results, and
// the address is never sent as a referrer.
export const metadata: Metadata = {
  title: 'Your order',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

export default async function InstantCheckoutPage({ params }: { params: Promise<{ subdomain: string; token: string }> }) {
  const { subdomain, token } = await storeParams(params);
  const store = await getStoreInfo(subdomain);
  return <InstantCheckoutView subdomain={subdomain} token={token} storeName={store.storeName} logoUrl={store.logoUrl ?? null} />;
}
