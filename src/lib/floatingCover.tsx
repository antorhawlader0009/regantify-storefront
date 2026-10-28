'use client';

import { useEffect } from 'react';
import { create } from 'zustand';

/**
 * How many full-screen layers (checkout, sign-in, photo viewer, quick add, size guide, mobile menu...) are open now.
 * Floating buttons (the AI assistant bubble and its teaser, the WhatsApp/Messenger button) hide while it is above 0,
 * so they never sit on top of a form or a photo the shopper is busy with. A counter, not a flag, because two layers
 * can be open at once (sign-in over checkout). Shared by every template.
 */
export const useFloatingCover = create<{ count: number; enter: () => void; leave: () => void }>((set) => ({
  count: 0,
  enter: () => set((s) => ({ count: s.count + 1 })),
  leave: () => set((s) => ({ count: Math.max(0, s.count - 1) })),
}));

/** True while any full-screen layer is open. */
export function useFloatingCovered(): boolean {
  return useFloatingCover((s) => s.count > 0);
}

/** Counts a layer in while `active` is true (call it in an overlay that stays mounted when closed). */
export function useCoverFloating(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    useFloatingCover.getState().enter();
    return () => useFloatingCover.getState().leave();
  }, [active]);
}

/** Drop inside an overlay that is only rendered while open: counts it in for as long as it is on the page. */
export function CoverFloating() {
  useCoverFloating(true);
  return null;
}
