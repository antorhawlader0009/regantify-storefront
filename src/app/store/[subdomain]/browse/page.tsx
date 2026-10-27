import type { Metadata } from 'next';
import { HomePage, homeMetadata, type HomeQuery } from '../homePage';

// The store home page with a query: a category or brand listing, search results or a coupon link (middleware.ts sends
// such requests here, PERFORMANCE-PLAN.md Step 8). It reads the query, so it is rendered fresh on every request, exactly
// like the home page was before. The plain home page (../page.tsx) is the one that is kept.
export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ subdomain: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

function homeQuery(raw: Record<string, string | string[] | undefined>): HomeQuery {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  return { category: one(raw.category), brand: one(raw.brand), q: one(raw.q), coupon: one(raw.coupon), picks: one(raw.picks) };
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  return homeMetadata({ params, query: homeQuery(await searchParams) });
}

export default async function StoreBrowsePage({ params, searchParams }: PageProps) {
  return <HomePage params={params} query={homeQuery(await searchParams)} />;
}
