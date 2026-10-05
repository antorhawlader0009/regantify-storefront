import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import type { StorefrontCampaignSummary } from '@/lib/storefrontApi';

/**
 * Marketing > Campaigns' "Product pages" on the StorePal homepage. A campaign
 * page (/campaigns/[slug]) had no link anywhere in the store, so shoppers could
 * only reach it from a link the vendor shared; this puts every campaign on the
 * home page as a cover card. Renders nothing when the vendor has none.
 */
export function CampaignsStrip({ subdomain, campaigns }: { subdomain: string; campaigns: StorefrontCampaignSummary[] }) {
  if (campaigns.length === 0) return null;
  return (
    <section aria-label="Campaigns">
      <h2 className="text-[18px] font-bold text-ink mb-4 text-center">Offers &amp; Campaigns</h2>
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {campaigns.map((c) => (
          <Link
            key={c.id}
            href={`/store/${subdomain}/campaigns/${c.slug}`}
            className="group relative block aspect-[16/9] overflow-hidden rounded-lg border border-line bg-surface"
          >
            {c.coverPhotoUrl && (
              <Image
                src={c.coverPhotoUrl}
                alt={c.name}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-3.5 text-white">
              <span className="text-[15px] font-bold leading-tight">{c.name}</span>
              <span className="flex shrink-0 items-center gap-1 text-[12px] font-semibold">
                Shop now <ArrowRight size={13} aria-hidden />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
