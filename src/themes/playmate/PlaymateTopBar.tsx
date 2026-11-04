'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { CloseIcon, RefreshIcon, TagIcon, TruckIcon } from './icons';

const ICONS = [TruckIcon, TagIcon, RefreshIcon];

/**
 * The template's announcement bar (templete/playmate TopBar.tsx), drawn exactly like it: on a computer every message
 * side by side with its icon, on a phone one message at a time that changes every 3.5 seconds, and a close button that
 * folds the bar away for the rest of the visit. Used by the store's header (its own Site Banner text) and the demo.
 */
export function PmTopBarView({
  messages,
  closeKey,
  closeLabel,
  background,
}: {
  messages: ReactNode[];
  /** sessionStorage key that remembers the close for this visit. */
  closeKey: string;
  closeLabel: string;
  background?: string | null;
}) {
  const [i, setI] = useState(0);
  const [closed, setClosed] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(closeKey) === '1') {
        setClosed(true);
        setGone(true);
      }
    } catch {
      /* private mode: the bar just stays */
    }
  }, [closeKey]);

  useEffect(() => {
    if (closed || messages.length < 2) return;
    const timer = setInterval(() => setI((v) => (v + 1) % messages.length), 3500);
    return () => clearInterval(timer);
  }, [closed, messages.length]);

  if (gone || messages.length === 0) return null;
  const close = () => {
    setClosed(true);
    try {
      sessionStorage.setItem(closeKey, '1');
    } catch {
      /* ignore */
    }
  };
  const CurrentIcon = ICONS[i % ICONS.length];

  return (
    <div
      data-rg="announcement-bar"
      className={`grid transition-[grid-template-rows] duration-300 ease-out ${closed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'}`}
      onTransitionEnd={() => closed && setGone(true)}
      role="region"
      aria-label={closeLabel}
    >
      <div className="overflow-hidden">
        <div className="relative bg-accent text-white" style={background ? { backgroundColor: background } : undefined}>
          {/* large screens: all the messages */}
          <div
            className={`pm-wrap hidden h-10 items-center gap-6 pr-12 text-[11px] font-medium uppercase tracking-wide lg:flex xl:pr-14 ${
              messages.length === 1 ? 'justify-center' : 'justify-between'
            }`}
          >
            {messages.map((text, idx) => {
              const Icon = ICONS[idx % ICONS.length];
              return (
                <span key={idx} className="inline-flex items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{text}</span>
                </span>
              );
            })}
          </div>
          {/* smaller screens: one message at a time */}
          <div
            className="flex min-h-9 items-center justify-center px-10 py-2 text-center text-[10.5px] font-medium uppercase leading-snug tracking-wide sm:text-[11px] lg:hidden"
            aria-live="polite"
          >
            <span key={i} className="pm-fade-in inline-flex items-center gap-2">
              <CurrentIcon className="h-4 w-4 shrink-0" />
              <span>{messages[i % messages.length]}</span>
            </span>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label={closeLabel}
            className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-white/90 transition hover:bg-white/15 hover:text-white sm:right-4"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/** The store's Site Banner text split into the bar's messages: one per paragraph or line (at most 3, like the template). */
export function bannerMessages(html: string): string[] {
  return html
    .replace(/^\s*<p[^>]*>/i, '')
    .replace(/<\/p>\s*$/i, '')
    .split(/<\/p>\s*<p[^>]*>|<br\s*\/?>/i)
    .map((part) => part.trim())
    .filter((part) => part.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim().length > 0)
    .slice(0, 3);
}
