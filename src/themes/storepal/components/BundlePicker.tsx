'use client';

import { Minus, Plus } from 'lucide-react';
import type { StorefrontProduct } from '@/lib/storefrontApi';
import { formatPrice as plainPrice } from '../lib/formatPrice';
import { bnDigits, useFormatPrice, useStoreText } from '../lib/storeText';
import { useStorePalDesign } from '../lib/designSettings';

/** What the shopper picked for a "pick N" box: product id -> pieces. */
export type BundlePickState = Record<string, number>;

/** The pieces picked so far. */
export const pickedCount = (picks: BundlePickState) => Object.values(picks).reduce((sum, n) => sum + n, 0);

/**
 * The picker of a "pick N" box (IDEA-22): a short list of choices with a stepper each, and a counter "2 of 3 picked". The box has one price
 * whatever is picked. A choice stops at its own "most per box" and at what is left of it; nothing more can be added once the box is full.
 * The parent holds the picks (so Add to Cart and Buy Now can check them) and shows the error.
 */
export function BundlePicker({
  product,
  picks,
  onPicks,
  error,
}: {
  product: StorefrontProduct;
  picks: BundlePickState;
  onPicks: (next: BundlePickState) => void;
  error: string | null;
}) {
  const t = useStoreText();
  const formatPrice = useFormatPrice(plainPrice);
  const design = useStorePalDesign();
  const bn = design.storeLanguage === 'bn';
  const bundle = product.bundle;
  const pick = bundle?.pick ?? 0;
  if (!bundle || !pick) return null;

  const count = (n: number) => (bn ? bnDigits(n) : String(n));
  const done = pickedCount(picks);
  const full = done >= pick;
  const set = (productId: string, value: number) => {
    const next = { ...picks };
    if (value <= 0) delete next[productId];
    else next[productId] = value;
    onPicks(next);
  };

  return (
    <div className="mb-4 rounded-md border border-line bg-canvas px-3.5 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="m-0 text-[13px] font-semibold text-ink">{t('Pick your {n} items').replace('{n}', count(pick))}</p>
        <span className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-bold ${full ? 'bg-success-bg text-success' : 'bg-surface text-muted'}`}>
          {t('{done} of {total} picked').replace('{done}', count(done)).replace('{total}', count(pick))}
        </span>
      </div>
      <ul className="m-0 mt-2.5 list-none space-y-2 p-0">
        {bundle.items.map((item) => {
          const id = item.productId ?? item.name;
          const n = picks[id] ?? 0;
          const left = item.stock === null || item.stock === undefined ? Infinity : Math.max(0, item.stock);
          const most = Math.min(item.quantity, left);
          const soldOut = left <= 0;
          return (
            <li key={id} className={`flex items-center gap-3 rounded-md border bg-surface p-2 ${n > 0 ? 'border-accent' : 'border-line'} ${soldOut ? 'opacity-55' : ''}`}>
              {item.photo ? (
                // eslint-disable-next-line @next/next/no-img-element -- a small thumbnail of a choice
                <img src={item.photo} alt="" loading="lazy" className="h-11 w-11 shrink-0 rounded object-cover" />
              ) : (
                <div className="h-11 w-11 shrink-0 rounded bg-canvas" />
              )}
              <div className="min-w-0 flex-1">
                <p className="m-0 truncate text-[13px] font-medium text-ink">{item.name}</p>
                <p className="m-0 text-[11.5px] text-muted">{soldOut ? t('Out of stock') : item.price ? formatPrice(item.price) : ''}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => set(id, n - 1)}
                  disabled={n <= 0}
                  aria-label={t('Remove one')}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-line-strong text-ink disabled:opacity-35"
                >
                  <Minus size={14} />
                </button>
                <span className="w-5 text-center text-[13.5px] font-semibold text-ink">{count(n)}</span>
                <button
                  type="button"
                  onClick={() => set(id, n + 1)}
                  disabled={soldOut || full || n >= most}
                  aria-label={t('Add one')}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-line-strong text-ink disabled:opacity-35"
                >
                  <Plus size={14} />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      {error && <p className="m-0 mt-2 text-[12.5px] font-semibold text-accent">{error}</p>}
    </div>
  );
}
