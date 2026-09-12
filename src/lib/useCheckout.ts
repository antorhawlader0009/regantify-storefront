'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useShallow } from 'zustand/react/shallow';
import { useCartStore, useCartHydrated } from '@/providers/cart-store-provider';
import { useCustomerAuthStore, useCustomerAuthHydrated } from '@/providers/customer-auth-store-provider';
import { placeOrder, syncIncompleteOrder, validateCoupon, type ValidatedCoupon } from '@/lib/checkoutApi';

export const DELIVERY_CHARGE: Record<'DHAKA' | 'OUTSIDE_DHAKA', number> = {
  DHAKA: 70,
  OUTSIDE_DHAKA: 130,
};

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
 */
export function useCheckout(subdomain: string) {
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
  const deliveryCharge = lines.length > 0 ? DELIVERY_CHARGE[form.zone] : 0;
  // FREE_SHIPPING waives the delivery charge instead of discounting the
  // subtotal — same split OrdersService.create's own coupon handling
  // makes server-side, so the number shown here always matches what
  // Place Order will actually charge.
  const couponFreeShipping = appliedCoupon?.discountType === 'FREE_SHIPPING';
  const couponDiscount = couponFreeShipping ? 0 : (appliedCoupon?.discountAmount ?? 0);
  const effectiveDeliveryCharge = couponFreeShipping ? 0 : deliveryCharge;
  const grandTotal = Math.max(0, subtotal + effectiveDeliveryCharge - couponDiscount);

  const updateField = (field: keyof CheckoutFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
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
      clearStore(subdomain);
      sessionStorage.removeItem(`regantify-checkout-session:${subdomain}`);
      sessionStorage.setItem(
        HANDOFF_KEY,
        JSON.stringify({ subdomain, invoiceNumber: result.invoiceNumber, phone: form.phone.trim() }),
      );
      router.push(`/store/${subdomain}/orders`);
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
  };
}
