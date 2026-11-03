'use client';

import Image from 'next/image';
import { useState } from 'react';

/**
 * The product photos (2026-11-03 redesign, the reference picture's right phone): the big photo on a soft light-grey backdrop, a strip of
 * rounded thumbnails laid over its bottom edge, the last one an accent tile "+N" when there are more than fit.
 */
export function ShopGallery({ photos, name }: { photos: string[]; name: string }) {
  const [i, setI] = useState(0);
  const shown = photos.slice(0, 5);
  const more = photos.length - shown.length;
  return (
    <div className="relative">
      <div className="relative aspect-square overflow-hidden rounded-[28px] bg-gradient-to-b from-slate-100 to-slate-200/70">
        {photos[i] ? <Image src={photos[i]} alt={name} fill priority sizes="(max-width: 768px) 100vw, 50vw" className="object-contain p-4 drop-shadow-xl" /> : null}
      </div>
      {photos.length > 1 ? (
        <div className="absolute inset-x-4 bottom-4 flex justify-center">
          <div className="flex gap-2 rounded-2xl bg-white/90 p-1.5 shadow-lg backdrop-blur">
            {shown.map((u, n) => (
              <button
                key={u}
                type="button"
                onClick={() => setI(n)}
                aria-label={`Photo ${n + 1}`}
                className={`relative h-12 w-12 overflow-hidden rounded-xl ring-2 transition sm:h-14 sm:w-14 ${n === i ? 'ring-[var(--shop-accent)]' : 'ring-transparent'}`}
              >
                <Image src={u} alt="" fill sizes="56px" className="object-cover" />
              </button>
            ))}
            {more > 0 ? (
              <button
                type="button"
                onClick={() => setI((n) => (n + 1) % photos.length)}
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--shop-accent)] text-sm font-bold text-white sm:h-14 sm:w-14"
                aria-label="Next photo"
              >
                +{more}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
