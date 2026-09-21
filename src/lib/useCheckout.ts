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
  initiateGatewayOrderPayment,
  getStoreDeliveryCharges,
  type ValidatedCoupon,
  type StorePaymentGateway,
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
const FALLBACK_VAT_CHARGE = 10;
// Only used for the brief window before the real gateway list loads —
// every vendor always has at least a COD row (see
// PaymentGatewaysService.ensureBuiltins), so this is never shown, just a
// safe default so paymentMethod/vatAmount have something to resolve
// against on first render.
const FALLBACK_GATEWAYS: StorePaymentGateway[] = [
  { id: 'COD', type: 'COD', displayLabel: 'Cash On Delivery', platformChargeBdt: '0', feeHidden: false },
];

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

  // Settings > Courier Integration > Delivery Charge / Settings > VAT —
  // the vendor's own saved charges, fetched once per subdomain. Falls
  // back to the old frozen DELIVERY_CHARGE/FALLBACK_VAT_CHARGE constants
  // until this resolves (or if the fetch fails), so checkout never
  // blocks on it. Also carries Store > Payment Gateway's own enabled
  // gateway list (see StorePaymentGateway) — one fetch, both concerns,
  // same as before this feature only had the 3 charge fields.
  const [vendorCharges, setVendorCharges] = useState<{
    insideDhakaCharge: number;
    outsideDhakaCharge: number;
    vatChargeBdt: number;
    paymentGateways: StorePaymentGateway[];
  } | null>(null);
  useEffect(() => {
    let cancelled = false;
    getStoreDeliveryCharges(subdomain).then((charges) => {
      if (cancelled || !charges) return;
      setVendorCharges({
        insideDhakaCharge: Number(charges.insideDhakaCharge),
        outsideDhakaCharge: Number(charges.outsideDhakaCharge),
        vatChargeBdt: Number(charges.vatChargeBdt),
        paymentGateways: charges.paymentGateways,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [subdomain]);
  const resolvedDeliveryCharge: Record<'DHAKA' | 'OUTSIDE_DHAKA', number> = vendorCharges
    ? { DHAKA: vendorCharges.insideDhakaCharge, OUTSIDE_DHAKA: vendorCharges.outsideDhakaCharge }
    : DELIVERY_CHARGE;
  const resolvedVatCharge = vendorCharges?.vatChargeBdt ?? FALLBACK_VAT_CHARGE;
  const paymentGateways = vendorCharges?.paymentGateways ?? FALLBACK_GATEWAYS;

  // "Payment Method" on checkout — the id of one of paymentGateways above
  // ("COD"/"ONLINE_PAYMENT" for the two built-ins, or a
  // VendorPaymentGateway id for a custom gateway like SSLCommerz).
  // Defaults to whichever row is COD, matching every theme's original
  // COD-only default. Medium/Minimal never render a payment-method
  // selector and so never call setPaymentMethod, which is what keeps
  // their checkout behavior byte-for-byte the same as before this was
  // added — handlePlaceOrder only takes the non-COD branch when a
  // theme's own UI explicitly switches to something else.
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const selectedGateway = paymentGateways.find((g) => g.id === paymentMethod) ?? paymentGateways.find((g) => g.type === 'COD');

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
  // VAT — a flat fee applied to every order regardless of payment method
  // (see Vendor.vatChargeBdt's own schema comment). Zero whenever the
  // cart is empty, same as deliveryCharge above.
  const vatAmount = lines.length > 0 ? resolvedVatCharge : 0;
  // Store > Payment Gateway's per-gateway Platform Charge — the
  // CURRENTLY SELECTED gateway's own configured surcharge, independent
  // of vatAmount above. Never shown until a gateway is actually
  // selected; useCheckout always has a selection (defaults to COD), so
  // in practice this just reflects whichever gateway platformChargeBdt
  // the shopper's current radio choice carries — 0 for COD/Online
  // Payment unless the vendor set one. This is the REAL amount — always
  // what OrdersService.create will actually charge, regardless of
  // feeHidden below (the server resolves this itself and never trusts
  // anything the client sends).
  const platformChargeAmount = lines.length > 0 ? Number(selectedGateway?.platformChargeBdt ?? 0) : 0;
  // Plan.codFeeHidden/onlinePaymentFeeHidden — display-only "fold this
  // fee silently into the total instead of breaking it out" switch (see
  // StorePaymentGateway.feeHidden's own comment). Only ever hides the
  // LINE ITEM and its contribution to the shown total; the shopper is
  // always actually charged platformChargeAmount above, both here (via
  // visibleGrandTotal, which still adds it in unseen) and by the order
  // the server creates.
  const visiblePlatformChargeAmount = selectedGateway?.feeHidden ? 0 : platformChargeAmount;
  // FREE_SHIPPING waives the delivery charge instead of discounting the
  // subtotal — same split OrdersService.create's own coupon handling
  // makes server-side, so the number shown here always matches what
  // Place Order will actually charge.
  const couponFreeShipping = appliedCoupon?.discountType === 'FREE_SHIPPING';
  const couponDiscount = couponFreeShipping ? 0 : (appliedCoupon?.discountAmount ?? 0);
  const effectiveDeliveryCharge = couponFreeShipping ? 0 : deliveryCharge;
  // The real total (includes a hidden fee) — never shown to the shopper
  // as a number, only used so Place Order and any "you'll be charged X"
  // confirmation stay correct even when a fee is hidden from the
  // itemized breakdown. What's actually rendered is visibleGrandTotal.
  const grandTotal = Math.max(0, subtotal + effectiveDeliveryCharge + vatAmount + platformChargeAmount - couponDiscount);
  // What checkout actually displays as "Total" — silently excludes a
  // hidden fee, per Plan.codFeeHidden/onlinePaymentFeeHidden's design:
  // the shopper never sees it broken out, but they ARE still charged it
  // (the order the server creates always uses the real amount above).
  const visibleGrandTotal = Math.max(
    0,
    subtotal + effectiveDeliveryCharge + vatAmount + visiblePlatformChargeAmount - couponDiscount,
  );

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

      // Any non-COD gateway: the order now exists (PAYMENT_INITIATED,
      // stock already decremented — see OrdersService.create), but it
      // isn't "placed" from the shopper's point of view until that
      // gateway confirms payment. Cart is cleared either way (the order
      // is real either way — re-adding the same items and checking out
      // again would double the stock decrement), but the redirect goes
      // to that gateway's hosted checkout instead of the thank-you/
      // orders page; that page is only reached once payment-callback
      // confirms success (see themes/storepal/views/PaymentCallbackView.tsx).
      clearStore(subdomain);
      sessionStorage.removeItem(`regantify-checkout-session:${subdomain}`);

      if (selectedGateway && selectedGateway.type !== 'COD') {
        const payment =
          selectedGateway.type === 'ONLINE_PAYMENT'
            ? await initiateOrderPayment(result.orderId)
            : await initiateGatewayOrderPayment(result.orderId);
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
    // Applies regardless of payment method now (see comment above) —
    // StorePal's CheckoutView/ThankYouView show this as "VAT";
    // Medium/Minimal don't render it as its own line (their JSX is
    // unchanged), it's only folded silently into grandTotal below, same
    // as it already was for MANUAL orders.
    vatAmount,
    // The currently-selected gateway's own Platform Charge — never shown
    // until a gateway is actually picked (StorePal's CheckoutView is
    // responsible for that "only render once selected" UI; this value
    // itself always reflects whatever paymentMethod currently is, which
    // defaults to COD). Medium/Minimal don't render this as its own line
    // either, same "folded silently into grandTotal" treatment as
    // vatAmount. This is the REAL amount (see its own comment above) —
    // StorePal's CheckoutView/ThankYouView use visiblePlatformChargeAmount
    // instead for what to actually render, so a Plan-hidden fee never
    // appears there even though it's still charged.
    platformChargeAmount,
    visiblePlatformChargeAmount,
    // grandTotal is the REAL total (what Place Order actually charges);
    // visibleGrandTotal is what StorePal's CheckoutView renders as
    // "Total" — identical unless the selected gateway's fee is
    // Plan-hidden, in which case visibleGrandTotal silently excludes it.
    // Medium/Minimal only ever render grandTotal (no hide-fee UI exists
    // there), which is correct: neither breaks out platformChargeAmount
    // as its own line regardless, so there's nothing to hide further.
    grandTotal,
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
    // Store > Payment Gateway's enabled gateway list for this vendor —
    // StorePal's CheckoutView renders one radio per entry; Medium/Minimal
    // ignore this entirely (unchanged JSX), same as paymentMethod/
    // setPaymentMethod below.
    paymentGateways,
    paymentMethod,
    setPaymentMethod,
  };
}
