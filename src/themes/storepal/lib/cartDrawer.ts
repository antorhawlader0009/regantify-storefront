'use client';

import { create } from 'zustand';

/**
 * Whether StorePal's slide-in cart is open. Plain UI state (not the cart's
 * contents, which live in the cart store), shared by the header's cart icon,
 * the add-to-cart buttons, the drawer itself, and the floating chat / WhatsApp
 * buttons, which step aside to the left while it is open.
 */
interface CartDrawerState {
  open: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

export const useCartDrawer = create<CartDrawerState>((set) => ({
  open: false,
  openDrawer: () => set({ open: true }),
  closeDrawer: () => set({ open: false }),
}));
