'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useShallow } from 'zustand/react/shallow';
import { useCartStore, useCartHydrated } from '@/providers/cart-store-provider';
import { useCustomerAuthStore, useCustomerAuthHydrated } from '@/providers/customer-auth-store-provider';
import {
  placeOrder,
  syncIncompleteOrder,
  validateCoupon,
  initiateOrderPayment,
  getStoreDeliveryCharges,
  type ValidatedCoupon,
} from '@/lib/checkoutApi';

// Frozen fallback — the exact old constant every theme's checkout used
// before Settings > Courier Integration > Delivery Charge made this
// vendor-configurable (see Vendor.insideDhakaCharge etc in
// schema.prisma). Medium/Minimal's own CheckoutView.tsx/ProfileView.tsx
// still import/hardcode this literal 70/130 pairing directly for their
// own "Inside Dhaka — ৳70" style option labels — kept as-is/untouched.
// This export only remains as that same fallback value for the brief
// window before the real per-vendor charges below have loaded.
export const DELIVERY_CHARGE: Record<'DHAKA' | 'OUTSIDE_DHAKA', number> = {
  DHAKA: 70,
  OUTSIDE_DHAKA: 130,
};
const FALLBACK_COD_VAT_CHARGE = 5;

const HANDOFF_KEY = 'regantify-last-order';

export interface CheckoutFormState {
  fullName: string;
  phone: string;
  address: string;
  // Optional finer-grained shipping fields — matches the reference
  // checkout screenshot's separate Thana/Upazila and District inputs,
  // alongside the free-text Address field every theme already has.
  // Sent straight through to CreateOrderDto's own shippingCity/
  // shippingDistrict (already existed there before this — see that
  // DTO), which so far only Add Order (vendor dashboard) populated.
  city: string;
  district: string;
  zone: 'DHAKA' | 'OUTSIDE_DHAKA';
  note: string;
}

/**
 * All of checkout's stateful logic — cart lines, form state/validation,
 * the debounced "Incomplete Orders" sync, and the place-order flow —
 * extracted out of the page so both themes' CheckoutView can share the
 * exact same behavior and only differ in JSX/styling. See the original
 * checkout/page.tsx (pre-theme-split) for the reasoning behind each
 * piece; nothing here changes that reasoning, only where it lives.
 *
 * `redirectTo` picks where a successful order sends the shopper:
 * 'orders' (default — Medium/Minimal's existing "Order placed
 * successfully" banner on the order-tracking page, unchanged) or
 * 'thank-you' (StorePal's own animated confirmation + memo page, see
 * themes/storepal/views/ThankYouView.tsx). Both destinations read the
 * same sessionStorage handoff (see HANDOFF_KEY) via useTrackOrder.
 */
