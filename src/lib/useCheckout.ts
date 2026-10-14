'use client';

import { useEffect, useRef, useState } from 'react';
import { deliveryAreaRefusal } from '@/lib/deliveryArea';
import { useRouter } from 'next/navigation';
import { useShallow } from 'zustand/react/shallow';
import { useCartStore, useCartHydrated } from '@/providers/cart-store-provider';
import type { CartLine } from '@/stores/cart-store';
import { useCustomerAuthStore, useCustomerAuthHydrated } from '@/providers/customer-auth-store-provider';
import {
  refreshCustomerSession,
  fetchCustomerRewards,
  listMyAddresses,
  createMyAddress,
  type CustomerRewards,
  type SavedAddress,
} from '@/lib/customerAuthApi';
import { trackMetaAddPaymentInfo } from '@/lib/metaPixelEvents';
import { metaAdContext } from '@/lib/metaPixel';
import { trackAddPaymentInfo } from '@/lib/ecommerceEvents';
import { gaAdContext } from '@/lib/googleAnalytics';
import { tiktokAdContext } from '@/lib/tiktokPixel';
import { captureTrafficSource } from '@/lib/trafficSource';
import { stillAway, type StorefrontStoreAway } from '@/lib/storeAway';
import {
  placeOrder,
  syncIncompleteOrder,
  validateCoupon,
  validateGiftCard,
  previewDiscounts,
  initiateOrderPayment,
  initiateGatewayOrderPayment,
  getStoreDeliveryCharges,
  fetchDeliverySlots,
  sendCodVerificationOtp,
  CheckoutApiError,
  type ValidatedCoupon,
  type ValidatedGiftCard,
  type AutomaticDiscounts,
  type StorePaymentGateway,
  type StoreDeliveryCharges,
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
  { id: 'COD', type: 'COD', displayLabel: 'Cash On Delivery', platformChargeBdt: '0', platformChargePercent: '0', feeHidden: false },
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
  zone: 'DHAKA' | 'OUTSIDE_DHAKA' | 'AROUND_DHAKA' | 'PICKUP';
  note: string;
  // Optional boxes the store can switch on (TellMe idea 128): a second phone and an email.
  altPhone: string;
  email: string;
}

