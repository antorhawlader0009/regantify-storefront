'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { Check, MapPin, Package, Truck, Wallet, X } from 'lucide-react';
import type { TrackedOrder } from '@/lib/checkoutApi';
import { customerOrderStatusLabel } from '@/lib/orderStatusDisplay';
import { orderLabel } from '@/lib/orderLabel';
import { useStoreText, useFormatPrice } from '../lib/storeText';
import { formatPrice as plainPrice } from '../lib/formatPrice';
import { useStorePalDesign } from '../lib/designSettings';
import { CourierTrackingLine } from './CourierTrackingCard';

interface OrderDetailsDialogProps {
  subdomain: string;
  order: TrackedOrder;
  onClose: () => void;
  /** Buy again and Memo, from the orders list, so they behave exactly as there. */
  actions?: ReactNode;
}

/** Where the order is on its way: 0 placed, 1 confirmed, 2 on the way (or ready at the shop), 3 delivered; null = it left the flow. */
function stepOf(status: string): number | null {
  switch (status) {
    case 'PENDING':
    case 'ON_HOLD':
    case 'STOCK_OUT':
      return 0;
    case 'PROCESSING':
      return 1;
    case 'SHIPPING':
    case 'READY_FOR_PICKUP':
      return 2;
    case 'COMPLETED':
      return 3;
    default:
      return null;
  }
}

/**
 * Account > Orders: one order's details in a dialog over the account dialog (2026-10-29, the owner's request): where it
 * is, what was bought (photo, options, quantity, price), the money, payment, delivery address, and Buy again / Memo /
 * Track. Built from the account answer, which carries the full order, so it opens with no wait.
 */
