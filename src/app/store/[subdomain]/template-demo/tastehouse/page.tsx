import type { Metadata } from 'next';
import { TastehouseDemo } from '@/themes/tastehouse/demo/TastehouseDemo';

// The Tastehouse template's demo store, opened from the dashboard's Store > Templates > View (every plan). It lives on the
// store's own address (/template-demo/tastehouse) so it works on every store host with no new domain, and shows only
// sample data: it reads nothing from the store.
export const metadata: Metadata = {
  title: { absolute: 'Tastehouse template preview' },
  robots: { index: false, follow: false },
};

export default function TastehouseDemoPage() {
  return <TastehouseDemo />;
}
