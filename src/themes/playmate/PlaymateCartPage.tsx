'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useShallow } from 'zustand/react/shallow';
import { useCartStore, useCartHydrated } from '@/providers/cart-store-provider';
import { useCustomerAuthStore } from '@/providers/customer-auth-store-provider';
import { validateCoupon, previewDiscounts, type AutomaticDiscounts, type ValidatedCoupon } from '@/lib/checkoutApi';
import { minOrderShortfall, useMinOrderAmount } from '@/lib/minOrder';
import type { StorefrontProduct } from '@/lib/storefrontApi';
import { isOutOfStock } from '@/lib/productDisplay';
import { StoreHeader } from '../storepal/components/StoreHeader';
import { StoreFooter } from '../storepal/components/StoreFooter';
import { ProductCard } from '../storepal/components/ProductCard';
import { CartViewTracker } from '../storepal/components/CartViewTracker';
import { loadSavedCheckoutForm } from '../storepal/lib/checkoutFormStorage';
import { setPendingCoupon } from '../storepal/lib/pendingCoupon';
import { formatPrice as plainPrice } from '../storepal/lib/formatPrice';
import { useStoreText, useFormatPrice } from '../storepal/lib/storeText';
import { PlaymateBreadcrumb } from './PlaymateBreadcrumb';
import { MinusIcon, PlusIcon, TrashIcon } from './icons';

const PENDING_KEY = 'regantify-pending-coupon:';

function apiOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL;
  if (configured) return configured.replace(/\/$/, '');
  return `${window.location.protocol}//${window.location.hostname}:4000`;
}

interface Props {
  subdomain: string;
  storeName: string;
  categories: string[];
  products: StorefrontProduct[];
}

/**
 * PlayMate's cart page, the template's CartView (templete/playmate CartView.tsx) on the store's real cart: lines with
 * quantity and remove, Clear cart, an order summary with the store's real coupon (checked with the server, kept for
 * checkout), the automatic discount the cart already gets, "delivery at checkout" (the charge depends on the address),
 * and "You May Also Like" (the vendor's "Show with this" picks first, then best sellers).
 */
