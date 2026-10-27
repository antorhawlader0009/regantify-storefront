import { useEffect } from 'react';
import { create } from 'zustand';

/**
 * The round floating buttons in the store's bottom-right corner (the user's rule, 2026-10-27): all the same size
 * (FLOATING_BUTTON), stacked from the bottom with no gap. A button that sits in the bottom spot (the WhatsApp /
 * Messenger chat button) says so with useFloatingSlot while it is on screen; the AI assistant then sits above it, and
 * moves down into the bottom spot when it isn't there.
 */
const useFloatingStackStore = create<{ right: number; add: (n: number) => void }>((set) => ({
  right: 0,
  add: (n) => set((s) => ({ right: Math.max(0, s.right + n) })),
}));

/**
 * Size, shape and shadow of every floating button, so they match. The shadow is the same on every side (the user's
 * wish, 2026-10-27: no offset, a close soft line plus a wider glow), so a button stands off any page colour.
 */
export const FLOATING_BUTTON =
  'w-14 h-14 rounded-full shadow-[0_0_4px_rgba(16,24,40,0.30),0_0_12px_rgba(16,24,40,0.30)]';

/** Holds the bottom-right spot while `taken` is true (call it on every render, before any early return). */
export function useFloatingSlot(taken: boolean) {
  useEffect(() => {
    if (!taken) return;
    useFloatingStackStore.getState().add(1);
    return () => useFloatingStackStore.getState().add(-1);
  }, [taken]);
}

/** Where the AI assistant's bubble (and its corner panel) sits: above the chat button when there is one, else at the bottom. */
export function useAssistantBottom(): string {
  const below = useFloatingStackStore((s) => s.right > 0);
  // 20 px from the edge, plus a 56 px button and a 12 px gap when the chat button is below it.
  return below ? 'bottom-[88px]' : 'bottom-5';
}
