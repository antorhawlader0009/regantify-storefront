'use client';

import { create } from 'zustand';

/**
 * Whether StorePal's checkout dialog is open. Plain UI state (the cart and the
 * form live in their own stores / useCheckout), shared by every "Checkout" and
 * "Buy Now" button, the dialog itself, and the /checkout route, which is only a
 * fallback for saved links and just opens the same dialog.
 */
interface CheckoutDialogState {
  open: boolean;
  openDialog: () => void;
  closeDialog: () => void;
}

export const useCheckoutDialog = create<CheckoutDialogState>((set) => ({
  open: false,
  openDialog: () => set({ open: true }),
  closeDialog: () => set({ open: false }),
}));
