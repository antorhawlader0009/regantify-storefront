'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Minus, Plus, X } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { formatPrice } from '@/lib/productDisplay';
import { useCartStore, useCartHydrated } from '@/providers/cart-store-provider';
import { useCustomerAuthStore, useCustomerAuthHydrated } from '@/providers/customer-auth-store-provider';
import { placeOrder, syncIncompleteOrder } from '@/lib/checkoutApi';

const DELIVERY_CHARGE: Record<'DHAKA' | 'OUTSIDE_DHAKA', number> = {
  DHAKA: 70,
  OUTSIDE_DHAKA: 130,
};

const HANDOFF_KEY = 'regantify-last-order';

interface FormState {
  fullName: string;
  phone: string;
  address: string;
  zone: 'DHAKA' | 'OUTSIDE_DHAKA';
  note: string;
}

export default function CheckoutPage({ params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = use(params);
  const router = useRouter();

  // Every line for THIS vendor's store — a shopper could have items from
  // another store sitting in the same browser, so only this store's lines
  // belong on this checkout. useShallow prevents the infinite-render loop
  // that a fresh .filter() array (new reference every call) would
  // otherwise cause — see the same note in CartList.tsx.
  const lines = useCartStore(useShallow((s) => s.lines.filter((l) => l.subdomain === subdomain)));
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeLine = useCartStore((s) => s.removeLine);
  const clearStore = useCartStore((s) => s.clearStore);
  const hydrated = useCartHydrated();

  const [form, setForm] = useState<FormState>({ fullName: '', phone: '', address: '', zone: 'DHAKA', note: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);

  // Prefill name/phone for a logged-in customer — still fully editable,
  // and a guest (not logged in) checks out exactly as before with an
  // empty form. Only fills in once (guards on both fields already being
  // empty) so it never clobbers something the shopper is mid-typing if
  // this effect re-runs for any reason.
  const authHydrated = useCustomerAuthHydrated();
  const customer = useCustomerAuthStore((s) => s.customer);
  useEffect(() => {
    if (!authHydrated || !customer) return;
    setForm((prev) =>
      prev.fullName === '' && prev.phone === ''
        ? { ...prev, fullName: customer.fullName, phone: customer.phone }
        : prev,
    );
  }, [authHydrated, customer]);

  // Identifies this checkout attempt for "Incomplete Orders" (see
  // checkoutApi.ts's syncIncompleteOrder) — persisted in sessionStorage
  // per store so repeated syncs from the same visit update the same
  // vendor-side row instead of creating a new one on every render, but a
  // brand-new tab/session (or a different store) gets its own key.
  // Never sent anywhere except this vendor's own incomplete-order sync
  // and, on success, the real checkout call (see handlePlaceOrder) — not
  // a tracking identifier used for anything else.
  const [sessionKey] = useState(() => {
    if (typeof window === 'undefined') return '';
    const key = `regantify-checkout-session:${subdomain}`;
    const existing = sessionStorage.getItem(key);
    if (existing) return existing;
    const generated = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(key, generated);
    return generated;
  });

  // Debounced sync to "Incomplete Orders" — fires ~2s after the shopper
  // stops typing/editing the cart, not on every keystroke. Skipped
  // entirely until the cart has actually hydrated from localStorage (see
  // useCartHydrated), so an empty `lines` on first paint never gets
  // synced as "cart is empty" before the real cart has even loaded.
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
  const grandTotal = subtotal + deliveryCharge;

  const updateField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
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
        deliveryZone: form.zone,
        sessionKey: sessionKey || undefined,
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
      // Hand off to the order-tracking page so the confirmation is a real
      // server-backed view (survives a refresh, matches what a shopper
      // would see coming back later) rather than transient React state
      // that vanishes the moment this page unmounts.
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

  // Wait for the cart to finish reading localStorage before deciding it's
  // empty — otherwise a cart with items briefly flashes "empty" on first
  // paint (see CartStoreProvider / useCartHydrated).
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

  return (
    <div className="min-h-screen bg-canvas text-ink pb-16">
      <header className="bg-surface border-b border-line">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <Link href={`/store/${subdomain}/cart`} className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-ink hover:text-accent">
            <ArrowLeft size={14} />
            {storeName}
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-[18px] font-bold text-ink mb-5">Checkout</h1>

        <div className="grid gap-5 items-start lg:[grid-template-columns:1.15fr_1fr]">
          <div className="bg-surface border border-line rounded-lg p-4 sm:p-5 shadow-card">
            <p className="text-[13px] font-bold text-ink mb-4 pb-3 border-b border-line">Delivery Details</p>

            <div className="space-y-3.5">
              <div>
                <input
                  value={form.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  placeholder="Full name"
                  className={`w-full px-3.5 py-2.5 rounded-md text-[13.5px] bg-canvas border outline-none transition-colors ${
                    errors.fullName ? 'border-accent' : 'border-line focus:border-ink focus:bg-surface'
                  }`}
                />
                {errors.fullName && <p className="mt-1.5 text-[12px] text-accent">{errors.fullName}</p>}
              </div>

              <div>
                <input
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="Phone number (01XXXXXXXXX)"
                  className={`w-full px-3.5 py-2.5 rounded-md text-[13.5px] bg-canvas border outline-none transition-colors ${
                    errors.phone ? 'border-accent' : 'border-line focus:border-ink focus:bg-surface'
                  }`}
                />
                {errors.phone && <p className="mt-1.5 text-[12px] text-accent">{errors.phone}</p>}
                <p className="mt-1.5 text-[11.5px] text-muted">You&apos;ll use this to track your order later.</p>
              </div>

              <div>
                <textarea
                  value={form.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  placeholder="House, road, area, city"
                  rows={3}
                  className={`w-full px-3.5 py-2.5 rounded text-[13.5px] bg-canvas border outline-none resize-y font-[inherit] ${
                    errors.address ? 'border-accent' : 'border-line focus:border-ink focus:bg-surface'
                  }`}
                />
                {errors.address && <p className="mt-1.5 text-[12px] text-accent">{errors.address}</p>}
              </div>

              <div>
                <p className="text-[12px] font-semibold text-ink mb-2">Delivery Area</p>
                <div className="flex gap-2">
                  {(['DHAKA', 'OUTSIDE_DHAKA'] as const).map((zone) => (
                    <button
                      key={zone}
                      onClick={() => updateField('zone', zone)}
                      className={`flex-1 py-2.5 rounded-md text-[12.5px] font-semibold border transition-colors ${
                        form.zone === zone ? 'border-accent bg-accent text-white' : 'border-line bg-canvas text-ink'
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
                className="w-full px-3.5 py-2.5 rounded-md text-[13.5px] bg-canvas border border-line outline-none resize-y font-[inherit] transition-colors focus:border-ink focus:bg-surface"
              />

              <div className="px-3.5 py-2.5 rounded-md bg-canvas border border-line text-[12.5px] text-muted">
                Payment: <span className="text-ink font-semibold">Cash on Delivery</span> — pay when your order arrives.
              </div>
            </div>
          </div>

          <div className="bg-surface border border-line rounded-lg p-4 sm:p-5 shadow-card">
            <p className="text-[13px] font-bold text-ink mb-4 pb-3 border-b border-line">Order Summary</p>

            <div className="space-y-3.5 mb-4">
              {lines.map((line) => (
                <div key={line.id} className="flex gap-3">
                  <div className="relative w-14 h-14 shrink-0 bg-canvas border border-line rounded overflow-hidden">
                    {line.image ? <Image src={line.image} alt={line.name} fill sizes="56px" className="object-cover" /> : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-ink leading-tight truncate">{line.name}</p>
                    {Object.entries(line.selectedOptions).length > 0 && (
                      <p className="text-[11.5px] text-muted mt-0.5">
                        {Object.entries(line.selectedOptions).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5">
                      <button
                        onClick={() => setQuantity(line.id, line.quantity - 1)}
                        className="w-5 h-5 rounded border border-line flex items-center justify-center"
                      >
                        <Minus size={10} />
                      </button>
                      <span className="text-[12px] text-muted w-4 text-center">{line.quantity}</span>
                      <button
                        onClick={() => setQuantity(line.id, line.quantity + 1)}
                        className="w-5 h-5 rounded border border-line flex items-center justify-center"
                      >
                        <Plus size={10} />
                      </button>
                      <button onClick={() => removeLine(line.id)} className="ml-2 text-muted hover:text-accent">
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                  <div className="text-right text-[13px] font-semibold text-ink whitespace-nowrap">
                    {formatPrice(line.unitPrice * line.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-line pt-3.5 flex flex-col gap-1.5 text-[12.5px]">
              <div className="flex justify-between text-muted">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Delivery charge</span>
                <span>{formatPrice(deliveryCharge)}</span>
              </div>
              <div className="flex justify-between text-[15px] font-bold text-ink pt-1.5 border-t border-line">
                <span>Total</span>
                <span className="text-accent">{formatPrice(grandTotal)}</span>
              </div>
            </div>

            {placeError && <p className="mt-3 text-[12.5px] text-accent text-center">{placeError}</p>}

            <button
              onClick={handlePlaceOrder}
              disabled={placing}
              className="w-full mt-4 py-3.5 rounded-md bg-accent hover:bg-accent-dark text-white text-[13.5px] font-bold disabled:opacity-60 shadow-sm transition-colors"
            >
              {placing ? 'Placing order…' : 'Place Order — Cash on Delivery'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
