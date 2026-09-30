import Image from 'next/image';
import type { StorefrontProduct } from '@/lib/storefrontApi';
import { StoreHeader } from '../components/StoreHeader';
import { StoreFooter } from '../components/StoreFooter';
import { ProductCard } from '../components/ProductCard';

interface CampaignViewProps {
  subdomain: string;
  storeName: string;
  categories: string[];
  campaignName: string;
  coverPhotoUrl: string | null;
  products: StorefrontProduct[];
}

/**
 * Marketing > Campaigns' public page on StorePal: header, the campaign's
 * cover photo with its name, and its hand-picked products. Prices are already
 * the campaign-adjusted ones (StorefrontService.applyCampaignPricing), the
 * same price checkout charges, so nothing here works out a price.
 */
export function CampaignView({ subdomain, storeName, categories, campaignName, coverPhotoUrl, products }: CampaignViewProps) {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <StoreHeader subdomain={subdomain} storeName={storeName} categories={categories} />

      {coverPhotoUrl ? (
        <div className="relative w-full aspect-[1200/633] max-h-[420px] bg-ink overflow-hidden">
          <Image src={coverPhotoUrl} alt={campaignName} fill sizes="100vw" className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 max-w-6xl mx-auto px-4 sm:px-6 pb-6">
            <h1 className="text-[26px] sm:text-[40px] font-bold text-white leading-tight">{campaignName}</h1>
          </div>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8">
          <h1 className="text-[26px] sm:text-[32px] font-bold text-ink">{campaignName}</h1>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {products.length === 0 ? (
          <div className="text-center py-20 bg-surface border border-line">
            <p className="text-lg font-semibold text-ink mb-1.5">Nothing here yet</p>
            <p className="text-[13.5px] text-muted">This campaign doesn&apos;t have any products yet. Check back soon.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:[grid-template-columns:repeat(auto-fill,minmax(200px,1fr))]">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} subdomain={subdomain} storeName={storeName} />
            ))}
          </div>
        )}
      </main>

      <StoreFooter subdomain={subdomain} storeName={storeName} />
    </div>
  );
}
