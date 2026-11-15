import type { Metadata } from 'next';
import { ShopeaseDemo } from '@/themes/shopease/demo/ShopeaseDemo';

// The Shopease template's demo store, opened from the dashboard's Store > Templates > View (every plan). It lives on the
// store's own address (/template-demo/shopease) so it works on every store host with no new domain, and shows only
// sample data: it reads nothing from the store.
export const metadata: Metadata = {
  title: { absolute: 'Shopease template preview' },
  robots: { index: false, follow: false },
};

export default function ShopeaseDemoPage() {
  return <ShopeaseDemo />;
}
