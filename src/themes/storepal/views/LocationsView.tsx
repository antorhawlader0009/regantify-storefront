import type { StoreShopLocation } from '@/lib/storefrontApi';
import { StoreHeader } from '../components/StoreHeader';
import { StoreFooter } from '../components/StoreFooter';
import { ShopLocationsHeading, ShopLocationsList } from '../components/ShopLocationsList';
import { TrackFeature } from '@/components/TrackFeature';

/** /locations: the store's shops with Google Maps links (Store > Content > Shop Locations). */
export function LocationsView({ subdomain, storeName, categories, items }: { subdomain: string; storeName: string; categories: string[]; items: StoreShopLocation[] }) {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <TrackFeature feature="LOCATIONS_VIEW" />
      <StoreHeader subdomain={subdomain} storeName={storeName} categories={categories} />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <ShopLocationsHeading />
        <ShopLocationsList items={items} />
      </main>
      <StoreFooter subdomain={subdomain} storeName={storeName} />
    </div>
  );
}
