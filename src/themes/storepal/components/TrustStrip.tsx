'use client';

import { Banknote, BadgeCheck, Gift, Headphones, Lock, RotateCcw, ShieldCheck, Truck, type LucideIcon } from 'lucide-react';
import { useStorePalDesign } from '../lib/designSettings';

const ICONS: Record<string, LucideIcon> = {
  truck: Truck,
  return: RotateCcw,
  shield: ShieldCheck,
  support: Headphones,
  genuine: BadgeCheck,
  lock: Lock,
  cash: Banknote,
  gift: Gift,
};

/**
 * The store's trust strip (TellMe idea 130): a few icon + title + line the owner wrote (Store > Design > Trust Strip),
 * under the Buy button, near the payment choice at checkout, and optionally at the bottom of the home page. Off until
 * the owner turns it on; the words are theirs alone.
 */
export function TrustStrip({ where }: { where: 'product' | 'checkout' | 'home' }) {
  const strip = useStorePalDesign().trustStrip;
  if (!strip?.enabled || !strip[where] || strip.items.length === 0) return null;
  const wide = where === 'home';
  return (
    <ul
      className={`m-0 list-none p-0 grid gap-3 ${wide ? 'max-w-6xl mx-auto px-4 sm:px-6 py-6 grid-cols-2 md:grid-cols-4' : 'mt-4 grid-cols-2 rounded-lg border border-line bg-surface p-3'}`}
    >
      {strip.items.map((item, i) => {
        const Icon = ICONS[item.icon] ?? ShieldCheck;
        return (
          <li key={i} className="flex items-start gap-2">
            <Icon size={wide ? 22 : 18} className="mt-0.5 shrink-0 text-ink" />
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold text-ink">{item.title}</span>
              {item.text && <span className="block text-[12px] leading-snug text-muted">{item.text}</span>}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
