'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Link2, Share2 } from 'lucide-react';
import { useStorePalDesign } from '../lib/designSettings';
import { formatPrice as plainPrice } from '../lib/formatPrice';
import { useFormatPrice } from '../lib/storeText';
import { trackFeature } from '@/lib/featureUse';

/**
 * Product page "Share" (TellMe idea 61). On a phone it opens the phone's own share sheet; elsewhere a small menu offers
 * WhatsApp, Messenger and "Copy link". The text is the product's name and today's price, the link is the product page with
 * `?ref=share` so shared visits can be told apart. Nothing is sent to our server. The product page's preview (Open Graph)
 * is already set by the page, so the picture and price show well in a friend's chat. The vendor can turn it off in
 * Store > Design > Product Display.
 */
export function ShareButton({ name, price }: { name: string; price: number }) {
  const formatPrice = useFormatPrice(plainPrice);
  const design = useStorePalDesign();
  const bn = design.storeLanguage === 'bn';
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  if (design.productShareEnabled === false) return null;

  const link = () => {
    const url = new URL(window.location.href);
    url.hash = '';
    url.search = '?ref=share';
    return url.toString();
  };
  const text = `${name} - ${formatPrice(price)}`;

  const onClick = async () => {
    trackFeature('SHARE_OPEN');
    const nav = navigator as Navigator & { share?: (data: { title?: string; text?: string; url?: string }) => Promise<void> };
    if (typeof nav.share === 'function' && window.matchMedia('(pointer: coarse)').matches) {
      try {
        await nav.share({ title: name, text, url: link() });
      } catch {
        // Closed without sharing: nothing to do.
      }
      return;
    }
    setOpen((v) => !v);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt(bn ? 'লিংক কপি করুন' : 'Copy this link', link());
    }
  };

  const item = 'flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-ink hover:bg-canvas';
  return (
    <div ref={box} className="relative shrink-0">
      <button
        type="button"
        onClick={() => void onClick()}
        aria-label={bn ? 'শেয়ার করুন' : 'Share'}
        aria-expanded={open}
        className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[12.5px] font-semibold text-ink hover:border-ink"
      >
        <Share2 size={14} />
        {bn ? 'শেয়ার' : 'Share'}
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-md border border-line bg-surface shadow-lg">
          <a className={item} target="_blank" rel="noopener noreferrer" href={`https://wa.me/?text=${encodeURIComponent(`${text} ${link()}`)}`} onClick={() => setOpen(false)}>
            WhatsApp
          </a>
          <a className={item} href={`fb-messenger://share/?link=${encodeURIComponent(link())}`} onClick={() => setOpen(false)}>
            Messenger
          </a>
          <button type="button" className={item} onClick={() => void copy()}>
            {copied ? <Check size={14} /> : <Link2 size={14} />}
            {copied ? (bn ? 'কপি হয়েছে' : 'Copied') : bn ? 'লিংক কপি' : 'Copy link'}
          </button>
        </div>
      )}
    </div>
  );
}
