import type { Metadata } from 'next';
import { getStoreInfo } from '@/lib/storefrontApi';
import { ConfirmOrderView } from '@/themes/storepal/views/ConfirmOrderView';
import { storeParams } from '@/lib/storeRequest';

// A one-person page (its token is the proof of access): always rendered for the request, never kept in the page cache
// (PERFORMANCE-PLAN.md Step 8), so no token ends up stored on the server's disk.
export const dynamic = 'force-dynamic';

// The "confirm your order" link texted after a Cash on Delivery order (IDEA-24). Theme-independent like the tracking
// link: one page for every store. The token is the proof of access, so the page is kept out of search results and never
// sends the address as a referrer. The order is fetched in the browser, fresh each time.
export const metadata: Metadata = {
  title: 'Confirm your order',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

export default async function ConfirmOrderPage({ params }: { params: Promise<{ subdomain: string; token: string }> }) {
  const { subdomain, token } = await storeParams(params);
  const store = await getStoreInfo(subdomain);
  return <ConfirmOrderView subdomain={subdomain} token={token} storeName={store.storeName} logoUrl={store.logoUrl ?? null} />;
}
