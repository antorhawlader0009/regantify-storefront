import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getStoreProducts, StoreNotFoundError } from '@/lib/storefrontApi';
import { resolveTheme } from '@/lib/theme';
import { decodeWishlistLink } from '@/lib/wishlistLink';
import { SharedWishlistView } from '@/themes/storepal/views/SharedWishlistView';
import { storeParams } from '@/lib/storeRequest';

// The list is in the link and every link is different, so the page is made per request and never kept.
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ subdomain: string; code: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await storeParams(params);
  const list = decodeWishlistLink(code);
  return {
    title: list?.name ? `${list.name}'s wishlist` : 'A wishlist for you',
    robots: { index: false, follow: false },
  };
}

// "My wishlist" shared link (lib/wishlistLink.ts): someone's saved products, looked up in the live catalog, so friends and
// family can buy one as a gift. StorePal only, like the wishlist itself.
export default async function SharedWishlistPage({ params }: PageProps) {
  const { subdomain, code } = await storeParams(params);
  let data;
  try {
    data = await getStoreProducts(subdomain);
  } catch (err) {
    if (err instanceof StoreNotFoundError) notFound();
    throw err;
  }
  const { store, products, categories, categoryDetails } = data;
  if (resolveTheme(store.theme) !== 'STOREPAL') notFound();

  const list = decodeWishlistLink(code);
  const shown = (list?.slugs ?? []).map((slug) => products.find((p) => p.slug === slug)).filter((p): p is (typeof products)[number] => !!p);

  return (
    <SharedWishlistView
      subdomain={subdomain}
      storeName={store.storeName}
      ownerName={list?.name ?? null}
      valid={!!list}
      products={shown}
      missing={(list?.slugs.length ?? 0) - shown.length}
      giftOn={!!store.giftOption}
      categories={categories}
      categoryDetails={categoryDetails}
      logoUrl={store.logoUrl}
      footerConfig={store.footerConfig}
    />
  );
}
