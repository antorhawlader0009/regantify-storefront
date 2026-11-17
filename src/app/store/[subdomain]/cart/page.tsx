import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getStoreProducts, StoreNotFoundError } from '@/lib/storefrontApi';
import { resolveTheme, storeSkin } from '@/lib/theme';
import { PlaymateCartPage } from '@/themes/playmate/PlaymateCartPage';
import { SolevoCartPage } from '@/themes/solevo/SolevoCartPage';
import { ChronicsCartPage } from '@/themes/chronics/ChronicsCartPage';
import { MahabeshCartPage } from '@/themes/mahabesh/MahabeshCartPage';
import { TechzoneCartPage } from '@/themes/techzone/TechzoneCartPage';
import { StrideCartPage } from '@/themes/stride/StrideCartPage';
import { VaeloraCartPage } from '@/themes/vaelora/VaeloraCartPage';
import { ChicwoveCartPage } from '@/themes/chicwove/ChicwoveCartPage';
import { TastehouseCartPage } from '@/themes/tastehouse/TastehouseCartPage';
import { SporteqCartPage } from '@/themes/sporteq/SporteqCartPage';
import { ShopeaseCartPage } from '@/themes/shopease/ShopeaseCartPage';
import { QuickbiteCartPage } from '@/themes/quickbite/QuickbiteCartPage';
import { PetmartCartPage } from '@/themes/petmart/PetmartCartPage';
import { PapernestCartPage } from '@/themes/papernest/PapernestCartPage';
import { NovellaCartPage } from '@/themes/novella/NovellaCartPage';
import { NovatrendCartPage } from '@/themes/novatrend/NovatrendCartPage';
import { MinimogCartPage } from '@/themes/minimog/MinimogCartPage';
import { MenauraCartPage } from '@/themes/menaura/MenauraCartPage';
import { MallonCartPage } from '@/themes/mallon/MallonCartPage';
import { GroceryantoCartPage } from '@/themes/groceryanto/GroceryantoCartPage';
import { GreenmartCartPage } from '@/themes/greenmart/GreenmartCartPage';
import { GloweriveCartPage } from '@/themes/glowerive/GloweriveCartPage';
import { GadgetstoreCartPage } from '@/themes/gadgetstore/GadgetstoreCartPage';
import { FurniluxCartPage } from '@/themes/furnilux/FurniluxCartPage';
import { EstateproCartPage } from '@/themes/estatepro/EstateproCartPage';
import { DrivecraftCartPage } from '@/themes/drivecraft/DrivecraftCartPage';
import { BeloraCartPage } from '@/themes/belora/BeloraCartPage';
import { ElevateCartPage } from '@/themes/elevate/ElevateCartPage';
import { CartView as MediumCartView } from '@/themes/medium/views/CartView';
import { CartView as MinimalCartView } from '@/themes/minimal/views/CartView';
import { CartView as StorepalCartView } from '@/themes/storepal/views/CartView';
import { storeParams } from '@/lib/storeRequest';

interface PageProps {
  params: Promise<{ subdomain: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subdomain } = await storeParams(params);
  try {
    const { store } = await getStoreProducts(subdomain);
    return { title: { absolute: `Your Cart - ${store.storeName}` } };
  } catch {
    return { title: 'Cart' };
  }
}

