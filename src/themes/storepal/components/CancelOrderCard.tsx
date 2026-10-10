'use client';

import { useState } from 'react';
import { XCircle } from 'lucide-react';
import { cancelOrderByLink, type CustomerCancelReason, type TrackedOrder } from '@/lib/checkoutApi';
import { isFinishedOrder } from '@/lib/useLiveOrder';
import { ui, type TrackLang, type UiKey } from '@/lib/trackingI18n';

const REASONS: { code: CustomerCancelReason; label: UiKey }[] = [
  { code: 'CHANGED_MIND', label: 'cancelChangedMind' },
  { code: 'ORDERED_BY_MISTAKE', label: 'cancelMistake' },
  { code: 'BOUGHT_ELSEWHERE', label: 'cancelElsewhere' },
];

/**
 * "Cancel my order" on the tracking page and the thank-you page (TellMe idea 12). The server decides whether it is
 * allowed (`order.customerCancel`, rule in orders/customer-cancel.ts: Pending or On Hold, Cash on Delivery, nothing
 * paid, no courier yet, and the store hasn't turned it off), and the tracking token proves who is asking. Once the
 * store has started on the order the card turns into a "please call the store" note. After a cancel the new order is
 * handed back through `onChanged`, so the page shows it as Cancelled without a reload.
 */
export function CancelOrderCard({
  subdomain,
  order,
  lang,
  onChanged,
}: {
  subdomain: string;
  order: TrackedOrder;
  lang: TrackLang;
  onChanged?: (order: TrackedOrder) => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<CustomerCancelReason | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Cancelled a moment ago from this page: say so (the order then reads Cancelled, so the card itself goes away).
  if (done) {
    return (
      <p role="status" className="rounded-lg border border-line bg-success-bg px-4 py-3 text-[13px] font-semibold text-ink">
        {ui(lang, 'cancelDone')}
      </p>
    );
  }
  if (order.source === 'POS' || order.status === 'CANCELLED') return null;

  // Not cancellable here: say so only for an order that is still on its way, never on a finished one.
  if (!order.customerCancel?.allowed || !order.trackingToken) {
    if (!order.customerCancel || isFinishedOrder(order) || order.status === 'PENDING' || order.status === 'ON_HOLD') return null;
    return (
      <p className="rounded-lg border border-line bg-canvas px-4 py-3 text-[12.5px] text-muted">{ui(lang, 'cancelCallStore')}</p>
    );
  }
  const token = order.trackingToken;

  const confirm = async () => {
    if (!reason) {
      setError(ui(lang, 'cancelPickReason'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const next = await cancelOrderByLink(subdomain, token, reason);
      setDone(true);
      onChanged?.(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not cancel the order. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-lg border border-line bg-canvas p-4 sm:p-5">
      <h2 className="text-[14px] font-bold text-ink">{ui(lang, 'cancelTitle')}</h2>
      <p className="text-[12.5px] text-muted mt-1">{ui(lang, 'cancelHelp')}</p>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 inline-flex items-center justify-center gap-2 rounded-md border border-line-strong bg-surface px-4 min-h-[44px] w-full sm:w-auto text-[13.5px] font-bold text-ink hover:bg-canvas"
        >
          <XCircle size={16} />
          {ui(lang, 'cancelOrder')}
        </button>
      ) : (
        <div className="mt-3">
          <p className="text-[13px] font-semibold text-ink">{ui(lang, 'cancelWhy')}</p>
          <div className="mt-2 space-y-2">
            {REASONS.map((r) => (
              <label key={r.code} className="flex items-center gap-2.5 text-[13.5px] text-ink cursor-pointer min-h-[36px]">
                <input
                  type="radio"
                  name="cancel-reason"
                  checked={reason === r.code}
                  onChange={() => {
                    setReason(r.code);
                    setError(null);
                  }}
                  className="accent-accent"
                />
                {ui(lang, r.label)}
              </label>
            ))}
          </div>
          {error && <p className="m-0 mt-2 text-[12.5px] text-accent">{error}</p>}
          <div className="mt-3 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={confirm}
              disabled={busy}
              className="rounded-md bg-ink px-4 min-h-[44px] text-[13.5px] font-bold text-white hover:bg-ink/90 disabled:opacity-60"
            >
              {busy ? ui(lang, 'cancelling') : ui(lang, 'cancelConfirm')}
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
              {ui(lang, 'cancelKeep')}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
