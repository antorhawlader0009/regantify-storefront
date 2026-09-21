'use client';

import { useEffect, useState } from 'react';
import type { StorefrontLandingPageProduct } from '@/lib/storefrontApi';
import { formatPrice } from '@/lib/productDisplay';
import type { CountdownTimerProps, PriceOfferProps, SelectProductsProps, StickyOrderBarProps } from '../types';

/** Resolves this section's productId(s) against the page-level product map — see StorefrontService.getStoreLandingPage's own comment on why this is batched server-side rather than fetched per-section. A productId with no match (deleted/unpublished) is silently skipped, not an error. */
function resolveProducts(ids: string[], byId: Map<string, StorefrontLandingPageProduct>): StorefrontLandingPageProduct[] {
  return ids.map((id) => byId.get(id)).filter((p): p is StorefrontLandingPageProduct => !!p);
}

function ProductCard({ product, showPrice, showStock }: { product: StorefrontLandingPageProduct; showPrice?: boolean; showStock?: boolean }) {
  const price = Number(product.discountPrice ?? product.price);
  const was = product.discountPrice ? Number(product.price) : null;

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200">
      {product.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={product.photoUrl} alt={product.name} className="aspect-square w-full object-cover" />
      ) : (
        <div className="aspect-square w-full bg-neutral-100" />
      )}
      <div className="p-3">
        <p className="truncate text-[14px] font-medium text-neutral-900">{product.name}</p>
        {showPrice !== false && (
          <p className="mt-1 flex items-baseline gap-2">
            <span className="text-base font-bold text-neutral-900">{formatPrice(price)}</span>
            {was && <span className="text-xs text-neutral-400 line-through">{formatPrice(was)}</span>}
          </p>
        )}
        {showStock && (
          <p className="mt-0.5 text-xs text-neutral-500">{product.inStock ? 'In stock' : 'Out of stock'}</p>
        )}
      </div>
    </div>
  );
}

export function SelectProductsSection({
  props,
  productsById,
}: {
  props: SelectProductsProps;
  productsById: Map<string, StorefrontLandingPageProduct>;
}) {
  const products = resolveProducts(props.productIds ?? [], productsById);
  if (products.length === 0) return null;

  if (props.layout === 'single') {
    return (
      <div className="mx-auto max-w-sm px-5 py-8 sm:px-8">
        <ProductCard product={products[0]} showPrice={props.showPrice} showStock={props.showStock} />
      </div>
    );
  }

  const cols = props.columns ?? 3;
  const colsClass = cols === 2 ? 'sm:grid-cols-2' : cols === 4 ? 'sm:grid-cols-4' : 'sm:grid-cols-3';
  return (
    <div className="px-5 py-8 sm:px-8">
      <div className={`mx-auto grid max-w-5xl grid-cols-2 gap-4 ${colsClass}`}>
        {products.map((p) => (
          <ProductCard key={p.id} product={p} showPrice={props.showPrice} showStock={props.showStock} />
        ))}
      </div>
    </div>
  );
}

export function PriceOfferSection({
  props,
  productsById,
}: {
  props: PriceOfferProps;
  productsById: Map<string, StorefrontLandingPageProduct>;
}) {
  const product = props.productId ? productsById.get(props.productId) : undefined;
  // Independently editable even when a product is set (landing-page-
  // sections.md §3.2's own note: "an offer price doesn't have to match
  // the real product price exactly") — so wasPrice/nowPrice from props
  // always win, the product is only used for the fallback when the
  // vendor left them at 0.
  const wasPrice = props.wasPrice || (product ? Number(product.price) : 0);
  const nowPrice = props.nowPrice || (product ? Number(product.discountPrice ?? product.price) : 0);

  return (
    <div
      className="flex flex-col items-center gap-2 bg-cover bg-center px-5 py-12 text-center sm:px-8"
      style={props.backgroundImageUrl ? { backgroundImage: `url(${props.backgroundImageUrl})` } : { backgroundColor: '#fff7ed' }}
    >
      {wasPrice > 0 && <span className="text-base text-neutral-500 line-through">{formatPrice(wasPrice)}</span>}
      <span className="text-4xl font-extrabold text-orange-600 sm:text-5xl">{formatPrice(nowPrice)}</span>
      <a
        href={props.ctaLink || '#checkout'}
        className="mt-3 rounded-lg bg-orange-600 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-700"
      >
        {props.ctaLabel || 'Order Now'}
      </a>
    </div>
  );
}

export function CountdownTimerSection({ props }: { props: CountdownTimerProps }) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const end = new Date(props.endsAt ?? '').getTime();
    const tick = () => setRemaining(Math.max(0, end - Date.now()));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [props.endsAt]);

  // Renders nothing on the server / before the first client tick — a
  // countdown is inherently "now"-relative, so there's no correct SSR
  // value to show before hydration; a brief blank beats a mismatched
  // hydration flash.
  if (remaining === null) return null;

  if (remaining === 0) {
    if ((props.expiredBehavior ?? 'hide') === 'hide') return null;
    return (
      <div className="px-5 py-6 text-center text-sm font-medium text-neutral-700 sm:px-8">
        {props.expiredMessage || 'This offer has ended.'}
      </div>
    );
  }

  const days = Math.floor(remaining / 86_400_000);
  const hours = Math.floor((remaining % 86_400_000) / 3_600_000);
  const mins = Math.floor((remaining % 3_600_000) / 60_000);
  const secs = Math.floor((remaining % 60_000) / 1000);

  if ((props.style_ ?? 'boxes') === 'inline') {
    return (
      <div className="px-5 py-6 text-center text-lg font-bold text-neutral-900 sm:px-8">
        {days}d : {String(hours).padStart(2, '0')}h : {String(mins).padStart(2, '0')}m : {String(secs).padStart(2, '0')}s
      </div>
    );
  }

  const parts = [
    { v: days, l: 'Days' },
    { v: hours, l: 'Hrs' },
    { v: mins, l: 'Min' },
    { v: secs, l: 'Sec' },
  ];
  return (
    <div className="flex justify-center gap-3 px-5 py-8 sm:px-8">
      {parts.map((p) => (
        <div key={p.l} className="w-16 rounded-lg bg-neutral-900 py-3 text-center text-white">
          <span className="block text-2xl font-bold">{String(p.v).padStart(2, '0')}</span>
          <span className="block text-[11px] uppercase tracking-wide opacity-70">{p.l}</span>
        </div>
      ))}
    </div>
  );
}

export function StickyOrderBarSection({
  props,
  productsById,
}: {
  props: StickyOrderBarProps;
  productsById: Map<string, StorefrontLandingPageProduct>;
}) {
  const product = props.productId ? productsById.get(props.productId) : undefined;
  const [visible, setVisible] = useState((props.showAfterScrollPx ?? 0) === 0);

  useEffect(() => {
    const threshold = props.showAfterScrollPx ?? 0;
    if (threshold === 0) return;
    const onScroll = () => setVisible(window.scrollY > threshold);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [props.showAfterScrollPx]);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 px-4 py-2.5 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center gap-3">
        {product?.photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.photoUrl} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
        )}
        {product && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-neutral-900">{product.name}</p>
            <p className="text-[12.5px] font-semibold text-orange-600">
              {formatPrice(Number(product.discountPrice ?? product.price))}
            </p>
          </div>
        )}
        <a
          href={props.ctaLink || '#checkout'}
          className="ml-auto shrink-0 rounded-lg bg-orange-600 px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-orange-700"
        >
          {props.ctaLabel || 'Order Now'}
        </a>
      </div>
    </div>
  );
}
