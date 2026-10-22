'use client';

import { create } from 'zustand';

/**
 * Lets other parts of the store hand a question to the AI chat widget (AiAssistantWidget.tsx): a search that found
 * nothing shows "Ask our assistant" (AskAssistantButton.tsx), and a tap opens the chat and sends the search words.
 * `available` is set by the widget from /chat/status, so the button only shows while the assistant can answer.
 */
interface AssistantBridgeState {
  available: boolean;
  /** A question waiting for the widget to send. */
  pending: string | null;
  setAvailable: (available: boolean) => void;
  ask: (question: string) => void;
  /** The widget takes the waiting question (once). */
  take: () => string | null;
}

export const useAssistantBridge = create<AssistantBridgeState>((set, get) => ({
  available: false,
  pending: null,
  setAvailable: (available) => set({ available }),
  ask: (question) => {
    const q = question.trim().slice(0, 450);
    if (q) set({ pending: q });
  },
  take: () => {
    const q = get().pending;
    if (q) set({ pending: null });
    return q;
  },
}));

/** What the chat receives for a search that found nothing (in Bangla, like the rest of the chat). */
export function searchQuestion(words: string): string {
  return `“${words.trim().slice(0, 200)}” আছে?`;
}
