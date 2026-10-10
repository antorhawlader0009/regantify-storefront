'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Ruler, X } from 'lucide-react';
import type { StorefrontSizeGuide } from '@/lib/storefrontApi';
import { useStoreText } from '../lib/storeText';

/**
 * The "Size guide" link beside a product's Size choice (Store > Product > Size Guides), opening the vendor's table
 * or chart picture in a popup. Plain text cells and the vendor's own picture only, never HTML. The popup closes on
 * Escape, on the X, and on a tap outside it, and the page behind doesn't scroll while it is open.
 */
export function SizeGuideLink({ guide }: { guide: StorefrontSizeGuide }) {
  const t = useStoreText();
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-[12px] font-semibold text-accent underline underline-offset-2 hover:text-accent-dark"
      >
        <Ruler size={13} aria-hidden />
        {t('Size guide')}
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" onClick={() => setOpen(false)}>
            <div
              role="dialog"
              aria-modal="true"
              aria-label={guide.name}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-2xl max-h-[85vh] overflow-y-auto rounded-t-xl sm:rounded-xl bg-surface shadow-xl"
            >
              <div className="sticky top-0 flex items-center justify-between gap-3 border-b border-line bg-surface px-5 py-3">
                <h2 className="m-0 text-[15px] font-bold text-ink">
                  {t('Size guide')}
                  {guide.name ? <span className="font-medium text-muted"> · {guide.name}</span> : null}
                </h2>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={t('Close')}
                  className="flex h-9 w-9 items-center justify-center rounded-md text-muted hover:bg-canvas hover:text-ink"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5">
                {guide.kind === 'IMAGE' && guide.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={guide.imageUrl} alt={guide.name} className="mx-auto h-auto max-w-full rounded-md" />
                ) : (
                  <div className="overflow-x-auto rounded-md border border-line">
                    <table className="w-full min-w-[320px] border-collapse text-[13px]">
                      <thead>
                        <tr className="bg-canvas text-ink">
                          {guide.columns.map((c, i) => (
                            <th key={i} scope="col" className="border-b border-line px-3 py-2.5 text-left font-bold whitespace-nowrap">
                              {c}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {guide.rows.map((row, r) => (
                          <tr key={r} className="border-t border-line first:border-t-0">
                            {row.map((cell, i) => (
                              <td key={i} className={`px-3 py-2.5 whitespace-nowrap ${i === 0 ? 'font-semibold text-ink' : 'text-ink'}`}>
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {guide.note && <p className="m-0 mt-3 text-[12.5px] text-muted whitespace-pre-line">{guide.note}</p>}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
