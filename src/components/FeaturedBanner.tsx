'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import type { StorefrontProduct } from '@/lib/storefrontApi';
import { formatPrice } from '@/lib/productDisplay';

interface FeaturedBannerProps {
  subdomain: string;
  products: StorefrontProduct[];
}

/**
 * Auto-rotating banner strip — the "deal slider" every established BD
 * e-commerce homepage opens with (startech.com.bd, daraz.com.bd). Built
 * entirely from the vendor's own best real discounts (the products with
 * the largest percent-off), never fabricated marketing copy — there's
 * no banner/offer content model on the backend, so this is the honest
 * version of that slot: real products, real savings.
 */
export function FeaturedBanner({ subdomain, products }: FeaturedBannerProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (products.length <= 1) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % products.length), 5500);
    return () => clearInterval(timer);
  }, [products.length]);

  if (products.length === 0) return null;

  const product = products[index];
  const percentOff = Math.round(
    ((Number(product.price) - Number(product.discountPrice)) / Number(product.price)) * 100,
  );

  return (
    <div className="relative bg-ink overflow-hidden">
      {/* Soft blurred backdrop of the same product photo — adds depth
          without needing separate banner artwork the backend doesn't have. */}
      {product.photoUrls[0] && (
        <div className="absolute inset-0 opacity-20">
          <Image src={product.photoUrls[0]} alt="" fill sizes="100vw" className="object-cover blur-2xl scale-110" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/95 to-ink/70" />

      <Link
        key={product.id}
        href={`/store/${subdomain}/product/${product.slug}`}
        className="relative flex items-center gap-6 sm:gap-10 max-w-6xl mx-auto px-6 sm:px-10 py-9 sm:py-14 no-underline"
      >
        <div className="flex-1 min-w-0">
          <span className="inline-flex items-center gap-1 bg-accent text-white text-[11px] font-bold px-2.5 py-1 rounded mb-3.5 shadow-sm">
            {percentOff}% OFF
          </span>
          <h2 className="font-display text-2xl sm:text-4xl text-white leading-tight mb-3 line-clamp-2">{product.name}</h2>
          <div className="flex items-baseline gap-3">
            <span className="text-white text-xl sm:text-3xl font-bold tracking-tight">{formatPrice(product.discountPrice!)}</span>
            <span className="text-white/45 line-through text-[15px]">{formatPrice(product.price)}</span>
          </div>
          <span className="inline-flex items-center gap-1.5 mt-5 px-4 py-2 rounded-md bg-white text-ink text-[13px] font-semibold hover:bg-white/90 transition-colors">
            Shop Now
            <ArrowRight size={14} />
          </span>
        </div>
        <div className="relative w-28 h-28 sm:w-52 sm:h-52 shrink-0 rounded-lg overflow-hidden bg-white/5 ring-1 ring-white/10">
          {product.photoUrls[0] && (
            <Image src={product.photoUrls[0]} alt="" fill sizes="208px" className="object-cover" />
          )}
        </div>
      </Link>

      {products.length > 1 && (
        <>
          <button
            onClick={() => setIndex((i) => (i - 1 + products.length) % products.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white flex items-center justify-center transition-colors"
            aria-label="Previous"
          >
            <ChevronLeft size={17} />
          </button>
          <button
            onClick={() => setIndex((i) => (i + 1) % products.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white flex items-center justify-center transition-colors"
            aria-label="Next"
          >
            <ChevronRight size={17} />
          </button>
          <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 flex gap-1.5">
            {products.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === index ? 'bg-accent w-5' : 'bg-white/30 w-1.5 hover:bg-white/50'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
