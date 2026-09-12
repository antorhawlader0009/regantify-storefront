'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Minus, Plus, X } from 'lucide-react';
import { formatPrice } from '@/lib/productDisplay';
import { useCheckout, DELIVERY_CHARGE } from '@/lib/useCheckout';

export function CheckoutView({ subdomain }: { subdomain: string }) {
  const {
    hydrated,
    lines,
    setQuantity,
    removeLine,
    form,
    errors,
    placing,
    placeError,
    storeName,
    subtotal,
    deliveryCharge,
    grandTotal,
    updateField,
    handlePlaceOrder,
  } = useCheckout(subdomain);

  if (!hydrated) return null;

  if (lines.length === 0) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center gap-3">
        <p className="text-muted text-[13px]">Your cart is empty.</p>
        <Link href={`/store/${subdomain}`} className="text-ink text-[13px] border-b border-ink pb-0.5 w-fit">
          Back to store
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-ink pb-16">
      <header className="border-b border-line">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 py-5">
          <Link href={`/store/${subdomain}/cart`} className="inline-flex items-center gap-1.5 text-[13px] text-ink hover:text-accent transition-colors">
            <ArrowLeft size={14} strokeWidth={1.5} />
            {storeName}
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-5 sm:px-8 py-10">
        <h1 className="font-display italic text-[24px] text-ink mb-8">Checkout</h1>

        <div className="grid gap-10 items-start lg:[grid-template-columns:1.15fr_1fr]">
          <div>
            <p className="text-[11px] tracking-[0.06em] uppercase text-muted mb-5 pb-3 border-b border-line">Delivery Details</p>

            <div className="space-y-5">
              <div>
                <input
                  value={form.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  placeholder="Full name"
                  className={`w-full px-0 py-2.5 bg-transparent text-[13.5px] border-b outline-none transition-colors ${
                    errors.fullName ? 'border-accent-dark' : 'border-line focus:border-ink'
                  }`}
                />
                {errors.fullName && <p className="mt-1.5 text-[12px] text-accent-dark">{errors.fullName}</p>}
              </div>

              <div>
                <input
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="Phone number (01XXXXXXXXX)"
                  className={`w-full px-0 py-2.5 bg-transparent text-[13.5px] border-b outline-none transition-colors ${
                    errors.phone ? 'border-accent-dark' : 'border-line focus:border-ink'
                  }`}
                />
                {errors.phone && <p className="mt-1.5 text-[12px] text-accent-dark">{errors.phone}</p>}
                <p className="mt-1.5 text-[11px] text-muted">You&apos;ll use this to track your order later.</p>
              </div>

              <div>
                <textarea
                  value={form.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  placeholder="House, road, area, city"
                  rows={3}
                  className={`w-full px-0 py-2.5 bg-transparent text-[13.5px] border-b outline-none resize-y font-[inherit] ${
                    errors.address ? 'border-accent-dark' : 'border-line focus:border-ink'
                  }`}
                />
                {errors.address && <p className="mt-1.5 text-[12px] text-accent-dark">{errors.address}</p>}
              </div>

              <div>
                <p className="text-[11px] tracking-[0.06em] uppercase text-muted mb-2.5">Delivery Area</p>
                <div className="flex gap-2">
                  {(['DHAKA', 'OUTSIDE_DHAKA'] as const).map((zone) => (
                    <button
                      key={zone}
                      onClick={() => updateField('zone', zone)}
                      className={`flex-1 py-2.5 text-[12px] border transition-colors ${
                        form.zone === zone ? 'border-ink bg-ink text-white' : 'border-line text-ink'
                      }`}
                    >
                      {zone === 'DHAKA' ? `Inside Dhaka — ${formatPrice(DELIVERY_CHARGE.DHAKA)}` : `Outside Dhaka — ${formatPrice(DELIVERY_CHARGE.OUTSIDE_DHAKA)}`}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                value={form.note}
                onChange={(e) => updateField('note', e.target.value)}
                placeholder="Order note (optional)"
                rows={2}
                className="w-full px-0 py-2.5 bg-transparent text-[13.5px] border-b border-line outline-none resize-y font-[inherit] transition-colors focus:border-ink placeholder:text-muted"
              />

              <div className="text-[12px] text-muted pt-2">
                Payment: <span className="text-ink">Cash on Delivery</span> — pay when your order arrives.
              </div>
            </div>
          </div>

          <div>
            <p className="text-[11px] tracking-[0.06em] uppercase text-muted mb-5 pb-3 border-b border-line">Order Summary</p>

            <div className="space-y-4 mb-5">
              {lines.map((line) => (
                <div key={line.id} className="flex gap-3">
                  <div className="relative w-14 h-14 shrink-0 bg-canvas overflow-hidden">
                    {line.image ? <Image src={line.image} alt={line.name} fill sizes="56px" className="object-cover" /> : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-ink leading-tight truncate">{line.name}</p>
                    {Object.entries(line.selectedOptions).length > 0 && (
                      <p className="text-[11px] text-muted mt-0.5">
                        {Object.entries(line.selectedOptions).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                      </p>
                    )}
                    <div className="flex items-center gap-2.5 mt-1.5">
                      <button
                        onClick={() => setQuantity(line.id, line.quantity - 1)}
                        className="w-5 h-5 border border-line flex items-center justify-center"
                      >
                        <Minus size={10} strokeWidth={1.5} />
                      </button>
                      <span className="text-[12px] text-muted w-4 text-center">{line.quantity}</span>
                      <button
                        onClick={() => setQuantity(line.id, line.quantity + 1)}
                        className="w-5 h-5 border border-line flex items-center justify-center"
                      >
                        <Plus size={10} strokeWidth={1.5} />
                      </button>
                      <button onClick={() => removeLine(line.id)} className="ml-2 text-muted hover:text-ink">
                        <X size={13} strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                  <div className="text-right text-[13px] text-ink whitespace-nowrap">
                    {formatPrice(line.unitPrice * line.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-line pt-4 flex flex-col gap-1.5 text-[12.5px]">
              <div className="flex justify-between text-muted">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Delivery charge</span>
                <span>{formatPrice(deliveryCharge)}</span>
              </div>
              <div className="flex justify-between text-[15px] text-ink pt-2 border-t border-line mt-1">
                <span>Total</span>
                <span>{formatPrice(grandTotal)}</span>
              </div>
            </div>

            {placeError && <p className="mt-3 text-[12px] text-accent-dark text-center">{placeError}</p>}

            <button
              onClick={handlePlaceOrder}
              disabled={placing}
              className="w-full mt-5 py-4 bg-ink hover:bg-accent-dark text-white text-[12.5px] tracking-[0.04em] uppercase disabled:opacity-60 transition-colors"
            >
              {placing ? 'Placing order…' : 'Place Order — Cash on Delivery'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
