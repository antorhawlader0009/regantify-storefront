'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Package, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { formatPrice } from '@/lib/productDisplay';
import { customerOrderStatusLabel, HAPPY_PATH } from '@/lib/orderStatusDisplay';
import { useTrackOrder } from '@/lib/useTrackOrder';
import type { TrackedOrder } from '@/lib/checkoutApi';

// `renderCourierTracking` lets a theme that reuses this view add its own
// courier block under the status (StorePal, pathao-plan.md Step 13);
// Medium itself passes nothing and is unchanged.
export function OrdersView({ subdomain, renderCourierTracking }: { subdomain: string; renderCourierTracking?: (order: TrackedOrder) => ReactNode }) {
  const {
    invoiceNumber,
    setInvoiceNumber,
    phone,
    setPhone,
    loading,
    error,
    order,
    justPlaced,
    handleSubmit,
    rememberedOrders,
    selectRememberedOrder,
  } = useTrackOrder(subdomain);

  const stepIndex = order ? HAPPY_PATH.indexOf(order.status) : -1;
  const isOffPath = order && stepIndex === -1;

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="bg-surface border-b border-line">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4">
          <Link href={`/store/${subdomain}`} className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-ink hover:text-accent">
            <ArrowLeft size={14} />
            Back to store
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-surface border border-line rounded-lg p-4 sm:p-6 shadow-card">
          {justPlaced && order ? (
            <div className="flex items-center gap-2.5 mb-5 px-3.5 py-2.5 rounded bg-success-bg text-success w-fit">
              <CheckCircle2 size={17} />
              <span className="text-[13.5px] font-semibold">Order placed successfully</span>
            </div>
          ) : (
            <>
              <h1 className="text-[18px] font-bold text-ink mb-1.5">Track Your Order</h1>
              <p className="text-[13px] text-muted mb-5">
                Enter your order number and the phone number you used to place it.
              </p>
            </>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5 mb-2.5">
            <input
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="Order number (e.g. ORDER-1024)"
              className="flex-1 px-3.5 py-2.5 rounded-md border border-line bg-canvas text-[13.5px] outline-none transition-colors focus:border-ink focus:bg-surface"
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number"
              className="flex-1 px-3.5 py-2.5 rounded-md border border-line bg-canvas text-[13.5px] outline-none transition-colors focus:border-ink focus:bg-surface"
            />
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-md bg-accent hover:bg-accent-dark text-white text-[13px] font-bold disabled:opacity-60 shrink-0 shadow-sm transition-colors"
            >
              <Search size={15} />
              {loading ? 'Looking…' : 'Track'}
            </button>
          </form>

          {error && <p className="text-[12.5px] text-accent">{error}</p>}

          {/* "Your recent orders" (see guestOrderMemory.ts / useTrackOrder.ts)
              — every invoice this browser has looked up or placed before,
              remembered in localStorage so a returning guest doesn't have
              to re-type/re-find the invoice number. Only the invoice+phone
              pair is cached, never order data itself — clicking one
              re-runs a real lookup the same as typing it in would. */}
          {rememberedOrders.length > 0 && (
            <div className="mt-4 pt-4 border-t border-line">
              <p className="text-[12px] font-semibold text-muted uppercase tracking-wide mb-2">Your recent orders</p>
              <div className="flex flex-wrap gap-2">
                {rememberedOrders.map((remembered) => (
                  <button
                    key={remembered.invoiceNumber}
                    type="button"
                    onClick={() => selectRememberedOrder(remembered)}
                    disabled={loading}
                    className="px-3 py-1.5 rounded-md border border-line bg-canvas text-[12.5px] font-medium text-ink hover:border-accent hover:text-accent disabled:opacity-60 transition-colors"
                  >
                    ORDER-{remembered.invoiceNumber}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {order && (
          <div className="bg-surface border border-line rounded-lg p-4 sm:p-6 mt-4 shadow-card">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-line">
              <div>
                <p className="text-[12px] text-muted">Order</p>
                <p className="text-[17px] font-bold text-ink">ORDER-{order.invoiceNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-[12px] text-muted">Placed</p>
                <p className="text-[13px] text-ink">{new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            {!isOffPath ? (
              <div className="mb-6">
                <div className="flex items-center">
                  {HAPPY_PATH.map((step, i) => (
                    <div key={step} className="flex items-center flex-1 last:flex-none">
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${i <= stepIndex ? 'bg-accent' : 'bg-line'}`} />
                      {i < HAPPY_PATH.length - 1 && (
                        <div className={`h-0.5 flex-1 mx-1 ${i < stepIndex ? 'bg-accent' : 'bg-line'}`} />
                      )}
                    </div>
                  ))}
                </div>
                <p className="mt-2.5 text-[13.5px] font-semibold text-ink">{customerOrderStatusLabel(order.status)}</p>
              </div>
            ) : (
              <div className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-canvas border border-line">
                <Package size={15} className="text-muted" />
                <span className="text-[13px] text-ink font-medium">{customerOrderStatusLabel(order.status)}</span>
              </div>
            )}

            {renderCourierTracking?.(order)}

            <div className="space-y-3 mb-5">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="relative w-12 h-12 shrink-0 bg-canvas border border-line rounded overflow-hidden">
                    {item.productImage && <Image src={item.productImage} alt="" fill sizes="48px" className="object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-ink truncate">{item.productName}</p>
                    <p className="text-[11.5px] text-muted">Qty {item.quantity}</p>
                  </div>
                  <span className="text-[13px] font-semibold text-ink">{formatPrice(item.lineTotal)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-line pt-3.5 flex flex-col gap-1.5 text-[12.5px]">
              <div className="flex justify-between text-muted">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Delivery</span>
                <span>{formatPrice(order.deliveryCharge)}</span>
              </div>
              <div className="flex justify-between text-ink font-bold pt-1.5 border-t border-line">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>

            <div className="mt-4 text-[12.5px] text-muted">
              Shipping to {order.shippingAddress}
              {order.shippingCity ? `, ${order.shippingCity}` : ''}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
