import type { Metadata } from 'next';
import { MallonDemo } from '@/themes/mallon/demo/MallonDemo';

// The Mallon template's demo store, opened from the dashboard's Store > Templates > View (every plan). It lives on the
// store's own address (/template-demo/mallon) so it works on every store host with no new domain, and shows only
// sample data: it reads nothing from the store.
export const metadata: Metadata = {
  title: { absolute: 'Mallon template preview' },
  robots: { index: false, follow: false },
};

export default function MallonDemoPage() {
  return <MallonDemo />;
}
