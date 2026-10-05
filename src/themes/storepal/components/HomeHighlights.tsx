'use client';

import { useStorePalDesign } from '../lib/designSettings';
import { highlightIcon } from '../lib/highlightIcons';

// What a store shows until its vendor writes its own in Store > Design > Customize.
// Keep the words in lockstep with the dashboard's DEFAULT_HIGHLIGHTS (client/src/lib/homeSections.ts).
const DEFAULT_HIGHLIGHTS = [
  { id: 'default-1', icon: 'TRUCK', title: 'Fast delivery', text: 'Quick delivery to your doorstep.' },
  { id: 'default-2', icon: 'SHIELD_CHECK', title: 'Genuine products', text: 'Quality-checked items you can trust.' },
  { id: 'default-3', icon: 'HAND_COINS', title: 'Cash on delivery', text: 'Pay when your order arrives at your door.' },
];

// Rows are centred and wrap, so 1, 2, 4, 5, 7 or 8 highlights all sit neatly instead of leaving a gap on
// the right. Four fit on one desktop row; every other count uses three.
const ITEM_WIDTH_CLASS = {
  four: 'w-full sm:w-[calc(50%-1rem)] lg:w-[calc(25%-1.5rem)]',
  three: 'w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.35rem)]',
};

/**
 * The home page's highlights band (Store > Design > Customize): short points with
 * an icon, such as free delivery or easy returns, from the vendor's own list
 * (up to 9), or StorePal's three built-in ones when they never wrote any. An
 * optional heading sits above. Phones show them one per row.
 */
export function HomeHighlights() {
  const design = useStorePalDesign();
  const items = design.homeHighlights.length > 0 ? design.homeHighlights : DEFAULT_HIGHLIGHTS;
  const heading = design.homeHighlightsHeading?.trim();
  const widthClass = items.length === 4 ? ITEM_WIDTH_CLASS.four : ITEM_WIDTH_CLASS.three;

  return (
    <section className="bg-surface border-y border-line" aria-label={heading || 'Why shop with us'}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {heading && <h2 className="text-[15px] font-bold text-ink text-center mb-6">{heading}</h2>}
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-7">
          {items.map((item) => {
            const Icon = highlightIcon(item.icon);
            return (
              <div key={item.id} className={`${widthClass} flex flex-col items-center text-center gap-2`}>
                <div className="w-12 h-12 rounded-full bg-accent-light flex items-center justify-center">
                  <Icon size={22} className="text-accent" aria-hidden />
                </div>
                <p className="font-bold text-[13.5px] text-ink">{item.title}</p>
                {item.text && <p className="text-[12.5px] text-muted leading-relaxed max-w-[240px]">{item.text}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
