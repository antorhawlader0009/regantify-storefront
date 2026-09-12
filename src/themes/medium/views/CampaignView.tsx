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
 * Marketing > Campaigns' public landing page — Medium theme only (see
 * the user's own instruction: campaigns are being built for the
 * default theme, not Minimal, and the two themes' files must never mix
 * — this view lives entirely under themes/medium/ and imports nothing
 * from themes/minimal/, same isolation every other Medium-only piece
 * already has). Structurally a simplified HomeView: header, an optional
 * cover-photo hero, and the campaign's product grid — no category
 * grouping or search filtering, since a campaign page is already a
 * curated, single-purpose product list. Every product's price here is
 * already the campaign-adjusted price (see
 * StorefrontService.applyCampaignPricing on the backend) — the exact
 * same price checkout will charge, no separate campaign-pricing logic
 * needed in this component.
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
            <h1 className="font-display text-2xl sm:text-4xl text-white leading-tight">{campaignName}</h1>
          </div>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
          <h1 className="font-display text-2xl sm:text-3xl text-ink">{campaignName}</h1>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {products.length === 0 ? (
          <div className="text-center py-20 bg-surface border border-line rounded-lg shadow-card">
            <p className="text-lg font-semibold text-ink mb-1.5">Nothing here yet</p>
            <p className="text-[13.5px] text-muted">This campaign doesn&apos;t have any products yet. Check back soon.</p>
          </div>
        ) : (
          <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(150px,1fr))]">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} subdomain={subdomain} />
            ))}
          </div>
        )}
      </main>

      <StoreFooter subdomain={subdomain} storeName={storeName} />
    </div>
  );
}
