'use client';

import { ReceiptText } from 'lucide-react';
import type { TrackedOrder } from '@/lib/checkoutApi';
import { orderLabel } from '@/lib/orderLabel';
import { ui, type TrackLang } from '@/lib/trackingI18n';
import { formatPrice } from '../lib/formatPrice';

const METHOD: Record<TrackLang, Record<string, string>> = {
  en: { CASH: 'Cash', CARD: 'Card', BKASH: 'bKash', NAGAD: 'Nagad', BANGLA_QR: 'Bangla QR', BANK: 'Bank', GIFT_CARD: 'Gift card', DUE: 'Due', OTHER: 'Other' },
  bn: { CASH: 'নগদ', CARD: 'কার্ড', BKASH: 'বিকাশ', NAGAD: 'নগদ (MFS)', BANGLA_QR: 'বাংলা কিউআর', BANK: 'ব্যাংক', GIFT_CARD: 'গিফট কার্ড', DUE: 'বাকি', OTHER: 'অন্যান্য' },
};

/**
 * A sale made at the shop counter (POS-system-plan.md Step 5), opened from the
 * receipt's QR code or the SMS receipt: the receipt itself, no delivery steps,
 * courier card or timeline, since it was handed over in the shop.
 */
export function InStoreReceipt({ order, lang }: { order: TrackedOrder; lang: TrackLang }) {
  const vat = Number(order.vatAmount);
  const paidWith = [...new Set(order.paidWith ?? [])].map((m) => METHOD[lang][m] ?? m).join(', ');
  return (
    <section className="rounded-lg border border-line bg-canvas p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <ReceiptText size={20} className="mt-0.5 shrink-0 text-muted" />
        <div className="min-w-0">
          <p className="text-[17px] sm:text-[18px] font-bold text-ink break-all">{orderLabel(order)}</p>
          <p className="text-[12px] text-muted mt-0.5">
            {ui(lang, 'boughtInStore')}{' '}
            {new Date(order.createdAt).toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-GB', {
              timeZone: 'Asia/Dhaka',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>

      <ul className="mt-4 divide-y divide-line">
        {order.items.map((item) => (
          <li key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-[13px]">
            <span className="text-ink min-w-0">
              <span className="block truncate">{item.productName}</span>
              <span className="text-muted text-[12px]">
                {Object.values(item.selectedOptions ?? {}).join(' / ')}
                {Object.keys(item.selectedOptions ?? {}).length > 0 && ' · '}
                {item.quantity} x {formatPrice(item.unitPrice)}
              </span>
            </span>
            <span className="text-ink font-medium shrink-0">{formatPrice(item.lineTotal)}</span>
          </li>
        ))}
      </ul>

      <dl className="mt-3 pt-3 border-t border-line space-y-1 text-[13px]">
        <div className="flex justify-between text-muted">
          <dt>{ui(lang, 'subtotal')}</dt>
          <dd>{formatPrice(order.subtotal)}</dd>
        </div>
        {vat > 0 && (
          <div className="flex justify-between text-muted">
            <dt>{order.vatIncluded ? ui(lang, 'vatIncluded') : ui(lang, 'vat')}</dt>
            <dd>{formatPrice(vat)}</dd>
          </div>
        )}
        {Number(order.discountAmount) > 0 && (
          <div className="flex justify-between text-muted">
            <dt>{order.discountLabel ?? ''}</dt>
            <dd>-{formatPrice(order.discountAmount)}</dd>
          </div>
        )}
        <div className="flex justify-between pt-1 text-[14px] font-bold text-ink">
          <dt>{ui(lang, 'total')}</dt>
          <dd>{formatPrice(order.total)}</dd>
        </div>
      </dl>
      {paidWith && (
        <p className="mt-2 text-[12px] text-muted">
          {ui(lang, 'paidWith')}: {paidWith}
        </p>
      )}
    </section>
  );
}
