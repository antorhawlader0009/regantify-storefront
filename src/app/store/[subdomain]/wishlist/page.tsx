import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getStoreProducts, StoreNotFoundError } from '@/lib/storefrontApi';
import { isPageSkin, storeSkin } from '@/lib/theme';
import { PlaymateWishlistPage } from '@/themes/playmate/PlaymateWishlistPage';
import { SolevoWishlistPage } from '@/themes/solevo/SolevoWishlistPage';
import { ChronicsWishlistPage } from '@/themes/chronics/ChronicsWishlistPage';
import { MahabeshWishlistPage } from '@/themes/mahabesh/MahabeshWishlistPage';
import { TechzoneWishlistPage } from '@/themes/techzone/TechzoneWishlistPage';
import { StrideWishlistPage } from '@/themes/stride/StrideWishlistPage';
import { VaeloraWishlistPage } from '@/themes/vaelora/VaeloraWishlistPage';
import { ChicwoveWishlistPage } from '@/themes/chicwove/ChicwoveWishlistPage';
import { TechnovaWishlistPage } from '@/themes/technova/TechnovaWishlistPage';
import { TastehouseWishlistPage } from '@/themes/tastehouse/TastehouseWishlistPage';
import { SporteqWishlistPage } from '@/themes/sporteq/SporteqWishlistPage';
import { ShopeaseWishlistPage } from '@/themes/shopease/ShopeaseWishlistPage';
import { QuickbiteWishlistPage } from '@/themes/quickbite/QuickbiteWishlistPage';
import { PetmartWishlistPage } from '@/themes/petmart/PetmartWishlistPage';
import { PapernestWishlistPage } from '@/themes/papernest/PapernestWishlistPage';
import { NovellaWishlistPage } from '@/themes/novella/NovellaWishlistPage';
import { NovatrendWishlistPage } from '@/themes/novatrend/NovatrendWishlistPage';
import { MinimogWishlistPage } from '@/themes/minimog/MinimogWishlistPage';
import { MenauraWishlistPage } from '@/themes/menaura/MenauraWishlistPage';
import { MallonWishlistPage } from '@/themes/mallon/MallonWishlistPage';
import { GroceryantoWishlistPage } from '@/themes/groceryanto/GroceryantoWishlistPage';
import { GreenmartWishlistPage } from '@/themes/greenmart/GreenmartWishlistPage';
import { GloweriveWishlistPage } from '@/themes/glowerive/GloweriveWishlistPage';
import { GadgetstoreWishlistPage } from '@/themes/gadgetstore/GadgetstoreWishlistPage';
import { FurniluxWishlistPage } from '@/themes/furnilux/FurniluxWishlistPage';
import { EstateproWishlistPage } from '@/themes/estatepro/EstateproWishlistPage';
import { DrivecraftWishlistPage } from '@/themes/drivecraft/DrivecraftWishlistPage';
import { BeloraWishlistPage } from '@/themes/belora/BeloraWishlistPage';
import { ElevateWishlistPage } from '@/themes/elevate/ElevateWishlistPage';
import { storeParams } from '@/lib/storeRequest';

interface PageProps {
  params: Promise<{ subdomain: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subdomain } = await storeParams(params);
  try {
    const { store } = await getStoreProducts(subdomain);
    return { title: { absolute: `Wishlist - ${store.storeName}` }, robots: { index: false } };
  } catch {
    return { title: 'Wishlist' };
  }
}

// PlayMate has a wishlist page of its own (the template's WishlistView). On StorePal the wishlist opens inside the
// My account dialog (2026-10-29, the owner's request), so old links land there.
export default async function WishlistPage({ params }: PageProps) {
  const { subdomain } = await storeParams(params);
  let data;
  try {
    data = await getStoreProducts(subdomain);
  } catch (err) {
    if (err instanceof StoreNotFoundError) notFound();
    throw err;
  }
  const { store, products, categories } = data;
  const skin = storeSkin(store.theme);
  if (!isPageSkin(skin)) redirect(`/store/${subdomain}/account/wishlist`);
  const WishlistPage = skin === 'stride' ? StrideWishlistPage : skin === 'vaelora' ? VaeloraWishlistPage : skin === 'techzone' ? TechzoneWishlistPage : skin === 'mahabesh' ? MahabeshWishlistPage : skin === 'chronics' ? ChronicsWishlistPage : skin === 'elevate' ? ElevateWishlistPage : skin === 'belora' ? BeloraWishlistPage : skin === 'drivecraft' ? DrivecraftWishlistPage : skin === 'estatepro' ? EstateproWishlistPage : skin === 'furnilux' ? FurniluxWishlistPage : skin === 'gadgetstore' ? GadgetstoreWishlistPage : skin === 'glowerive' ? GloweriveWishlistPage : skin === 'greenmart' ? GreenmartWishlistPage : skin === 'groceryanto' ? GroceryantoWishlistPage : skin === 'mallon' ? MallonWishlistPage : skin === 'menaura' ? MenauraWishlistPage : skin === 'minimog' ? MinimogWishlistPage : skin === 'novatrend' ? NovatrendWishlistPage : skin === 'novella' ? NovellaWishlistPage : skin === 'papernest' ? PapernestWishlistPage : skin === 'petmart' ? PetmartWishlistPage : skin === 'quickbite' ? QuickbiteWishlistPage : skin === 'shopease' ? ShopeaseWishlistPage : skin === 'sporteq' ? SporteqWishlistPage : skin === 'tastehouse' ? TastehouseWishlistPage : skin === 'technova' ? TechnovaWishlistPage : skin === 'chicwove' ? ChicwoveWishlistPage : skin === 'solevo' ? SolevoWishlistPage : PlaymateWishlistPage;
  return <WishlistPage subdomain={subdomain} storeName={store.storeName} categories={categories} products={products} logoUrl={store.logoUrl} />;
}