/** Which optional checkout boxes the store asks and how strictly (TellMe idea 128, StorePal's form). Missing = today's form. */
export interface CheckoutFormRules {
  altPhone?: 'HIDDEN' | 'OPTIONAL' | 'REQUIRED';
  email?: 'HIDDEN' | 'OPTIONAL' | 'REQUIRED';
  thana?: 'OPTIONAL' | 'REQUIRED';
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
 *
 * `options.lines` replaces the shopper's cart with a caller-owned line
 * list (a landing page's Checkout Form section, whose products are fixed
 * by the vendor) — same pricing/coupon/payment/COD Guard flow, but the
 * cart store is never read or cleared, and the Incomplete Orders session
 * key is kept separate from the cart checkout's. The caller must memoize
 * the array (it drives the debounced incomplete-order sync).
 */
export function useCheckout(
  subdomain: string,
  redirectTo: 'orders' | 'thank-you' = 'orders',
  options?: { lines?: CartLine[]; formRules?: CheckoutFormRules },
) {
  const formRules = options?.formRules;
  const router = useRouter();
  // Checkout bot guard (TellMe idea 152): when the checkout opened (so the server can tell a person from a script), and a hidden box
  // that people never see. Only StorePal's checkout (the one with `formRules`) sends the time.
  const openedAt = useRef(Date.now());
  const [botTrap, setBotTrap] = useState('');

  const externalLines = options?.lines;
  const cartLines = useCartStore(useShallow((s) => s.lines.filter((l) => l.subdomain === subdomain)));
  const lines = externalLines ?? cartLines;
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeLine = useCartStore((s) => s.removeLine);
  const clearStore = useCartStore((s) => s.clearStore);
  const cartHydrated = useCartHydrated();
  const hydrated = externalLines ? true : cartHydrated;
  const sessionStorageKey = `regantify-checkout-session:${subdomain}${externalLines ? ':landing' : ''}`;

  const [form, setForm] = useState<CheckoutFormState>({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    zone: 'DHAKA',
    note: '',
    altPhone: '',
    email: '',
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
    codSmsVerification: 'BEFORE_CHECKOUT' | 'AFTER_CHECKOUT' | null;
    codAdvance: { minOrder: number | null; delivery?: boolean; preOrderPercent?: number | null } | null;
    deliveryEstimate: { DHAKA: string | null; OUTSIDE_DHAKA: string | null; AROUND_DHAKA?: string | null; PICKUP?: string | null } | null;
    aroundDhaka: { charge: number } | null;
    express: StoreDeliveryCharges['express'] | null;
    pickup: { address: string | null; hours: string | null } | null;
    preferredDays: string[] | null;
    hasSlots: boolean;
    minOrderAmount: number | null;
    giftOption: { charge: number } | null;
    deliveryArea: { mode: 'ONLY' | 'EXCEPT'; districts: string[]; message: string | null } | null;
    dailyLimit: { limit: number; remaining: number } | null;
    orderCutoff: { time: string; passed: boolean } | null;
    storeAway: StorefrontStoreAway | null;
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
        codSmsVerification: charges.codSmsVerification ?? null,
        codAdvance: charges.codAdvance ?? null,
        deliveryEstimate: charges.deliveryEstimate ?? null,
        aroundDhaka: charges.aroundDhaka ?? null,
        express: charges.express ?? null,
        pickup: charges.pickup ?? null,
        preferredDays: charges.preferredDelivery?.days ?? null,
        hasSlots: (charges.preferredDelivery?.slots?.length ?? 0) > 0,
        minOrderAmount: charges.minOrderAmount ?? null,
        giftOption: charges.giftOption ?? null,
        deliveryArea: charges.deliveryArea ?? null,
        dailyLimit: charges.dailyLimit ?? null,
        orderCutoff: charges.orderCutoff ?? null,
        storeAway: stillAway(charges.storeAway),
      });
    });
    return () => {
      cancelled = true;
    };
  }, [subdomain]);
  // Around Dhaka is offered only while the store has it on and is on StorePal (the server reports aroundDhaka
  // null otherwise); a zone the shopper can't be offered counts as Outside Dhaka, so a saved "around" choice
  // from another store's checkout never prices or sends a zone this checkout doesn't show.
  const aroundDhaka = vendorCharges?.aroundDhaka ?? null;
  // Store pickup (TellMe idea 46) follows the same rule: offered only while on, else it counts as Outside Dhaka.
  const pickup = vendorCharges?.pickup ?? null;
  // Preferred delivery day (TellMe idea 50): optional, kept apart from the saved form so an old pick never lingers; a day
  // the store no longer offers counts as none.
  const preferredDays = vendorCharges?.preferredDays ?? null;
  const [preferredPick, setPreferredPick] = useState('');
  const preferredDate = preferredDays && preferredDays.includes(preferredPick) ? preferredPick : '';
  // Delivery time slot (TellMe idea 90): only after a day is picked; which are full on that day is read fresh.
  const [slotPick, setSlotPick] = useState('');
  const [slotOptions, setSlotOptions] = useState<Array<{ id: string; label: string; full: boolean }>>([]);
  const hasSlots = vendorCharges?.hasSlots ?? false;
  useEffect(() => {
    setSlotPick('');
    if (!hasSlots || !preferredDate) {
      setSlotOptions([]);
      return;
    }
    let cancelled = false;
    fetchDeliverySlots(subdomain, preferredDate).then((s) => !cancelled && setSlotOptions(s));
    return () => {
      cancelled = true;
    };
  }, [hasSlots, preferredDate, subdomain]);
  const preferredSlotId = preferredDate && slotOptions.some((s) => s.id === slotPick && !s.full) ? slotPick : '';
  const zone: CheckoutFormState['zone'] =
    (form.zone === 'AROUND_DHAKA' && !aroundDhaka) || (form.zone === 'PICKUP' && !pickup) ? 'OUTSIDE_DHAKA' : form.zone;
  const resolvedDeliveryCharge: Record<'DHAKA' | 'OUTSIDE_DHAKA' | 'AROUND_DHAKA' | 'PICKUP', number> = vendorCharges
    ? {
        PICKUP: 0,
        DHAKA: vendorCharges.insideDhakaCharge,
        OUTSIDE_DHAKA: vendorCharges.outsideDhakaCharge,
        AROUND_DHAKA: vendorCharges.aroundDhaka?.charge ?? vendorCharges.outsideDhakaCharge,
      }
    : { ...DELIVERY_CHARGE, AROUND_DHAKA: DELIVERY_CHARGE.OUTSIDE_DHAKA, PICKUP: 0 };
  const resolvedVatCharge = vendorCharges?.vatChargeBdt ?? FALLBACK_VAT_CHARGE;
  // Manual Mobile Payment needs the TrxID form, which only StorePal's checkout (the one with formRules) has: the
  // landing-page checkout never offers it.
  const paymentGateways = (vendorCharges?.paymentGateways ?? FALLBACK_GATEWAYS).filter((g) => g.type !== 'MANUAL_MOBILE' || !!formRules);

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

  // Manual Mobile Payment (Add-ons): which of the store's wallets the shopper paid with, from which number, and the
  // TrxID. The server checks them again (payment-gateways/manual-mobile.ts) and refuses a TrxID used before.
  const [manualWallet, setManualWallet] = useState('');
  const [manualSender, setManualSender] = useState('');
  const [manualTrxId, setManualTrxId] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);
  const manualMobile = selectedGateway?.type === 'MANUAL_MOBILE' ? (selectedGateway.manualMobile ?? null) : null;
  const manualWalletInUse = manualMobile ? (manualMobile.accounts.some((a) => a.wallet === manualWallet) ? manualWallet : (manualMobile.accounts[0]?.wallet ?? '')) : '';

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

  // Marketing > Gift Cards — checked here only to show its balance, then
  // redeemed server-side by placeOrder (which works out how much of the total
  // it pays). Unlike a coupon it doesn't depend on the cart or phone, so
  // changing those doesn't clear it.
  const [giftCardCode, setGiftCardCode] = useState('');
  const [appliedGiftCard, setAppliedGiftCard] = useState<ValidatedGiftCard | null>(null);
  const [giftCardChecking, setGiftCardChecking] = useState(false);
  const [giftCardError, setGiftCardError] = useState<string | null>(null);

  const authHydrated = useCustomerAuthHydrated();
  const customer = useCustomerAuthStore((s) => s.customer);
  const setSession = useCustomerAuthStore((s) => s.setSession);
  const accessToken = useCustomerAuthStore((s) => s.accessToken);

  // Reward points (TellMe idea 41): a logged-in shopper of a store that turned them on can pay part of the order with
  // their points. The server caps the amount again at Place Order; this only previews it.
  const [rewards, setRewards] = useState<CustomerRewards | null>(null);
  const [usePoints, setUsePoints] = useState(false);
  useEffect(() => {
    if (!authHydrated || !customer || !accessToken) {
      setRewards(null);
      return;
    }
    let cancelled = false;
    fetchCustomerRewards(subdomain, accessToken)
      .then((r) => !cancelled && setRewards(r.enabled && r.balance > 0 ? r : null))
      .catch(() => !cancelled && setRewards(null));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authHydrated, customer?.id, accessToken === null, subdomain]);

  // Saved addresses (TellMe idea 53): a logged-in shopper picks one to fill the form, or ticks "save this address"
  // when typing a new one. Only StorePal's checkout renders it; the other themes ignore the extra fields.
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [maxAddresses, setMaxAddresses] = useState(5);
  const [pickedAddressId, setPickedAddressId] = useState<string | null>(null);
  const [saveNewAddress, setSaveNewAddress] = useState(false);
  const [newAddressLabel, setNewAddressLabel] = useState('');
  useEffect(() => {
    if (!authHydrated || !customer || !accessToken) {
      setSavedAddresses([]);
      return;
    }
    let cancelled = false;
    listMyAddresses(accessToken)
      .then((r) => {
        if (cancelled) return;
        setSavedAddresses(r.addresses);
        setMaxAddresses(r.max);
      })
      .catch(() => !cancelled && setSavedAddresses([]));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authHydrated, customer?.id, accessToken === null]);

  /** Fills receiver, phone, address, thana, district and delivery zone from a saved address. */
  const applyAddress = (a: SavedAddress) => {
    setForm((prev) => ({
      ...prev,
      fullName: a.recipientName,
      phone: a.phone,
      address: a.address,
      city: a.city ?? '',
      district: a.district ?? '',
      // A store without the Around Dhaka option prices that address as Outside Dhaka (see `zone` below).
      zone: a.deliveryZone,
    }));
    setErrors({});
    setPickedAddressId(a.id);
    setSaveNewAddress(false);
  };

  // "Save this address" is offered for an address that is not already saved, while there is room for one more.
  const canSaveAddress =
    !!customer &&
    !!accessToken &&
    savedAddresses.length < maxAddresses &&
    form.address.trim().length >= 3 &&
    !savedAddresses.some((a) => a.address === form.address.trim() && a.phone === form.phone.trim());

  // The district picked in the product page's delivery check (TellMe idea 68) starts the checkout, when nothing else has filled it.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`storepal-delivery-district:${subdomain}`);
      if (saved) setForm((prev) => (prev.district === '' ? { ...prev, district: saved } : prev));
    } catch {
      // Storage blocked: nothing to prefill.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subdomain]);

  // A logged-in shopper's order must be saved to their account, which the server only does for a valid
  // token. The 15-minute access token may have run out by the time they press Place Order, so take a
  // fresh one first. If that fails the order goes through as a guest order.
  const freshAccessToken = async (): Promise<string | undefined> => {
    if (!customer) return undefined;
    try {
      const session = await refreshCustomerSession();
      setSession(session.customer, session.accessToken);
      return session.accessToken;
    } catch {
      return undefined;
    }
  };
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
    const existing = sessionStorage.getItem(sessionStorageKey);
    if (existing) return existing;
    const generated = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(sessionStorageKey, generated);
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

  // Marketing > Discounts — the automatic discount this cart qualifies
  // for, re-previewed whenever the cart changes (short debounce so a
  // quantity stepper doesn't fire one request per click).
  const [automaticDiscounts, setAutomaticDiscounts] = useState<AutomaticDiscounts | null>(null);
  const discountCartKey = lines.map((l) => `${l.productSlug}:${l.quantity}`).join(',');
  useEffect(() => {
    if (!hydrated || lines.length === 0) {
      setAutomaticDiscounts(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      previewDiscounts(
        subdomain,
        lines.map((l) => ({ productSlug: l.productSlug, quantity: l.quantity })),
      ).then((result) => {
        if (!cancelled) setAutomaticDiscounts(result);
      });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, subdomain, discountCartKey]);

  const storeName = lines[0]?.storeName ?? '';
  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  // Heavy cart (TellMe idea 58): the server's own number per zone, added to the zone's charge. A free-shipping coupon or
  // discount waives both (effectiveDeliveryCharge below).
  const weightExtra = lines.length > 0 && zone !== 'PICKUP' ? (automaticDiscounts?.weightExtra?.[zone] ?? 0) : 0;
  const deliveryCharge = lines.length > 0 ? resolvedDeliveryCharge[zone] + weightExtra : 0;
  // Express delivery (TellMe idea 132): a second choice for the zones the store runs it in, until its cut-off (Dhaka time). The shopper's
  // pick only counts while it is offered, so a zone change or the cut-off passing quietly puts it back to standard. The server judges it again.
  const [speedPick, setSpeedPick] = useState<'STANDARD' | 'EXPRESS'>('STANDARD');
  const expressInfo = vendorCharges?.express ?? null;
  const dhakaMinutesNow = (() => {
    const d = new Date(Date.now() + 6 * 3_600_000);
    return d.getUTCHours() * 60 + d.getUTCMinutes();
  })();
  const expressOffered =
    !!expressInfo && lines.length > 0 && zone !== 'PICKUP' && expressInfo.zones.includes(zone) && (expressInfo.cutoffMinutes === null || dhakaMinutesNow < expressInfo.cutoffMinutes);
  const expressSelected = expressOffered && speedPick === 'EXPRESS';
  const expressCharge = expressSelected && expressInfo ? expressInfo.charge : 0;
  // Gift option (TellMe idea 57): the shopper's tick, message and "hide prices"; the wrap charge is the store's.
  const [isGift, setIsGift] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');
  const [hidePrices, setHidePrices] = useState(false);
  const giftOption = vendorCharges?.giftOption ?? null;
  const giftWrapCharge = isGift && giftOption && lines.length > 0 ? giftOption.charge : 0;
  // Minimum order (TellMe idea 56): the goods total before discounts; the button waits until it is reached.
  const minOrderAmount = vendorCharges?.minOrderAmount ?? null;
  // Delivery area control (TellMe idea 65): the shopper's district against the store's list, so the shopper hears it at once.
  const deliveryArea = vendorCharges?.deliveryArea ?? null;
  const areaRefusal =
    deliveryArea && zone !== 'PICKUP' && lines.length > 0
      ? deliveryAreaRefusal(deliveryArea.mode, deliveryArea.districts, form.district, deliveryArea.message)
      : null;
  // Daily order limit and cut-off (TellMe idea 69): full today means no order; after the cut-off the shopper is told it counts as tomorrow's.
  const dailyLimit = vendorCharges?.dailyLimit ?? null;
  const ordersFullToday = !!dailyLimit && dailyLimit.remaining <= 0;
  const orderCutoff = vendorCharges?.orderCutoff ?? null;
  const minOrderShortfall = minOrderAmount && lines.length > 0 && subtotal < minOrderAmount ? Math.ceil(minOrderAmount - subtotal) : 0;
  // VAT — a flat fee applied to every order regardless of payment method
  // (see Vendor.vatChargeBdt's own schema comment). Zero whenever the
  // cart is empty, same as deliveryCharge above.
  const vatAmount = lines.length > 0 ? resolvedVatCharge : 0;
  // FREE_SHIPPING waives the delivery charge instead of discounting the
  // subtotal — same split OrdersService.create's own coupon handling
  // makes server-side, so the number shown here always matches what
  // Place Order will actually charge.
  const couponFreeShipping = appliedCoupon?.discountType === 'FREE_SHIPPING';
  const couponDiscount = couponFreeShipping ? 0 : (appliedCoupon?.discountAmount ?? 0);
  // Marketing > Discounts — dropped while a coupon with "Reset other
  // conditional discounts" is applied, and capped so coupon + discount
  // never exceed the subtotal; same rules as OrdersService.create.
  const discountsReset = Boolean(appliedCoupon?.resetOtherDiscounts);
  // Products that must be paid online (TellMe idea 126): Cash on Delivery is off while the cart holds one.
  const onlineOnlyNames = automaticDiscounts?.onlineOnly ?? [];
  const codBlocked = onlineOnlyNames.length > 0;
  const onlineGateways = paymentGateways.filter((g) => g.type !== 'COD');
  useEffect(() => {
    if (!codBlocked || onlineGateways.length === 0) return;
    if (selectedGateway?.type === 'COD') setPaymentMethod((onlineGateways.find((g) => g.type === 'ONLINE_PAYMENT') ?? onlineGateways[0]).id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codBlocked, selectedGateway?.type, paymentGateways.length]);
  const autoDiscount = discountsReset ? null : (automaticDiscounts?.discount ?? null);
  const autoFreeShipping = discountsReset ? null : (automaticDiscounts?.freeShipping ?? null);
  const automaticDiscountAmount = Math.max(0, Math.min(autoDiscount?.discountAmount ?? 0, subtotal - couponDiscount));
  const totalDiscount = couponDiscount + automaticDiscountAmount;
  // A free-delivery coupon or discount waives the normal charge; the express extra stays unless the store waives it too.
  const freeDelivery = couponFreeShipping || !!autoFreeShipping;
  const effectiveDeliveryCharge = freeDelivery ? (expressSelected && expressInfo && !expressInfo.waivedByFree ? expressCharge : 0) : deliveryCharge + expressCharge;
  // Store > Payment Gateway's per-gateway Platform Charge — the
  // CURRENTLY SELECTED gateway's own configured surcharge, independent
  // of vatAmount above. Never shown until a gateway is actually
  // selected; useCheckout always has a selection (defaults to COD), so
  // in practice this just reflects whichever gateway platformChargeBdt
  // the shopper's current radio choice carries — 0 for COD/Online
  // Payment unless the vendor set one. This is the REAL amount shown
  // pre-payment — same resolution OrdersService.create does
  // server-side (which is what actually gets charged; this is only a
  // preview) — the flat part plus platformChargePercent % of the order's
  // full amount INCLUDING that flat part (subtotal + delivery + VAT -
  // coupon + flat; e.g. ৳100 + ৳50 + ৳10 flat = ৳160, 2% = ৳3.2, shopper
  // pays ৳163.2 — see VendorPaymentGateway.platformChargePercent's own
  // schema comment), rounded to paisa like the server. Independent of
  // feeHidden below (the server resolves/charges this itself regardless
  // of what the client sends).
  const platformChargeFlat = selectedGateway ? Number(selectedGateway.platformChargeBdt) : 0;
  const platformChargeBase =
    Math.max(0, subtotal + effectiveDeliveryCharge + vatAmount + giftWrapCharge - totalDiscount) + platformChargeFlat;
  const platformChargeAmount =
    lines.length > 0 && selectedGateway
      ? Math.round(
          (platformChargeFlat + (platformChargeBase * Number(selectedGateway.platformChargePercent)) / 100) * 100,
        ) / 100
      : 0;
  // Plan.codFeeHidden/onlinePaymentFeeHidden — display-only "fold this
  // fee silently into the total instead of breaking it out" switch (see
  // StorePaymentGateway.feeHidden's own comment). Only ever hides the
  // LINE ITEM and its contribution to the shown total; the shopper is
  // always actually charged platformChargeAmount above, both here (via
  // visibleGrandTotal, which still adds it in unseen) and by the order
  // the server creates.
  // ONLINE_PAYMENT's fee (Payment Gateway Fee) is always hidden from the
  // shopper. The server already reports it as feeHidden; checked here too
  // so a cached gateway list can't bring it back.
  const visiblePlatformChargeAmount =
    selectedGateway?.feeHidden || selectedGateway?.type === 'ONLINE_PAYMENT' ? 0 : platformChargeAmount;
  // The real total (includes a hidden fee) — never shown to the shopper
  // as a number, only used so Place Order and any "you'll be charged X"
  // confirmation stay correct even when a fee is hidden from the
  // itemized breakdown. What's actually rendered is visibleGrandTotal.
  const grandTotalBeforeGiftCard = Math.max(
    0,
    subtotal + effectiveDeliveryCharge + vatAmount + giftWrapCharge + platformChargeAmount - totalDiscount,
  );
  // Reward points first (same rule as OrdersService.create: within the balance and the store's % of the total).
  const rewardPointsAmount =
    usePoints && rewards
      ? Math.max(0, Math.min(rewards.balance, Math.floor((grandTotalBeforeGiftCard * rewards.maxRedeemPercent) / 100), Math.floor(grandTotalBeforeGiftCard)))
      : 0;
  const grandTotalAfterPoints = grandTotalBeforeGiftCard - rewardPointsAmount;
  // Marketing > Gift Cards — takes as much of what is left as the card
  // holds, same rule as OrdersService.create. Zero unless a card is applied,
  // so Medium/Minimal (which never show one) are unchanged.
  const giftCardAmount = appliedGiftCard
    ? Math.round(Math.max(0, Math.min(appliedGiftCard.balance, grandTotalAfterPoints)) * 100) / 100
    : 0;
  const grandTotal = grandTotalAfterPoints - giftCardAmount;
  // The server won't put a card that pays the whole order on an online gateway
  // (it can't take a payment of nothing), so checkout warns about it.
  const giftCardCoversOrder = (giftCardAmount > 0 || rewardPointsAmount > 0) && giftCardAmount + rewardPointsAmount >= grandTotalBeforeGiftCard;
  // What checkout actually displays as "Total" — silently excludes a
  // hidden fee, per Plan.codFeeHidden/onlinePaymentFeeHidden's design:
  // the shopper never sees it broken out, but they ARE still charged it
  // (the order the server creates always uses the real amount above).
  const visibleGrandTotal = Math.max(
    0,
    subtotal + effectiveDeliveryCharge + vatAmount + visiblePlatformChargeAmount - totalDiscount - rewardPointsAmount - giftCardAmount,
  );

  // Store > COD Guard > "Delivery charge in advance" — a preview of what OrdersService.resolveCodAdvance
  // will charge, so StorePal's checkout can say "pay ৳60 now, ৳X on delivery". The server decides: this
  // only mirrors it (COD selected, vendor minimum met, delivery charge above 0, never more than the total).
  // Null on every other payment method and on Medium/Minimal (the server never reports codAdvance there).
  // Two reasons to pay up front, sharing one payment: the delivery charge, and a share of the pre-order products.
  // The larger of the two is taken, never both (the server does the same).
  const codAdvanceRule = selectedGateway?.type === 'COD' ? (vendorCharges?.codAdvance ?? null) : null;
  const deliveryAdvanceAmount =
    codAdvanceRule && codAdvanceRule.delivery !== false && (codAdvanceRule.minOrder === null || subtotal >= codAdvanceRule.minOrder)
      ? Math.round(Math.min(effectiveDeliveryCharge, grandTotal) * 100) / 100
      : 0;
  const preOrderSubtotal = lines.reduce((sum, l) => (l.isPreOrder ? sum + l.unitPrice * l.quantity : sum), 0);
  const preOrderAdvanceAmount =
    codAdvanceRule?.preOrderPercent && preOrderSubtotal > 0
      ? Math.round(Math.min((preOrderSubtotal * Math.min(codAdvanceRule.preOrderPercent, 100)) / 100, grandTotal) * 100) / 100
      : 0;
  const codAdvanceAmount = Math.max(deliveryAdvanceAmount, preOrderAdvanceAmount);
  const codAdvance =
    codAdvanceAmount > 0
      ? {
          amount: codAdvanceAmount,
          restOnDelivery: Math.max(0, visibleGrandTotal - codAdvanceAmount),
          // What the advance is for, so the checkout can word it ("pay the delivery charge" / "pay 50% for your pre-order").
          kind: preOrderAdvanceAmount > deliveryAdvanceAmount ? ('PREORDER' as const) : ('DELIVERY' as const),
          preOrderPercent: preOrderAdvanceAmount > deliveryAdvanceAmount ? (codAdvanceRule?.preOrderPercent ?? null) : null,
        }
      : null;

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
    altPhone: 30,
    email: 150,
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

  const applyGiftCard = async () => {
    const code = giftCardCode.trim();
    if (!code) return;
    setGiftCardChecking(true);
    setGiftCardError(null);
    try {
      setAppliedGiftCard(await validateGiftCard(subdomain, code));
    } catch (err) {
      setAppliedGiftCard(null);
      setGiftCardError(err instanceof Error ? err.message : 'This gift card code is not valid.');
    } finally {
      setGiftCardChecking(false);
    }
  };

  const removeGiftCard = () => {
    setAppliedGiftCard(null);
    setGiftCardCode('');
    setGiftCardError(null);
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof CheckoutFormState, string>> = {};
    if (!form.fullName.trim()) next.fullName = 'Enter your full name.';
    if (!/^01[0-9]{9}$/.test(form.phone.trim())) next.phone = 'Enter a valid 11-digit phone number.';
    if (zone !== 'PICKUP' && !form.address.trim()) next.address = 'Enter your delivery address.';
    // The store's own checkout rules (TellMe idea 128).
    const alt = form.altPhone.trim();
    if (alt && !/^01[0-9]{9}$/.test(alt)) next.altPhone = 'Enter a valid 11-digit phone number, or leave it empty.';
    else if (formRules?.altPhone === 'REQUIRED' && !alt) next.altPhone = 'Enter a second phone number.';
    if (formRules?.email && formRules.email !== 'HIDDEN' && form.email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) next.email = 'Enter a valid email, or leave it empty.';
    else if (formRules?.email === 'REQUIRED' && !form.email.trim()) next.email = 'Enter your email.';
    if (formRules?.thana === 'REQUIRED' && zone !== 'PICKUP' && !form.city.trim()) next.city = 'Choose your thana or area.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // Store > COD Guard "Before Checkout" (StorePal only — the server never
  // reports codSmsVerification for other themes, so Medium/Minimal never
  // reach this). `codOtp` is set once a code was texted to `phone`;
  // StorePal's CheckoutView then shows the code input, and the next Place
  // Order sends the code along. Changing the phone field afterwards
  // invalidates it, so the next Place Order texts the new number instead.
  const [codOtp, setCodOtp] = useState<{ phone: string } | null>(null);
  const [codOtpCode, setCodOtpCode] = useState('');
  const [codOtpSending, setCodOtpSending] = useState(false);
  const [codOtpError, setCodOtpError] = useState<string | null>(null);

  // Returns true when a code is now waiting to be entered, false when this
  // phone doesn't need one (so the caller should just place the order).
  const requestCodOtp = async (phone: string): Promise<boolean> => {
    setCodOtpSending(true);
    setCodOtpError(null);
    try {
      const { required } = await sendCodVerificationOtp(subdomain, phone);
      if (!required) return false;
      setCodOtp({ phone });
      setCodOtpCode('');
      return true;
    } finally {
      setCodOtpSending(false);
    }
  };

  const resendCodOtp = async () => {
    if (!codOtp) return;
    try {
      await requestCodOtp(codOtp.phone);
    } catch (err) {
      setCodOtpError(err instanceof Error ? err.message : 'Could not resend the code. Please try again.');
    }
  };

  const handlePlaceOrder = async () => {
    if (!validate()) return;
    if (manualMobile) {
      const sender = manualSender.replace(/[\s-]/g, '');
      if (!/^01[3-9][0-9]{8}$/.test(sender)) {
        setManualError('Type the 11-digit number you sent the money from.');
        return;
      }
      if (!/^[A-Za-z0-9]{6,30}$/.test(manualTrxId.replace(/\s/g, ''))) {
        setManualError('Type the transaction ID (TrxID) from your payment message.');
        return;
      }
      setManualError(null);
    }
    if (areaRefusal) {
      setPlaceError(areaRefusal);
      return;
    }
    if (ordersFullToday) {
      setPlaceError('Today’s orders are full. Please order again tomorrow morning.');
      return;
    }
    if (minOrderShortfall > 0) {
      setPlaceError(`The minimum order is ৳${minOrderAmount}. Add ৳${minOrderShortfall} more to order.`);
      return;
    }
    const phone = form.phone.trim();
    const isCod = selectedGateway?.type === 'COD';
    const otpForThisPhone = codOtp?.phone === phone ? codOtp : null;

    setPlacing(true);
    setPlaceError(null);

    if (isCod && vendorCharges?.codSmsVerification === 'BEFORE_CHECKOUT') {
      if (!otpForThisPhone) {
        try {
          if (await requestCodOtp(phone)) {
            setPlacing(false);
            return;
          }
        } catch (err) {
          setPlaceError(err instanceof Error ? err.message : 'Could not send the verification code. Please try again.');
          setPlacing(false);
          return;
        }
      } else if (!/^\d{6}$/.test(codOtpCode.trim())) {
        setCodOtpError('Enter the 6-digit code from the SMS.');
        setPlacing(false);
        return;
      }
    }

    // Meta pixel AddPaymentInfo / GA4 add_payment_info: validation passed
    // and a payment method is chosen. No-ops on non-StorePal stores
    // (neither is mounted there).
    trackMetaAddPaymentInfo(lines);
    trackAddPaymentInfo(lines, selectedGateway?.type ?? paymentMethod, appliedCoupon?.code);

    try {
      const authToken = await freshAccessToken();
      const result = await placeOrder(subdomain, {
        // Meta pixel cookies / page URL / consent, for the server's
        // Conversions API Purchase, the GA4 client/session ids for a
        // server-sent GA4 purchase, and TikTok's _ttp / ttclid for its
        // Events API Purchase (StorePal only; empty otherwise).
        ...metaAdContext(),
        ...(await gaAdContext()),
        ...tiktokAdContext(),
        // Where this shopper came from, for the vendor's Analytics > Marketing.
        traffic: captureTrafficSource(subdomain),
        codVerificationCode: isCod && otpForThisPhone ? codOtpCode.trim() : undefined,
        customerName: form.fullName.trim(),
        customerPhone: form.phone.trim(),
        customerNote: form.note.trim() || undefined,
        customerPhoneAlt: formRules?.altPhone && formRules.altPhone !== 'HIDDEN' ? form.altPhone.trim() || undefined : undefined,
        customerEmail: formRules?.email && formRules.email !== 'HIDDEN' ? form.email.trim() || undefined : undefined,
        fromStorePalCheckout: formRules ? true : undefined,
        botTrap: botTrap || undefined,
        fillMs: formRules ? Math.max(0, Math.round(Date.now() - openedAt.current)) : undefined,
        shippingAddress: zone === 'PICKUP' ? 'Pickup from the shop' : form.address.trim(),
        shippingCity: form.city.trim() || undefined,
        shippingDistrict: form.district.trim() || undefined,
        deliveryZone: zone,
        deliverySpeed: expressSelected ? 'EXPRESS' : undefined,
        preferredDeliveryDate: preferredDate || undefined,
        preferredSlotId: preferredSlotId || undefined,
        ...(isGift && giftOption ? { isGift: true, giftMessage: giftMessage.trim() || undefined, hidePricesOnInvoice: hidePrices || undefined } : {}),
        sessionKey: sessionKey || undefined,
        couponCode: appliedCoupon?.code,
        giftCardCode: appliedGiftCard?.code,
        rewardPointsToUse: rewardPointsAmount > 0 ? rewardPointsAmount : undefined,
        paymentMethod,
        ...(manualMobile
          ? { manualPayment: { wallet: manualWalletInUse, senderNumber: manualSender.replace(/[\s-]/g, ''), trxId: manualTrxId.replace(/\s/g, '').toUpperCase() } }
          : {}),
        items: lines.map((l) => ({
          productSlug: l.productSlug,
          productName: l.name,
          productImage: l.image,
          selectedOptions: l.selectedOptions,
          customValues: l.customValues,
          listPrice: l.originalUnitPrice ?? l.unitPrice,
          unitPrice: l.unitPrice,
          quantity: l.quantity,
        })),
      }, authToken);

      // Any non-COD gateway: the order now exists (PAYMENT_INITIATED,
      // stock already decremented — see OrdersService.create), but it
      // isn't "placed" from the shopper's point of view until that
      // gateway confirms payment. Cart is cleared either way (the order
      // is real either way — re-adding the same items and checking out
      // again would double the stock decrement), but the redirect goes
      // to that gateway's hosted checkout instead of the thank-you/
      // orders page; that page is only reached once payment-callback
      // confirms success (see themes/storepal/views/PaymentCallbackView.tsx).
      // "Save this address": best effort, the order is already placed whatever happens here.
      if (saveNewAddress && canSaveAddress && authToken && zone !== 'PICKUP') {
        try {
          await createMyAddress(authToken, {
            label: newAddressLabel.trim() || 'Home',
            recipientName: form.fullName.trim(),
            phone: form.phone.trim(),
            district: form.district.trim() || undefined,
            city: form.city.trim() || undefined,
            address: form.address.trim(),
            deliveryZone: zone,
          });
        } catch {
          // The shopper can add it again from Account > My Addresses.
        }
      }

      if (!externalLines) clearStore(subdomain);
      sessionStorage.removeItem(sessionStorageKey);

      // A COD order whose delivery charge must be paid first (Store > COD Guard): the server created it
      // PAYMENT_INITIATED and charges just that amount through the same PayStation session.
      if (isCod && result.advanceDue) {
        const payment = await initiateOrderPayment(result.orderId);
        window.location.href = payment.paymentUrl;
        return;
      }

      // A mobile payment was already sent to the store's own wallet: no gateway page, straight to the thank-you page.
      if (selectedGateway && selectedGateway.type !== 'COD' && selectedGateway.type !== 'MANUAL_MOBILE') {
        const payment =
          selectedGateway.type === 'ONLINE_PAYMENT'
            ? await initiateOrderPayment(result.orderId)
            : await initiateGatewayOrderPayment(result.orderId);
        window.location.href = payment.paymentUrl;
        return;
      }

      sessionStorage.setItem(
        HANDOFF_KEY,
        JSON.stringify({ subdomain, invoiceNumber: result.invoiceNumber, orderCode: result.publicCode ?? null, phone: form.phone.trim() }),
      );
      router.push(`/store/${subdomain}/${redirectTo === 'thank-you' ? 'thank-you' : 'orders'}`);
    } catch (err) {
      // The server wanted a COD Guard code this page didn't know to ask
      // for (settings changed since the page loaded) — text one and show
      // the code input, same as the proactive path above.
      if (err instanceof CheckoutApiError && err.code === 'COD_VERIFICATION_REQUIRED' && !otpForThisPhone) {
        try {
          if (await requestCodOtp(phone)) {
            setPlacing(false);
            return;
          }
        } catch {
          // Fall through to showing the original error.
        }
      }
      if (otpForThisPhone && err instanceof Error && /verification code/i.test(err.message)) {
        setCodOtpError(err.message);
      } else {
        setPlaceError(err instanceof Error ? err.message : 'Could not place the order. Please try again.');
      }
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
    // "Expected by" date (YYYY-MM-DD) for the chosen zone, or null when the store set no delivery time.
    expectedDeliveryDate: expressSelected ? null : (vendorCharges?.deliveryEstimate?.[zone] ?? null),
    // Express delivery (TellMe idea 132): the offer (null when not offered here and now), whether it is picked, and the pick setter.
    standardDeliveryDate: vendorCharges?.deliveryEstimate?.[zone] ?? null,
    express: expressOffered && expressInfo ? { charge: expressInfo.charge, day: expressInfo.day, waivedByFree: expressInfo.waivedByFree } : null,
    expressSelected,
    setDeliverySpeed: setSpeedPick,
    // The optional third zone ({ charge } while the store offers it, else null) and the zone actually in use.
    aroundDhaka,
    pickup,
    preferredDays,
    preferredDate,
    setPreferredDate: setPreferredPick,
    slotOptions,
    preferredSlotId,
    setPreferredSlot: setSlotPick,
    zone,
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
    botTrap,
    setBotTrap,
    handlePlaceOrder,
    // Saved addresses (TellMe idea 53); StorePal's checkout only.
    // Heavy-cart extra, gift option and minimum order (TellMe ideas 56, 57, 58); StorePal's checkout shows them.
    weightExtra,
    giftOption,
    isGift,
    setIsGift,
    giftMessage,
    setGiftMessage: (value: string) => setGiftMessage(value.slice(0, 200)),
    hidePrices,
    setHidePrices,
    giftWrapCharge,
    minOrderAmount,
    minOrderShortfall,
    areaRefusal,
    dailyLimit,
    ordersFullToday,
    orderCutoff,
    savedAddresses,
    pickedAddressId,
    applyAddress,
    canSaveAddress,
    saveNewAddress,
    setSaveNewAddress,
    newAddressLabel,
    setNewAddressLabel,
    couponCode,
    setCouponCode,
    appliedCoupon,
    // Marketing > Discounts, already folded into the totals above: the
    // money discount's name + capped amount, and the free-shipping
    // discount's name (delivery is already 0 when set).
    automaticDiscount: autoDiscount && automaticDiscountAmount > 0 ? { name: autoDiscount.name, amount: automaticDiscountAmount } : null,
    automaticFreeShipping: autoFreeShipping && !couponFreeShipping ? { name: autoFreeShipping.name } : null,
    // Free gifts the order will carry as price-0 lines (a coupon that resets discounts does not take them away).
    freeGifts: automaticDiscounts?.gifts ?? [],
    couponChecking,
    couponError,
    applyCoupon,
    removeCoupon,
    // Marketing > Gift Cards, already folded into grandTotal/visibleGrandTotal:
    // giftCardAmount is what the card pays of this order (0 with none applied).
    // Reward points: the shopper's balance (null when off or empty), the toggle, and what they pay of this order.
    rewards,
    usePoints,
    setUsePoints,
    rewardPointsAmount,
    giftCardCode,
    setGiftCardCode,
    appliedGiftCard,
    giftCardAmount,
    giftCardCoversOrder,
    giftCardChecking,
    giftCardError,
    applyGiftCard,
    removeGiftCard,
    // Store > Payment Gateway's enabled gateway list for this vendor —
    // StorePal's CheckoutView renders one radio per entry; Medium/Minimal
    // ignore this entirely (unchanged JSX), same as paymentMethod/
    // setPaymentMethod below.
    paymentGateways,
    codBlocked,
    onlineOnlyNames,
    paymentMethod,
    setPaymentMethod,
    // Manual Mobile Payment form (StorePal's CheckoutDialog only); manualMobile is null unless that gateway is picked.
    manualMobile,
    manualWallet: manualWalletInUse,
    setManualWallet,
    manualSender,
    setManualSender: (v: string) => {
      setManualSender(v);
      setManualError(null);
    },
    manualTrxId,
    setManualTrxId: (v: string) => {
      setManualTrxId(v.toUpperCase());
      setManualError(null);
    },
    manualError,
    // Delivery charge to pay online before a COD order is placed, with what's left for the courier;
    // null when none applies. Only StorePal's CheckoutDialog renders it.
    codAdvance,
    // Store > Store Away: null while the store is open (always on Medium/Minimal). In BROWSE_ONLY the
    // server refuses the order, so the checkout shows why instead of the place-order button.
    storeAway: vendorCharges?.storeAway ?? null,
    // Store > COD Guard's before-checkout SMS step — only StorePal's
    // CheckoutView renders these (see codOtp's own comment above).
    codOtpPhone: codOtp && codOtp.phone === form.phone.trim() ? codOtp.phone : null,
    codOtpCode,
    setCodOtpCode: (value: string) => {
      setCodOtpCode(value.replace(/\D/g, '').slice(0, 6));
      setCodOtpError(null);
    },
    codOtpSending,
    codOtpError,
    resendCodOtp,
  };
}
