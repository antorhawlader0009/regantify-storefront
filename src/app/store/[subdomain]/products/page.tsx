import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getStoreProducts, siteUrl, StoreNotFoundError } from '@/lib/storefrontApi';
import { isPageSkin, storeSkin } from '@/lib/theme';
import { storeParams } from '@/lib/storeRequest';
import { StoreHeader } from '@/themes/storepal/components/StoreHeader';
import { StoreFooter } from '@/themes/storepal/components/StoreFooter';
import { PlaymateProductsView } from '@/themes/playmate/PlaymateProductsView';
import { SolevoProductsView } from '@/themes/solevo/SolevoProductsView';

interface PageProps {
  params: Promise<{ subdomain: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subdomain } = await storeParams(params);
  try {
    const { store } = await getStoreProducts(subdomain);
    if (!isPageSkin(storeSkin(store.theme))) return { title: 'Products' };
    return { title: 'All products', alternates: { canonical: await siteUrl(`/store/${subdomain}/products`) } };
  } catch {
    return { title: 'Products' };
  }
}

// "All products": the template's product list page with nothing chosen (the template's /products). StorePal lists
// every product on the home page, so this page is for the template skins (PlayMate, Solevo) only. Kept like the other store pages (it reads no query:
// Show, price and sort are chosen in the browser; category, brand and search go to the home address's listing).
export default async function ProductsPage({ params }: PageProps) {
  const { subdomain } = await storeParams(params);
  let data;
  try {
    data = await getStoreProducts(subdomain);
  } catch (err) {
    if (err instanceof StoreNotFoundError) notFound();
    throw err;
  }
  const { store, products, categories, categoryDetails } = data;
  const skin = storeSkin(store.theme);
  if (!isPageSkin(skin)) notFound();
  const ProductsView = skin === 'solevo' ? SolevoProductsView : PlaymateProductsView;
  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      <StoreHeader subdomain={subdomain} storeName={store.storeName} categories={categories} categoryDetails={categoryDetails} logoUrl={store.logoUrl} />
      <main className="flex-1">
        <ProductsView subdomain={subdomain} storeName={store.storeName} products={products} categories={categories} categoryDetails={categoryDetails} />
      </main>
      <StoreFooter subdomain={subdomain} storeName={store.storeName} logoUrl={store.logoUrl} />
    </div>
  );
}
