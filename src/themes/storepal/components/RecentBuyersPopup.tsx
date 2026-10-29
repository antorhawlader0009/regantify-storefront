'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { apiOrigin } from '@/lib/visitSession';
import { useFloatingCovered } from '@/lib/floatingCover';
import { bnDigits, useStoreText } from '../lib/storeText';
import { useStorePalDesign } from '../lib/designSettings';

interface Buyer {
  district: string | null;
  productName: string;
  slug: string;
  photoUrl: string | null;
  minutesAgo: number;
}

/** Pages where nothing may stand between a shopper and paying, like the popup campaigns. */
const NEVER_ON = new Set(['checkout', 'thank-you', 'payment-callback', 'account', 'orders', 't', 'l', 'pay', 'cart', 'r']);

function agoText(minutes: number, bn: boolean): string {
  if (minutes < 5) return bn ? 'এইমাত্র' : 'just now';
  if (minutes < 60) return bn ? `${bnDigits(minutes)} মিনিট আগে` : `${minutes} minutes ago`;
  const h = Math.floor(minutes / 60);
  return bn ? `${bnDigits(h)} ঘণ্টা আগে` : `${h} hour${h === 1 ? '' : 's'} ago`;
}

/**
 * "Someone bought" popup (TellMe idea 123), StorePal only and off unless the store turned it on (Store > Design > Product Display). It shows what the server
 * sends from the store's real orders of the last 48 hours: the district (or "Bangladesh" when too few share it), the product and how long ago. Nothing
 * is ever made up: with fewer than 5 real orders the server sends nothing and nothing shows. One small card at a time, every N seconds, closable; once
 * closed it does not come back in this browser session. Not on checkout, cart, payment, account or tracking pages.
 */
export function RecentBuyersPopup({ subdomain }: { subdomain: string }) {
  const design = useStorePalDesign();
  const t = useStoreText();
  const pathname = usePathname();
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [closed, setClosed] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const enabled = design.recentBuyersEnabled;
  const bn = design.storeLanguage === 'bn';
  const section = pathname.split('/').filter(Boolean);
  // "/store/<sub>/checkout" or "/checkout" on a custom domain.
  const first = section[0] === 'store' ? section[2] : section[0];
  const blocked = first ? NEVER_ON.has(first) : false;

  useEffect(() => {
    try {
      if (sessionStorage.getItem(`storepal:recent-buyers-closed:${subdomain}`) === '1') setClosed(true);
    } catch {
      // Storage blocked: the popup just comes back on the next page.
    }
  }, [subdomain]);

  useEffect(() => {
    if (!enabled || closed) return;
    let cancelled = false;
    fetch(`${apiOrigin()}/v1/store/${encodeURIComponent(subdomain)}/recent-buyers`)
      .then((r) => (r.ok ? r.json() : { buyers: [] }))
      .then((data: { buyers: Buyer[] }) => {
        if (!cancelled && Array.isArray(data.buyers)) setBuyers(data.buyers);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [enabled, closed, subdomain]);

  // Show one for 6 seconds, rest for the store's interval, and go on to the next.
  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (!enabled || closed || blocked || buyers.length === 0) {
      setVisible(false);
      return;
    }
    const gap = Math.min(120, Math.max(10, design.recentBuyersSeconds ?? 20)) * 1000;
    const cycle = (i: number) => {
      setIndex(i % buyers.length);
      setVisible(true);
      timers.current.push(setTimeout(() => setVisible(false), 6000));
      timers.current.push(setTimeout(() => cycle(i + 1), gap + 6000));
    };
    timers.current.push(setTimeout(() => cycle(0), 5000));
    return () => timers.current.forEach(clearTimeout);
  }, [enabled, closed, blocked, buyers, design.recentBuyersSeconds]);

  const close = () => {
    setClosed(true);
    setVisible(false);
    try {
      sessionStorage.setItem(`storepal:recent-buyers-closed:${subdomain}`, '1');
    } catch {
      // ignore
    }
  };

  // Steps aside while something covers the page (the AI chat, checkout, sign-in...: lib/floatingCover.tsx).
  const covered = useFloatingCovered();
  const b = buyers[index];
  if (!enabled || closed || blocked || !b || covered) return null;
  const who = b.district ? (bn ? `${b.district}-এর একজন` : `Someone from ${b.district}`) : bn ? `${t('Bangladesh')}-এর একজন` : `Someone in ${t('Bangladesh')}`;

  return (
    <div
      className={`fixed bottom-4 z-40 w-[calc(100%-2rem)] max-w-[320px] transition-all duration-300 ${design.recentBuyersPosition === 'RIGHT' ? 'right-4' : 'left-4'} ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="relative flex items-center gap-3 rounded-lg border border-line bg-surface p-2.5 shadow-lg">
        <Link href={`/store/${subdomain}/product/${b.slug}`} className="flex min-w-0 flex-1 items-center gap-3">
          <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded bg-canvas">{b.photoUrl && <Image src={b.photoUrl} alt="" fill sizes="48px" className="object-cover" />}</span>
          <span className="min-w-0 text-[12px] leading-snug text-ink">
            <span className="block font-semibold">{who} {bn ? 'কিনেছেন' : 'bought'}</span>
            <span className="block truncate text-muted">{b.productName}</span>
            <span className="block text-[11px] text-muted">{agoText(b.minutesAgo, bn)}</span>
          </span>
        </Link>
        <button type="button" onClick={close} aria-label="Close" className="absolute right-1 top-1 rounded p-0.5 text-muted hover:text-ink">
          <X size={13} />
        </button>
      </div>
    </div>
  );
}
