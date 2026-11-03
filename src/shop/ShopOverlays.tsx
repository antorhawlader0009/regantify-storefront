'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { useShopOverlay, type ShopPanel } from './overlay';
import { useShopSession } from './shopClient';
import { ShopCartView } from './ShopCartView';
import { ShopCheckoutView } from './ShopCheckoutView';
import { ShopLoginForm } from './ShopLoginForm';
import { ShopOrderDetail, ShopOrdersList } from './ShopOrdersView';

const SLIDE_MS = 250;

/**
 * The Shop's panels over the page (2026-11-03, the owner's request, like the StorePal template): the cart slides in from the right,
 * sign-in, checkout and My orders open as dialogs (the whole screen on a phone). Mounted once in the Shop layout. Esc, the backdrop
 * and the close button close it; the page under it doesn't scroll meanwhile.
 */
export function ShopOverlays() {
  const { panel, orderId, after, open, close } = useShopOverlay();
  const count = useShopSession((s) => s.lines.reduce((n, l) => n + l.quantity, 0));
  // The panel being shown, kept while it slides out so the closing animation has something to move.
  const [shown, setShown] = useState<ShopPanel | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (panel) {
      setShown(panel);
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }
    setVisible(false);
    const t = setTimeout(() => setShown(null), SLIDE_MS);
    return () => clearTimeout(t);
  }, [panel]);

  useEffect(() => {
    if (!panel) return;
    const before = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = before;
      document.removeEventListener('keydown', onKey);
    };
  }, [panel, close]);

  if (!shown) return null;
  const isCart = shown === 'cart';

  const title =
    shown === 'cart' ? `Cart${count ? ` (${count})` : ''}` : shown === 'login' ? 'Sign in' : shown === 'checkout' ? 'Checkout' : orderId ? 'Order' : 'My orders';
  const width = shown === 'checkout' ? 'sm:max-w-5xl' : shown === 'login' ? 'sm:max-w-md' : 'sm:max-w-2xl';

  let body: ReactNode = null;
  if (shown === 'cart') body = <ShopCartView inPanel />;
  else if (shown === 'checkout') body = <ShopCheckoutView inPanel />;
  else if (shown === 'login') body = <ShopLoginForm onDone={() => (after ? open(after) : close())} />;
  else body = orderId ? <ShopOrderDetail orderId={orderId} onBack={() => open('orders')} /> : <ShopOrdersList onOpen={(id) => open('orders', { orderId: id })} />;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <div
        className={`absolute inset-0 bg-slate-900/50 backdrop-blur-[2px] transition-opacity ${visible ? 'opacity-100' : 'opacity-0'}`}
        style={{ transitionDuration: `${SLIDE_MS}ms` }}
        onClick={close}
        aria-hidden
      />
      {isCart ? (
        <aside
          className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-[#F6F7F9] shadow-2xl transition-transform ease-out ${visible ? 'translate-x-0' : 'translate-x-full'}`}
          style={{ transitionDuration: `${SLIDE_MS}ms` }}
        >
          <PanelHead title={title} onClose={close} />
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{body}</div>
        </aside>
      ) : (
        <div className="absolute inset-0 flex items-stretch justify-center sm:items-center sm:p-6" onClick={close}>
          <div
            onClick={(e) => e.stopPropagation()}
            className={`flex max-h-full w-full flex-col overflow-hidden bg-[#F6F7F9] shadow-2xl transition sm:max-h-[92vh] sm:rounded-[28px] ${width} ${visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
            style={{ transitionDuration: `${SLIDE_MS}ms` }}
          >
            <PanelHead
              title={title}
              onClose={close}
              onBack={shown === 'orders' && orderId ? () => open('orders') : shown === 'checkout' ? () => open('cart') : undefined}
            />
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">{body}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function PanelHead({ title, onClose, onBack }: { title: string; onClose: () => void; onBack?: () => void }) {
  return (
    <div className="flex items-center gap-2 bg-white px-4 py-3.5 shadow-[0_1px_0_rgba(16,24,40,0.06)]">
      {onBack ? (
        <button type="button" onClick={onBack} aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200">
          <ArrowLeft size={18} aria-hidden />
        </button>
      ) : null}
      <h2 className="flex-1 text-base font-bold text-slate-900">{title}</h2>
      <button type="button" onClick={onClose} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200">
        <X size={18} aria-hidden />
      </button>
    </div>
  );
}