export function OrderDetailsDialog({ subdomain, order, onClose, actions }: OrderDetailsDialogProps) {
  const t = useStoreText();
  const formatPrice = useFormatPrice(plainPrice);
  const bn = useStorePalDesign().storeLanguage === 'bn';
  const boxRef = useRef<HTMLDivElement>(null);

  // Esc closes this dialog only (caught before the account dialog's own Esc), and focus comes back where it was.
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    boxRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      onClose();
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      before?.focus?.({ preventScroll: true });
    };
  }, [onClose]);

  const pickup = order.deliveryZone === 'PICKUP';
  const step = stepOf(order.status);
  const steps = [t('Order placed'), t('Confirmed'), pickup ? t('Ready for pickup') : t('On the way'), pickup ? t('Picked up') : t('Delivered')];
  const placed = new Date(order.createdAt).toLocaleDateString(bn ? 'bn-BD-u-nu-latn' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const closedBadly = ['CANCELLED', 'PAYMENT_FAILED', 'RETURN', 'REFUNDED'].includes(order.status);

  const subtotal = Number(order.subtotal);
  const delivery = Number(order.deliveryCharge);
  const vat = Number(order.vatAmount);
  const discount = Number(order.discountAmount);
  const total = Number(order.total);
  // Anything else in the total (a shown service charge, gift wrap, express) as one line, so the sum always adds up.
  const other = Math.round((total - (subtotal + delivery + vat - discount)) * 100) / 100;
  const advance = order.paymentMethod === 'COD' && order.advancePaidAt ? Number(order.advanceAmount ?? 0) : 0;
  const payment =
    order.manualPaymentStatus && order.paymentMethod !== 'COD'
      ? order.manualPaymentWallet || t('Mobile payment')
      : order.paymentMethod === 'COD'
        ? t('Cash on delivery')
        : t('Paid online');
  const pieces = order.items.reduce((n, it) => n + it.quantity, 0);

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div
        ref={boxRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-details-title"
        className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-surface shadow-[0_24px_80px_-12px_rgba(16,24,40,0.5)] outline-none sm:max-h-[min(86vh,780px)] sm:max-w-2xl sm:rounded-2xl"
      >
        {/* Head: which order, when, and its state. */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 id="order-details-title" className="m-0 select-all text-[17px] font-bold tracking-tight text-ink">
              {orderLabel(order)}
            </h2>
            <p className="m-0 mt-0.5 text-[12.5px] text-muted">{t('Placed on {date}').replace('{date}', placed)}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${
                order.status === 'COMPLETED'
                  ? 'bg-success/10 text-success'
                  : closedBadly
                    ? 'bg-red-50 text-red-600'
                    : 'bg-accent/10 text-accent'
              }`}
            >
              {customerOrderStatusLabel(order.status)}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label={t('Close')}
              className="flex h-9 w-9 items-center justify-center rounded-full text-ink transition-colors hover:bg-canvas focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              <X size={20} strokeWidth={2.25} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {/* Progress, only while the order is in the normal flow. */}
          {step !== null && (
            <ol className="m-0 grid list-none grid-cols-4 gap-1 border-b border-line px-5 py-4 sm:px-6" aria-label={t('Order status')}>
              {steps.map((label, i) => {
                const done = i <= step;
                return (
                  <li key={label} className="relative flex flex-col items-center text-center">
                    {i > 0 && (
                      <span
                        style={{ left: "-50%", right: "50%" }}
                        className={`absolute top-[11px] h-[2px] ${i <= step ? 'bg-accent' : 'bg-line-strong'}`}
                        aria-hidden
                      />
                    )}
                    <span
                      className={`relative z-[1] flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                        done ? 'border-accent bg-accent text-white' : 'border-line-strong bg-surface'
                      } ${i === step && step < 3 ? 'ring-4 ring-accent/15' : ''}`}
                      aria-hidden
                    >
                      {done && <Check size={13} strokeWidth={3} />}
                    </span>
                    <span className={`mt-1.5 text-[11.5px] leading-tight ${i === step ? 'font-semibold text-ink' : done ? 'text-ink' : 'text-muted'}`}>
                      {label}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}

          {/* What was bought. */}
          <section className="px-5 py-4 sm:px-6" aria-labelledby="order-items-title">
            <h3 id="order-items-title" className="m-0 mb-2 flex items-center gap-2 text-[14px] font-semibold text-ink">
              <Package size={16} className="text-muted" aria-hidden />
              {t('Items')}
              <span className="font-normal text-muted">({pieces})</span>
            </h3>
            <ul className="m-0 list-none divide-y divide-line p-0">
              {order.items.map((it) => {
                const options = Object.entries(it.selectedOptions ?? {}).filter(([, v]) => v);
                const slug = it.product?.visibility === 'PUBLIC' ? it.product.slug : null;
                const name = slug ? (
                  <Link href={`/store/${subdomain}/p/${slug}`} className="text-ink hover:text-accent">
                    {it.productName}
                  </Link>
                ) : (
                  it.productName
                );
                return (
                  <li key={it.id} className="flex gap-3 py-3">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-line bg-canvas">
                      {it.productImage ? (
                        <Image src={it.productImage} alt="" fill sizes="64px" className="object-cover" />
                      ) : (
                        <Package size={22} className="absolute inset-0 m-auto text-muted" aria-hidden />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="m-0 text-[14px] font-medium leading-snug line-clamp-2">{name}</p>
                      {options.length > 0 && (
                        <p className="m-0 mt-1 flex flex-wrap gap-1.5">
                          {options.map(([k, v]) => (
                            <span key={k} className="rounded-md bg-canvas px-1.5 py-0.5 text-[11.5px] text-muted">
                              {k}: <span className="font-medium text-ink">{v}</span>
                            </span>
                          ))}
                        </p>
                      )}
                      {it.customValues?.map((c) => (
                        <p key={c.label} className="m-0 mt-1 text-[12px] text-muted">
                          {c.label}: <span className="text-ink">{c.value}</span>
                        </p>
                      ))}
                      <p className="m-0 mt-1 text-[12.5px] tabular-nums text-muted">
                        {formatPrice(it.unitPrice)} × {it.quantity}
                      </p>
                    </div>
                    <p className="m-0 shrink-0 text-[14px] font-semibold tabular-nums text-ink">{formatPrice(it.lineTotal)}</p>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* The money, then how it is paid and where it goes. */}
          <div className="grid gap-px border-t border-line bg-line sm:grid-cols-2">
            <section className="bg-surface px-5 py-4 sm:px-6" aria-labelledby="order-money-title">
              <h3 id="order-money-title" className="m-0 mb-2.5 flex items-center gap-2 text-[14px] font-semibold text-ink">
                <Wallet size={16} className="text-muted" aria-hidden />
                {t('Payment')}
              </h3>
              <dl className="m-0 space-y-1.5 text-[13px]">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">{t('Subtotal')}</dt>
                  <dd className="m-0 tabular-nums text-ink">{formatPrice(subtotal)}</dd>
                </div>
                {!pickup && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">{t('Delivery charge')}</dt>
                    <dd className="m-0 tabular-nums text-ink">{formatPrice(delivery)}</dd>
                  </div>
                )}
                {vat > 0 && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">{t('VAT')}</dt>
                    <dd className="m-0 tabular-nums text-ink">{formatPrice(vat)}</dd>
                  </div>
                )}
                {other > 0.5 && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">{t('Other charges')}</dt>
                    <dd className="m-0 tabular-nums text-ink">{formatPrice(other)}</dd>
                  </div>
                )}
                {discount > 0 && (
                  <div className="flex justify-between gap-3">
                    <dt className="min-w-0 truncate text-muted">{order.discountLabel || t('Discount')}</dt>
                    <dd className="m-0 tabular-nums text-success">−{formatPrice(discount)}</dd>
                  </div>
                )}
                <div className="mt-2.5! flex justify-between gap-3 border-t border-line pt-2.5 text-[15px] font-bold text-ink">
                  <dt>{t('Total')}</dt>
                  <dd className="m-0 tabular-nums">{formatPrice(total)}</dd>
                </div>
                {advance > 0 && (
                  <>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted">{t('Paid in advance')}</dt>
                      <dd className="m-0 tabular-nums text-ink">{formatPrice(advance)}</dd>
                    </div>
                    <div className="flex justify-between gap-3 font-semibold">
                      <dt className="text-ink">{t('Due on delivery')}</dt>
                      <dd className="m-0 tabular-nums text-ink">{formatPrice(Math.max(0, total - advance))}</dd>
                    </div>
                  </>
                )}
              </dl>
              <p className="m-0 mt-3 inline-flex rounded-md bg-canvas px-2 py-1 text-[12px] font-medium text-ink">{payment}</p>
            </section>

            <section className="bg-surface px-5 py-4 sm:px-6" aria-labelledby="order-ship-title">
              <h3 id="order-ship-title" className="m-0 mb-2.5 flex items-center gap-2 text-[14px] font-semibold text-ink">
                <MapPin size={16} className="text-muted" aria-hidden />
                {pickup ? t('Pick up from the shop') : t('Delivery address')}
              </h3>
              <p className="m-0 text-[13.5px] font-medium text-ink">{order.customerName}</p>
              {order.customerPhone && <p className="m-0 mt-0.5 text-[13px] tabular-nums text-muted">{order.customerPhone}</p>}
              <p className="m-0 mt-1.5 text-[13px] leading-relaxed text-ink">
                {[order.shippingAddress, order.shippingCity, order.shippingDistrict].filter(Boolean).join(', ')}
              </p>
              {order.courierTracking && (
                <div className="mt-3 flex items-start gap-2 text-[12.5px]">
                  <Truck size={15} className="mt-0.5 shrink-0 text-muted" aria-hidden />
                  <CourierTrackingLine tracking={order.courierTracking} />
                </div>
              )}
            </section>
          </div>
        </div>

        {/* Actions. */}
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-line bg-canvas/60 px-5 py-3 sm:px-6">
          {order.trackingToken && (
            <Link
              href={`/store/${subdomain}/t/${order.trackingToken}`}
              className="mr-auto inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent hover:underline"
            >
              <Truck size={15} aria-hidden />
              {t('Track order')}
            </Link>
          )}
          {actions}
        </div>
      </div>
    </div>,
    document.body,
  );
}
