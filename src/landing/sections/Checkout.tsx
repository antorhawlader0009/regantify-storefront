'use client';

import { useEffect, useMemo, useState } from 'react';
import type { StorefrontLandingPageProduct } from '@/lib/storefrontApi';
import { formatPrice } from '@/lib/productDisplay';
import { submitLandingPageLead } from '@/lib/checkoutApi';
import { useCheckout } from '@/lib/useCheckout';
import { useStoreTheme } from '@/providers/theme-provider';
import type { CartLine } from '@/stores/cart-store';
import type { CheckoutFormProps, LeadFormProps } from '../types';

// A handful of common Bangladeshi districts for the "quick-select" chips
// (landing-page-sections.md §6.1 / landing-plan.md §1.2 item 6) — this is
// a UX shortcut that fills the free-text district input, not a
// constrained enum (the input stays free text, matching the existing
// storefront checkout's own District field — see CheckoutView.tsx), so an
// unlisted district is always still typeable by hand.
const QUICK_DISTRICTS = ['Dhaka', 'Chattogram', 'Khulna', 'Rajshahi', 'Sylhet', 'Barishal', 'Rangpur', 'Mymensingh'];

const PHONE_PATTERN = /^01[0-9]{9}$/;

// Same fallback labels as StorePal's CheckoutView — a gateway row with no
// vendor-set displayLabel.
const DEFAULT_GATEWAY_LABELS: Record<string, string> = {
  COD: 'Cash on Delivery',
  ONLINE_PAYMENT: 'Online Payment',
  SSLCOMMERZ: 'SSLCommerz',
  BKASH_MERCHANT: 'bKash Merchant',
  VENDOR_PAYSTATION: 'PayStation',
};

const INPUT_CLASS =
  'w-full rounded-md border border-neutral-300 px-3.5 py-2.5 text-[13.5px] text-neutral-900 outline-none transition-colors focus:border-neutral-900';

/**
 * Checkout Form section (landing-page-sections.md §6.1, landing-plan.md
 * Step 9). Runs the SAME checkout logic as the storefront's cart checkout
 * — useCheckout() with the section's fixed products passed in as
 * `options.lines` instead of the shopper's cart — so delivery charge,
 * VAT, Platform Charge, coupons, payment gateways (COD / Online Payment /
 * a connected custom gateway), COD Guard's SMS code and the Incomplete
 * Orders sync all behave exactly like the product checkout. Order.source
 * stays STOREFRONT (set server-side), so courier booking, the ledger and
 * the admin Orders UI work unmodified (landing-plan.md §9.5).
 *
 * Non-COD gateways are only offered on StorePal: the payment-callback
 * page that finishes an online payment is StorePal-only (see
 * payment-callback/page.tsx), same reason the Medium/Minimal checkouts
 * have no payment-method picker. `codOnly` hides them everywhere.
 */
