'use client';

import { useState } from 'react';
import { Check, Copy, Truck, Undo2 } from 'lucide-react';
import { COURIER_TRACKING_STEPS, courierStageLabel, type CourierTracking } from '@/lib/courierTracking';

/** Tracking ID with a copy button — the shopper pastes it into the courier's own tracking or quotes it on a call. */
function TrackingId({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard
          .writeText(id)
          .then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          })
          .catch(() => {});
      }}
      className="inline-flex items-center gap-1.5 font-mono text-[13px] font-semibold text-ink hover:text-accent"
      aria-label={`Copy tracking ID ${id}`}
    >
      {id}
      {copied ? <Check size={13} /> : <Copy size={13} className="text-muted" />}
    </button>
  );
}

/**
 * StorePal's courier tracking block (pathao-plan.md Step 13): which
 * courier has the parcel, its tracking ID, and a five-step progress bar
 * (Booked → Picked up → In transit → Out for delivery → Delivered).
 */
export function CourierTrackingCard({ tracking }: { tracking: CourierTracking }) {
  const current = COURIER_TRACKING_STEPS.findIndex((s) => s.stage === tracking.stage);
  const returned = tracking.stage === 'returned';

  return (
    <div className="mb-6 rounded-lg border border-line bg-canvas p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Truck size={16} className="text-muted" />
          <p className="text-[13.5px] text-ink">
            Shipped with <span className="font-semibold">{tracking.providerName}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-muted">Tracking ID</p>
          <TrackingId id={tracking.trackingId} />
        </div>
      </div>

      {returned ? (
        <p className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink">
          <Undo2 size={14} /> This parcel was returned to the store.
        </p>
      ) : (
        <ol className="mt-4 grid grid-cols-5 gap-1" aria-label={`Delivery progress: ${courierStageLabel(tracking.stage)}`}>
          {COURIER_TRACKING_STEPS.map((step, i) => {
            const done = i <= current;
            return (
              <li key={step.stage} className="min-w-0" aria-current={i === current ? 'step' : undefined}>
                <div className={`h-1.5 rounded-full ${done ? 'bg-accent' : 'bg-line'}`} />
                <p className={`mt-1.5 text-[11px] leading-tight ${i === current ? 'font-semibold text-ink' : 'text-muted'}`}>{step.label}</p>
              </li>
            );
          })}
        </ol>
      )}

      {tracking.notice && <p className="mt-3 text-[12.5px] text-ink">{tracking.notice}</p>}
    </div>
  );
}

/** One-line version for the account orders table. */
export function CourierTrackingLine({ tracking }: { tracking: CourierTracking }) {
  return (
    <p className="mt-0.5 text-[11.5px] text-muted">
      {tracking.providerName} · <span className="font-mono">{tracking.trackingId}</span> · {courierStageLabel(tracking.stage)}
    </p>
  );
}
