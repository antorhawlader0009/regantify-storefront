'use client';

import { BadgeCheck, CalendarDays, PackageCheck, Star, ThumbsUp, type LucideIcon } from 'lucide-react';
import { useStorePalDesign, useVerifiedSeller } from '../lib/designSettings';

// Numbers are always shown in English digits, also in Bangla text (the owner's rule, 2026-10-29).
const toBn = (text: string) => text;

/**
 * The store's reputation numbers (TellMe idea 147): true figures the server counted (orders delivered, delivery rating, share of 4-5 star
 * reviews, year started), at the top of the footer on every page. The owner picks which to show in Store > Design > Store reputation; the server
 * rounds them down and leaves out a figure with too little behind it, so whatever arrives here is shown as it is. Nothing renders when there is none.
 */
export function ReputationStrip() {
  const { reputation, storeLanguage } = useStorePalDesign();
  const verified = useVerifiedSeller();
  if (!reputation && !verified) return null;
  const bn = storeLanguage === 'bn';
  const num = (n: number | string) => (bn ? toBn(String(n)) : String(n));
  const big = (n: number) => num(n.toLocaleString('en-US'));

  const items: { icon: LucideIcon; text: string; strong?: boolean }[] = [];
  // "Verified seller" (super-admin-new.md Step 12): Regantify checked who runs this store. First, and shown even when no reputation figure is on.
  if (verified) {
    items.push({
      icon: BadgeCheck,
      strong: true,
      text: bn ? `যাচাই করা বিক্রেতা${verified.dbid ? ` · DBID ${verified.dbid}` : ''}` : `Verified seller${verified.dbid ? ` · DBID ${verified.dbid}` : ''}`,
    });
  }
  if (!reputation) return <Strip items={items} />;
  if (reputation.orders) items.push({ icon: PackageCheck, text: bn ? `${big(reputation.orders)}+ অর্ডার ডেলিভারি হয়েছে` : `${big(reputation.orders)}+ orders delivered` });
  if (reputation.rating) {
    items.push({
      icon: Star,
      text: bn
        ? `ডেলিভারি রেটিং ${num(reputation.rating.avg.toFixed(1))}/5 (${big(reputation.rating.count)}+ জন ক্রেতার)`
        : `${reputation.rating.avg.toFixed(1)}/5 delivery rating (${big(reputation.rating.count)}+ customers)`,
    });
  }
  if (reputation.reviews) {
    items.push({
      icon: ThumbsUp,
      text: bn ? `${num(reputation.reviews.percent)}% রিভিউ 4 বা 5 স্টারের` : `${reputation.reviews.percent}% of reviews are 4 or 5 stars`,
    });
  }
  if (reputation.since) items.push({ icon: CalendarDays, text: bn ? `${num(reputation.since)} সাল থেকে আছি` : `Serving since ${reputation.since}` });
  return <Strip items={items} />;
}

function Strip({ items }: { items: { icon: LucideIcon; text: string; strong?: boolean }[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="m-0 mx-auto flex max-w-6xl list-none flex-wrap items-center justify-center gap-x-6 gap-y-2 border-b border-line px-4 py-4 sm:px-6">
      {items.map(({ icon: Icon, text, strong }) => (
        <li key={text} className="flex items-center gap-2 text-[13px] font-medium text-ink">
          <Icon size={16} className={`shrink-0 ${strong ? 'text-emerald-600' : 'text-muted'}`} aria-hidden />
          {text}
        </li>
      ))}
    </ul>
  );
}
