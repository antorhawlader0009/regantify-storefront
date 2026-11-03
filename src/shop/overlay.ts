'use client';

import { create } from 'zustand';

/**
 * Which Shop panel is open over the page (2026-11-03, the owner's request: like the StorePal template, the cart slides in from the
 * right and sign-in, checkout and My orders open as dialogs). One at a time. `after` is what opens once sign-in finishes.
 */
export type ShopPanel = 'cart' | 'login' | 'checkout' | 'orders';

type OverlayState = {
  panel: ShopPanel | null;
  /** Inside My orders: the order being looked at. */
  orderId: string | null;
  after: ShopPanel | null;
  open: (panel: ShopPanel, opts?: { after?: ShopPanel | null; orderId?: string | null }) => void;
  close: () => void;
};

export const useShopOverlay = create<OverlayState>((set) => ({
  panel: null,
  orderId: null,
  after: null,
  open: (panel, opts) => set({ panel, after: opts?.after ?? null, orderId: opts?.orderId ?? null }),
  close: () => set({ panel: null, after: null, orderId: null }),
}));
