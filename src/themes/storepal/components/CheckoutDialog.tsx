'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Minus, Plus, X, Tag, ShieldCheck, Truck, Gift } from 'lucide-react';
import { formatExpectedDate } from '@/lib/expectedDate';
import { formatReturnDay } from '@/lib/storeAway';
import { suggestZone } from '@/lib/deliveryZone';
import { formatPrice } from '../lib/formatPrice';
import { useCheckout } from '@/lib/useCheckout';
import { useCustomerAuthHydrated, useCustomerAuthStore } from '@/providers/customer-auth-store-provider';
import { takePendingCoupon } from '../lib/pendingCoupon';
import { loadSavedCheckoutForm, saveCheckoutForm } from '../lib/checkoutFormStorage';
import { useCheckoutDialog } from '../lib/checkoutDialog';
import { trackMetaInitiateCheckout } from '@/lib/metaPixelEvents';
import { trackBeginCheckout } from '@/lib/ecommerceEvents';
import { sendStoreEvent } from '@/lib/storeEvents';

// Fallback label for a gateway row with no vendor-set displayLabel — see
// StorePaymentGateway.displayLabel's own comment. Only COD/ONLINE_PAYMENT
// need one here; a custom gateway (SSLCommerz etc) always carries its own
// displayLabel (set at connect time — see PaymentGatewaysService.
// connectSslcommerz), so those two are the only types this ever resolves.
const DEFAULT_GATEWAY_LABELS: Record<string, string> = {
  COD: 'Cash on Delivery',
  ONLINE_PAYMENT: 'Online Payment',
  SSLCOMMERZ: 'SSLCommerz',
  BKASH_MERCHANT: 'bKash Merchant',
  VENDOR_PAYSTATION: 'PayStation',
};

type Lang = 'bn' | 'en';

const EN = {
  placeOrder: 'Place Order',
  close: 'Close',
  name: 'Name',
  phone: 'Phone',
  address: 'Address',
  addressPlaceholder: 'Your full address including upazila',
  thana: 'Thana / Upazila',
  district: 'District',
  districtPlaceholder: 'Please select district',
  shipping: 'Shipping Option',
  insideDhaka: 'Inside Dhaka',
  outsideDhaka: 'Outside Dhaka',
  note: 'Note',
  paymentMethod: 'Payment Method',
  gatewayLabels: { COD: 'Cash on Delivery', ONLINE_PAYMENT: 'Online Payment' } as Record<string, string>,
  onlineHint: '(bKash, Nagad, cards & more via PayStation)',
  verifyTitle: 'Verify your phone number',
  verifyBody: (phone: string) => `We sent a 6-digit code to ${phone}. Enter it to place your order.`,
  enterCode: 'Enter code',
  codeAria: 'Verification code',
  resend: 'Resend code',
  sending: 'Sending…',
  sendingCode: 'Sending verification code…',
  redirecting: 'Redirecting to payment…',
  placing: 'Placing order…',
  verifySubmit: 'Verify & Submit Order',
  submit: 'Submit Order',
  advanceTitle: 'Pay the delivery charge now',
  advanceBody: (advance: string, rest: string) =>
    `Pay ${advance} online (bKash, Nagad, cards) to confirm your order. You pay the remaining ${rest} in cash when it arrives.`,
  advanceNow: 'Pay now (delivery charge)',
  advanceRest: 'Pay on delivery',
  advanceTitlePre: 'Pay an advance for your pre-order',
  advanceBodyPre: (advance: string, rest: string, percent: number | null) =>
    `Pay ${advance}${percent ? ` (${percent}% of your pre-order items)` : ''} online (bKash, Nagad, cards) to confirm your pre-order. You pay the remaining ${rest} in cash when it arrives.`,
  advanceNowPre: 'Pay now (pre-order advance)',
  aroundDhaka: 'Around Dhaka',
  submitAdvance: (advance: string) => `Pay ${advance} & Place Order`,
  awayTitle: 'The store is away',
  awayOpen: (day: string | null) =>
    day ? `You can still order. Delivery starts from ${day}.` : 'You can still order. Delivery starts when the store is back.',
  awayClosed: (day: string | null) => (day ? `Orders are paused until ${day}.` : 'Orders are paused for now. Please check back soon.'),
  codBadge: 'Cash On Delivery All Over Bangladesh',
  genuineBadge: '100% genuine products',
  yourCart: 'Your cart',
  remove: 'Remove',
  cartTotal: 'Cart Total',
  delivery: 'Delivery Charge',
  expectedBy: 'Expected by',
  vat: 'VAT',
  platformCharge: 'Platform Charge',
  coupon: (code: string) => `Coupon ${code}`,
  freeShipping: 'Free shipping',
  giftCard: (code: string) => `Gift card ${code}`,
  total: 'Total',
  haveCoupon: 'Coupon code',
  haveGift: 'Gift card',
  applied: 'applied',
  couponPlaceholder: 'Enter coupon code',
  giftPlaceholder: 'Enter gift card code',
  apply: 'Apply',
  checking: 'Checking…',
  balance: 'Balance',
  giftCovers: 'This card covers your whole order. Choose Cash on Delivery to use it, or add more items.',
  removeGiftAria: 'Remove gift card',
  emptyCart: 'Your cart is empty.',
  backToStore: 'Back to store',
  errors: {} as Record<string, string>,
};

