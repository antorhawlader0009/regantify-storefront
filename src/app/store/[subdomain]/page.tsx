import type { Metadata } from 'next';
import { HomePage, homeMetadata } from './homePage';

// The plain store home page (no query). It reads no request data, so Next keeps the rendered page and serves it again
// until the store's data changes (on-demand revalidation by tag) or a minute passes. A home request with ?category=,
// ?brand=, ?q= or ?coupon= is sent to browse/page.tsx by middleware.ts (PERFORMANCE-PLAN.md Step 8).
type PageProps = { params: Promise<{ subdomain: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return homeMetadata({ params, query: {} });
}

export default async function StorePage({ params }: PageProps) {
  return <HomePage params={params} query={{}} />;
}