export function CheckoutFormSection({
  props,
  subdomain,
  products,
}: {
  props: CheckoutFormProps;
  subdomain: string;
  products: StorefrontLandingPageProduct[];
}) {
  const theme = useStoreTheme();
  const collect = props.collectFields ?? { name: true, phone: true, address: true, district: true, shippingOption: true };

  const orderable = (p: StorefrontLandingPageProduct) => p.inStock || p.isPreOrder;
  // Which of the section's products are in the order, and how many of
  // each. Every in-stock product starts selected at quantity 1 (the old
  // fixed "one of each" order); the checkbox only shows with 2+ products.
  const [selected, setSelected] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(products.map((p) => [p.id, orderable(p)])),
  );
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const lines = useMemo<CartLine[]>(
    () =>
      products
        .filter((p) => selected[p.id] && orderable(p))
        .map((p) => {
          const price = Number(p.price);
          const discount = p.discountPrice != null ? Number(p.discountPrice) : null;
          return {
            id: p.id,
            subdomain,
            storeName: '',
            productSlug: p.slug,
            name: p.name,
            image: p.photoUrl ?? undefined,
            unitPrice: discount ?? price,
            originalUnitPrice: discount != null && discount < price ? price : undefined,
            quantity: quantities[p.id] ?? 1,
            selectedOptions: {},
            isPreOrder: p.isPreOrder,
          };
        }),
    [products, selected, quantities, subdomain],
  );

  const {
    form,
    errors,
    placing,
    placeError,
    subtotal,
    deliveryCharge,
    deliveryChargeByZone,
    vatAmount,
    visiblePlatformChargeAmount,
    visibleGrandTotal,
    updateField,
    handlePlaceOrder,
    couponCode,
    setCouponCode,
    appliedCoupon,
    couponChecking,
    couponError,
    applyCoupon,
    removeCoupon,
    paymentGateways,
    paymentMethod,
    setPaymentMethod,
    codOtpPhone,
    codOtpCode,
    setCodOtpCode,
    codOtpSending,
    codOtpError,
    resendCodOtp,
  } = useCheckout(subdomain, 'thank-you', { lines });

  const onlineAllowed = theme === 'STOREPAL' && !props.codOnly;
  const gateways = onlineAllowed ? paymentGateways : paymentGateways.filter((g) => g.type === 'COD');
  // Keep the selection valid once the real gateway list loads (e.g. a
  // vendor whose COD row is switched off).
  useEffect(() => {
    if (gateways.length > 0 && !gateways.some((g) => g.id === paymentMethod)) setPaymentMethod(gateways[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gateways.map((g) => g.id).join(','), paymentMethod]);

  const selectedGateway = gateways.find((g) => g.id === paymentMethod);
  const isCodSelected = selectedGateway?.type === 'COD';
  const isRedirectGateway = selectedGateway ? selectedGateway.type !== 'COD' : false;
  const showCodOtp = isCodSelected && codOtpPhone !== null;
  const couponDiscountAmount = appliedCoupon && appliedCoupon.discountType !== 'FREE_SHIPPING' ? appliedCoupon.discountAmount : 0;

  const [couponBoxOpen, setCouponBoxOpen] = useState(false);
  const [noProductError, setNoProductError] = useState<string | null>(null);

  const onSubmit = () => {
    if (lines.length === 0) {
      setNoProductError(products.length === 0 ? 'No product is set up for this order form yet.' : 'Select at least one product.');
      return;
    }
    setNoProductError(null);
    handlePlaceOrder();
  };

  const setQuantity = (id: string, qty: number) => setQuantities((prev) => ({ ...prev, [id]: Math.max(1, Math.min(99, qty)) }));

  return (
    <div id="checkout" className="px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-4xl rounded-2xl border border-neutral-200 p-5 sm:p-8">
        <h2 className="mb-5 text-xl font-bold text-neutral-900 sm:text-2xl">Submit Your Order Information</h2>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-3.5">
            <Field label="Full Name" required error={errors.fullName}>
              <input
                value={form.fullName}
                onChange={(e) => updateField('fullName', e.target.value)}
                className={INPUT_CLASS}
                placeholder="Your name"
              />
            </Field>
            <Field label="Mobile Number" required error={errors.phone}>
              <input
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value.replace(/[^0-9]/g, '').slice(0, 11))}
                className={INPUT_CLASS}
                placeholder="01XXXXXXXXX"
                inputMode="numeric"
              />
            </Field>
            <Field label="Delivery Address" required error={errors.address}>
              <textarea
                value={form.address}
                onChange={(e) => updateField('address', e.target.value)}
                className={`${INPUT_CLASS} min-h-[72px] resize-none`}
                placeholder="House, road, area"
              />
            </Field>
            {collect.district && (
              <Field label="District">
                <input
                  value={form.district}
                  onChange={(e) => updateField('district', e.target.value)}
                  className={`${INPUT_CLASS} mb-2`}
                  placeholder="Select or type your district"
                />
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_DISTRICTS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => updateField('district', d)}
                      className={`rounded-full border px-3 py-1 text-[12px] transition-colors ${
                        form.district === d
                          ? 'border-orange-600 bg-orange-50 text-orange-700'
                          : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </Field>
            )}
            {collect.shippingOption && (
              <Field label="Shipping Option">
                <div className="flex flex-col gap-2">
                  {(['DHAKA', 'OUTSIDE_DHAKA'] as const).map((z) => (
                    <label key={z} className="flex items-center gap-2 text-[13.5px] text-neutral-700">
                      <input type="radio" checked={form.zone === z} onChange={() => updateField('zone', z)} />
                      {z === 'DHAKA' ? 'Inside Dhaka' : 'Outside Dhaka'} — {formatPrice(deliveryChargeByZone[z])}
                    </label>
                  ))}
                </div>
              </Field>
            )}
            <Field label="Note">
              <textarea
                value={form.note}
                onChange={(e) => updateField('note', e.target.value)}
                className={`${INPUT_CLASS} min-h-[60px] resize-none`}
                placeholder="Anything we should know? (optional)"
              />
            </Field>
          </div>

          <div className="h-fit rounded-xl border border-neutral-200 p-4">
            <p className="mb-2.5 text-[13.5px] font-semibold text-neutral-900">Your order</p>
            {products.length === 0 && (
              <p className="text-[12.5px] text-red-600">No product is set up for this order form yet.</p>
            )}
            <div className="flex flex-col gap-3">
              {products.map((p) => {
                const canOrder = orderable(p);
                const isOn = canOrder && selected[p.id];
                const qty = quantities[p.id] ?? 1;
                const unit = Number(p.discountPrice ?? p.price);
                return (
                  <div key={p.id} className={`flex items-center gap-2.5 ${isOn ? '' : 'opacity-50'}`}>
                    {products.length > 1 && (
                      <input
                        type="checkbox"
                        checked={isOn}
                        disabled={!canOrder}
                        onChange={(e) => setSelected((prev) => ({ ...prev, [p.id]: e.target.checked }))}
                        aria-label={`Order ${p.name}`}
                      />
                    )}
                    {p.photoUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.photoUrl} alt="" className="h-11 w-11 shrink-0 rounded-md border border-neutral-200 object-cover" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] text-neutral-800">{p.name}</p>
                      {canOrder ? (
                        <div className="mt-1 flex items-center">
                          <div className="flex items-center overflow-hidden rounded border border-neutral-300">
                            <button
                              type="button"
                              disabled={!isOn}
                              onClick={() => setQuantity(p.id, qty - 1)}
                              className="h-6 w-6 text-sm leading-none text-neutral-800 hover:bg-neutral-100"
                            >
                              −
                            </button>
                            <span className="w-7 text-center text-[12px]">{qty}</span>
                            <button
                              type="button"
                              disabled={!isOn}
                              onClick={() => setQuantity(p.id, qty + 1)}
                              className="h-6 w-6 text-sm leading-none text-neutral-800 hover:bg-neutral-100"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-0.5 text-[11.5px] font-medium text-red-600">Out of stock</p>
                      )}
                    </div>
                    <span className="shrink-0 text-[13px] font-medium text-neutral-900">{formatPrice(unit * (isOn ? qty : 1))}</span>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 flex flex-col gap-1.5 border-t border-neutral-200 pt-3 text-[13px]">
              <Row label="Subtotal" value={formatPrice(subtotal)} />
              <Row label="Delivery Charge" value={formatPrice(deliveryCharge)} />
              {vatAmount > 0 && <Row label="VAT" value={formatPrice(vatAmount)} />}
              {visiblePlatformChargeAmount > 0 && (
                <Row
                  label={selectedGateway?.type === 'ONLINE_PAYMENT' ? 'Payment Gateway Fee' : 'Platform Charge'}
                  value={formatPrice(visiblePlatformChargeAmount)}
                />
              )}
              {appliedCoupon && (
                <div className="flex justify-between text-green-700">
                  <span>{appliedCoupon.discountType === 'FREE_SHIPPING' ? 'Free shipping' : `Coupon ${appliedCoupon.code}`}</span>
                  <span className="font-medium">
                    {appliedCoupon.discountType === 'FREE_SHIPPING' ? '—' : `-${formatPrice(couponDiscountAmount)}`}
                  </span>
                </div>
              )}
              <div className="mt-1 flex justify-between border-t border-neutral-200 pt-2 text-[15px] font-bold text-neutral-900">
                <span>Total</span>
                <span>{formatPrice(visibleGrandTotal)}</span>
              </div>
            </div>

            {appliedCoupon ? (
              <div className="mt-3 flex items-center justify-between rounded-md bg-green-50 px-3 py-2 text-[12.5px] font-semibold text-green-700">
                <span>{appliedCoupon.code} applied</span>
                <button type="button" onClick={removeCoupon} className="hover:opacity-70">
                  Remove
                </button>
              </div>
            ) : couponBoxOpen ? (
              <div className="mt-3">
                <div className="flex gap-2">
                  <input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.slice(0, 50))}
                    placeholder="Enter coupon code"
                    className="min-w-0 flex-1 rounded-md border border-neutral-300 px-3 py-2 text-[13px] uppercase outline-none focus:border-neutral-900"
                  />
                  <button
                    type="button"
                    onClick={applyCoupon}
                    disabled={couponChecking || !couponCode.trim()}
                    className="rounded-md bg-neutral-900 px-4 py-2 text-[12.5px] font-bold text-white disabled:opacity-60"
                  >
                    {couponChecking ? 'Checking…' : 'Apply'}
                  </button>
                </div>
                {couponError && <p className="mt-1.5 text-[12px] text-red-600">{couponError}</p>}
              </div>
            ) : (
              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={() => setCouponBoxOpen(true)}
                  className="text-[12.5px] font-medium text-orange-600 hover:text-orange-700"
                >
                  Have Coupon?
                </button>
              </div>
            )}

            <div className="mt-4 border-t border-neutral-200 pt-3">
              <p className="mb-2 text-[13px] font-semibold text-neutral-900">Payment Method</p>
              <div className="flex flex-col gap-2">
                {gateways.map((gateway) => (
                  <label key={gateway.id} className="flex cursor-pointer items-center gap-2 text-[13px] text-neutral-800">
                    <input type="radio" checked={paymentMethod === gateway.id} onChange={() => setPaymentMethod(gateway.id)} />
                    {gateway.displayLabel ?? DEFAULT_GATEWAY_LABELS[gateway.type]}
                    {gateway.type === 'ONLINE_PAYMENT' && (
                      <span className="text-[11px] text-neutral-500">(bKash, Nagad, cards &amp; more)</span>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Store > COD Guard "Before Checkout" — see useCheckout's codOtp. */}
            {showCodOtp && (
              <div className="mt-4 rounded-md border border-orange-200 bg-orange-50 p-3.5">
                <p className="text-[13px] font-semibold text-neutral-900">Verify your phone number</p>
                <p className="mt-1 text-[12.5px] text-neutral-600">
                  We sent a 6-digit code to {codOtpPhone}. Enter it to place your order.
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={codOtpCode}
                  onChange={(e) => setCodOtpCode(e.target.value)}
                  placeholder="Enter code"
                  aria-label="Verification code"
                  className="mt-2.5 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-[15px] tracking-[0.3em] text-neutral-900 outline-none focus:border-orange-600 sm:w-48"
                />
                {codOtpError && <p className="mt-2 text-[12.5px] text-red-600">{codOtpError}</p>}
                <button
                  type="button"
                  onClick={resendCodOtp}
                  disabled={codOtpSending}
                  className="mt-2 block text-[12.5px] font-semibold text-orange-700 underline underline-offset-2 disabled:opacity-60"
                >
                  {codOtpSending ? 'Sending…' : 'Resend code'}
                </button>
              </div>
            )}

            {(noProductError || placeError) && (
              <p className="mt-3 text-[12.5px] text-red-600">{noProductError ?? placeError}</p>
            )}

            <button
              type="button"
              onClick={onSubmit}
              disabled={placing || codOtpSending}
              className="mt-3 w-full rounded-lg bg-neutral-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
            >
              {codOtpSending && !showCodOtp
                ? 'Sending verification code…'
                : placing
                  ? isRedirectGateway
                    ? 'Redirecting to payment…'
                    : 'Placing order…'
                  : showCodOtp
                    ? 'Verify & Place Order'
                    : 'Place Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-neutral-700">{label}</span>
      <span className="font-medium text-neutral-900">{value}</span>
    </div>
  );
}

/**
 * Lead/Contact Form section, both destinations (landing-page-sections.md
 * §6.2, landing-plan.md Step 9):
 *  - "vendor-dashboard": POSTs to the new lightweight Lead endpoint (see
 *    StorefrontService.submitLandingPageLead on the backend / Lead's own
 *    schema comment for why this is a new minimal table, not
 *    IncompleteOrder/Order).
 *  - "whatsapp": no backend call at all — just deep-links to
 *    wa.me/<number> with the shopper's own message prefilled, same
 *    "chat button" convention this landing-page feature already uses
 *    elsewhere (chatButtonLink).
 */
export function LeadFormSection({
  props,
  subdomain,
  slug,
}: {
  props: LeadFormProps;
  subdomain: string;
  slug: string;
}) {
  const collect = props.collectFields ?? { name: true, phone: true, email: false };

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'Enter your name.';
    if (!PHONE_PATTERN.test(phone.trim())) next.phone = 'Enter a valid 11-digit phone number.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    if (props.destination === 'whatsapp') {
      const number = (props.whatsappNumber || '').replace(/[^0-9]/g, '');
      const message = `Name: ${name.trim()}\nPhone: ${phone.trim()}${email.trim() ? `\nEmail: ${email.trim()}` : ''}`;
      window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, '_blank', 'noreferrer');
      setDone(true);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitLandingPageLead(subdomain, slug, {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
      });
      setDone(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not submit your information. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="px-5 py-10 text-center sm:px-8">
        <p className="mx-auto max-w-sm text-[15px] font-medium text-neutral-800">
          {props.successMessage || 'Thank you! We will contact you shortly.'}
        </p>
      </div>
    );
  }

  return (
    <div className="px-5 py-10 sm:px-8">
      <div className="mx-auto flex max-w-sm flex-col gap-3.5">
        <Field label="Full Name" required error={errors.name}>
          <input value={name} onChange={(e) => setName(e.target.value.slice(0, 100))} className="w-full rounded-md border border-neutral-300 px-3.5 py-2.5 text-[13.5px] text-neutral-900 outline-none transition-colors focus:border-neutral-900" placeholder="Your name" />
        </Field>
        <Field label="Mobile Number" required error={errors.phone}>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 11))}
            className="w-full rounded-md border border-neutral-300 px-3.5 py-2.5 text-[13.5px] text-neutral-900 outline-none transition-colors focus:border-neutral-900"
            placeholder="01XXXXXXXXX"
            inputMode="numeric"
          />
        </Field>
        {collect.email && (
          <Field label="Email">
            <input value={email} onChange={(e) => setEmail(e.target.value.slice(0, 150))} className="w-full rounded-md border border-neutral-300 px-3.5 py-2.5 text-[13.5px] text-neutral-900 outline-none transition-colors focus:border-neutral-900" placeholder="you@example.com" type="email" />
          </Field>
        )}

        {submitError && <p className="text-[12.5px] text-red-600">{submitError}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="mt-1 rounded-lg bg-orange-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-700 disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12.5px] font-medium text-neutral-700">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-[11.5px] text-red-600">{error}</span>}
    </label>
  );
}
