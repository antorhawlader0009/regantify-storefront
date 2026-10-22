'use client';

import { Loader2, ShoppingBag } from 'lucide-react';
import { isValidBdPhone, type ChatOrder, type ChatOrderDetails } from '@/lib/chatOrder';

/**
 * The order being taken in the store's AI chat (lib/chatOrder.ts): the items, the delivery details (filled by the
 * assistant from the chat, from the shopper's saved details, or typed here), and a Checkout button that opens the store's
 * normal checkout with everything filled in. The order is placed only when the shopper presses Place order there. Its words
 * are in Bangla, like the store chat itself (the chat always answers in Bangla script unless the shopper asks for English).
 */
export function ChatOrderCard({
  order,
  details,
  onDetails,
  onCheckout,
  busy,
}: {
  order: ChatOrder;
  details: ChatOrderDetails;
  onDetails: (d: ChatOrderDetails) => void;
  onCheckout: () => void;
  busy: boolean;
}) {
  const optionsMissing = order.items.some((i) => i.missingOptions.length > 0);
  const phoneOk = isValidBdPhone(details.phone);
  const canCheckout = order.items.length > 0 && !optionsMissing && !!details.name.trim() && phoneOk && !!details.address.trim() && !!details.district.trim();
  const field = (key: keyof ChatOrderDetails, label: string, placeholder?: string) => (
    <label className="block">
      <span className="text-[11px] text-muted">{label}</span>
      <input
        value={details[key]}
        placeholder={placeholder}
        onChange={(e) => onDetails({ ...details, [key]: e.target.value })}
        className={`mt-0.5 w-full rounded-md border px-2 py-1.5 text-[12.5px] text-ink bg-surface outline-none focus:border-accent ${
          key === 'phone' && details.phone && !phoneOk ? 'border-red-400' : 'border-line-strong'
        }`}
      />
    </label>
  );

  return (
    <div className="w-full rounded-lg border border-accent/40 bg-canvas p-3 text-[12.5px]">
      <p className="m-0 mb-2 flex items-center gap-1.5 font-semibold text-ink">
        <ShoppingBag size={14} aria-hidden /> আপনার অর্ডার
      </p>
      {order.items.length === 0 ? (
        <p className="m-0 text-muted">কোন পণ্যটি চান, অ্যাসিস্ট্যান্টকে বলুন।</p>
      ) : (
        <ul className="m-0 mb-2 list-none space-y-1 p-0">
          {order.items.map((i) => (
            <li key={`${i.slug}-${JSON.stringify(i.options)}`} className="text-ink">
              {i.name}
              {Object.keys(i.options).length > 0 && <span className="text-muted"> · {Object.values(i.options).join(' / ')}</span>}
              <span className="text-muted"> × {i.quantity}</span>
              {i.missingOptions.length > 0 && <span className="block text-[11px] text-amber-700">{i.missingOptions.join(', ')} বেছে নিন</span>}
            </li>
          ))}
        </ul>
      )}
      <div className="grid grid-cols-2 gap-1.5">
        {field('name', 'নাম')}
        {field('phone', 'মোবাইল নম্বর', '01XXXXXXXXX')}
        <div className="col-span-2">{field('address', 'ঠিকানা', 'বাসা, রোড, এলাকা')}</div>
        {field('district', 'জেলা')}
      </div>
      <button
        type="button"
        onClick={onCheckout}
        disabled={!canCheckout || busy}
        className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-md bg-accent px-3 py-2 text-[13px] font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
      >
        {busy && <Loader2 size={13} className="animate-spin" />} চেকআউট
      </button>
      <p className="m-0 mt-1.5 text-[10.5px] text-muted">
        এসব তথ্য দিয়ে চেকআউট খুলবে। সেখানে অর্ডার করার বোতাম চাপলেই কেবল অর্ডার হবে। আপনার তথ্য পরের বারের জন্য রাখা থাকবে।
      </p>
    </div>
  );
}
