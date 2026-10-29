'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { LogOut } from 'lucide-react';
import { useStoreText } from '../lib/storeText';

/**
 * "Log out?" asked before the account dialog signs the shopper out (2026-10-29, the owner's request), from the phone header and the
 * side menu alike. Drawn in the page (never the browser's own confirm box), above the account dialog. Esc or a click outside cancels.
 */
export function LogoutConfirm({ open, onCancel, onConfirm }: { open: boolean; onCancel: () => void; onConfirm: () => void }) {
  const t = useStoreText();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    // Caught before the account dialog's own Esc, so only this popup closes.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      onCancel();
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [open, onCancel]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} aria-hidden />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="logout-confirm-title"
        className="relative w-full max-w-sm rounded-2xl bg-surface p-5 text-center shadow-[0_24px_64px_-12px_rgba(16,24,40,0.45)]"
      >
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600" aria-hidden>
          <LogOut size={22} />
        </span>
        <h2 id="logout-confirm-title" className="m-0 text-[17px] font-bold text-ink">
          {t('Log out?')}
        </h2>
        <p className="m-0 mt-1.5 text-[13px] leading-snug text-muted">{t('You can log in again any time with your phone or Google.')}</p>
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="h-10 rounded-lg border border-line-strong bg-surface text-[13.5px] font-semibold text-ink transition-colors hover:bg-canvas"
          >
            {t('Cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-10 rounded-lg bg-red-600 text-[13.5px] font-semibold text-white transition-colors hover:bg-red-700"
          >
            {t('Log out')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
