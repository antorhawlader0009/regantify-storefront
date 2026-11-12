'use client';

import { useEffect, useState } from 'react';
import type { StorefrontLandingPageProduct } from '@/lib/storefrontApi';
import { formatPrice } from '@/lib/productDisplay';
import type { CountdownTimerProps, PriceOfferProps, SelectProductsProps, StickyOrderBarProps } from '../types';
import { landingT, type LandingDelivery, type LandingLang } from '../landingText';
import { Banknote, Truck } from 'lucide-react';

/**
 * Under the price: what a Bangladeshi shopper asks before ordering from an ad (research: the delivery charge, inside
 * and outside Dhaka, and "can I pay when it arrives?"), from the store's own settings, so it is never made up.
 */
function DeliveryFacts({ delivery, lang }: { delivery: LandingDelivery; lang: LandingLang }) {
  const amount = (n: number) => (n > 0 ? formatPrice(n) : landingT(lang, 'Free delivery'));
  return (
    <ul className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 p-0 text-[13px] text-neutral-700">
      {delivery.cod && (
        <li className="flex list-none items-center gap-1.5">
          <Banknote size={15} className="text-green-700" aria-hidden />
          {landingT(lang, 'Cash on delivery')}
        </li>
      )}
      <li className="flex list-none items-center gap-1.5">
        <Truck size={15} className="text-orange-600" aria-hidden />
        {landingT(lang, 'Delivery inside Dhaka {amount}', { amount: amount(delivery.inside) })}
      </li>
      <li className="list-none">{landingT(lang, 'Outside Dhaka {amount}', { amount: amount(delivery.outside) })}</li>
    </ul>
  );
}
import { LandingPhoto } from '../LandingPhoto';

/** Resolves this section's productId(s) against the page-level product map - see StorefrontService.getStoreLandingPage's own comment on why this is batched server-side rather than fetched per-section. A productId with no match (deleted/unpublished) is silently skipped, not an error. */
function resolveProducts(ids: string[], byId: Map<string, StorefrontLandingPageProduct>): StorefrontLandingPageProduct[] {
  return ids.map((id) => byId.get(id)).filter((p): p is StorefrontLandingPageProduct => !!p);
}

function ProductCard({ product, showPrice, showStock, lang }: { product: StorefrontLandingPageProduct; showPrice?: boolean; showStock?: boolean; lang: LandingLang }) {
  const price = Number(product.discountPrice ?? product.price);
  const was = product.discountPrice ? Number(product.price) : null;

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200">
      {product.photoUrl ? (
        // Whole photo, not cropped (see LandingPhoto).
        <LandingPhoto src={product.photoUrl} alt={product.name} className="aspect-square w-full" sizes="(max-width: 640px) 50vw, 320px" />
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
          <p className="mt-0.5 text-xs text-neutral-500">{landingT(lang, product.inStock ? 'In stock' : 'Out of stock')}</p>
        )}
      </div>
    </div>
  );
}

export function SelectProductsSection({
  props,
  productsById,
  lang = 'en',
}: {
  props: SelectProductsProps;
  productsById: Map<string, StorefrontLandingPageProduct>;
  lang?: LandingLang;
}) {
  const products = resolveProducts(props.productIds ?? [], productsById);
  if (products.length === 0) return null;

  if (props.layout === 'single') {
    return (
      <div className="mx-auto max-w-sm px-5 py-8 sm:px-8">
        <ProductCard product={products[0]} showPrice={props.showPrice} showStock={props.showStock} lang={lang} />
      </div>
    );
  }

  const cols = props.columns ?? 3;
  const colsClass = cols === 2 ? 'sm:grid-cols-2' : cols === 4 ? 'sm:grid-cols-4' : 'sm:grid-cols-3';
  return (
    <div className="px-5 py-8 sm:px-8">
      <div className={`mx-auto grid max-w-5xl grid-cols-2 gap-4 ${colsClass}`}>
        {products.map((p) => (
          <ProductCard key={p.id} product={p} showPrice={props.showPrice} showStock={props.showStock} lang={lang} />
        ))}
      </div>
    </div>
  );
}

