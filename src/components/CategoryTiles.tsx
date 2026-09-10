import Link from 'next/link';
import Image from 'next/image';
import type { StorefrontProduct } from '@/lib/storefrontApi';

interface CategoryTilesProps {
  subdomain: string;
  categories: string[];
  products: StorefrontProduct[];
}

/**
 * "Featured Category" row (startech.com.bd's icon strip below the
 * banner) — but this backend has no per-category icon/image field, so
 * each tile uses that category's own first product photo as a
 * representative thumbnail, plus the real product count underneath.
 * Real data throughout, not a placeholder icon set.
 */
export function CategoryTiles({ subdomain, categories, products }: CategoryTilesProps) {
  if (categories.length === 0) return null;

  const tiles = categories.slice(0, 12).map((cat) => {
    const sample = products.find((p) => p.category === cat && p.photoUrls[0]);
    const count = products.filter((p) => p.category === cat).length;
    return { name: cat, image: sample?.photoUrls[0], count };
  });

  return (
    <section className="bg-surface border-b border-line">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5">
        <h2 className="text-[13px] font-bold text-ink mb-3.5 uppercase tracking-wide">Shop by Category</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {tiles.map((tile) => (
            <Link
              key={tile.name}
              href={`/store/${subdomain}?category=${encodeURIComponent(tile.name)}`}
              className="flex flex-col items-center gap-2 text-center no-underline text-inherit group"
            >
              <div className="relative w-16 h-16 sm:w-[70px] sm:h-[70px] rounded-full overflow-hidden bg-canvas border-2 border-transparent
                ring-1 ring-line group-hover:ring-2 group-hover:ring-accent transition-all duration-200">
                {tile.image ? (
                  <Image
                    src={tile.image}
                    alt=""
                    fill
                    sizes="70px"
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted text-sm font-semibold bg-canvas">
                    {tile.name.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <span className="block text-[11px] font-medium text-ink leading-tight line-clamp-1 group-hover:text-accent transition-colors">
                  {tile.name}
                </span>
                <span className="block text-[10px] text-muted mt-0.5">{tile.count} items</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
