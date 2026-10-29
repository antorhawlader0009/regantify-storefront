import { useEffect } from 'react';
import { create } from 'zustand';

/**
 * The round floating buttons in the store's bottom-right corner (the user's rule, 2026-10-27): all the same size
 * (FLOATING_BUTTON), stacked from the bottom with no gap. The AI assistant's button always takes the bottom spot (the
 * user's rule, 2026-10-29) and says so with useFloatingSlot while it is on screen; the WhatsApp / Messenger chat button
 * on the same side then sits above it, and moves down into the bottom spot when it isn't there.
 */
export type FloatingSide = 'left' | 'right';

/** How many buttons hold the bottom spot on each side (the AI button may sit on either side, AI Usages > "Your AI assistant"). */
const useFloatingStackStore = create<{ right: number; left: number; add: (side: FloatingSide, n: number) => void }>((set) => ({
  right: 0,
  left: 0,
  add: (side, n) => set((s) => ({ [side]: Math.max(0, s[side] + n) }) as Pick<{ right: number; left: number }, FloatingSide>),
}));

/**
 * Size, shape and shadow of every floating button, so they match. The shadow is the same on every side (the user's
 * wish, 2026-10-27: no offset, a close soft line plus a wider glow), so a button stands off any page colour.
 */
export const FLOATING_BUTTON =
  'w-14 h-14 rounded-full shadow-[0_0_4px_rgba(16,24,40,0.30),0_0_12px_rgba(16,24,40,0.30)]';

/** Holds the bottom spot of one side while `taken` is true (call it on every render, before any early return). */
export function useFloatingSlot(taken: boolean, side: FloatingSide = 'right') {
  useEffect(() => {
    if (!taken) return;
    useFloatingStackStore.getState().add(side, 1);
    return () => useFloatingStackStore.getState().add(side, -1);
  }, [taken, side]);
}

/** Where the WhatsApp / Messenger chat button sits: above the AI assistant's button on the same side, else at the bottom. */
export function useChatButtonBottom(side: FloatingSide = 'right'): { button: string; note: string } {
  const above = useFloatingStackStore((s) => s[side] > 0);
  // 20 px from the edge, plus a 56 px button and a 12 px gap when the AI button is below it.
  return above ? { button: 'bottom-[88px]', note: 'bottom-[92px]' } : { button: 'bottom-5', note: 'bottom-6' };
}
