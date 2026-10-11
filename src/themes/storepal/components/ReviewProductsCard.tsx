'use client';

import Link from 'next/link';
import type { TrackedOrder } from '@/lib/checkoutApi';
import type { TrackLang } from '@/lib/trackingI18n';

const TEXT = {
  en: { title: 'Review your products', sub: 'Your review will carry a “Verified buyer” mark.', write: 'Write a review' },
  bn: { title: 'আপনার পণ্যগুলোর রিভিউ দিন', sub: 'আপনার রিভিউতে “কিনেছেন” চিহ্ন থাকবে।', write: 'রিভিউ লিখুন' },
} as const;

/**
 * "Review your products" on the tracking page of a Completed online order (TellMe idea 99): one link per product that opens its page with the
 * order's tracking token, which the server checks before it marks the review "Verified buyer".
 */
export function ReviewProductsCard({ subdomain, order, lang }: { subdomain: string; order: TrackedOrder; lang: TrackLang }) {
  const t = TEXT[lang === 'bn' ? 'bn' : 'en'];
  if (order.status !== 'COMPLETED' || order.source !== 'STOREFRONT' || !order.trackingToken) return null;
  const items = order.items.filter((i) => i.product?.slug && i.product.visibility === 'PUBLIC');
  if (items.length === 0) return null;
  const seen = new Set<string>();
  const unique = items.filter((i) => (seen.has(i.product!.slug) ? false : (seen.add(i.product!.slug), true)));
  return (
    <div className="rounded-lg border border-line bg-canvas px-4 py-3">
      <p className="m-0 text-[14px] font-semibold text-ink">{t.title}</p>
      <p className="m-0 mt-0.5 text-[12px] text-muted">{t.sub}</p>
      <ul className="mt-2 divide-y divide-line">
        {unique.map((i) => (
          <li key={i.id} className="flex items-center justify-between gap-3 py-2">
            <span className="min-w-0 truncate text-[13px] text-ink">{i.productName}</span>
            <Link href={`/store/${subdomain}/product/${i.product!.slug}?order=${encodeURIComponent(order.trackingToken!)}`} className="shrink-0 text-[13px] font-medium text-accent hover:underline">
              {t.write}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
