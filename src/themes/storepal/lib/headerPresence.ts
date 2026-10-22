import { create } from 'zustand';

/**
 * Whether a StorePal store header is on the page right now. The AI chat widget is mounted once in the store layout
 * (so a voice call survives moving to another page), but it should only show where the header is, as before:
 * StoreHeader counts itself in and out here, and the widget hides its bubble when no header is mounted.
 */
export const useHeaderPresence = create<{ count: number; enter: () => void; leave: () => void }>((set) => ({
  count: 0,
  enter: () => set((s) => ({ count: s.count + 1 })),
  leave: () => set((s) => ({ count: Math.max(0, s.count - 1) })),
}));
