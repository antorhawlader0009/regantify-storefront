'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { StorefrontLandingPageProduct } from '@/lib/storefrontApi';
import { formatPrice } from '@/lib/productDisplay';
import { placeOrder, submitLandingPageLead } from '@/lib/checkoutApi';
import type { CheckoutFormProps, LeadFormProps } from '../types';

// A handful of common Bangladeshi districts for the "quick-select" chips
// (landing-page-sections.md §6.1 / landing-plan.md §1.2 item 6) — this is
// a UX shortcut that fills the free-text district input, not a
// constrained enum (the input stays free text, matching the existing
// storefront checkout's own District field — see CheckoutView.tsx), so an
// unlisted district is always still typeable by hand.
const QUICK_DISTRICTS = ['Dhaka', 'Chattogram', 'Khulna', 'Rajshahi', 'Sylhet', 'Barishal', 'Rangpur', 'Mymensingh'];

const PHONE_PATTERN = /^01[0-9]{9}$/;

/**
 * Checkout Form section (landing-page-sections.md §6.1, landing-plan.md
 * Step 9). This is a THIN WRAPPER over the existing storefront checkout
 * API — not a new order pipeline. It builds a CreateOrderDto-shaped
 * payload (customerName/customerPhone/shippingAddress/shippingDistrict/
 * deliveryZone/items/paymentMethod — see
 * server/src/orders/dto/create-order.dto.ts for the exact field names)
 * and posts it through checkoutApi.ts's placeOrder(), the SAME function
 * the regular cart-based checkout page uses. Order.source stays
 * STOREFRONT (set server-side by StorefrontController.checkout, not
 * anything sent from here) — this is why courier booking, the
 * Transaction ledger, and the admin Orders UI all work unmodified for a
 * landing-page order (landing-plan.md §9.5).
 *
 * Deliberately does NOT use useCheckout()/the global cart store: this
 * section's cart is fixed (props.productIds), not the shopper's roaming
 * cross-store cart, so a self-contained quantity-1-per-product flow here
 * is simpler and correct for this use case (single-product, ad-driven
 * landing pages, per landing-plan.md's own target-user framing) without
 * dragging in unrelated cart-store/coupon/payment-gateway UI this section
 * doesn't expose (codOnly hides ONLINE_PAYMENT entirely, per its own doc
 * comment in the props interface).
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
  const router = useRouter();
  const collect = props.collectFields ?? { name: true, phone: true, address: true, district: true, shippingOption: true };

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('');
  const [zone, setZone] = useState<'DHAKA' | 'OUTSIDE_DHAKA'>('DHAKA');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const subtotal = products.reduce((sum, p) => sum + Number(p.discountPrice ?? p.price), 0);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'Enter your name.';
    if (!PHONE_PATTERN.test(phone.trim())) next.phone = 'Enter a valid 11-digit phone number.';
    if (!address.trim()) next.address = 'Enter your delivery address.';
    if (products.length === 0) next.products = 'No product is set up for this order form yet.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await placeOrder(subdomain, {
        customerName: name.trim(),
        customerPhone: phone.trim(),
        shippingAddress: address.trim(),
        shippingDistrict: collect.district ? district.trim() || undefined : undefined,
        deliveryZone: collect.shippingOption ? zone : undefined,
        // codOnly hides any non-COD choice entirely from this form's own
        // UI (no payment-method selector rendered at all) — always COD
        // when true, matching this props field's own doc comment; when
        // false, still always COD from THIS form (no gateway picker is
        // built for the landing-page checkout — a vendor wanting Online
        // Payment on a landing page uses the regular storefront checkout
        // instead), so paymentMethod is simply omitted either way and
        // OrdersService defaults it server-side.
        items: products.map((p) => ({
          productId: p.id,
          productName: p.name,
          productImage: p.photoUrl ?? undefined,
          listPrice: Number(p.price),
          unitPrice: Number(p.discountPrice ?? p.price),
          quantity: 1,
        })),
      });
      // Same sessionStorage handoff useCheckout.ts's own handlePlaceOrder
      // uses (HANDOFF_KEY = 'regantify-last-order') — the order-tracking
      // page (useTrackOrder.ts) reads this key to auto-look-up the order
      // that was "just placed" rather than showing an empty lookup form,
      // so a landing-page order must hand off the exact same way a
      // regular cart checkout does to land on the same confirmation UX.
      sessionStorage.setItem(
        'regantify-last-order',
        JSON.stringify({ subdomain, invoiceNumber: result.invoiceNumber, phone: phone.trim() }),
      );
      router.push(`/store/${subdomain}/orders`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not place the order. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div id="checkout" className="px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-3xl rounded-2xl border border-neutral-200 p-5 sm:p-8">
        <h2 className="mb-5 text-xl font-bold text-neutral-900 sm:text-2xl">Submit Your Order Information</h2>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="flex flex-col gap-3.5">
            <Field label="Full Name" required error={errors.name}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 100))}
                className="w-full rounded-md border border-neutral-300 px-3.5 py-2.5 text-[13.5px] text-neutral-900 outline-none transition-colors focus:border-neutral-900"
                placeholder="Your name"
              />
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
            <Field label="Delivery Address" required error={errors.address}>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value.slice(0, 300))}
                className="w-full rounded-md border border-neutral-300 px-3.5 py-2.5 text-[13.5px] text-neutral-900 outline-none transition-colors focus:border-neutral-900 min-h-[72px] resize-none"
                placeholder="House, road, area"
              />
            </Field>
            {collect.district && (
              <Field label="District">
                <input
                  value={district}
                  onChange={(e) => setDistrict(e.target.value.slice(0, 100))}
                  className="w-full rounded-md border border-neutral-300 px-3.5 py-2.5 text-[13.5px] text-neutral-900 outline-none transition-colors focus:border-neutral-900 mb-2"
                  placeholder="Select or type your district"
                />
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_DISTRICTS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDistrict(d)}
                      className={`rounded-full border px-3 py-1 text-[12px] transition-colors ${
                        district === d
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
                  <label className="flex items-center gap-2 text-[13.5px] text-neutral-700">
                    <input type="radio" checked={zone === 'DHAKA'} onChange={() => setZone('DHAKA')} />
                    Inside Dhaka
                  </label>
                  <label className="flex items-center gap-2 text-[13.5px] text-neutral-700">
                    <input type="radio" checked={zone === 'OUTSIDE_DHAKA'} onChange={() => setZone('OUTSIDE_DHAKA')} />
                    Outside Dhaka
                  </label>
                </div>
              </Field>
            )}
          </div>

          <div className="rounded-xl border border-neutral-200 p-4">
            <p className="mb-2.5 text-[13.5px] font-semibold text-neutral-900">Your order</p>
            {errors.products && <p className="text-[12.5px] text-red-600">{errors.products}</p>}
            {products.map((p) => (
              <div key={p.id} className="mb-2 flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-[13px] text-neutral-700">{p.name}</span>
                <span className="shrink-0 text-[13px] font-medium text-neutral-900">
                  {formatPrice(Number(p.discountPrice ?? p.price))}
                </span>
              </div>
            ))}
            <div className="mt-2 flex items-center justify-between border-t border-neutral-200 pt-2">
              <span className="text-[13px] font-semibold text-neutral-900">Subtotal</span>
              <span className="text-[13px] font-semibold text-neutral-900">{formatPrice(subtotal)}</span>
            </div>
            <p className="mt-2 text-[11.5px] text-neutral-500">Cash on Delivery — delivery charge calculated at dispatch.</p>

            {submitError && <p className="mt-3 text-[12.5px] text-red-600">{submitError}</p>}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="mt-3 w-full rounded-lg bg-neutral-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
            >
              {submitting ? 'Placing order...' : 'Place Order'}
            </button>
          </div>
        </div>
      </div>
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
