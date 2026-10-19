'use client';

import type { StorefrontCardSwatches } from '@/lib/storefrontApi';
import { swatchColor } from '@/lib/swatchColor';

/**
 * Colour circles on a product card, shared by every template (TellMe "StorePal 1" idea 1). A value with a photo shows
 * that photo in the circle; otherwise its colour from the name, else its first letter. Hovering (or tapping) a circle
 * asks the card to show that photo and pick that value; the card decides what to do with it.
 * Baymard: colours named only in text ("+7 colours") are often missed while scanning a list.
 */
export function CardSwatches({
  swatches,
  active,
  onPick,
  max = 5,
  moreLabel = (n: number) => `+${n}`,
}: {
  swatches: StorefrontCardSwatches;
  /** The value picked now (highlighted). */
  active?: string;
  onPick: (value: string, photoUrl: string | null) => void;
  max?: number;
  moreLabel?: (n: number) => string;
}) {
  const shown = swatches.items.slice(0, max);
  const more = swatches.items.length - shown.length;
  return (
    <div className="flex items-center gap-1.5" role="group" aria-label={swatches.option}>
      {shown.map((s) => {
        const fill = s.photoUrl ? null : swatchColor(s.value);
        const isActive = active === s.value;
        return (
          <button
            key={s.value}
            type="button"
            title={s.value}
            aria-label={s.value}
            aria-pressed={isActive}
            onMouseEnter={() => onPick(s.value, s.photoUrl)}
            onFocus={() => onPick(s.value, s.photoUrl)}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onPick(s.value, s.photoUrl);
            }}
            className={`relative h-6 w-6 shrink-0 cursor-pointer overflow-hidden rounded-full border bg-canvas p-0 transition
              focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                isActive ? 'border-ink ring-2 ring-ink/80 ring-offset-1 ring-offset-surface' : 'border-line-strong hover:border-ink/60'
              }`}
            style={fill ? { backgroundColor: fill } : undefined}
          >
            {s.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- a 24px circle; next/image's loader is overkill here
              <img src={s.photoUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
            ) : !fill ? (
              <span className="flex h-full w-full items-center justify-center text-[10px] font-bold uppercase text-muted">
                {s.value.slice(0, 1)}
              </span>
            ) : null}
          </button>
        );
      })}
      {more > 0 && <span className="text-[11px] font-medium text-muted">{moreLabel(more)}</span>}
    </div>
  );
}