export function PlaymateCartPage({ subdomain, storeName, categories, products }: Props) {
  const t = useStoreText();
  const formatPrice = useFormatPrice(plainPrice);
  const hydrated = useCartHydrated();
  const lines = useCartStore(useShallow((s) => s.lines.filter((l) => l.subdomain === subdomain)));
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeLine = useCartStore((s) => s.removeLine);
  const clearStore = useCartStore((s) => s.clearStore);
  const customer = useCustomerAuthStore((s) => s.customer);
  const minimum = useMinOrderAmount(subdomain);

  const [code, setCode] = useState('');
  const [coupon, setCoupon] = useState<ValidatedCoupon | null>(null);
  const [savedCode, setSavedCode] = useState<string | null>(null);
  const [codeError, setCodeError] = useState('');
  const [checking, setChecking] = useState(false);
  const [offers, setOffers] = useState<AutomaticDiscounts | null>(null);
  const [addonSlugs, setAddonSlugs] = useState<string[]>([]);

  const count = lines.reduce((sum, l) => sum + l.quantity, 0);
  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const savings = lines.reduce((sum, l) => sum + (l.originalUnitPrice ? (l.originalUnitPrice - l.unitPrice) * l.quantity : 0), 0);
  const items = useMemo(
    () => lines.map((l) => ({ productSlug: l.productSlug, quantity: l.quantity, selectedOptions: l.selectedOptions })),
    [lines],
  );
  const cartKey = lines.map((l) => `${l.productSlug}:${l.quantity}:${JSON.stringify(l.selectedOptions)}`).join(',');
  const slugsKey = [...new Set(lines.map((l) => l.productSlug))].join(',');

  // A code opened from a coupon link (or typed here before) is waiting for checkout: show it as the code in use.
  useEffect(() => {
    try {
      const pending = sessionStorage.getItem(PENDING_KEY + subdomain);
      if (pending) {
        setSavedCode(pending);
        setCode(pending);
      }
    } catch {
      // Storage blocked: the shopper types the code again.
    }
  }, [subdomain]);

  // The automatic discount and free delivery this cart already gets (the same server preview checkout uses).
  useEffect(() => {
    if (!hydrated || items.length === 0) {
      setOffers(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      previewDiscounts(subdomain, items).then((r) => !cancelled && setOffers(r));
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, subdomain, cartKey]);

  // The vendor's "Show with this" picks for what is in the cart.
  useEffect(() => {
    if (!hydrated || !slugsKey) {
      setAddonSlugs([]);
      return;
    }
    const controller = new AbortController();
    fetch(`${apiOrigin()}/v1/store/${encodeURIComponent(subdomain)}/cart-addons?slugs=${encodeURIComponent(slugsKey)}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((data: { products?: StorefrontProduct[] }) => setAddonSlugs((data.products ?? []).map((p) => p.slug)))
      .catch(() => undefined);
    return () => controller.abort();
  }, [hydrated, subdomain, slugsKey]);

  // A checked coupon's amount depends on the cart; when the cart changes it is checked again at checkout.
  useEffect(() => {
    setCoupon(null);
  }, [cartKey]);

  const phone = customer?.phone || (hydrated ? loadSavedCheckoutForm(subdomain)?.phone : '') || '';

  const applyCode = async (e: FormEvent) => {
    e.preventDefault();
    const typed = code.trim();
    if (!typed) return;
    setCodeError('');
    setCoupon(null);
    // Without a phone the server can't judge per-customer limits, so the code is kept and checked at checkout.
    if (!phone) {
      setPendingCoupon(subdomain, typed);
      setSavedCode(typed);
      return;
    }
    setChecking(true);
    try {
      const result = await validateCoupon(subdomain, typed, phone, items);
      setCoupon(result);
      setPendingCoupon(subdomain, result.code);
      setSavedCode(result.code);
    } catch (err) {
      setCodeError(err instanceof Error ? err.message : t('This coupon code is not valid.'));
      setSavedCode(null);
      try {
        sessionStorage.removeItem(PENDING_KEY + subdomain);
      } catch {
        // nothing to remove
      }
    } finally {
      setChecking(false);
    }
  };

  const removeCode = () => {
    setCoupon(null);
    setSavedCode(null);
    setCode('');
    try {
      sessionStorage.removeItem(PENDING_KEY + subdomain);
    } catch {
      // nothing to remove
    }
  };

  const autoDiscount = offers?.discount && offers.discount.discountAmount > 0 ? offers.discount : null;
  // A coupon that replaces the automatic discount (resetOtherDiscounts) is counted alone, like checkout does.
  const couponAmount = coupon && coupon.discountType !== 'FREE_SHIPPING' ? coupon.discountAmount : 0;
  const autoAmount = autoDiscount && !(coupon?.resetOtherDiscounts) ? autoDiscount.discountAmount : 0;
  const freeDelivery = !!offers?.freeShipping || coupon?.discountType === 'FREE_SHIPPING';
  const total = Math.max(0, subtotal - couponAmount - autoAmount);
  const shortfall = minOrderShortfall(minimum, subtotal);

  const suggestions = useMemo(() => {
    const inCart = new Set(lines.map((l) => l.productSlug));
    const bySlug = new Map(products.map((p) => [p.slug, p]));
    const picked = addonSlugs.map((s) => bySlug.get(s)).filter((p): p is StorefrontProduct => !!p && !inCart.has(p.slug));
    const pickedSet = new Set(picked.map((p) => p.slug));
    const best = products
      .filter((p) => !inCart.has(p.slug) && !pickedSet.has(p.slug) && !isOutOfStock(p))
      .sort((a, b) => (b.soldRecent ?? 0) - (a.soldRecent ?? 0));
    return [...picked, ...best].slice(0, 4);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, addonSlugs, slugsKey]);

  const home = `/store/${subdomain}`;

  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      <StoreHeader subdomain={subdomain} storeName={storeName} categories={categories} />
      <main className="pm-wrap w-full flex-1 py-6 sm:py-8">
        <PlaymateBreadcrumb subdomain={subdomain} homeLabel={t('Home')} items={[{ label: t('Cart') }]} />
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
          {t('Your Cart')} {hydrated && count > 0 && <span className="text-lg font-semibold text-muted">({count})</span>}
        </h1>

        {!hydrated ? (
          <div className="min-h-[40vh]" />
        ) : lines.length === 0 ? (
          <div className="mt-8 rounded-xl bg-[var(--pm-card)] px-6 py-16 text-center">
            <p className="text-lg font-bold">{t('Your cart is empty')}</p>
            <p className="mt-1 text-sm text-muted">{t('Add a product and it will show up here.')}</p>
            <Link href={home} className="pm-btn-primary mt-6">
              {t('Continue shopping')}
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid items-start gap-8 lg:grid-cols-[1fr_360px]">
            <div>
              {minimum && minimum > 0 ? (
                <div className="rounded-lg bg-accent-light px-4 py-3 text-[13px]">
                  {shortfall > 0 ? (
                    <p>{t('Add {amount} more to place your order').replace('{amount}', formatPrice(shortfall))}</p>
                  ) : (
                    <p className="font-semibold text-accent">{t('Your order can be placed')}</p>
                  )}
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
                    <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${Math.min(100, (subtotal / minimum) * 100)}%` }} />
                  </div>
                </div>
              ) : null}

              <ul className="mt-2 divide-y divide-line">
                {lines.map((line) => {
                  const href = `${home}/product/${line.productSlug}`;
                  const options = Object.entries(line.selectedOptions);
                  const step = line.quantityStep ?? 1;
                  return (
                    <li key={line.id} className="flex gap-3 py-5 sm:gap-5">
                      <Link href={href} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-[var(--pm-card)] sm:h-28 sm:w-28">
                        {line.image && <Image src={line.image} alt={line.name} fill sizes="112px" className="object-cover" />}
                      </Link>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            {line.isPreOrder && <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">{t('Pre-order')}</p>}
                            <h2 className="truncate text-sm font-bold sm:text-base">
                              <Link href={href} className="hover:text-accent">
                                {line.name}
                              </Link>
                            </h2>
                            {options.length > 0 && <p className="truncate text-xs text-muted">{options.map(([k, v]) => `${k}: ${v}`).join(' · ')}</p>}
                            {line.customDisplay && line.customDisplay.length > 0 && (
                              <p className="truncate text-xs text-muted">{line.customDisplay.map((v) => `${v.label}: ${v.value}`).join(' · ')}</p>
                            )}
                          </div>
                          <button
                            type="button"
                            className="shrink-0 rounded p-1.5 text-muted hover:text-red-500"
                            aria-label={`${t('Remove')} ${line.name}`}
                            onClick={() => removeLine(line.id)}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
                          <div className="inline-flex items-center rounded-md border border-line-strong">
                            <button type="button" className="p-2" aria-label={t('Decrease quantity')} onClick={() => setQuantity(line.id, line.quantity - step)}>
                              <MinusIcon className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-8 text-center text-sm font-semibold" aria-live="polite">
                              {line.quantity}
                            </span>
                            <button
                              type="button"
                              className="p-2 disabled:opacity-40"
                              aria-label={t('Increase quantity')}
                              disabled={line.maxQuantity !== undefined && line.quantity + step > line.maxQuantity}
                              onClick={() => setQuantity(line.id, line.quantity + step)}
                            >
                              <PlusIcon className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <div className="text-right">
                            <p className="text-base font-extrabold">{formatPrice(line.unitPrice * line.quantity)}</p>
                            {line.originalUnitPrice ? (
                              <p className="text-[11px] text-muted line-through">{formatPrice(line.originalUnitPrice * line.quantity)}</p>
                            ) : line.quantity > 1 ? (
                              <p className="text-[11px] text-muted">
                                {formatPrice(line.unitPrice)} {t('each')}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                <Link href={home} className="text-[12px] font-semibold uppercase tracking-wide text-accent hover:underline">
                  ← {t('Continue shopping')}
                </Link>
                <button type="button" className="text-[12px] font-semibold uppercase tracking-wide text-muted hover:text-red-600" onClick={() => clearStore(subdomain)}>
                  {t('Clear cart')}
                </button>
              </div>
            </div>

            <aside className="rounded-xl bg-[var(--pm-card)] p-5 sm:p-6 lg:sticky lg:top-24" aria-label={t('Order Summary')}>
              <h2 className="text-base font-bold">{t('Order Summary')}</h2>

              {savedCode && !codeError ? (
                <div className="mt-4 flex items-center justify-between gap-2 rounded-md border border-dashed border-accent bg-white px-3 py-2.5 text-sm">
                  <span className="font-bold uppercase tracking-wide">{savedCode}</span>
                  <button type="button" className="text-[12px] font-semibold text-muted hover:text-red-600" onClick={removeCode}>
                    {t('Remove')}
                  </button>
                </div>
              ) : (
                <form onSubmit={applyCode} className="mt-4 flex gap-2">
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder={t('Promo code')}
                    aria-label={t('Promo code')}
                    className="min-w-0 flex-1 rounded-md border border-line-strong bg-white px-3 py-2.5 text-sm uppercase outline-none focus:border-accent"
                  />
                  <button
                    type="submit"
                    disabled={checking}
                    className="rounded-md bg-ink px-4 text-[12px] font-semibold uppercase tracking-wide text-white hover:bg-accent disabled:opacity-60"
                  >
                    {checking ? '...' : t('Apply')}
                  </button>
                </form>
              )}
              {codeError && (
                <p className="mt-2 text-xs text-red-600" role="alert">
                  {codeError}
                </p>
              )}
              {savedCode && !coupon && !codeError && <p className="mt-2 text-xs text-muted">{t('Your code will be checked at checkout.')}</p>}

              <dl className="mt-5 space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">{t('Subtotal')}</dt>
                  <dd className="font-semibold">{formatPrice(subtotal)}</dd>
                </div>
                {savings > 0 && (
                  <div className="flex justify-between text-green-600">
                    <dt>{t('You save')}</dt>
                    <dd className="font-semibold">{formatPrice(savings)}</dd>
                  </div>
                )}
                {autoAmount > 0 && autoDiscount && (
                  <div className="flex justify-between text-green-600">
                    <dt className="min-w-0 truncate pr-2">{autoDiscount.name}</dt>
                    <dd className="font-semibold">-{formatPrice(autoAmount)}</dd>
                  </div>
                )}
                {couponAmount > 0 && coupon && (
                  <div className="flex justify-between text-green-600">
                    <dt>
                      {t('Coupon')} ({coupon.code})
                    </dt>
                    <dd className="font-semibold">-{formatPrice(couponAmount)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-muted">{t('Delivery')}</dt>
                  <dd className="font-semibold">{freeDelivery ? t('Free') : t('At checkout')}</dd>
                </div>
                <div className="flex items-baseline justify-between border-t border-line-strong pt-3">
                  <dt className="font-bold">{t('Total')}</dt>
                  <dd className="text-xl font-extrabold">{formatPrice(total)}</dd>
                </div>
              </dl>
              {offers?.gifts && offers.gifts.length > 0 && (
                <ul className="mt-3 space-y-1 text-xs font-semibold text-green-600">
                  {offers.gifts.map((g) => (
                    <li key={g.offerId}>
                      {t('Free gift')}: {g.productName}
                      {g.quantity > 1 ? ` × ${g.quantity}` : ''}
                    </li>
                  ))}
                </ul>
              )}

              {shortfall > 0 ? (
                <span className="pm-btn-primary mt-5 w-full cursor-not-allowed opacity-50" aria-disabled="true">
                  {t('Checkout')}
                </span>
              ) : (
                <Link href={`${home}/checkout`} className="pm-btn-primary mt-5 w-full" data-rg="checkout-button">
                  {t('Checkout')}
                </Link>
              )}
              <p className="mt-3 text-center text-[11px] text-muted">{t('Delivery charge is added at checkout from your address.')}</p>
            </aside>
          </div>
        )}

        {hydrated && suggestions.length > 0 && (
          <section className="mt-12" aria-labelledby="pm-also-title">
            <h2 id="pm-also-title" className="mb-4 text-[15px] font-bold uppercase tracking-wide">
              {t('You May Also Like')}
            </h2>
            <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
              {suggestions.map((p) => (
                <li key={p.id}>
                  <ProductCard product={p} subdomain={subdomain} storeName={storeName} />
                </li>
              ))}
            </ul>
          </section>
        )}
        <CartViewTracker subdomain={subdomain} />
      </main>
      <StoreFooter subdomain={subdomain} storeName={storeName} />
    </div>
  );
}
