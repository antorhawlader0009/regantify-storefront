'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface CampaignSummary {
  id: string;
  name: string;
  slug: string;
  coverPhotoUrl: string | null;
}

interface HeroBannerProps {
  subdomain: string;
  campaigns: CampaignSummary[];
}

/**
 * Matches the reference homepage's hero exactly: a large campaign
 * cover photo with a "SHOP NOW" link and small dot indicators when
 * there's more than one campaign to show (see storepal.com.bd — the
 * banner cycles between the vendor's own promotional campaigns, not
 * fabricated marketing copy). Renders nothing when the vendor has no
 * campaign with a cover photo set — see StorefrontService.getStoreCampaigns
 * for why that's already filtered server-side.
 */
export function HeroBanner({ subdomain, campaigns }: HeroBannerProps) {
  const [active, setActive] = useState(0);

  if (campaigns.length === 0) return null;

  const campaign = campaigns[active];

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
      <div className="relative aspect-[21/9] sm:aspect-[3/1] rounded-lg overflow-hidden bg-canvas">
        {campaign.coverPhotoUrl && (
          <Image
            key={campaign.id}
            src={campaign.coverPhotoUrl}
            alt={campaign.name}
            fill
            priority
            sizes="(max-width: 1100px) 100vw, 1100px"
            className="object-cover"
          />
        )}

        <Link
          href={`/store/${subdomain}/campaigns/${campaign.slug}`}
          className="absolute right-4 bottom-4 sm:right-6 sm:bottom-6 px-4 py-2 rounded-md bg-ink text-white text-[12.5px] font-bold hover:bg-ink/90 transition-colors"
        >
          SHOP NOW
        </Link>

        {campaigns.length > 1 && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-3 flex gap-1.5">
            {campaigns.map((c, i) => (
              <button
                key={c.id}
                onClick={() => setActive(i)}
                aria-label={`Show ${c.name}`}
                className={`w-2 h-2 rounded-full transition-colors ${i === active ? 'bg-white' : 'bg-white/50'}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
