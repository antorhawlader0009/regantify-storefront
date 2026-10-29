'use client';

import { useStorePalDesign } from '../lib/designSettings';
import { highlightIcon } from '../lib/highlightIcons';
import { useStoreText } from '../lib/storeText';

// What a store shows until its vendor writes its own in Store > Design > Customize.
// Keep the words in lockstep with the dashboard's DEFAULT_HIGHLIGHTS (client/src/lib/homeSections.ts).
const DEFAULT_HIGHLIGHTS = [
  { id: 'default-1', icon: 'TRUCK', title: 'Fast delivery', text: 'Quick delivery to your doorstep.' },
  { id: 'default-2', icon: 'SHIELD_CHECK', title: 'Genuine products', text: 'Quality-checked items you can trust.' },
  { id: 'default-3', icon: 'HAND_COINS', title: 'Cash on delivery', text: 'Pay when your order arrives at your door.' },
];

// Desktop columns by count: up to 4 sit on one row with a thin line between them; 5 or more wrap in rows of 3.
const LG_COLS: Record<number, string> = { 1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4' };

/**
 * The home page's highlights (Store > Design > Customize): short points with an icon, such as free delivery or easy
 * returns, from the vendor's own list (up to 9), or StorePal's three built-in ones when they never wrote any. An
 * optional heading sits above. Drawn as one card in the page's own column, like the product cards (2026-10-29: it was a
 * full-width white band that broke out of the layout): icon left, words right, a thin line between points.
 */
export function HomeHighlights() {
  const t = useStoreText();
  const design = useStorePalDesign();
  const items = design.homeHighlights.length > 0 ? design.homeHighlights : DEFAULT_HIGHLIGHTS;
  const heading = design.homeHighlightsHeading?.trim();
  const oneRow = items.length <= 4;

  return (
    <section className="max-w-6xl mx-auto px-3 sm:px-6 py-6" aria-label={heading || 'Why shop with us'}>
      {heading && <h2 className="mb-3 text-[18px] font-bold text-ink">{heading}</h2>}
      <ul
        className={`m-0 grid list-none grid-cols-1 rounded-md border border-line bg-surface p-0 shadow-card divide-y divide-line sm:grid-cols-2 sm:divide-y-0 ${
          oneRow ? `${LG_COLS[items.length]} lg:divide-x` : 'lg:grid-cols-3'
        }`}
      >
        {items.map((item) => {
          const Icon = highlightIcon(item.icon);
          return (
            <li key={item.id} className="flex items-start gap-3 px-4 py-4 sm:px-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent-light text-accent">
                <Icon size={20} strokeWidth={2} aria-hidden />
              </span>
              <span className="min-w-0 pt-0.5">
                <span className="block text-[14px] font-bold leading-snug text-ink">{t(item.title)}</span>
                {item.text && <span className="mt-0.5 block text-[12.5px] leading-snug text-muted">{t(item.text)}</span>}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
