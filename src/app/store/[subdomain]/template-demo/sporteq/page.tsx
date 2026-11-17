import type { Metadata } from 'next';
import { SporteqDemo } from '@/themes/sporteq/demo/SporteqDemo';

// The Sporteq template's demo store, opened from the dashboard's Store > Templates > View (every plan). It lives on the
// store's own address (/template-demo/sporteq) so it works on every store host with no new domain, and shows only
// sample data: it reads nothing from the store.
export const metadata: Metadata = {
  title: { absolute: 'Sporteq template preview' },
  robots: { index: false, follow: false },
};

export default function SporteqDemoPage() {
  return <SporteqDemo />;
}
