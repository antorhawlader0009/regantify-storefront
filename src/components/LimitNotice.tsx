'use client';

import { useEffect } from 'react';
import { Info, X } from 'lucide-react';
import { useLimitNotice } from '@/lib/shopLimits';

/** "Your cart is full" and the like: a small note at the bottom of the screen for 4 seconds (lib/shopLimits.ts). */
export function LimitNotice() {
  const { message, at, hide } = useLimitNotice();
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(hide, 4000);
    return () => clearTimeout(timer);
  }, [message, at, hide]);
  if (!message) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[90] flex justify-center px-4" role="status" aria-live="polite">
      <div className="pointer-events-auto flex max-w-md items-start gap-2.5 rounded-xl bg-ink px-4 py-3 text-[13px] leading-snug text-white shadow-[0_12px_32px_-8px_rgba(16,24,40,0.45)]">
        <Info size={17} className="mt-px shrink-0" aria-hidden />
        <span className="flex-1">{message}</span>
        <button type="button" onClick={hide} aria-label="Close" className="-mr-1 shrink-0 rounded-full p-0.5 opacity-80 hover:opacity-100">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
