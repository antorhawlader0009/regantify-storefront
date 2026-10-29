'use client';

import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { CoverFloating } from '@/lib/floatingCover';
import { useStoreText } from '../lib/storeText';

/**
 * A store page shown as a dialog over the store (2026-10-29, the owner's request): the thank-you page and Track your order. The
 * page renders the store header itself; this draws the dimmed backdrop, a centred box (the whole screen on a phone) whose content
 * scrolls inside, and the ×. × / Esc / a click outside go to the store's home. The page behind doesn't scroll while it is open.
 */
export function StoreDialogFrame({ subdomain, label, maxWidth = 'sm:max-w-3xl', children }: { subdomain: string; label: string; maxWidth?: string; children: ReactNode }) {
  const t = useStoreText();
  const router = useRouter();
  const boxRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => router.push(`/store/${subdomain}`), [router, subdomain]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    boxRef.current?.focus({ preventScroll: true });
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [close]);

  return (
    <>
      <CoverFloating />
      <div className="fixed inset-0 z-50 flex items-stretch justify-center sm:items-center sm:p-6">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={close} aria-hidden />
        <div
          ref={boxRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label={label}
          className={`relative flex h-full w-full flex-col overflow-hidden bg-canvas shadow-[0_24px_80px_-12px_rgba(16,24,40,0.45)] outline-none sm:h-auto sm:max-h-[min(92vh,940px)] sm:rounded-2xl ${maxWidth}`}
        >
          <button
            type="button"
            onClick={close}
            aria-label={t('Close')}
            className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-surface/90 text-ink shadow-sm transition-colors hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <X size={20} strokeWidth={2.25} />
          </button>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
        </div>
      </div>
    </>
  );
}
