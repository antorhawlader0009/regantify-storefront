import { create } from 'zustand';

/**
 * How much one shopper can keep per store (2026-10-29, the owner's request, so the cart and wishlist can't be abused: a
 * script filling them without end, a huge order or saved list posted to the server). Kept in step with the server
 * (customer-auth save-customer-cart.dto.ts and wishlist.service.ts MAX_ITEMS).
 *
 * - Cart: 50 different products (Amazon is reported to stop a cart at 50 different items). How many of ONE product is
 *   already limited by the product's "most per order" (5 by default), so a cart stays a real order.
 * - Wishlist: 100 products, far more than shoppers save, and small enough to keep the saved list and its alerts light.
 */
export const CART_MAX_LINES = 50;
export const WISHLIST_MAX = 100;

/** A short message shown at the bottom of the store when a list is full (LimitNotice draws it). */
export const useLimitNotice = create<{ message: string | null; at: number; show: (message: string) => void; hide: () => void }>((set) => ({
  message: null,
  at: 0,
  show: (message) => set({ message, at: Date.now() }),
  hide: () => set({ message: null }),
}));