export function PriceOfferSection({
  props,
  productsById,
  lang = 'en',
  delivery = null,
}: {
  props: PriceOfferProps;
  productsById: Map<string, StorefrontLandingPageProduct>;
  lang?: LandingLang;
  delivery?: LandingDelivery | null;
}) {
  const product = props.productId ? productsById.get(props.productId) : undefined;
  // Independently editable even when a product is set (landing-page-
  // sections.md §3.2's own note: "an offer price doesn't have to match
  // the real product price exactly") - so wasPrice/nowPrice from props
  // always win, the product is only used for the fallback when the
  // vendor left them at 0.
  const wasPrice = props.wasPrice || (product ? Number(product.price) : 0);
  const nowPrice = props.nowPrice || (product ? Number(product.discountPrice ?? product.price) : 0);

  return (
    <div
      className="flex flex-col items-center gap-2 bg-cover bg-center px-5 py-12 text-center sm:px-8"
      style={props.backgroundImageUrl ? { backgroundImage: `url(${props.backgroundImageUrl})` } : { backgroundColor: '#fff7ed' }}
    >
      {wasPrice > nowPrice && nowPrice > 0 && (
        <span className="rounded-full bg-red-600 px-3 py-1 text-[12.5px] font-bold text-white">
          {landingT(lang, '{percent}% off', { percent: String(Math.round(((wasPrice - nowPrice) / wasPrice) * 100)) })}
        </span>
      )}
      {wasPrice > nowPrice && <span className="text-base text-neutral-500 line-through">{formatPrice(wasPrice)}</span>}
      <span className="text-4xl font-extrabold text-orange-600 sm:text-5xl">{formatPrice(nowPrice)}</span>
      <a
        href={props.ctaLink || '#checkout'}
        className="mt-3 rounded-xl bg-orange-600 px-10 py-3.5 text-[15px] font-bold text-white shadow-sm transition-colors hover:bg-orange-700"
      >
        {props.ctaLabel || landingT(lang, 'Order Now')}
      </a>
      {delivery && <DeliveryFacts delivery={delivery} lang={lang} />}
    </div>
  );
}

export function CountdownTimerSection({ props, lang = 'en' }: { props: CountdownTimerProps; lang?: LandingLang }) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const end = new Date(props.endsAt ?? '').getTime();
    const tick = () => setRemaining(Math.max(0, end - Date.now()));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [props.endsAt]);

  // Renders nothing on the server / before the first client tick - a
  // countdown is inherently "now"-relative, so there's no correct SSR
  // value to show before hydration; a brief blank beats a mismatched
  // hydration flash.
  if (remaining === null) return null;

  if (remaining === 0) {
    if ((props.expiredBehavior ?? 'hide') === 'hide') return null;
    return (
      <div className="px-5 py-6 text-center text-sm font-medium text-neutral-700 sm:px-8">
        {props.expiredMessage || landingT(lang, 'This offer has ended.')}
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
    { v: days, l: landingT(lang, 'Days') },
    { v: hours, l: landingT(lang, 'Hrs') },
    { v: mins, l: landingT(lang, 'Min') },
    { v: secs, l: landingT(lang, 'Sec') },
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
  lang = 'en',
}: {
  props: StickyOrderBarProps;
  productsById: Map<string, StorefrontLandingPageProduct>;
  lang?: LandingLang;
}) {
  const product = props.productId ? productsById.get(props.productId) : undefined;
  const [visible, setVisible] = useState((props.showAfterScrollPx ?? 0) === 0);
  // Out of the way while the order form is on screen: on a phone the bar sat on top of the form's Place Order button.
  const [formInView, setFormInView] = useState(false);

  useEffect(() => {
    const form = document.getElementById('checkout');
    if (!form || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => setFormInView(entry.isIntersecting), { threshold: 0.05 });
    io.observe(form);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const threshold = props.showAfterScrollPx ?? 0;
    if (threshold === 0) return;
    const onScroll = () => setVisible(window.scrollY > threshold);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [props.showAfterScrollPx]);

  if (!visible || formInView) return null;

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
          {props.ctaLabel || landingT(lang, 'Order Now')}
        </a>
      </div>
    </div>
  );
}
