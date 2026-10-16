import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getStoreInfo, getTrackedOrderByLink } from '@/lib/storefrontApi';
import { TrackOrderView } from '@/themes/storepal/views/TrackOrderView';
import { storeParams } from '@/lib/storeRequest';

// A one-person page (its token is the proof of access): always rendered for the request, never kept in the page cache
// (PERFORMANCE-PLAN.md Step 8), so no token ends up stored on the server's disk.
export const dynamic = 'force-dynamic';

// The private tracking link from the shipping SMS (tracking-plan.md Steps 1 and 4).
// Theme-independent on purpose: one view for every store, so the link works for
// vendors on any theme. The token is the proof of access, so the page is kept
// out of search results and never sends the address as a referrer. The first paint is
// rendered here on the server; the view then refreshes itself in the browser.
export const metadata: Metadata = {
  title: 'Track your order',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

export default async function TrackLinkPage({ params }: { params: Promise<{ subdomain: string; token: string }> }) {
  const { subdomain, token } = await storeParams(params);
  const [store, order] = await Promise.all([getStoreInfo(subdomain), getTrackedOrderByLink(subdomain, token)]);
  if (!order) notFound();
  return (
    <TrackOrderView
      subdomain={subdomain}
      token={token}
      storeName={store.storeName}
      logoUrl={store.logoUrl ?? null}
      whatsappUrl={store.whatsappUrl ?? null}
      initialOrder={order}
    />
  );
}
