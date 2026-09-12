'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import type { StorefrontProduct } from '@/lib/storefrontApi';
import { formatPrice } from '@/lib/productDisplay';

interface FeaturedBannerProps {
  subdomain: string;
  products: StorefrontProduct[];
}

/**
 * Minimal's hero is a quiet, large-format editorial split — full-bleed
 * product photo on one side, generous whitespace and a restrained price
 * treatment on the other. Same underlying data as Medium's
 * FeaturedBanner (the vendor's own best real discounts, largest
 * percent-off first — never fabricated), but no dark backdrop, no loud
 * "% OFF" badge, no auto-advancing carousel chrome — just a slow
 * crossfade and a few small dots, so it reads as considered rather than
 * a "deal slider."
 */
export function FeaturedBanner({ subdomain, products }: FeaturedBannerProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (products.length <= 1) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % products.length), 6500);
    return () => clearInterval(timer);
  }, [products.length]);

  if (products.length === 0) return null;

  const product = products[index];

  return (
    <div className="border-b border-line">
      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-10 sm:py-16 grid gap-8 sm:gap-14 sm:grid-cols-2 items-center">
        <Link
          key={product.id}
          href={`/store/${subdomain}/product/${product.slug}`}
          className="relative aspect-[4/5] sm:aspect-[3/4] bg-canvas overflow-hidden order-1 sm:order-none block"
        >
          {product.photoUrls[0] && (
            <Image src={product.photoUrls[0]} alt={product.name} fill sizes="(max-width: 640px) 100vw, 480px" className="object-cover" />
          )}
        </Link>

        <div>
          <span className="text-[11px] text-muted tracking-[0.08em] uppercase">Featured</span>
          <h2 className="font-display italic text-[28px] sm:text-[38px] text-ink leading-tight mt-2 mb-4">{product.name}</h2>
          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-ink text-[17px]">{formatPrice(product.discountPrice!)}</span>
            <span className="text-muted line-through text-[13.5px]">{formatPrice(product.price)}</span>
          </div>
          <Link
            href={`/store/${subdomain}/product/${product.slug}`}
            className="inline-flex items-center gap-2 text-[12.5px] tracking-[0.04em] uppercase text-ink border-b border-ink pb-1 hover:gap-3 transition-all"
          >
            Shop the piece
            <ArrowRight size={13} />
          </Link>

          {products.length > 1 && (
            <div className="flex gap-2 mt-10">
              {products.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className={`h-[3px] rounded-full transition-all duration-300 ${
                    i === index ? 'bg-ink w-6' : 'bg-line-strong w-3 hover:bg-muted'
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
