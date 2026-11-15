import type { Metadata } from 'next';
import { MinimogDemo } from '@/themes/minimog/demo/MinimogDemo';

// The Minimog template's demo store, opened from the dashboard's Store > Templates > View (every plan). It lives on the
// store's own address (/template-demo/minimog) so it works on every store host with no new domain, and shows only
// sample data: it reads nothing from the store.
export const metadata: Metadata = {
  title: { absolute: 'Minimog template preview' },
  robots: { index: false, follow: false },
};

export default function MinimogDemoPage() {
  return <MinimogDemo />;
}