export function useCheckout(subdomain: string, redirectTo: 'orders' | 'thank-you' = 'orders') {
  const router = useRouter();

  const lines = useCartStore(useShallow((s) => s.lines.filter((l) => l.subdomain === subdomain)));
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeLine = useCartStore((s) => s.removeLine);
  const clearStore = useCartStore((s) => s.clearStore);
  const hydrated = useCartHydrated();

  const [form, setForm] = useState<CheckoutFormState>({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    zone: 'DHAKA',
    note: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutFormState, string>>>({});
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);

  // Settings > Courier Integration > Delivery Charge — the vendor's own
  // saved charges, fetched once per subdomain. Falls back to the old
  // frozen DELIVERY_CHARGE/FALLBACK_COD_VAT_CHARGE constants until this
  // resolves (or if the fetch fails), so checkout never blocks on it.
  const [vendorCharges, setVendorCharges] = useState<{
    insideDhakaCharge: number;
    outsideDhakaCharge: number;
    codVatCharge: number;
  } | null>(null);
  useEffect(() => {
    let cancelled = false;
    getStoreDeliveryCharges(subdomain).then((charges) => {
      if (cancelled || !charges) return;
      setVendorCharges({
        insideDhakaCharge: Number(charges.insideDhakaCharge),
        outsideDhakaCharge: Number(charges.outsideDhakaCharge),
        codVatCharge: Number(charges.codVatCharge),
      });
    });
    return () => {
      cancelled = true;
    };
  }, [subdomain]);
  const resolvedDeliveryCharge: Record<'DHAKA' | 'OUTSIDE_DHAKA', number> = vendorCharges
    ? { DHAKA: vendorCharges.insideDhakaCharge, OUTSIDE_DHAKA: vendorCharges.outsideDhakaCharge }
    : DELIVERY_CHARGE;
  const resolvedCodVatCharge = vendorCharges?.codVatCharge ?? FALLBACK_COD_VAT_CHARGE;

  // "Payment Method" on checkout — COD (default, every theme today) or
  // ONLINE_PAYMENT (StorePal only — see themes/storepal/views/
  // CheckoutView.tsx). Medium/Minimal never render a payment-method
  // selector and so never call setPaymentMethod, which is what keeps
  // their checkout behavior byte-for-byte the same as before this was
  // added — handlePlaceOrder only takes the ONLINE_PAYMENT branch when
  // a theme's own UI explicitly switches to it.
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE_PAYMENT'>('COD');

  // "Have Coupon?" (see reference checkout screenshot) — a coupon is
  // only ever previewed here (validateCoupon never touches usageCount,
  // see StorefrontService.validateCoupon's own comment), then re-
  // resolved and actually redeemed server-side inside placeOrder's own
  // OrdersService.create call. couponCode is kept separate from
  // appliedCoupon (the last successfully validated result) so editing
  // the input after a successful apply doesn't keep showing a stale
  // discount until the shopper re-validates.
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<ValidatedCoupon | null>(null);
  const [couponChecking, setCouponChecking] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const authHydrated = useCustomerAuthHydrated();
  const customer = useCustomerAuthStore((s) => s.customer);
  useEffect(() => {
    if (!authHydrated || !customer) return;
    setForm((prev) =>
      prev.fullName === '' && prev.phone === '' && prev.address === ''
        ? {
            ...prev,
            fullName: customer.fullName,
            phone: customer.phone,
            address: customer.address ?? '',
            zone: customer.deliveryZone ?? prev.zone,
          }
        : prev,
    );
  }, [authHydrated, customer]);

  const [sessionKey] = useState(() => {
    if (typeof window === 'undefined') return '';
    const key = `regantify-checkout-session:${subdomain}`;
    const existing = sessionStorage.getItem(key);
    if (existing) return existing;
    const generated = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(key, generated);
    return generated;
  });

  useEffect(() => {
    if (!hydrated || !sessionKey) return;
    const timer = setTimeout(() => {
      syncIncompleteOrder(subdomain, {
        sessionKey,
        customerName: form.fullName.trim() || undefined,
        customerPhone: form.phone.trim() || undefined,
        customerNote: form.note.trim() || undefined,
        shippingAddress: form.address.trim() || undefined,
        items: lines.map((l) => ({
          productName: l.name,
          productSku: l.productSlug,
          productImage: l.image,
          selectedOptions: l.selectedOptions,
          quantity: l.quantity,
        })),
      });
    }, 2000);
    return () => clearTimeout(timer);
  }, [hydrated, sessionKey, subdomain, form.fullName, form.phone, form.note, form.address, lines]);

  const storeName = lines[0]?.storeName ?? '';
  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const deliveryCharge = lines.length > 0 ? resolvedDeliveryCharge[form.zone] : 0;
  // COD VAT — a flat fee added only for Cash on Delivery orders, never
  // Online Payment (see OrdersService.create's own comment on why). Zero
  // whenever the cart is empty, same as deliveryCharge above.
  const vatAmount = lines.length > 0 && paymentMethod === 'COD' ? resolvedCodVatCharge : 0;
  // FREE_SHIPPING waives the delivery charge instead of discounting the
  // subtotal — same split OrdersService.create's own coupon handling
  // makes server-side, so the number shown here always matches what
  // Place Order will actually charge.
  const couponFreeShipping = appliedCoupon?.discountType === 'FREE_SHIPPING';
  const couponDiscount = couponFreeShipping ? 0 : (appliedCoupon?.discountAmount ?? 0);
  const effectiveDeliveryCharge = couponFreeShipping ? 0 : deliveryCharge;
  const grandTotal = Math.max(0, subtotal + effectiveDeliveryCharge + vatAmount - couponDiscount);

  // Same limits enforced server-side by CreateOrderDto — kept here too so
  // a shopper is stopped from typing past them in the first place, on
  // every theme (Medium, Minimal, StorePal all share this hook).
  const FIELD_MAX_LENGTH: Record<keyof CheckoutFormState, number> = {
    fullName: 100,
    phone: 30,
    address: 300,
    city: 100,
    district: 100,
    zone: 20, // not user-typed (a <select> value), generous ceiling only
    note: 500,
  };

  const updateField = (field: keyof CheckoutFormState, value: string) => {
    const capped = value.slice(0, FIELD_MAX_LENGTH[field]);
    setForm((prev) => ({ ...prev, [field]: capped }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // A coupon already applied is invalidated (silently — the shopper is
  // re-prompted rather than shown an error mid-checkout) whenever the
  // cart or phone it was checked against changes, since either could
  // change whether it's still valid or what it's worth.
  useEffect(() => {
    setAppliedCoupon(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines.map((l) => `${l.id}:${l.quantity}`).join(','), form.phone]);

  const applyCoupon = async () => {
    const code = couponCode.trim();
    if (!code) return;
    if (!/^01[0-9]{9}$/.test(form.phone.trim())) {
      setCouponError('Enter your phone number above first.');
      return;
    }
    setCouponChecking(true);
    setCouponError(null);
    try {
      const result = await validateCoupon(
        subdomain,
        code,
        form.phone.trim(),
        lines.map((l) => ({ productSlug: l.productSlug, quantity: l.quantity })),
      );
      setAppliedCoupon(result);
    } catch (err) {
      setAppliedCoupon(null);
      setCouponError(err instanceof Error ? err.message : 'This coupon code is not valid.');
    } finally {
      setCouponChecking(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError(null);
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof CheckoutFormState, string>> = {};
    if (!form.fullName.trim()) next.fullName = 'Enter your full name.';
    if (!/^01[0-9]{9}$/.test(form.phone.trim())) next.phone = 'Enter a valid 11-digit phone number.';
    if (!form.address.trim()) next.address = 'Enter your delivery address.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!validate()) return;
    setPlacing(true);
    setPlaceError(null);
    try {
      const result = await placeOrder(subdomain, {
        customerName: form.fullName.trim(),
        customerPhone: form.phone.trim(),
        customerNote: form.note.trim() || undefined,
        shippingAddress: form.address.trim(),
        shippingCity: form.city.trim() || undefined,
        shippingDistrict: form.district.trim() || undefined,
        deliveryZone: form.zone,
        sessionKey: sessionKey || undefined,
        couponCode: appliedCoupon?.code,
        paymentMethod,
        items: lines.map((l) => ({
          productSlug: l.productSlug,
          productName: l.name,
          productImage: l.image,
          selectedOptions: l.selectedOptions,
          listPrice: l.originalUnitPrice ?? l.unitPrice,
          unitPrice: l.unitPrice,
          quantity: l.quantity,
        })),
      });

      // ONLINE_PAYMENT: the order now exists (PAYMENT_INITIATED, stock
      // already decremented — see OrdersService.create), but it isn't
      // "placed" from the shopper's point of view until PayStation
      // confirms payment. Cart is cleared either way (the order is real
      // either way — re-adding the same items and checking out again
      // would double the stock decrement), but the redirect goes to
      // PayStation's hosted checkout instead of the thank-you/orders
      // page; that page is only reached once payment-callback confirms
      // success (see themes/storepal/views/PaymentCallbackView.tsx).
      clearStore(subdomain);
      sessionStorage.removeItem(`regantify-checkout-session:${subdomain}`);

      if (paymentMethod === 'ONLINE_PAYMENT') {
        const payment = await initiateOrderPayment(result.orderId);
        window.location.href = payment.paymentUrl;
        return;
      }

      sessionStorage.setItem(
        HANDOFF_KEY,
        JSON.stringify({ subdomain, invoiceNumber: result.invoiceNumber, phone: form.phone.trim() }),
      );
      router.push(`/store/${subdomain}/${redirectTo === 'thank-you' ? 'thank-you' : 'orders'}`);
    } catch (err) {
      setPlaceError(err instanceof Error ? err.message : 'Could not place the order. Please try again.');
      setPlacing(false);
    }
  };

  return {
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
    deliveryCharge: effectiveDeliveryCharge,
    // Per-zone map (Inside/Outside Dhaka) — the vendor's real saved
    // charges once loaded, same frozen 70/130 fallback otherwise. Lets
    // a theme show both options' prices before one is actually chosen
    // (see StorePal's own Shipping Option <select>); Medium/Minimal
    // still use their own imported DELIVERY_CHARGE constant for this,
    // unchanged.
    deliveryChargeByZone: resolvedDeliveryCharge,
    // COD-only flat fee (see comment above) — StorePal's CheckoutView/
    // ThankYouView show this as "VAT"; Medium/Minimal don't render it as
    // its own line (their JSX is unchanged), it's only folded silently
    // into grandTotal below, same as it already was for MANUAL orders.
    vatAmount,
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
    paymentMethod,
    setPaymentMethod,
  };
}