type Copy = typeof EN;

const BN: Copy = {
  placeOrder: 'অর্ডার করুন',
  close: 'বন্ধ করুন',
  name: 'নাম',
  phone: 'ফোন নম্বর',
  address: 'ঠিকানা',
  addressPlaceholder: 'উপজেলাসহ আপনার সম্পূর্ণ ঠিকানা',
  thana: 'থানা / উপজেলা',
  district: 'জেলা',
  districtPlaceholder: 'জেলা নির্বাচন করুন',
  shipping: 'ডেলিভারি অপশন',
  insideDhaka: 'ঢাকার ভিতরে',
  outsideDhaka: 'ঢাকার বাইরে',
  note: 'নোট',
  paymentMethod: 'পেমেন্ট পদ্ধতি',
  gatewayLabels: { COD: 'ক্যাশ অন ডেলিভারি', ONLINE_PAYMENT: 'অনলাইন পেমেন্ট' },
  onlineHint: '(পে-স্টেশনের মাধ্যমে বিকাশ, নগদ, কার্ড ও আরও অনেক কিছু)',
  verifyTitle: 'আপনার ফোন নম্বর যাচাই করুন',
  verifyBody: (phone) => `${phone} নম্বরে একটি ৬ সংখ্যার কোড পাঠানো হয়েছে। অর্ডার করতে কোডটি দিন।`,
  enterCode: 'কোড দিন',
  codeAria: 'যাচাইকরণ কোড',
  resend: 'আবার কোড পাঠান',
  sending: 'পাঠানো হচ্ছে…',
  sendingCode: 'যাচাইকরণ কোড পাঠানো হচ্ছে…',
  redirecting: 'পেমেন্টে নেওয়া হচ্ছে…',
  placing: 'অর্ডার হচ্ছে…',
  verifySubmit: 'যাচাই করে অর্ডার করুন',
  submit: 'অর্ডার কনফার্ম করুন',
  advanceTitle: 'এখন ডেলিভারি চার্জ পরিশোধ করুন',
  advanceBody: (advance, rest) =>
    `অর্ডার নিশ্চিত করতে ${advance} অনলাইনে (বিকাশ, নগদ, কার্ড) দিন। বাকি ${rest} পণ্য হাতে পেয়ে ক্যাশে দেবেন।`,
  advanceNow: 'এখন পরিশোধ (ডেলিভারি চার্জ)',
  advanceRest: 'ডেলিভারির সময় পরিশোধ',
  advanceTitlePre: 'প্রি-অর্ডারের জন্য অগ্রিম দিন',
  advanceBodyPre: (advance, rest, percent) =>
    `প্রি-অর্ডার নিশ্চিত করতে ${advance}${percent ? ` (প্রি-অর্ডার পণ্যের ${percent}%)` : ''} অনলাইনে (বিকাশ, নগদ, কার্ড) দিন। বাকি ${rest} পণ্য হাতে পেয়ে ক্যাশে দেবেন।`,
  advanceNowPre: 'এখন পরিশোধ (প্রি-অর্ডার অগ্রিম)',
  aroundDhaka: 'ঢাকার আশেপাশে',
  submitAdvance: (advance) => `${advance} দিয়ে অর্ডার করুন`,
  awayTitle: 'দোকান এখন সাময়িক বন্ধ',
  awayOpen: (day) => (day ? `অর্ডার করতে পারবেন। ডেলিভারি শুরু হবে ${day} থেকে।` : 'অর্ডার করতে পারবেন। দোকান খুললে ডেলিভারি শুরু হবে।'),
  awayClosed: (day) => (day ? `${day} পর্যন্ত অর্ডার নেওয়া বন্ধ।` : 'এখন অর্ডার নেওয়া বন্ধ। কিছুদিন পর আবার দেখুন।'),
  codBadge: 'সারা বাংলাদেশে ক্যাশ অন ডেলিভারি',
  genuineBadge: '১০০% আসল পণ্য',
  yourCart: 'আপনার কার্ট',
  remove: 'সরিয়ে দিন',
  cartTotal: 'কার্ট মোট',
  delivery: 'ডেলিভারি চার্জ',
  expectedBy: 'প্রত্যাশিত ডেলিভারি',
  vat: 'ভ্যাট',
  platformCharge: 'প্ল্যাটফর্ম চার্জ',
  coupon: (code) => `কুপন ${code}`,
  freeShipping: 'ফ্রি ডেলিভারি',
  giftCard: (code) => `গিফট কার্ড ${code}`,
  total: 'সর্বমোট',
  haveCoupon: 'কুপন কোড',
  haveGift: 'গিফট কার্ড',
  applied: 'প্রয়োগ হয়েছে',
  couponPlaceholder: 'কুপন কোড দিন',
  giftPlaceholder: 'গিফট কার্ড কোড দিন',
  apply: 'প্রয়োগ করুন',
  checking: 'যাচাই হচ্ছে…',
  balance: 'ব্যালেন্স',
  giftCovers: 'এই কার্ডে আপনার পুরো অর্ডারের টাকা কভার হচ্ছে। এটি ব্যবহার করতে ক্যাশ অন ডেলিভারি বেছে নিন, অথবা আরও পণ্য যোগ করুন।',
  removeGiftAria: 'গিফট কার্ড সরান',
  emptyCart: 'আপনার কার্ট খালি।',
  backToStore: 'দোকানে ফিরে যান',
  // useCheckout's validation messages arrive in English; matched by exact text, anything else shows as sent.
  errors: {
    'Enter your full name.': 'আপনার পূর্ণ নাম দিন।',
    'Enter a valid 11-digit phone number.': 'সঠিক ১১ সংখ্যার ফোন নম্বর দিন।',
    'Enter your delivery address.': 'আপনার ডেলিভারি ঠিকানা দিন।',
  },
};

