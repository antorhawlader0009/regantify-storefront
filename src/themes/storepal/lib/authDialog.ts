'use client';

import { create } from 'zustand';

export type AuthDialogMode = 'login' | 'signup' | 'forgot';

/**
 * Whether StorePal's login / sign-up / forgot-password dialog is open, and which
 * side of it. Plain UI state shared by the header's account icon, the
 * /account/login, /account/signup and /account/forgot-password pages (which just
 * open the dialog), and the dialog itself.
 */
interface AuthDialogState {
  open: boolean;
  mode: AuthDialogMode;
  openLogin: () => void;
  openSignup: () => void;
  openForgot: () => void;
  setMode: (mode: AuthDialogMode) => void;
  close: () => void;
}

export const useAuthDialog = create<AuthDialogState>((set) => ({
  open: false,
  mode: 'login',
  openLogin: () => set({ open: true, mode: 'login' }),
  openSignup: () => set({ open: true, mode: 'signup' }),
  openForgot: () => set({ open: true, mode: 'forgot' }),
  setMode: (mode) => set({ mode }),
  close: () => set({ open: false }),
}));
