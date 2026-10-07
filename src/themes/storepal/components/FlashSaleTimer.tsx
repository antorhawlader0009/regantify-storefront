'use client';

import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import { useStoreText } from '../lib/storeText';

/** "2d 04h", or "03:12:45" once under a day. */
function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return days > 0 ? `${days}d ${pad(hours)}h` : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

interface FlashSaleTimerProps {
  /** ISO time the sale ends (Product.flashSaleEndsAt); the timer renders nothing without it. */
  endsAt?: string | null;
  /** "badge" is the small pill on a product card; "bar" is the wider strip on the product page. */
  variant?: 'badge' | 'bar';
  className?: string;
}

/**
 * Marketing > Flash Sale's "sale ends in" badge/countdown. The price itself is
 * already the sale price (StorefrontService.applyCampaignPricing), so this only
 * labels it. Empty on the server render and until mounted, so the countdown
 * never causes a hydration mismatch; hides itself when the time runs out.
 */
export function FlashSaleTimer({ endsAt, variant = 'badge', className = '' }: FlashSaleTimerProps) {
  const t = useStoreText();
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!endsAt) return;
    const end = new Date(endsAt).getTime();
    if (Number.isNaN(end)) return;
    const tick = () => setRemaining(end - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  if (remaining === null || remaining <= 0) return null;

  if (variant === 'bar') {
    return (
      <div
        className={`inline-flex items-center gap-2 bg-accent text-white px-3 py-1.5 rounded-md text-[12.5px] font-semibold ${className}`}
      >
        <Zap size={14} className="fill-white" />
        <span>{t('Flash Sale')}</span>
        <span className="opacity-90 font-mono tabular-nums">ends in {formatRemaining(remaining)}</span>
      </div>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 bg-accent text-white px-2 py-1 rounded text-[10.5px] font-bold uppercase tracking-wide shadow ${className}`}
    >
      <Zap size={11} className="fill-white" />
      <span className="font-mono tabular-nums normal-case">{formatRemaining(remaining)}</span>
    </span>
  );
}