const COPY: Record<Lang, Copy> = { en: EN, bn: BN };

function CheckoutDialogBody({ subdomain, onClose, lang }: { subdomain: string; onClose: () => void; lang: Lang }) {
  const t = COPY[lang];
  const tr = (message: string) => t.errors[message] ?? message;
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
    deliveryChargeByZone,
    expectedDeliveryDate,
    vatAmount,
    visiblePlatformChargeAmount,
    visibleGrandTotal,
    updateField,
    handlePlaceOrder,
    couponCode,
    setCouponCode,
    appliedCoupon,
    automaticDiscount,
    automaticFreeShipping,
    couponChecking,
    couponError,
    applyCoupon,
    removeCoupon,
    giftCardCode,
    setGiftCardCode,
    appliedGiftCard,
    giftCardAmount,
    giftCardCoversOrder,
    giftCardChecking,
    giftCardError,
    applyGiftCard,
    removeGiftCard,
    paymentGateways,
    paymentMethod,
    setPaymentMethod,
    codAdvance,
    aroundDhaka,
    zone,
    storeAway,
    codOtpPhone,
    codOtpCode,
    setCodOtpCode,
    codOtpSending,
    codOtpError,
    resendCodOtp,
  } = useCheckout(subdomain, 'thank-you');
  // Store > Store Away: "browse only" stops the order here (the server refuses it too).
  const ordersPaused = storeAway?.mode === 'BROWSE_ONLY';
  const awayDay = storeAway?.returnDate ? formatReturnDay(storeAway.returnDate, lang) : null;
  // Around Dhaka: while the store offers it and the shopper has not picked a shipping option themselves, the zone
  // follows the district and thana they type (see lib/deliveryZone.ts). Stores without it behave as before.
  const zoneChosenByShopper = useRef(false);
  useEffect(() => {
    if (!aroundDhaka || zoneChosenByShopper.current) return;
    const suggested = suggestZone(form.district, form.city);
    if (suggested && suggested !== zone) updateField('zone', suggested);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aroundDhaka, form.district, form.city]);
  const isCodSelected = paymentGateways.find((g) => g.id === paymentMethod)?.type === 'COD';
  const showCodOtp = isCodSelected && codOtpPhone !== null;

  const selectedGateway = paymentGateways.find((g) => g.id === paymentMethod);
  // A COD order that must pay its delivery charge first also ends in PayStation's hosted page.
  const isRedirectGateway = (selectedGateway ? selectedGateway.type !== 'COD' : false) || codAdvance !== null;

  // Meta pixel InitiateCheckout / GA4 begin_checkout, once, as soon as the
  // saved cart has loaded and isn't empty.
  const checkoutTracked = useRef(false);
  useEffect(() => {
    if (!hydrated || checkoutTracked.current || lines.length === 0) return;
    checkoutTracked.current = true;
    trackMetaInitiateCheckout(lines);
    trackBeginCheckout(lines);
    sendStoreEvent(subdomain, 'BEGIN_CHECKOUT');
  }, [hydrated, lines]);

  // "Create custom link for this coupon" hand-off from HomeView (see
  // lib/pendingCoupon.ts) — a code stashed there pre-fills the coupon box
  // here, then auto-applies itself the moment a valid phone number is
  // on hand (validateCoupon requires one — see useCheckout.applyCoupon).
  // pendingRef both survives the one-time sessionStorage read (so a
  // re-render doesn't re-open a box the shopper already closed/edited)
  // and gates the auto-apply to fire exactly once.
  const pendingRef = useRef<string | null>(null);
  const [pendingConsumed, setPendingConsumed] = useState(false);
  useEffect(() => {
    const code = takePendingCoupon(subdomain);
    if (code) {
      pendingRef.current = code;
      setCouponCode(code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subdomain]);
  useEffect(() => {
    if (!pendingRef.current || pendingConsumed) return;
    if (couponCode !== pendingRef.current) return; // shopper edited it before it had a chance to fire
    if (!/^01[0-9]{9}$/.test(form.phone.trim())) return;
    setPendingConsumed(true);
    applyCoupon();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.phone, couponCode, pendingConsumed]);

  // Checkout form auto-save (see checkoutFormStorage.ts) — a returning
  // guest gets their name/phone/address/etc back without retyping.
  // Applied once, on mount only, and only into fields still at their
  // untouched default at that point — so it can never clobber a
  // logged-in Customer's own account prefill (useCheckout's own effect,
  // which runs with the same "only if still all blank" guard) or
  // anything the shopper already typed in the brief window before this
  // effect runs. zone needs its own check since its default ('DHAKA')
  // is non-empty, unlike every other field's default ('').
  // Guests only: a logged-in shopper gets their own account's details (useCheckout), and their form is
  // never saved here, so the next person on this browser can't inherit it. Waits for the login check
  // to finish first, since the store reads as logged out until then.
  const authHydrated = useCustomerAuthHydrated();
  const loggedIn = useCustomerAuthStore((s) => s.customer !== null);
  const formRestoredRef = useRef(false);
  useEffect(() => {
    if (formRestoredRef.current || !authHydrated) return;
    formRestoredRef.current = true;
    if (loggedIn) return;
    const saved = loadSavedCheckoutForm(subdomain);
    if (!saved) return;
    (Object.keys(saved) as (keyof typeof saved)[]).forEach((field) => {
      const value = saved[field];
      if (!value) return;
      const untouched = field === 'zone' ? form.zone === 'DHAKA' : !form[field];
      if (untouched) updateField(field, value);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subdomain, authHydrated]);
  useEffect(() => {
    // Not before the restore above has run, or the blank form would overwrite what was saved.
    if (!authHydrated || loggedIn || !formRestoredRef.current) return;
    saveCheckoutForm(subdomain, form);
  }, [subdomain, form, authHydrated, loggedIn]);

  if (!hydrated) return null;

  // `placing` guards this: handlePlaceOrder clears the cart as soon as
  // the order is created (see useCheckout's own comment on clearStore),
  // but for a redirect gateway (ONLINE_PAYMENT / a custom gateway) that
  // happens BEFORE the async initiateOrderPayment/initiateGatewayOrderPayment
  // call resolves and window.location.href actually navigates away — so
  // without this guard, this component re-renders with an already-empty
  // cart and flashes "Your cart is empty" for that gap instead of staying
  // on the (correct) "Redirecting to payment…" button state until the
  // browser leaves the page.
  if (lines.length === 0 && !placing) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 py-10">
        <p className="text-muted text-[13.5px]">{t.emptyCart}</p>
        <button type="button" onClick={onClose} className="text-accent text-[13.5px] font-medium">
          {t.backToStore}
        </button>
      </div>
    );
  }

  const couponDiscountAmount = appliedCoupon && appliedCoupon.discountType !== 'FREE_SHIPPING' ? appliedCoupon.discountAmount : 0;

  return (
    <div className="text-ink">
      <div>
        <div className="grid gap-6 items-start lg:[grid-template-columns:1.2fr_1fr]">
          {/* Place Order form */}
          <div>
            <div className="space-y-4">
              <div>
                <label className="block text-[13.5px] font-medium text-ink mb-1.5">{t.name}</label>
                <input
                  value={form.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  maxLength={100}
                  className={`w-full px-3.5 py-2.5 rounded-md text-[13.5px] bg-surface border outline-none transition-colors ${
                    errors.fullName ? 'border-accent' : 'border-line-strong focus:border-ink'
                  }`}
                />
                {errors.fullName && <p className="mt-1.5 text-[12px] text-accent">{tr(errors.fullName)}</p>}
              </div>

              <div>
                <label className="block text-[13.5px] font-medium text-ink mb-1.5">{t.phone}</label>
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
                {errors.phone && <p className="mt-1.5 text-[12px] text-accent">{tr(errors.phone)}</p>}
              </div>

              <div>
                <label className="block text-[13.5px] font-medium text-ink mb-1.5">{t.address}</label>
                <textarea
                  value={form.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  placeholder={t.addressPlaceholder}
                  rows={3}
                  maxLength={300}
                  className={`w-full px-3.5 py-2.5 rounded-md text-[13.5px] bg-surface border outline-none resize-y font-[inherit] transition-colors ${
                    errors.address ? 'border-accent' : 'border-line-strong focus:border-ink'
                  }`}
                />
                {errors.address && <p className="mt-1.5 text-[12px] text-accent">{tr(errors.address)}</p>}
              </div>

              <div>
                <label className="block text-[13.5px] font-medium text-ink mb-1.5">{t.thana}</label>
                <input
                  value={form.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  maxLength={100}
                  className="w-full px-3.5 py-2.5 rounded-md text-[13.5px] bg-surface border border-line-strong outline-none focus:border-ink transition-colors"
                />
              </div>

              <div>
                <label className="block text-[13.5px] font-medium text-ink mb-1.5">{t.district}</label>
                <input
                  value={form.district}
                  onChange={(e) => updateField('district', e.target.value)}
                  placeholder={t.districtPlaceholder}
                  maxLength={100}
                  className="w-full px-3.5 py-2.5 rounded-md text-[13.5px] bg-surface border border-line-strong outline-none focus:border-ink transition-colors"
                />
              </div>

              <div>
                <label className="block text-[13.5px] font-medium text-ink mb-1.5">{t.shipping}</label>
                <select
                  value={zone}
                  onChange={(e) => {
                    zoneChosenByShopper.current = true;
                    updateField('zone', e.target.value);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-md text-[13.5px] bg-surface border border-line-strong outline-none focus:border-ink transition-colors"
                >
                  <option value="DHAKA">{t.insideDhaka} — {formatPrice(deliveryChargeByZone.DHAKA)}</option>
                  {aroundDhaka && <option value="AROUND_DHAKA">{t.aroundDhaka} — {formatPrice(deliveryChargeByZone.AROUND_DHAKA)}</option>}
                  <option value="OUTSIDE_DHAKA">{t.outsideDhaka} — {formatPrice(deliveryChargeByZone.OUTSIDE_DHAKA)}</option>
                </select>
              </div>

              <div>
                <label className="block text-[13.5px] font-medium text-ink mb-1.5">{t.note}</label>
                <textarea
                  value={form.note}
                  onChange={(e) => updateField('note', e.target.value)}
                  rows={3}
                  maxLength={500}
                  className="w-full px-3.5 py-2.5 rounded-md text-[13.5px] bg-surface border border-line-strong outline-none resize-y font-[inherit] focus:border-ink transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Right column: cart summary, then payment and Submit under it */}
          <div>
          {/* Your cart summary */}
          <div className="bg-surface border border-line rounded-lg p-4 sm:p-5 ">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-line">
              <p className="text-[16px] font-semibold text-muted">{t.yourCart}</p>
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
                        {t.remove}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-line pt-3 space-y-2 text-[13.5px]">
              <div className="flex justify-between">
                <span className="text-ink">{t.cartTotal}</span>
                <span className="font-semibold text-accent">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink">{t.delivery}</span>
                <span className="font-semibold text-accent">{formatPrice(deliveryCharge)}</span>
              </div>
              {expectedDeliveryDate && (
                <div className="flex justify-between">
                  <span className="text-ink">{t.expectedBy}</span>
                  <span className="font-semibold text-ink">{formatExpectedDate(expectedDeliveryDate, lang)}</span>
                </div>
              )}
              {vatAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-ink">{t.vat}</span>
                  <span className="font-semibold text-accent">{formatPrice(vatAmount)}</span>
                </div>
              )}
              {/* Store > Payment Gateway's Platform Charge — deliberately
                  only shown once a gateway with a nonzero, non-hidden
                  charge is the CURRENTLY SELECTED one (never advertised
                  on the payment method options themselves, see the radio
                  list above). Plan.codFeeHidden/onlinePaymentFeeHidden
                  suppresses this line entirely — visiblePlatformChargeAmount
                  is already 0 in that case, same as visibleGrandTotal
                  below already excludes it; the shopper is still
                  actually charged it (see useCheckout's own comment).
                  ONLINE_PAYMENT's fee (Payment Gateway Fee) is always
                  hidden (useCheckout), so this line never shows for it.
                  Label is the flat "Platform Charge" for every gateway,
                  not the selected gateway's own name; the AMOUNT still
                  switches with the selected gateway. */}
              {visiblePlatformChargeAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-ink">{t.platformCharge}</span>
                  <span className="font-semibold text-accent">{formatPrice(visiblePlatformChargeAmount)}</span>
                </div>
              )}
              {appliedCoupon && (
                <div className="flex justify-between text-success">
                  <span className="flex items-center gap-1">
                    <Tag size={12} />
                    {appliedCoupon.discountType === 'FREE_SHIPPING' ? t.freeShipping : t.coupon(appliedCoupon.code)}
                  </span>
                  <span className="font-semibold">
                    {appliedCoupon.discountType === 'FREE_SHIPPING' ? '—' : `-${formatPrice(couponDiscountAmount)}`}
                  </span>
                </div>
              )}
              {/* Marketing > Discounts — applied automatically, no code. */}
              {automaticDiscount && (
                <div className="flex justify-between text-success">
                  <span className="flex items-center gap-1">
                    <Tag size={12} />
                    {automaticDiscount.name}
                  </span>
                  <span className="font-semibold">-{formatPrice(automaticDiscount.amount)}</span>
                </div>
              )}
              {automaticFreeShipping && (
                <div className="flex justify-between text-success">
                  <span className="flex items-center gap-1">
                    <Tag size={12} />
                    {automaticFreeShipping.name}
                  </span>
                  <span className="font-semibold">{t.freeShipping}</span>
                </div>
              )}
              {/* Marketing > Gift Cards — what the card pays of this order. */}
              {appliedGiftCard && giftCardAmount > 0 && (
                <div className="flex justify-between text-success">
                  <span className="flex items-center gap-1">
                    <Gift size={12} />
                    {t.giftCard(appliedGiftCard.code)}
                  </span>
                  <span className="font-semibold">-{formatPrice(giftCardAmount)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-line text-[15px] font-bold text-ink">
                <span>{t.total}</span>
                <span>{formatPrice(visibleGrandTotal)}</span>
              </div>
              {codAdvance && (
                <>
                  <div className="flex justify-between text-ink">
                    <span>{codAdvance.kind === 'PREORDER' ? t.advanceNowPre : t.advanceNow}</span>
                    <span className="font-semibold text-accent">{formatPrice(codAdvance.amount)}</span>
                  </div>
                  <div className="flex justify-between text-ink">
                    <span>{t.advanceRest}</span>
                    <span className="font-semibold text-accent">{formatPrice(codAdvance.restOnDelivery)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Coupon and gift card boxes are always open (no "Have Coupon?" toggle). */}
            <div className="mt-3 pt-3 border-t border-line">
                <p className="mb-1.5 text-[12.5px] font-medium text-ink">{t.haveCoupon}</p>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-success-bg text-success text-[12.5px] font-semibold px-3 py-2 rounded-md">
                    <span className="flex items-center gap-1.5">
                      <Tag size={13} />
                      {appliedCoupon.code} {t.applied}
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
                        placeholder={t.couponPlaceholder}
                        maxLength={50}
                        className="flex-1 px-3 py-2 rounded-md text-[13px] bg-canvas border border-line-strong outline-none focus:border-ink transition-colors uppercase"
                      />
                      <button
                        onClick={applyCoupon}
                        disabled={couponChecking || !couponCode.trim()}
                        className="px-4 py-2 rounded-md bg-ink hover:bg-ink/90 text-white text-[12.5px] font-bold disabled:opacity-60 transition-colors"
                      >
                        {couponChecking ? t.checking : t.apply}
                      </button>
                    </div>
                    {couponError && <p className="mt-1.5 text-[12px] text-accent">{couponError}</p>}
                  </div>
                )}
            </div>

            <div className="mt-3">
                <p className="mb-1.5 text-[12.5px] font-medium text-ink">{t.haveGift}</p>
                {appliedGiftCard ? (
                  <div>
                    <div className="flex items-center justify-between bg-success-bg text-success text-[12.5px] font-semibold px-3 py-2 rounded-md">
                      <span className="flex items-center gap-1.5">
                        <Gift size={13} />
                        {appliedGiftCard.code} {t.applied}
                      </span>
                      <button onClick={removeGiftCard} aria-label={t.removeGiftAria} className="text-success hover:opacity-70">
                        <X size={14} />
                      </button>
                    </div>
                    <p className="mt-1.5 text-[12px] text-muted">{t.balance}: {formatPrice(appliedGiftCard.balance)}</p>
                    {/* The server refuses this too; saying it here saves a failed Place Order. */}
                    {isRedirectGateway && giftCardCoversOrder && (
                      <p className="mt-1 text-[12px] text-accent">
                        {t.giftCovers}
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-2">
                      <input
                        value={giftCardCode}
                        onChange={(e) => setGiftCardCode(e.target.value.slice(0, 40))}
                        placeholder={t.giftPlaceholder}
                        maxLength={40}
                        className="flex-1 px-3 py-2 rounded-md text-[13px] bg-canvas border border-line-strong outline-none focus:border-ink transition-colors uppercase"
                      />
                      <button
                        onClick={applyGiftCard}
                        disabled={giftCardChecking || !giftCardCode.trim()}
                        className="px-4 py-2 rounded-md bg-ink hover:bg-ink/90 text-white text-[12.5px] font-bold disabled:opacity-60 transition-colors"
                      >
                        {giftCardChecking ? t.checking : t.apply}
                      </button>
                    </div>
                    {giftCardError && <p className="mt-1.5 text-[12px] text-accent">{giftCardError}</p>}
                  </div>
                )}
            </div>
          </div>

            <div className="mt-5 bg-surface border border-line rounded-lg p-4 sm:p-5">
              <p className="text-[15px] font-semibold text-ink mb-3">{t.paymentMethod}</p>
              <div className="space-y-2.5">
                {/* Store > Payment Gateway's enabled gateway list for this
                    vendor — COD/Online Payment plus any
                    connected custom gateway (e.g. SSLCommerz). Each
                    gateway's own Platform Charge is deliberately NOT shown
                    here — it only appears once selected, in the cart
                    summary below (see the Platform Charge line). */}
                {paymentGateways.map((gateway) => (
                  <label key={gateway.id} className="flex items-center gap-2.5 text-[13.5px] font-medium text-ink cursor-pointer">
                    <input
                      type="radio"
                      checked={paymentMethod === gateway.id}
                      onChange={() => setPaymentMethod(gateway.id)}
                      className="accent-accent w-4 h-4"
                    />
                    {gateway.displayLabel ?? t.gatewayLabels[gateway.type] ?? DEFAULT_GATEWAY_LABELS[gateway.type]}
                    {gateway.type === 'ONLINE_PAYMENT' && (
                      <span className="text-[11px] text-muted font-normal">{t.onlineHint}</span>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Store > COD Guard > "Delivery charge in advance" — see useCheckout's codAdvance. */}
            {codAdvance && (
              <div className="mt-5 rounded-md border border-accent/25 bg-accent-light p-4">
                <p className="m-0 text-[13px] font-semibold text-ink">
                  {codAdvance.kind === 'PREORDER' ? t.advanceTitlePre : t.advanceTitle}
                </p>
                <p className="m-0 mt-1 text-[12.5px] text-muted">
                  {codAdvance.kind === 'PREORDER'
                    ? t.advanceBodyPre(formatPrice(codAdvance.amount), formatPrice(codAdvance.restOnDelivery), codAdvance.preOrderPercent)
                    : t.advanceBody(formatPrice(codAdvance.amount), formatPrice(codAdvance.restOnDelivery))}
                </p>
              </div>
            )}

            {/* Store > COD Guard "Before Checkout" — see useCheckout's codOtp. */}
            {showCodOtp && (
              <div className="mt-5 rounded-md border border-accent/25 bg-accent-light p-4">
                <p className="m-0 text-[13px] font-semibold text-ink">{t.verifyTitle}</p>
                <p className="m-0 mt-1 text-[12.5px] text-muted">
                  {t.verifyBody(codOtpPhone ?? '')}
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={codOtpCode}
                  onChange={(e) => setCodOtpCode(e.target.value)}
                  placeholder={t.enterCode}
                  aria-label={t.codeAria}
                  className="mt-3 w-full sm:w-48 px-3 py-2.5 rounded-md border border-line bg-surface text-[15px] tracking-[0.3em] text-ink focus:outline-none focus:border-accent"
                />
                {codOtpError && <p className="m-0 mt-2 text-[12.5px] text-accent">{codOtpError}</p>}
                <button
                  type="button"
                  onClick={resendCodOtp}
                  disabled={codOtpSending}
                  className="mt-2 block text-[12.5px] font-semibold text-accent underline underline-offset-2 disabled:opacity-60"
                >
                  {codOtpSending ? t.sending : t.resend}
                </button>
              </div>
            )}

            {/* Store > Store Away — see useCheckout's storeAway. */}
            {storeAway && (
              <div className="mt-5 rounded-md border border-amber-300 bg-amber-50 p-4">
                <p className="m-0 text-[13px] font-semibold text-ink">{t.awayTitle}</p>
                {storeAway.message && <p className="m-0 mt-1 text-[12.5px] text-muted whitespace-pre-line">{storeAway.message}</p>}
                <p className="m-0 mt-1 text-[12.5px] font-medium text-ink">
                  {ordersPaused ? t.awayClosed(awayDay) : t.awayOpen(awayDay)}
                </p>
              </div>
            )}

            {placeError && <p className="mt-4 text-[13px] text-accent">{placeError}</p>}

            <button
              onClick={handlePlaceOrder}
              disabled={placing || codOtpSending || ordersPaused}
              className="w-full mt-6 py-3.5 rounded-md bg-accent hover:bg-accent-dark text-white text-[14px] font-bold disabled:opacity-60 transition-colors shadow-sm"
            >
              {codOtpSending && !showCodOtp
                ? t.sendingCode
                : placing
                  ? isRedirectGateway
                    ? t.redirecting
                    : t.placing
                  : showCodOtp
                    ? t.verifySubmit
                    : codAdvance
                      ? t.submitAdvance(formatPrice(codAdvance.amount))
                      : t.submit}
            </button>

            <div className="flex flex-wrap gap-2 mt-4">
              <div className="flex items-center gap-1.5 text-[11.5px] text-ink bg-canvas border border-line rounded-full px-2.5 py-1.5">
                <Truck size={13} className="text-accent shrink-0" />
                {t.codBadge}
              </div>
              <div className="flex items-center gap-1.5 text-[11.5px] text-ink bg-canvas border border-line rounded-full px-2.5 py-1.5">
                <ShieldCheck size={13} className="text-accent shrink-0" />
                {t.genuineBadge}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const FADE_MS = 200;

/**
 * StorePal's checkout: a centred dialog over whatever page the shopper is on
 * (cart drawer "Checkout", product "Buy Now"), instead of a page of its own.
 * Mounted once by StoreHeader like the cart drawer. The form only mounts while
 * it is open, so the cart / coupon / payment work starts when the shopper does.
 * Closes on Esc, a tap outside, the X, or any page change (placing the order
 * lands on the thank-you page). /checkout is just a fallback for saved links:
 * it opens this same dialog, and closing it there goes back to the store home.
 */
export function CheckoutDialog({ subdomain }: { subdomain: string }) {
  const open = useCheckoutDialog((s) => s.open);
  const closeDialog = useCheckoutDialog((s) => s.closeDialog);
  const pathname = usePathname();
  const router = useRouter();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [shown, setShown] = useState(false);
  // Bangla every time it opens; the shopper's switch only lasts until it closes.
  const [lang, setLang] = useState<Lang>('bn');
  const onCheckoutRoute = pathname?.endsWith('/checkout') ?? false;

  const close = useCallback(() => {
    closeDialog();
    if (onCheckoutRoute) router.push(`/store/${subdomain}`);
  }, [closeDialog, onCheckoutRoute, router, subdomain]);

  // A page change closes it (the store is global, so it would otherwise reopen
  // on the next page), and so does leaving the page this header lives on.
  const lastPathname = useRef(pathname);
  useEffect(() => {
    if (lastPathname.current === pathname) return;
    lastPathname.current = pathname;
    closeDialog();
  }, [pathname, closeDialog]);
  useEffect(() => closeDialog, [closeDialog]);

  useEffect(() => {
    if (!open) {
      setShown(false);
      setLang('bn');
      return;
    }
    const frame = requestAnimationFrame(() => setShown(true));
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKey);
      previouslyFocused?.focus?.();
    };
  }, [open, close]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6">
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity motion-reduce:transition-none ${shown ? 'opacity-100' : 'opacity-0'}`}
        style={{ transitionDuration: `${FADE_MS}ms` }}
        onClick={close}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={COPY[lang].placeOrder}
        lang={lang}
        className={`relative flex max-h-[calc(100vh-1.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-canvas shadow-2xl transition-all ease-out motion-reduce:transition-none sm:max-h-[calc(100vh-3rem)] ${shown ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-3 scale-95 opacity-0'}`}
        style={{ transitionDuration: `${FADE_MS}ms` }}
      >
        {/* Stays put while the form below scrolls. */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-6">
          <h1 className="text-[20px] font-bold text-ink sm:text-[24px]">{COPY[lang].placeOrder}</h1>
          <div className="flex items-center gap-2">
            <div role="group" aria-label="Language" className="flex overflow-hidden rounded-full border border-line-strong text-[12.5px] font-semibold">
              {(['en', 'bn'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  aria-pressed={lang === l}
                  className={`px-3 py-1.5 transition-colors ${lang === l ? 'bg-accent text-white' : 'text-muted hover:text-ink'}`}
                >
                  {l === 'en' ? 'English' : 'বাংলা'}
                </button>
              ))}
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={close}
              aria-label={COPY[lang].close}
              className="rounded-full p-2 text-muted transition-colors hover:bg-surface hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
          <CheckoutDialogBody subdomain={subdomain} onClose={close} lang={lang} />
        </div>
      </div>
    </div>
  );
}
