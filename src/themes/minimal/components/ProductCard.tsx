import Link from 'next/link';
import Image from 'next/image';
import { formatPrice, isOutOfStock } from '@/lib/productDisplay';

// Same minimal shape Medium's ProductCard reads — see that file's own
// comment for why this isn't the full StorefrontProduct type.
interface CardProduct {
  slug: string;
  name: string;
  photoSize: string;
  photoUrls: string[];
  brand?: string | null;
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
 * Borderless, image-forward card — no card "box," no percent-off
 * badge shouting from a corner. Sale is communicated quietly: a struck
 * price beside the new one, nothing more. This is the deliberate
 * opposite of Medium's bordered, badge-heavy card — the image does the
 * selling, not the chrome around it.
 */
export function ProductCard({ product, subdomain }: ProductCardProps) {
  const outOfStock = isOutOfStock(product);
  const hasDiscount = Boolean(product.discountPrice) && Number(product.discountPrice) < Number(product.price);

  return (
    <Link href={`/store/${subdomain}/product/${product.slug}`} className="group flex flex-col text-left no-underline text-inherit">
      <div className={`relative bg-canvas overflow-hidden mb-3.5 ${product.photoSize === 'PORTRAIT' ? 'aspect-[3/4]' : 'aspect-square'}`}>
        {product.photoUrls[0] ? (
          <Image
            src={product.photoUrls[0]}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, 300px"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-muted text-[12.5px]">No image</span>
          </div>
        )}

        {product.isPreOrder && (
          <span className="absolute top-3 left-3 bg-surface/90 backdrop-blur-sm text-ink text-[10px] font-medium tracking-[0.06em] uppercase px-2.5 py-1">
            Pre-order
          </span>
        )}

        {outOfStock && (
          <div className="absolute inset-0 bg-surface/70 backdrop-blur-[1px] flex items-center justify-center">
            <span className="text-ink text-[11px] font-medium tracking-[0.06em] uppercase border border-ink px-3 py-1.5">Sold Out</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1">
        {product.brand && <span className="text-[10.5px] text-muted tracking-[0.06em] uppercase">{product.brand}</span>}
        <p className="m-0 text-[13.5px] text-ink leading-snug line-clamp-2 min-h-[2.4em]">{product.name}</p>

        <div className="flex gap-2 items-baseline flex-wrap mt-0.5">
          <span className="text-[13.5px] text-ink">
            {formatPrice(hasDiscount ? product.discountPrice! : product.price)}
          </span>
          {hasDiscount && <span className="text-muted line-through text-[12px]">{formatPrice(product.price)}</span>}
        </div>
      </div>
    </Link>
  );
}
