import Link from 'next/link';
import Image from 'next/image';
import type { StorefrontProduct } from '@/lib/storefrontApi';
import { formatPrice, isOutOfStock } from '@/lib/productDisplay';

interface ProductCardProps {
  product: StorefrontProduct;
  subdomain: string;
}

/**
 * Bordered white card matching established BD e-commerce convention
 * (startech.com.bd, daraz.com.bd) — a real percent-off badge and a
 * "Save ৳X" line computed from the product's own price/discountPrice,
 * never decorative filler. This pass adds real elevation on hover
 * (shadow, not just a border-color swap) and tightens the type scale so
 * a dense grid still reads cleanly.
 */
export function ProductCard({ product, subdomain }: ProductCardProps) {
  const outOfStock = isOutOfStock(product);
  const hasDiscount = Boolean(product.discountPrice) && Number(product.discountPrice) < Number(product.price);
  const percentOff = hasDiscount
    ? Math.round(((Number(product.price) - Number(product.discountPrice)) / Number(product.price)) * 100)
    : 0;
  const saveAmount = hasDiscount ? Number(product.price) - Number(product.discountPrice) : 0;

  return (
    <Link
      href={`/store/${subdomain}/product/${product.slug}`}
      className="group flex flex-col text-left no-underline text-inherit bg-surface border border-line rounded-lg overflow-hidden
        transition-[box-shadow,border-color,transform] duration-200 ease-out
        hover:border-line-strong hover:-translate-y-0.5
        shadow-card hover:shadow-card-hover"
    >
      <div className={`relative bg-canvas overflow-hidden ${product.photoSize === 'PORTRAIT' ? 'aspect-[3/4]' : 'aspect-square'}`}>
        {product.photoUrls[0] ? (
          <Image
            src={product.photoUrls[0]}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, 220px"
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.05]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-muted text-[13px]">No image</span>
          </div>
        )}

        {hasDiscount && (
          <span className="absolute top-2 left-2 bg-accent text-white text-[11px] font-bold px-2 py-1 rounded shadow-sm">
            -{percentOff}%
          </span>
        )}

        {product.isPreOrder && (
          <span className="absolute top-2 right-2 bg-ink/90 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-1 rounded">
            Pre-order
          </span>
        )}

        {outOfStock && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex items-center justify-center">
            <span className="bg-ink text-white text-[11px] font-semibold px-2.5 py-1.5 rounded">Out of Stock</span>
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col gap-1 flex-1">
        {product.brand && <span className="text-[10px] text-muted uppercase tracking-wider font-medium">{product.brand}</span>}
        <p className="m-0 text-[13px] text-ink leading-snug line-clamp-2 min-h-[2.4em] group-hover:text-accent transition-colors">
          {product.name}
        </p>

        <div className="mt-auto pt-1.5">
          <div className="flex gap-1.5 items-baseline flex-wrap">
            <span className="font-bold text-[16px] text-ink tracking-tight">
              {formatPrice(hasDiscount ? product.discountPrice! : product.price)}
            </span>
            {hasDiscount && <span className="text-muted line-through text-[11.5px]">{formatPrice(product.price)}</span>}
          </div>
          {hasDiscount && (
            <p className="m-0 mt-1 inline-flex items-center gap-1 text-[10.5px] text-save font-semibold bg-success-bg px-1.5 py-0.5 rounded w-fit">
              Save {formatPrice(saveAmount)}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
