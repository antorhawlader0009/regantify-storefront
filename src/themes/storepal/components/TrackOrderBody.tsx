'use client';

import { useState } from 'react';
import { Check, Copy, ExternalLink, MapPin, MessageCircle, Package, Phone, Truck, Undo2, User, XCircle } from 'lucide-react';
import type { TrackedOrder, TrackedTimelineEntry } from '@/lib/checkoutApi';
import { COURIER_TRACKING_STEPS, courierStageLabel, type CourierTracking } from '@/lib/courierTracking';
import { customerOrderStatusLabel, HAPPY_PATH } from '@/lib/orderStatusDisplay';
import { orderLabel } from '@/lib/orderLabel';
import { stageText, statusText, timelineDetail, timelineTitle, ui, type TrackLang } from '@/lib/trackingI18n';
import { formatPrice } from '../lib/formatPrice';
import { formatExpectedDate } from '@/lib/expectedDate';
import { isFinishedOrder } from '@/lib/useLiveOrder';
import { CancelOrderCard } from './CancelOrderCard';

const STOPPED_STATUSES = ['CANCELLED', 'RETURN', 'REFUNDED', 'PAYMENT_FAILED', 'STOCK_OUT'];

function formatWhen(iso: string, lang: TrackLang): string {
  return new Date(iso).toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function CopyId({ id, lang }: { id: string; lang: TrackLang }) {
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
      className="inline-flex items-center gap-1.5 font-mono text-[13px] font-semibold text-ink hover:text-accent min-h-[32px]"
      aria-label={`${ui(lang, 'copy')} ${id}`}
    >
      {id}
      {copied ? <Check size={13} /> : <Copy size={13} className="text-muted" />}
      <span className="sr-only">{copied ? ui(lang, 'copied') : ui(lang, 'copy')}</span>
    </button>
  );
}

function CourierBlock({ tracking, lang }: { tracking: CourierTracking; lang: TrackLang }) {
  const current = COURIER_TRACKING_STEPS.findIndex((s) => s.stage === tracking.stage);
  const returned = tracking.stage === 'returned';
  return (
    <section className="rounded-lg border border-line bg-canvas p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Truck size={16} className="text-muted shrink-0" />
          <p className="text-[13.5px] text-ink">
            {ui(lang, 'shippedWith')} <span className="font-semibold">{tracking.providerName}</span>
          </p>
        </div>
        {tracking.trackingId && (
          <div className="sm:text-right">
            <p className="text-[11px] text-muted">{ui(lang, 'trackingId')}</p>
            <CopyId id={tracking.trackingId} lang={lang} />
          </div>
        )}
      </div>

      {returned ? (
        <p className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink">
          <Undo2 size={14} /> {ui(lang, 'returnedNote')}
        </p>
      ) : (
        <ol className="mt-4 grid grid-cols-5 gap-1" aria-label={courierStageLabel(tracking.stage)}>
          {COURIER_TRACKING_STEPS.map((step, i) => (
            <li key={step.stage} className="min-w-0" aria-current={i === current ? 'step' : undefined}>
              <div className={`h-1.5 rounded-full ${i <= current ? 'bg-accent' : 'bg-line'}`} />
              <p className={`mt-1.5 text-[10.5px] sm:text-[11px] leading-tight ${i === current ? 'font-semibold text-ink' : 'text-muted'}`}>
                {stageText(lang, step.label)}
              </p>
            </li>
          ))}
        </ol>
      )}

      {tracking.notice && <p className="mt-3 text-[12.5px] text-ink">{timelineDetail(lang, tracking.notice)}</p>}

      {tracking.riderPhone && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-md bg-surface px-3 py-2.5">
          <p className="text-[13px] text-ink">
            <span className="block text-[11px] text-muted">{ui(lang, 'yourRider')}</span>
            {tracking.riderName ?? tracking.riderPhone}
          </p>
          <a
            href={`tel:${tracking.riderPhone}`}
            className="inline-flex items-center gap-1.5 rounded-md bg-ink px-4 min-h-[40px] text-[13px] font-bold text-white hover:bg-ink/90"
          >
            <Phone size={14} />
            {ui(lang, 'callRider')} {tracking.riderPhone}
          </a>
        </div>
      )}

      {tracking.url && (
        <a
          href={tracking.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-line-strong px-3 min-h-[40px] text-[13px] font-semibold text-ink hover:bg-surface"
        >
          <ExternalLink size={14} />
          {ui(lang, 'trackOn')} {tracking.providerName}
        </a>
      )}
    </section>
  );
}

