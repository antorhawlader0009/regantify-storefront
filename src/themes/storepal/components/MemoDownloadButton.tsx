'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import type { TrackedOrder } from '@/lib/checkoutApi';
import { downloadOrderMemoPdf } from '../lib/orderMemoPdf';

/**
 * "Download Memo (PDF)" for an order the shopper already has on screen: the thank-you page had it alone; the tracking
 * pages and Account > Orders use this too (2026-10-28). The memo is drawn in the browser from the order answer, so it
 * shows what that page knows (the tracking link's answer hides most of the street address on purpose). Words come
 * from the caller, because the tracking page is not inside StorePal's text setup.
 */
export function MemoDownloadButton({
  order,
  storeName,
  logoUrl,
  label,
  busyLabel,
  className = '',
}: {
  order: TrackedOrder;
  storeName: string;
  logoUrl?: string | null;
  label: string;
  busyLabel: string;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await downloadOrderMemoPdf(order, storeName, logoUrl);
        } finally {
          setBusy(false);
        }
      }}
      className={`inline-flex items-center justify-center gap-2 rounded-md border border-line bg-surface px-4 py-2 text-[13px] font-semibold text-ink hover:border-ink transition-colors disabled:opacity-60 ${className}`}
    >
      <Download size={15} aria-hidden />
      {busy ? busyLabel : label}
    </button>
  );
}
