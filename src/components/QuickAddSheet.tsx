'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { swatchColor } from '@/lib/swatchColor';
import { CoverFloating } from '@/lib/floatingCover';

/**
 * Quick add (TellMe "StorePal 1" idea 2), shared by every template: a product with sizes or colours opens this sheet
 * from its card instead of sending the shopper to the product page. A sheet from the bottom on a phone, a small panel
 * in the middle on a computer. It only shows the choices; the card keeps the cart rules (price, stock, adding the line),
 * so every template's card stays the one place that decides what is bought.
 */
export interface QuickAddOption {
  name: string;
  values: string[];
}

export function QuickAddSheet({
  open,
  onClose,
  name,
  image,
  price,
  originalPrice,
  options,
  selected,
  onSelect,
  isAvailable,
  photoFor,
  note,
  warning,
  labels,
  onAdd,
  onBuy,
}: {
  open: boolean;
  onClose: () => void;
  name: string;
  image?: string | null;
  /** Already formatted by the template ("৳1,250"). */
  price: string;
  originalPrice?: string | null;
  options: QuickAddOption[];
  selected: Record<string, string>;
  onSelect: (option: string, value: string) => void;
  /** False = no stock left for this value with the other choices made (shown crossed out, still pickable for a message). */
  isAvailable: (option: string, value: string) => boolean;
  /** A value's own photo (Variation Photos), shown on colour circles and as the sheet's picture once picked. */
  photoFor?: (option: string, value: string) => string | null;
  /** E.g. "Only 3 left". */
  note?: string | null;
  warning?: string | null;
  labels: { addToCart: string; buyNow?: string; close: string };
  onAdd: () => void;
  onBuy?: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  // The picture follows the colour picked, when that colour has its own photo.
  const picked = options.map((o) => (selected[o.name] ? photoFor?.(o.name, selected[o.name]) : null)).find(Boolean);
  const shownImage = picked ?? image ?? null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center" role="presentation">
      <CoverFloating />
      <div className="absolute inset-0 bg-black/45" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={name}
        tabIndex={-1}
        className="relative w-full max-h-[85vh] overflow-y-auto rounded-t-2xl bg-surface p-5 shadow-2xl outline-none sm:max-w-md sm:rounded-2xl
          motion-safe:animate-[quickadd-in_180ms_ease-out]"
      >
        <span className="mx-auto mb-3 block h-1 w-10 rounded-full bg-line-strong sm:hidden" aria-hidden />
        <button
          type="button"
          onClick={onClose}
          aria-label={labels.close}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-canvas hover:text-ink"
        >
          <X size={18} />
        </button>

        <div className="flex gap-3 pr-8">
          {shownImage && (
            // eslint-disable-next-line @next/next/no-img-element -- a small preview inside a sheet
            <img src={shownImage} alt="" className="h-20 w-20 shrink-0 rounded-lg bg-canvas object-cover" />
          )}
          <div className="min-w-0">
            <p className="line-clamp-2 text-[14px] font-semibold leading-snug text-ink">{name}</p>
            <p className="mt-1 flex items-baseline gap-2">
              <span className="text-[16px] font-bold text-accent">{price}</span>
              {originalPrice && <span className="text-[12.5px] text-muted line-through">{originalPrice}</span>}
            </p>
            {note && <p className="mt-0.5 text-[12px] font-semibold text-accent-dark">{note}</p>}
          </div>
        </div>

        <div className="mt-4 space-y-4">
          {options.map((o) => (
            <div key={o.name}>
              <p className="mb-2 text-[12.5px] font-semibold text-ink">
                {o.name}
                {selected[o.name] && <span className="font-normal text-muted">: {selected[o.name]}</span>}
              </p>
              <div className="flex flex-wrap gap-2">
                {o.values.map((v) => {
                  const on = selected[o.name] === v;
                  const ok = isAvailable(o.name, v);
                  const photo = photoFor?.(o.name, v) ?? null;
                  const fill = photo ? null : swatchColor(v);
                  const asCircle = Boolean(photo || fill);
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => onSelect(o.name, v)}
                      aria-pressed={on}
                      title={v}
                      className={
                        asCircle
                          ? `relative h-10 w-10 overflow-hidden rounded-full border-2 p-0 transition ${
                              on ? 'border-ink ring-2 ring-ink/25' : 'border-line hover:border-ink/50'
                            } ${ok ? '' : 'opacity-40'}`
                          : `min-w-11 rounded-lg border px-3 py-2 text-[13px] font-medium transition ${
                              on ? 'border-ink bg-ink text-white' : 'border-line text-ink hover:border-ink/60'
                            } ${ok ? '' : 'text-muted line-through opacity-60'}`
                      }
                      style={fill ? { backgroundColor: fill } : undefined}
                    >
                      {photo ? (
                        // eslint-disable-next-line @next/next/no-img-element -- a 40px circle
                        <img src={photo} alt={v} className="h-full w-full object-cover" />
                      ) : asCircle ? (
                        <span className="sr-only">{v}</span>
                      ) : (
                        v
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {warning && <p className="mt-3 text-[12.5px] font-medium text-accent-dark">{warning}</p>}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onAdd}
            className="flex-1 rounded-lg border border-ink py-3 text-[14px] font-semibold text-ink transition-colors hover:bg-ink hover:text-white"
          >
            {labels.addToCart}
          </button>
          {onBuy && labels.buyNow && (
            <button
              type="button"
              onClick={onBuy}
              className="flex-1 rounded-lg bg-accent py-3 text-[14px] font-semibold text-white transition-colors hover:bg-accent-dark"
            >
              {labels.buyNow}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