export default async function CartPage({ params }: PageProps) {
  const { subdomain } = await storeParams(params);

  let data;
  try {
    data = await getStoreProducts(subdomain);
  } catch (err) {
    if (err instanceof StoreNotFoundError) notFound();
    throw err;
  }

  const { store, categories, products } = data;
  const viewProps = { subdomain, storeName: store.storeName, categories };
  // PlayMate has its own cart page (the template's CartView), with suggestions from the store's products.
  if (storeSkin(store.theme) === 'stride') return <StrideCartPage {...viewProps} products={products} logoUrl={store.logoUrl} />;
  if (storeSkin(store.theme) === 'vaelora') return <VaeloraCartPage {...viewProps} products={products} logoUrl={store.logoUrl} />;
  if (storeSkin(store.theme) === 'techzone') return <TechzoneCartPage {...viewProps} products={products} logoUrl={store.logoUrl} />;
  if (storeSkin(store.theme) === 'mahabesh') return <MahabeshCartPage {...viewProps} products={products} logoUrl={store.logoUrl} />;
  if (storeSkin(store.theme) === 'chronics') return <ChronicsCartPage {...viewProps} products={products} logoUrl={store.logoUrl} />;
  if (storeSkin(store.theme) === 'chicwove') return <ChicwoveCartPage {...viewProps} products={products} logoUrl={store.logoUrl} />;
  if (storeSkin(store.theme) === 'tastehouse') return <TastehouseCartPage {...viewProps} products={products} logoUrl={store.logoUrl} />;
  if (storeSkin(store.theme) === 'sporteq') return <SporteqCartPage {...viewProps} products={products} logoUrl={store.logoUrl} />;
  if (storeSkin(store.theme) === 'shopease') return <ShopeaseCartPage {...viewProps} products={products} logoUrl={store.logoUrl} />;
  if (storeSkin(store.theme) === 'quickbite') return <QuickbiteCartPage {...viewProps} products={products} logoUrl={store.logoUrl} />;
  if (storeSkin(store.theme) === 'petmart') return <PetmartCartPage {...viewProps} products={products} logoUrl={store.logoUrl} />;
  if (storeSkin(store.theme) === 'papernest') return <PapernestCartPage {...viewProps} products={products} logoUrl={store.logoUrl} />;
  if (storeSkin(store.theme) === 'novella') return <NovellaCartPage {...viewProps} products={products} logoUrl={store.logoUrl} />;
  if (storeSkin(store.theme) === 'novatrend') return <NovatrendCartPage {...viewProps} products={products} logoUrl={store.logoUrl} />;
  if (storeSkin(store.theme) === 'minimog') return <MinimogCartPage {...viewProps} products={products} logoUrl={store.logoUrl} />;
  if (storeSkin(store.theme) === 'menaura') return <MenauraCartPage {...viewProps} products={products} logoUrl={store.logoUrl} />;
  if (storeSkin(store.theme) === 'mallon') return <MallonCartPage {...viewProps} products={products} logoUrl={store.logoUrl} />;
  if (storeSkin(store.theme) === 'groceryanto') return <GroceryantoCartPage {...viewProps} products={products} logoUrl={store.logoUrl} />;
  if (storeSkin(store.theme) === 'greenmart') return <GreenmartCartPage {...viewProps} products={products} logoUrl={store.logoUrl} />;
  if (storeSkin(store.theme) === 'glowerive') return <GloweriveCartPage {...viewProps} products={products} logoUrl={store.logoUrl} />;
  if (storeSkin(store.theme) === 'gadgetstore') return <GadgetstoreCartPage {...viewProps} products={products} logoUrl={store.logoUrl} />;
  if (storeSkin(store.theme) === 'furnilux') return <FurniluxCartPage {...viewProps} products={products} logoUrl={store.logoUrl} />;
  if (storeSkin(store.theme) === 'estatepro') return <EstateproCartPage {...viewProps} products={products} logoUrl={store.logoUrl} />;
  if (storeSkin(store.theme) === 'drivecraft') return <DrivecraftCartPage {...viewProps} products={products} logoUrl={store.logoUrl} />;
  if (storeSkin(store.theme) === 'belora') return <BeloraCartPage {...viewProps} products={products} logoUrl={store.logoUrl} />;
  if (storeSkin(store.theme) === 'elevate') return <ElevateCartPage {...viewProps} products={products} logoUrl={store.logoUrl} />;
  if (storeSkin(store.theme) === 'solevo') return <SolevoCartPage {...viewProps} products={products} logoUrl={store.logoUrl} />;
  if (storeSkin(store.theme) === 'playmate') return <PlaymateCartPage {...viewProps} products={products} logoUrl={store.logoUrl} />;

  return resolveTheme(store.theme) === 'MINIMAL' ? (
    <MinimalCartView {...viewProps} />
  ) : resolveTheme(store.theme) === 'STOREPAL' ? (
    <StorepalCartView {...viewProps} />
  ) : (
    <MediumCartView {...viewProps} />
  );
}