function Timeline({ entries, lang }: { entries: TrackedTimelineEntry[]; lang: TrackLang }) {
  return (
    <section className="rounded-lg border border-line bg-canvas p-4 sm:p-5">
      <h2 className="text-[14px] font-bold text-ink mb-3">{ui(lang, 'history')}</h2>
      {entries.length === 0 ? (
        <p className="text-[13px] text-muted">{ui(lang, 'noHistory')}</p>
      ) : (
        <ol className="relative">
          {entries.map((entry, i) => {
            const latest = i === 0;
            const dot =
              entry.kind === 'problem' ? 'bg-ink/70' : entry.kind === 'done' ? 'bg-success' : latest ? 'bg-accent' : 'bg-line-strong';
            return (
              <li key={`${entry.at}-${i}`} className="relative flex gap-3 pb-4 last:pb-0">
                {i < entries.length - 1 && <span aria-hidden className="absolute left-[5px] top-3 bottom-0 w-px bg-line" />}
                <span aria-hidden className={`relative mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full ${dot}`} />
                <div className="min-w-0">
                  <p className={`text-[13.5px] ${latest ? 'font-bold' : 'font-medium'} text-ink`}>{timelineTitle(lang, entry.title)}</p>
                  {entry.detail && <p className="text-[12.5px] text-muted mt-0.5">{timelineDetail(lang, entry.detail)}</p>}
                  <p className="text-[11.5px] text-muted mt-0.5">{formatWhen(entry.at, lang)}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

/**
 * The body of the StorePal tracking screens (tracking-plan.md Step 4), shared by the private link
 * page and the order-number lookup: status and progress, the courier block, the timeline, what was
 * ordered, where it is going, and how to reach the store. Mobile first: one column, 40px+ tap targets.
 */
export function TrackOrderBody({
  order,
  lang,
  whatsappUrl,
  checkedAt,
  live,
  subdomain,
  onOrderChanged,
}: {
  order: TrackedOrder;
  lang: TrackLang;
  whatsappUrl?: string | null;
  checkedAt?: Date;
  /** Whether the page is still refreshing itself (the order has not finished). */
  live?: boolean;
  /** With `onOrderChanged`, turns on the "Cancel my order" card (CancelOrderCard). */
  subdomain?: string;
  onOrderChanged?: (order: TrackedOrder) => void;
}) {
  const stepIndex = HAPPY_PATH.indexOf(order.status);
  const stopped = STOPPED_STATUSES.includes(order.status);
  const statusLabel = statusText(lang, customerOrderStatusLabel(order.status));

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-line bg-canvas p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[12px] text-muted">{ui(lang, 'order')}</p>
            <p className="text-[17px] sm:text-[18px] font-bold text-ink break-all">{orderLabel(order)}</p>
            <p className="text-[12px] text-muted mt-0.5">
              {ui(lang, 'placed')} {new Date(order.createdAt).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12.5px] font-semibold ${
              stopped ? 'bg-surface text-ink border border-line-strong' : 'bg-success-bg text-ink'
            }`}
          >
            {stopped && <XCircle size={14} />}
            {statusLabel}
          </span>
        </div>

        {order.estimatedDeliveryDate && !isFinishedOrder(order) && (
          <p
            className={`mt-3 rounded-md px-3 py-2 text-[13px] ${order.deliveryLate ? 'bg-surface border border-line-strong font-semibold text-ink' : 'bg-success-bg text-ink'}`}
          >
            {order.deliveryLate ? ui(lang, 'runningLate') : ui(lang, 'expectedBy')}{' '}
            <span className="font-semibold">{formatExpectedDate(order.estimatedDeliveryDate, lang)}</span>
          </p>
        )}

        {stepIndex >= 0 && (
          <ol className="mt-5 grid grid-cols-4 gap-1" aria-label={`${ui(lang, 'progress')}: ${statusLabel}`}>
            {HAPPY_PATH.map((status, i) => (
              <li key={status} className="min-w-0" aria-current={i === stepIndex ? 'step' : undefined}>
                <div className={`h-1.5 rounded-full ${i <= stepIndex ? 'bg-accent' : 'bg-line'}`} />
                <p className={`mt-1.5 text-[10.5px] sm:text-[11px] leading-tight ${i === stepIndex ? 'font-semibold text-ink' : 'text-muted'}`}>
                  {statusText(lang, customerOrderStatusLabel(status))}
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>

      {subdomain && onOrderChanged && <CancelOrderCard subdomain={subdomain} order={order} lang={lang} onChanged={onOrderChanged} />}

      {order.courierTracking && <CourierBlock tracking={order.courierTracking} lang={lang} />}

      <Timeline entries={order.timeline ?? []} lang={lang} />

      <section className="rounded-lg border border-line bg-canvas p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <Package size={16} className="text-muted" />
          <h2 className="text-[14px] font-bold text-ink">{ui(lang, 'items')}</h2>
        </div>
        <ul className="divide-y divide-line">
          {order.items.map((item) => (
            <li key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-[13px]">
              <span className="text-ink min-w-0">
                <span className="block truncate">{item.productName}</span>
                <span className="text-muted text-[12px]">x{item.quantity}</span>
              </span>
              <span className="text-ink font-medium shrink-0">{formatPrice(item.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 pt-3 border-t border-line flex items-center justify-between text-[14px] font-bold text-ink">
          <span>{ui(lang, 'total')}</span>
          <span>{formatPrice(order.total)}</span>
        </div>
        <p className="mt-1 text-[12px] text-muted">{order.paymentMethod === 'ONLINE_PAYMENT' ? ui(lang, 'paidOnline') : ui(lang, 'cod')}</p>
        {order.paymentMethod === 'COD' && order.advancePaidAt && Number(order.advanceAmount) > 0 && (
          <div className="mt-2 space-y-1 text-[13px] text-ink">
            <p className="flex items-center justify-between">
              <span>{ui(lang, 'paidInAdvance')}</span>
              <span className="font-medium">{formatPrice(order.advanceAmount ?? 0)}</span>
            </p>
            <p className="flex items-center justify-between font-semibold">
              <span>{ui(lang, 'dueOnDelivery')}</span>
              <span>{formatPrice(Math.max(0, Number(order.total) - Number(order.advanceAmount)))}</span>
            </p>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-line bg-canvas p-4 sm:p-5 space-y-2 text-[13px] text-ink">
        <h2 className="text-[14px] font-bold text-ink mb-1">{ui(lang, 'deliveryTo')}</h2>
        <p className="flex items-center gap-2">
          <User size={14} className="text-muted shrink-0" />
          {order.customerName}
        </p>
        {order.customerPhone && (
          <p className="flex items-center gap-2">
            <Phone size={14} className="text-muted shrink-0" />
            {order.customerPhone}
          </p>
        )}
        {order.shippingAddress && (
          <p className="flex items-center gap-2">
            <MapPin size={14} className="text-muted shrink-0" />
            {order.shippingAddress}
          </p>
        )}
      </section>

      {whatsappUrl && (
        <section className="rounded-lg border border-line bg-canvas p-4 sm:p-5">
          <h2 className="text-[14px] font-bold text-ink">{ui(lang, 'needHelp')}</h2>
          <p className="text-[12.5px] text-muted mt-1">{ui(lang, 'helpText')}</p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 min-h-[44px] w-full sm:w-auto text-[13.5px] font-bold text-white hover:bg-ink/90"
          >
            <MessageCircle size={16} />
            {ui(lang, 'whatsapp')}
          </a>
        </section>
      )}

      {live && checkedAt && (
        <p className="text-center text-[11.5px] text-muted">
          {ui(lang, 'liveNote')} {ui(lang, 'lastChecked')}{' '}
          {checkedAt.toLocaleTimeString(lang === 'bn' ? 'bn-BD' : 'en-GB', { hour: 'numeric', minute: '2-digit' })}
        </p>
      )}
    </div>
  );
}
