'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCompare } from '../lib/compare';
import { useStorePalDesign } from '../lib/designSettings';
import { bnDigits } from '../lib/storeText';

/** The bar at the bottom while products are ticked for comparison (TellMe idea 74): "Compare 3 products". Hidden on the compare page. */
export function CompareBar({ subdomain }: { subdomain: string }) {
  const { slugs, clear } = useCompare(subdomain);
  const design = useStorePalDesign();
  const pathname = usePathname() ?? '';
  const bn = design.storeLanguage === 'bn';
  if (slugs.length === 0 || /\/compare$/.test(pathname)) return null;
  const n = bn ? bnDigits(slugs.length) : String(slugs.length);
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <span className="text-[13px] text-ink">{bn ? `${n}টা পণ্য বাছা হয়েছে (সর্বোচ্চ ৩)` : `${n} of 3 products picked`}</span>
        <div className="flex items-center gap-3">
          <button type="button" onClick={clear} className="text-[12.5px] text-muted hover:text-accent">
            {bn ? 'মুছুন' : 'Clear'}
          </button>
          {slugs.length >= 2 ? (
            <Link href={`/store/${subdomain}/compare`} className="rounded-md bg-ink px-4 py-2 text-[13px] font-bold text-white hover:bg-ink/90">
              {bn ? `${n}টা পণ্য তুলনা করুন` : `Compare ${n} products`}
            </Link>
          ) : (
            <span className="text-[12px] text-muted">{bn ? 'তুলনা করতে আরও একটা বাছুন' : 'Pick one more to compare'}</span>
          )}
        </div>
      </div>
    </div>
  );
}
