import Link from 'next/link';
import type { StorefrontProduct } from '@/lib/storefrontApi';

interface CategoryTilesProps {
  subdomain: string;
  categories: string[];
  products: StorefrontProduct[];
}

/**
 * A quiet, text-led category row — no thumbnail circles, no icon strip.
 * The opposite instinct from Medium's CategoryTiles (which leans on
 * imagery since a marketplace shopper scans visually); here the
 * typography itself is the navigation, in keeping with the theme's
 * editorial character. Real product counts, same as Medium — never
 * fabricated.
 */
export function CategoryTiles({ subdomain, categories, products }: CategoryTilesProps) {
  if (categories.length === 0) return null;

  const tiles = categories.slice(0, 10).map((cat) => ({
    name: cat,
    count: products.filter((p) => p.category === cat).length,
  }));

  return (
    <section className="border-b border-line">
      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-8 flex gap-x-8 gap-y-3 flex-wrap">
        {tiles.map((tile) => (
          <Link
            key={tile.name}
            href={`/store/${subdomain}?category=${encodeURIComponent(tile.name)}`}
            className="group no-underline text-inherit"
          >
            <span className="text-[14px] text-ink group-hover:text-accent transition-colors">{tile.name}</span>
            <span className="text-[11.5px] text-muted ml-1.5">({tile.count})</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
