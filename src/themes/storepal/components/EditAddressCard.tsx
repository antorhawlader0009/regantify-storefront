'use client';

import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { editOrderAddressByLink, type TrackedOrder } from '@/lib/checkoutApi';
import { ui, type TrackLang } from '@/lib/trackingI18n';

/**
 * "Fix my address" on the tracking page and the thank-you page (TellMe idea 21). The server decides whether it is
 * allowed (`order.customerEdit`, rule in orders/customer-cancel.ts: Pending or On Hold, not yet with a courier, and the
 * store hasn't turned it off) and the tracking token proves who is asking. The customer corrects the street address,
 * the thana/area and a second phone; the main phone and the district can't change here, which the card says. On the
 * tracking-link page the old street address isn't sent back (it is masked on purpose), so the form starts empty
 * there and asks for the whole corrected address; the thank-you page knows it and prefills it.
 */
export function EditAddressCard({
  subdomain,
  order,
  lang,
  prefillAddress = '',
  onChanged,
}: {
  subdomain: string;
  order: TrackedOrder;
  lang: TrackLang;
  /** The current street address, when the page is allowed to know it (the thank-you page). */
  prefillAddress?: string;
  /** The order as the tracking answer has it, plus what the shopper typed (the tracking answer masks the address, so a page that shows it needs the typed values). */
  onChanged?: (order: TrackedOrder, edited: { shippingAddress: string; shippingCity: string | null; customerPhoneAlt: string | null }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [address, setAddress] = useState(prefillAddress);
  const [thana, setThana] = useState(order.shippingCity ?? '');
  const [phoneAlt, setPhoneAlt] = useState(order.customerPhoneAlt ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (order.source === 'POS' || order.status === 'CANCELLED' || !order.customerEdit?.allowed || !order.trackingToken) return null;
  const token = order.trackingToken;

  const save = async () => {
    if (address.trim().length < 8) {
      setError(ui(lang, 'editAddressHint'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const next = await editOrderAddressByLink(subdomain, token, {
        shippingAddress: address.trim(),
        shippingCity: thana.trim(),
        customerPhoneAlt: phoneAlt.trim(),
      });
      setDone(true);
      setOpen(false);
      onChanged?.(next, { shippingAddress: address.trim(), shippingCity: thana.trim() || null, customerPhoneAlt: phoneAlt.trim() || null });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the address. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const input =
    'w-full px-3 py-2.5 rounded-md border border-line bg-surface text-[13.5px] text-ink focus:outline-none focus:border-accent';

  return (
    <section className="rounded-lg border border-line bg-canvas p-4 sm:p-5">
      <h2 className="text-[14px] font-bold text-ink">{ui(lang, 'editTitle')}</h2>
      <p className="text-[12.5px] text-muted mt-1">{ui(lang, 'editHelp')}</p>
      {done && !open && (
        <p role="status" className="mt-3 rounded-md bg-success-bg px-3 py-2 text-[12.5px] font-semibold text-ink">
          {ui(lang, 'editDone')}
        </p>
      )}

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 inline-flex items-center justify-center gap-2 rounded-md border border-line-strong bg-surface px-4 min-h-[44px] w-full sm:w-auto text-[13.5px] font-bold text-ink hover:bg-canvas"
        >
          <MapPin size={16} />
          {ui(lang, 'editButton')}
        </button>
      ) : (
        <div className="mt-3 space-y-3">
          <label className="block text-[12.5px] font-semibold text-ink">
            {ui(lang, 'editAddress')}
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              maxLength={300}
              className={`${input} mt-1 font-normal`}
            />
            <span className="mt-1 block text-[11.5px] font-normal text-muted">{ui(lang, 'editAddressHint')}</span>
          </label>
          <label className="block text-[12.5px] font-semibold text-ink">
            {ui(lang, 'editThana')}
            <input value={thana} onChange={(e) => setThana(e.target.value)} maxLength={80} className={`${input} mt-1 font-normal`} />
          </label>
          <label className="block text-[12.5px] font-semibold text-ink">
            {ui(lang, 'editPhoneAlt')}
            <input
              type="tel"
              inputMode="tel"
              value={phoneAlt}
              onChange={(e) => setPhoneAlt(e.target.value)}
              maxLength={20}
              className={`${input} mt-1 font-normal`}
            />
            <span className="mt-1 block text-[11.5px] font-normal text-muted">{ui(lang, 'editPhoneAltHint')}</span>
          </label>
          <p className="text-[11.5px] text-muted">{ui(lang, 'editLocked')}</p>
          {error && <p className="m-0 text-[12.5px] text-accent">{error}</p>}
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={save}
              disabled={busy}
              className="rounded-md bg-ink px-4 min-h-[44px] text-[13.5px] font-bold text-white hover:bg-ink/90 disabled:opacity-60"
            >
              {busy ? ui(lang, 'editSaving') : ui(lang, 'editSave')}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setError(null);
              }}
              disabled={busy}
              className="rounded-md border border-line-strong bg-surface px-4 min-h-[44px] text-[13.5px] font-bold text-ink hover:bg-canvas disabled:opacity-60"
            >
              {ui(lang, 'editBack')}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
