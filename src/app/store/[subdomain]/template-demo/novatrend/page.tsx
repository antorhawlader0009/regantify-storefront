import type { Metadata } from 'next';
import { NovatrendDemo } from '@/themes/novatrend/demo/NovatrendDemo';

// The Novatrend template's demo store, opened from the dashboard's Store > Templates > View (every plan). It lives on the
// store's own address (/template-demo/novatrend) so it works on every store host with no new domain, and shows only
// sample data: it reads nothing from the store.
export const metadata: Metadata = {
  title: { absolute: 'Novatrend template preview' },
  robots: { index: false, follow: false },
};

export default function NovatrendDemoPage() {
  return <NovatrendDemo />;
}
