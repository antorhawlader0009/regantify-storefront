'use client';

import { useEffect, useState } from 'react';
import { Banknote, BadgeCheck, Gift, Headphones, Lock, RotateCcw, ShieldCheck, Truck, type LucideIcon } from 'lucide-react';
import { useStorePalDesign } from '../lib/designSettings';
import { useStoreText } from '../lib/storeText';
import { apiOrigin } from '@/lib/checkoutApi';

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
// Whether the store's checkout offers Cash on Delivery now, asked once per store per page load (the public store answer's
// paymentGateways is already filtered for enabled, connected and the platform switch).
const codByStore = new Map<string, Promise<boolean>>();
function storeOffersCod(subdomain: string): Promise<boolean> {
  let known = codByStore.get(subdomain);
  if (!known) {
    known = fetch(`${apiOrigin()}/v1/store/${encodeURIComponent(subdomain)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => Array.isArray(data?.paymentGateways) && data.paymentGateways.some((g: { type?: string }) => g.type === 'COD'))
      .catch(() => false);
    codByStore.set(subdomain, known);
  }
  return known;
}

/**
 * The row right under the product page's Buy button (2026-10-28, the owner's rule): "Fast delivery" by default (the store
 * can turn it off in Store > Design > Trust Strip), "Cash on delivery" by itself while the checkout offers COD, then the
 * store's own trust items when it shows the strip on the product page. Nothing else is claimed for the store.
 */
export function ProductTrustRow({ subdomain, preOrder }: { subdomain: string; preOrder: boolean }) {
  const t = useStoreText();
  const strip = useStorePalDesign().trustStrip;
  const [cod, setCod] = useState(false);
  useEffect(() => {
    let live = true;
    void storeOffersCod(subdomain).then((on) => live && setCod(on));
    return () => {
      live = false;
    };
  }, [subdomain]);

  const own = strip?.enabled && strip.product ? strip.items : [];
  const items: { icon: string; title: string; text: string }[] = [];
  if (strip?.fastDelivery !== false) items.push({ icon: 'truck', title: preOrder ? t('Delivery in 20–25 days') : t('Fast delivery'), text: '' });
  // The store's own cash item already says it in its own words.
  if (cod && !own.some((i) => i.icon === 'cash')) items.push({ icon: 'cash', title: t('Cash on delivery'), text: '' });
  items.push(...own);
  if (items.length === 0) return null;

  const cols = items.length === 1 ? 'grid-cols-1' : items.length === 2 || items.length === 4 ? 'grid-cols-2' : 'grid-cols-3';
  return (
    <ul className={`mt-4 mb-0 grid ${cols} list-none gap-px overflow-hidden rounded-lg border border-line bg-line p-0 text-center`}>
      {items.map((item, i) => {
        const Icon = ICONS[item.icon] ?? ShieldCheck;
        return (
          <li key={i} className="flex flex-col items-center gap-1 bg-surface px-2 py-2.5 text-[11.5px] leading-tight text-muted">
            <Icon size={16} className="text-ink shrink-0" aria-hidden />
            <span className="text-ink/80">{item.title}</span>
            {item.text && <span className="text-[10.5px]">{item.text}</span>}
          </li>
        );
      })}
    </ul>
  );
}

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
