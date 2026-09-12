'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Search, Package, ArrowLeft, Check } from 'lucide-react';
import { formatPrice } from '@/lib/productDisplay';
import { customerOrderStatusLabel, HAPPY_PATH } from '@/lib/orderStatusDisplay';
import { useTrackOrder } from '@/lib/useTrackOrder';

export function OrdersView({ subdomain }: { subdomain: string }) {
  const { invoiceNumber, setInvoiceNumber, phone, setPhone, loading, error, order, justPlaced, handleSubmit } =
    useTrackOrder(subdomain);

  const stepIndex = order ? HAPPY_PATH.indexOf(order.status) : -1;
  const isOffPath = order && stepIndex === -1;

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="border-b border-line">
        <div className="max-w-xl mx-auto px-5 sm:px-8 py-5">
          <Link href={`/store/${subdomain}`} className="inline-flex items-center gap-1.5 text-[13px] text-ink hover:text-accent transition-colors">
            <ArrowLeft size={14} strokeWidth={1.5} />
            Back to store
          </Link>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-5 sm:px-8 py-10">
        {justPlaced && order ? (
          <div className="flex items-center gap-2 mb-6 text-success">
            <Check size={16} strokeWidth={1.5} />
            <span className="text-[14px]">Order placed successfully</span>
          </div>
        ) : (
          <>
            <h1 className="font-display italic text-[22px] text-ink mb-1.5">Track Your Order</h1>
            <p className="text-[13px] text-muted mb-7">
              Enter your order number and the phone number you used to place it.
            </p>
          </>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 mb-2.5">
          <input
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            placeholder="Order number (e.g. ORDER-1024)"
            className="flex-1 px-0 py-2.5 bg-transparent border-b border-line text-[13.5px] outline-none transition-colors focus:border-ink placeholder:text-muted"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number"
            className="flex-1 px-0 py-2.5 bg-transparent border-b border-line text-[13.5px] outline-none transition-colors focus:border-ink placeholder:text-muted"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-ink hover:bg-accent-dark text-white text-[12px] tracking-[0.04em] uppercase disabled:opacity-60 shrink-0 transition-colors"
          >
            <Search size={14} strokeWidth={1.5} />
            {loading ? 'Looking…' : 'Track'}
          </button>
        </form>

        {error && <p className="text-[12px] text-accent-dark mt-2">{error}</p>}

        {order && (
          <div className="mt-10 pt-8 border-t border-line">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[11px] text-muted">Order</p>
                <p className="text-[17px] font-display italic text-ink">ORDER-{order.invoiceNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-muted">Placed</p>
                <p className="text-[12.5px] text-ink">{new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            {!isOffPath ? (
              <div className="mb-7">
                <div className="flex items-center">
                  {HAPPY_PATH.map((step, i) => (
                    <div key={step} className="flex items-center flex-1 last:flex-none">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${i <= stepIndex ? 'bg-ink' : 'bg-line'}`} />
                      {i < HAPPY_PATH.length - 1 && (
                        <div className={`h-px flex-1 mx-1 ${i < stepIndex ? 'bg-ink' : 'bg-line'}`} />
                      )}
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[13px] text-ink">{customerOrderStatusLabel(order.status)}</p>
              </div>
            ) : (
              <div className="mb-7 inline-flex items-center gap-2 border border-line px-3 py-1.5">
                <Package size={14} strokeWidth={1.5} className="text-muted" />
                <span className="text-[12.5px] text-ink">{customerOrderStatusLabel(order.status)}</span>
              </div>
            )}

            <div className="space-y-3.5 mb-5">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="relative w-12 h-12 shrink-0 bg-canvas overflow-hidden">
                    {item.productImage && <Image src={item.productImage} alt="" fill sizes="48px" className="object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-ink truncate">{item.productName}</p>
                    <p className="text-[11px] text-muted">Qty {item.quantity}</p>
                  </div>
                  <span className="text-[13px] text-ink">{formatPrice(item.lineTotal)}</span>
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
              <div className="flex justify-between text-ink pt-1.5 border-t border-line">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>

            <div className="mt-4 text-[12px] text-muted">
              Shipping to {order.shippingAddress}
              {order.shippingCity ? `, ${order.shippingCity}` : ''}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
