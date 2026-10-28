'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Camera, Loader2, X } from 'lucide-react';
import { usePhotoSearch } from '@/lib/photoSearch';
import { PhotoSearchDrop } from '@/components/PhotoSearchDrop';
import { ProductCard } from './ProductCard';
import { useStoreText } from '../lib/storeText';
import { CoverFloating } from '@/lib/floatingCover';

/** How long the photo button stands out after the voice call asked the shopper to use it. */
const HINT_MS = 10_000;

/**
 * StorePal's look for the search by photo (lib/photoSearch.ts): the results dialog, and the drop-anywhere listener with
 * StorePal's words. Mounted once from StoreHeader. Matching is by picture fingerprint only, never AI.
 */
export function PhotoSearchPanel({ subdomain, storeName }: { subdomain: string; storeName: string }) {
  const t = useStoreText();
  const { open, status, preview, products, related, error, close, search } = usePhotoSearch();
  const fileRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();

  // Opening a result (a card is a link) closes the dialog.
  useEffect(() => {
    close();
  }, [pathname, close]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  return (
    <>
      <PhotoSearchDrop subdomain={subdomain} label={t('Drop the photo to find similar products')} />
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/45 p-4 sm:p-8 overflow-y-auto" onClick={close}>
          <CoverFloating />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t('Search by photo')}
            className="w-full max-w-4xl rounded-2xl bg-surface shadow-xl p-4 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              {preview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="" className="h-14 w-14 rounded-lg object-cover border border-line shrink-0" />
              )}
              <h2 className="flex-1 text-[17px] font-bold text-ink">
                {status === 'searching' ? t('Looking for this product…') : t('Products like your photo')}
              </h2>
              <button type="button" onClick={close} className="p-2 rounded-lg text-muted hover:text-ink" aria-label="Close">
                <X size={18} />
              </button>
            </div>

            {status === 'searching' && (
              <div className="py-12 flex justify-center">
                <Loader2 size={26} className="animate-spin text-muted" />
              </div>
            )}
            {status === 'error' && <p className="py-8 text-center text-[14px] text-red-600">{error}</p>}
            {status === 'done' && products.length === 0 && (
              <p className="py-8 text-center text-[14px] text-muted">
                {related.length
                  ? // Nothing exact (by picture, or by the store's AI photo search when it is on), but similar products below.
                    t("We couldn't find this exact product in our store. Here are some similar ones.")
                  : t('No similar product found. Try a clearer photo, or type the product name.')}
              </p>
            )}
            {status === 'done' && products.length > 0 && (
              <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:[grid-template-columns:repeat(auto-fill,minmax(180px,1fr))]">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} subdomain={subdomain} storeName={storeName} />
                ))}
              </div>
            )}

            {status === 'done' && related.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-3 text-[15px] font-bold text-ink">{t('Related products')}</h3>
                <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:[grid-template-columns:repeat(auto-fill,minmax(180px,1fr))]">
                  {related.map((product) => (
                    <ProductCard key={product.id} product={product} subdomain={subdomain} storeName={storeName} />
                  ))}
                </div>
              </div>
            )}

            {status !== 'searching' && (
              <div className="mt-5 flex justify-center">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-line-strong text-[13.5px] text-ink hover:bg-ink/5"
                >
                  <Camera size={16} />
                  {t('Try another photo')}
                </button>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (f) void search(subdomain, f);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}

/** The camera button inside a search bar: opens the phone's camera or gallery, or a file picker on a computer. */
export function PhotoSearchButton({ subdomain, className }: { subdomain: string; className?: string }) {
  const t = useStoreText();
  const search = usePhotoSearch((s) => s.search);
  const hintAt = usePhotoSearch((s) => s.hintAt);
  const fileRef = useRef<HTMLInputElement>(null);
  // The voice call asked the shopper to use this button: it pulses for a few seconds.
  const [hinting, setHinting] = useState(false);
  useEffect(() => {
    if (!hintAt) return;
    setHinting(true);
    const t = setTimeout(() => setHinting(false), HINT_MS);
    return () => clearTimeout(t);
  }, [hintAt]);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setHinting(false);
          fileRef.current?.click();
        }}
        className={className}
        aria-label={t('Search by photo')}
        title={t('Search by photo')}
      >
        <span className={hinting ? 'relative flex items-center justify-center rounded-full text-accent ring-2 ring-accent ring-offset-2 animate-pulse' : 'contents'}>
          <Camera size={17} />
        </span>
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f) void search(subdomain, f);
        }}
      />
    </>
  );
}
