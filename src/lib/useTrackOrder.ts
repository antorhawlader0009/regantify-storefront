'use client';

import { useEffect, useState } from 'react';
import { trackOrder, type TrackedOrder } from '@/lib/checkoutApi';
import { rememberGuestOrder, loadRememberedOrders, type RememberedOrder } from '@/lib/guestOrderMemory';

// Set by the checkout page right after a successful order (see
// HANDOFF_KEY in useCheckout.ts) so this page can look the order up
// automatically on redirect — this is also what makes the confirmation
// survive a refresh: nothing about the "order placed" state lives only
// in React state, it's always re-fetched from the server via the same
// invoice+phone lookup a returning shopper would use manually.
const HANDOFF_KEY = 'regantify-last-order';

export function useTrackOrder(subdomain: string) {
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [justPlaced, setJustPlaced] = useState(false);
  // "Your recent orders" (see guestOrderMemory.ts) — every invoice+phone
  // this browser has successfully looked up or just placed, most recent
  // first, so a returning guest can re-open one without re-typing its
  // invoice number. Loaded once on mount; re-read after each successful
  // lookup so a newly-placed/looked-up order shows up immediately.
  const [rememberedOrders, setRememberedOrders] = useState<RememberedOrder[]>([]);
  useEffect(() => {
    setRememberedOrders(loadRememberedOrders(subdomain));
  }, [subdomain]);

  const lookup = async (invoice: number, phoneValue: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await trackOrder(subdomain, invoice, phoneValue);
      setOrder(result);
      rememberGuestOrder(subdomain, invoice, phoneValue);
      setRememberedOrders(loadRememberedOrders(subdomain));
    } catch (err) {
      setOrder(null);
      setError(err instanceof Error ? err.message : 'Could not find that order.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const raw = sessionStorage.getItem(HANDOFF_KEY);
    if (!raw) return;
    sessionStorage.removeItem(HANDOFF_KEY);
    try {
      const handoff = JSON.parse(raw) as { subdomain: string; invoiceNumber: number; phone: string };
      if (handoff.subdomain !== subdomain) return;
      setInvoiceNumber(String(handoff.invoiceNumber));
      setPhone(handoff.phone);
      setJustPlaced(true);
      lookup(handoff.invoiceNumber, handoff.phone);
    } catch {
      // malformed handoff data — ignore, just show the empty lookup form
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subdomain]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const invoice = Number(invoiceNumber.replace(/^ORDER-/i, '').trim());
    if (!invoice || !phone.trim()) {
      setError('Enter both your order number and phone number.');
      return;
    }
    setJustPlaced(false);
    await lookup(invoice, phone.trim());
  };

  // "Your recent orders" list item click — re-runs the exact same
  // lookup a manual submit would, just pre-filled from what's
  // remembered instead of typed.
  const selectRememberedOrder = async (remembered: RememberedOrder) => {
    setInvoiceNumber(String(remembered.invoiceNumber));
    setPhone(remembered.phone);
    setJustPlaced(false);
    await lookup(remembered.invoiceNumber, remembered.phone);
  };

  return {
    invoiceNumber,
    setInvoiceNumber,
    phone,
    setPhone,
    loading,
    error,
    order,
    justPlaced,
    handleSubmit,
    rememberedOrders,
    selectRememberedOrder,
  };
}
