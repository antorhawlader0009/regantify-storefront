import Link from 'next/link';
import Image from 'next/image';
import { formatPrice } from '../lib/formatPrice';
import { isOutOfStock } from '@/lib/productDisplay';

// Minimal shape ProductCard actually reads — satisfied by both the full
// StorefrontProduct (product listing/search) and the leaner
// StorefrontCardProduct (product detail page's related-products
// sidebar, see getStoreSidebar) without needing two near-identical
// card components — same convention as Medium's own ProductCard.
interface CardProduct {
  slug: string;
  name: string;
  photoUrls: string[];
  price: string;
  discountPrice?: string | null;
  isPreOrder: boolean;
  variants: { stock: number }[];
  stockQuantity?: number | null;
}

interface ProductCardProps {
  product: CardProduct;
  subdomain: string;
}

/**
 * White bordered card with an explicit "View Product" button (matches
 * the reference category-listing screenshots — Sneakers, Loafer, Belt,
 * etc — rather than the whole card being a single click target the way
 * Medium's own ProductCard is).
 */
export function ProductCard({ product, subdomain }: ProductCardProps) {
  const outOfStock = isOutOfStock(product);
  const hasDiscount = Boolean(product.discountPrice) && Number(product.discountPrice) < Number(product.price);

  return (
    <div className="flex flex-col bg-surface border border-line rounded-md overflow-hidden shadow-card hover:shadow-card-hover transition-shadow">
      <Link href={`/store/${subdomain}/product/${product.slug}`} className="relative aspect-square bg-canvas block">
        {product.photoUrls[0] ? (
          <Image
            src={product.photoUrls[0]}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, 260px"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-muted text-[13px]">No image</span>
          </div>
        )}
        {outOfStock && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <span className="bg-ink text-white text-[11px] font-semibold px-2.5 py-1.5 rounded">Out of Stock</span>
          </div>
        )}
      </Link>

      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <Link
          href={`/store/${subdomain}/product/${product.slug}`}
          className="text-[13px] font-semibold text-ink uppercase tracking-tight leading-snug line-clamp-2 min-h-[2.4em] hover:text-accent transition-colors"
        >
          {product.name}
        </Link>

        <div className="flex gap-2 items-baseline flex-wrap">
          {hasDiscount && <span className="text-muted line-through text-[12.5px]">{formatPrice(product.price)}</span>}
          <span className="font-bold text-[15px] text-accent">
            {formatPrice(hasDiscount ? product.discountPrice! : product.price)}
          </span>
        </div>

        <Link
          href={`/store/${subdomain}/product/${product.slug}`}
          className="mt-auto text-center py-2 rounded-md border border-line-strong text-[12.5px] font-semibold text-ink hover:bg-ink hover:text-white hover:border-ink transition-colors"
        >
          View Product
        </Link>
      </div>
    </div>
  );
}
