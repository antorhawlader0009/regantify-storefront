'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus, X, Tag, ShieldCheck, Truck } from 'lucide-react';
import { formatPrice } from '../lib/formatPrice';
import { useCheckout, DELIVERY_CHARGE } from '@/lib/useCheckout';
import { useStoreDisplayName } from '../lib/useStoreDisplayName';
import { getStoreNavData, type StoreNavData } from '../lib/storeNavApi';
import { getStoreSocialLinks } from '@/lib/socialLinksApi';
import { StoreHeader } from '../components/StoreHeader';
import { StoreFooter } from '../components/StoreFooter';
import { WhatsAppBubble } from '../components/WhatsAppBubble';

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
    subtotal,
    deliveryCharge,
    grandTotal,
    updateField,
    handlePlaceOrder,
    couponCode,
    setCouponCode,
    appliedCoupon,
    couponChecking,
    couponError,
    applyCoupon,
    removeCoupon,
  } = useCheckout(subdomain, 'thank-you');

  const [couponBoxOpen, setCouponBoxOpen] = useState(false);
  const storeName = useStoreDisplayName(subdomain);

  // Checkout is a Client Component (needs cart state from
  // localStorage), so it has no server-fetched StorefrontListData the
  // way home/product pages do — the full category nav + logo/social
  // for StoreHeader/StoreFooter are fetched here instead, same
  // prop-or-fetch pattern those components already support for
  // account/* pages. Matches the reference site, which keeps its
  // complete header (logo, search, category strip) on /checkout rather
  // than a stripped-down bar.
  const [nav, setNav] = useState<StoreNavData>({ categories: [], categoryDetails: [] });
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [socialLinks, setSocialLinks] = useState<Awaited<ReturnType<typeof getStoreSocialLinks>>>({});

  useEffect(() => {
    getStoreNavData(subdomain).then(setNav);
    getStoreSocialLinks(subdomain).then((b) => {
      setLogoUrl(b.logoUrl ?? null);
      setSocialLinks(b);
    });
  }, [subdomain]);

  if (!hydrated) return null;

  if (lines.length === 0) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center gap-3">
        <p className="text-muted text-[13.5px]">Your cart is empty.</p>
        <Link href={`/store/${subdomain}`} className="text-accent text-[13.5px] font-medium">
          Back to store
        </Link>
      </div>
    );
  }

  const couponDiscountAmount = appliedCoupon && appliedCoupon.discountType !== 'FREE_SHIPPING' ? appliedCoupon.discountAmount : 0;

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <StoreHeader
        subdomain={subdomain}
        storeName={storeName}
        categories={nav.categories}
        categoryDetails={nav.categoryDetails}
        logoUrl={logoUrl}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid gap-6 items-start lg:[grid-template-columns:1.2fr_1fr]">
          {/* Place Order form */}
          <div>
            <h1 className="text-[24px] font-bold text-ink mb-5">Place Order</h1>

            <div className="space-y-4">
              <div>
                <label className="block text-[13.5px] font-medium text-ink mb-1.5">Name</label>
                <input
                  value={form.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  maxLength={100}
                  className={`w-full px-3.5 py-2.5 rounded-md text-[13.5px] bg-surface border outline-none transition-colors ${
                    errors.fullName ? 'border-accent' : 'border-line-strong focus:border-ink'
                  }`}
                />
                {errors.fullName && <p className="mt-1.5 text-[12px] text-accent">{errors.fullName}</p>}
              </div>

              <div>
                <label className="block text-[13.5px] font-medium text-ink mb-1.5">Phone</label>
                <div className="flex">
                  <span className="px-3.5 py-2.5 rounded-l-md border border-r-0 border-line-strong bg-canvas text-[13.5px] text-muted">
                    +88
                  </span>
                  <input
                    value={form.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="01XXXXXXXXX"
                    maxLength={30}
                    className={`flex-1 px-3.5 py-2.5 rounded-r-md text-[13.5px] bg-surface border outline-none transition-colors ${
                      errors.phone ? 'border-accent' : 'border-line-strong focus:border-ink'
                    }`}
                  />
                </div>
                {errors.phone && <p className="mt-1.5 text-[12px] text-accent">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-[13.5px] font-medium text-ink mb-1.5">Address</label>
                <textarea
                  value={form.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  placeholder="Your full address including upazila"
                  rows={3}
                  maxLength={300}
                  className={`w-full px-3.5 py-2.5 rounded-md text-[13.5px] bg-surface border outline-none resize-y font-[inherit] transition-colors ${
                    errors.address ? 'border-accent' : 'border-line-strong focus:border-ink'
                  }`}
                />
                {errors.address && <p className="mt-1.5 text-[12px] text-accent">{errors.address}</p>}
              </div>

              <div>
                <label className="block text-[13.5px] font-medium text-ink mb-1.5">Thana / Upazila</label>
                <input
                  value={form.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  maxLength={100}
                  className="w-full px-3.5 py-2.5 rounded-md text-[13.5px] bg-surface border border-line-strong outline-none focus:border-ink transition-colors"
                />
              </div>

              <div>
                <label className="block text-[13.5px] font-medium text-ink mb-1.5">District</label>
                <input
                  value={form.district}
                  onChange={(e) => updateField('district', e.target.value)}
                  placeholder="Please select district"
                  maxLength={100}
                  className="w-full px-3.5 py-2.5 rounded-md text-[13.5px] bg-surface border border-line-strong outline-none focus:border-ink transition-colors"
                />
              </div>

              <div>
                <label className="block text-[13.5px] font-medium text-ink mb-1.5">Shipping Option</label>
                <select
                  value={form.zone}
                  onChange={(e) => updateField('zone', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-md text-[13.5px] bg-surface border border-line-strong outline-none focus:border-ink transition-colors"
                >
                  <option value="DHAKA">Inside Dhaka — {formatPrice(DELIVERY_CHARGE.DHAKA)}</option>
                  <option value="OUTSIDE_DHAKA">Outside Dhaka — {formatPrice(DELIVERY_CHARGE.OUTSIDE_DHAKA)}</option>
                </select>
              </div>

              <div>
                <label className="block text-[13.5px] font-medium text-ink mb-1.5">Note</label>
                <textarea
                  value={form.note}
                  onChange={(e) => updateField('note', e.target.value)}
                  rows={3}
                  maxLength={500}
                  className="w-full px-3.5 py-2.5 rounded-md text-[13.5px] bg-surface border border-line-strong outline-none resize-y font-[inherit] focus:border-ink transition-colors"
                />
              </div>
            </div>

            <div className="border-t border-line mt-6 pt-6">
              <p className="text-[15px] font-semibold text-ink mb-3">Payment Method</p>
              <label className="flex items-center gap-2.5 text-[13.5px] font-medium text-ink">
                <input type="radio" checked readOnly className="accent-accent w-4 h-4" />
                Cash on Delivery
              </label>
            </div>

            {placeError && <p className="mt-4 text-[13px] text-accent">{placeError}</p>}

            <button
              onClick={handlePlaceOrder}
              disabled={placing}
              className="w-full mt-6 py-3.5 rounded-md bg-accent hover:bg-accent-dark text-white text-[14px] font-bold disabled:opacity-60 transition-colors shadow-sm"
            >
              {placing ? 'Placing order…' : 'Submit Order'}
            </button>

            <div className="flex flex-wrap gap-2 mt-4">
              <div className="flex items-center gap-1.5 text-[11.5px] text-ink bg-canvas border border-line rounded-full px-2.5 py-1.5">
                <Truck size={13} className="text-accent shrink-0" />
                Cash On Delivery All Over Bangladesh
              </div>
              <div className="flex items-center gap-1.5 text-[11.5px] text-ink bg-canvas border border-line rounded-full px-2.5 py-1.5">
                <ShieldCheck size={13} className="text-accent shrink-0" />
                100% genuine products
              </div>
            </div>
          </div>

          {/* Your cart summary */}
          <div className="bg-surface border border-line rounded-lg p-4 sm:p-5 lg:sticky lg:top-24">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-line">
              <p className="text-[16px] font-semibold text-muted">Your cart</p>
              <span className="w-6 h-6 rounded-full bg-muted text-white text-[12px] font-bold flex items-center justify-center">
                {lines.reduce((sum, l) => sum + l.quantity, 0)}
              </span>
            </div>

            <div className="space-y-4 mb-4">
              {lines.map((line) => (
                <div key={line.id} className="flex gap-3">
                  <div className="relative w-14 h-14 shrink-0 bg-canvas border border-line rounded overflow-hidden">
                    {line.image && <Image src={line.image} alt={line.name} fill sizes="56px" className="object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[13.5px] text-ink leading-tight">{line.name}</p>
                      <div className="text-right shrink-0">
                        {line.originalUnitPrice && (
                          <span className="block text-[11.5px] text-muted line-through">
                            {formatPrice(line.originalUnitPrice)}
                          </span>
                        )}
                        <span className="text-[13px] font-bold text-accent">{formatPrice(line.unitPrice)}</span>
                      </div>
                    </div>
                    <p className="text-[11.5px] text-muted font-mono mt-0.5">{line.productSlug}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[11.5px] text-muted">x{line.quantity}</span>
                      <div className="flex items-center border border-line rounded overflow-hidden ml-2">
                        <button
                          onClick={() => setQuantity(line.id, line.quantity - 1)}
                          className="w-6 h-6 text-ink text-sm leading-none hover:bg-canvas"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-[12px]">{line.quantity}</span>
                        <button
                          onClick={() => setQuantity(line.id, line.quantity + 1)}
                          className="w-6 h-6 text-ink text-sm leading-none hover:bg-canvas"
                        >
                          +
                        </button>
                      </div>
                      <button onClick={() => removeLine(line.id)} className="ml-auto text-[12px] font-medium text-accent hover:underline">
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-line pt-3 space-y-2 text-[13.5px]">
              <div className="flex justify-between">
                <span className="text-ink">Cart Total</span>
                <span className="font-semibold text-accent">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink">Shipping Charge</span>
                <span className="font-semibold text-accent">{formatPrice(deliveryCharge)}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-success">
                  <span className="flex items-center gap-1">
                    <Tag size={12} />
                    {appliedCoupon.discountType === 'FREE_SHIPPING' ? 'Free shipping' : `Coupon ${appliedCoupon.code}`}
                  </span>
                  <span className="font-semibold">
                    {appliedCoupon.discountType === 'FREE_SHIPPING' ? '—' : `-${formatPrice(couponDiscountAmount)}`}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-line text-[15px] font-bold text-ink">
                <span>Total</span>
                <span>{formatPrice(grandTotal)}</span>
              </div>
            </div>

            <div className="text-right mt-3">
              {!couponBoxOpen && !appliedCoupon && (
                <button
                  onClick={() => setCouponBoxOpen(true)}
                  className="text-[13px] font-medium text-accent hover:text-accent-dark transition-colors"
                >
                  Have Coupon?
                </button>
              )}
            </div>

            {(couponBoxOpen || appliedCoupon) && (
              <div className="mt-3 pt-3 border-t border-line">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-success-bg text-success text-[12.5px] font-semibold px-3 py-2 rounded-md">
                    <span className="flex items-center gap-1.5">
                      <Tag size={13} />
                      {appliedCoupon.code} applied
                    </span>
                    <button onClick={removeCoupon} className="text-success hover:opacity-70">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-2">
                      <input
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.slice(0, 50))}
                        placeholder="Enter coupon code"
                        maxLength={50}
                        className="flex-1 px-3 py-2 rounded-md text-[13px] bg-canvas border border-line-strong outline-none focus:border-ink transition-colors uppercase"
                      />
                      <button
                        onClick={applyCoupon}
                        disabled={couponChecking || !couponCode.trim()}
                        className="px-4 py-2 rounded-md bg-ink hover:bg-ink/90 text-white text-[12.5px] font-bold disabled:opacity-60 transition-colors"
                      >
                        {couponChecking ? 'Checking…' : 'Apply'}
                      </button>
                    </div>
                    {couponError && <p className="mt-1.5 text-[12px] text-accent">{couponError}</p>}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <StoreFooter subdomain={subdomain} storeName={storeName} logoUrl={logoUrl} socialLinks={socialLinks} />
      <WhatsAppBubble socialLinks={socialLinks} />
    </div>
  );
}
