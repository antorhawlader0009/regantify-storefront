import { create } from 'zustand';

/**
 * The voice call filling the checkout form while it is open (the user's request, 2026-10-27): the assistant asks for the
 * name, phone, address and district one at a time, and each answer is put into the form the moment it is heard. The call
 * pushes only what changed; the template's checkout form applies each push to its own fields. Shared by every template:
 * a template's checkout only has to listen (`useVoiceCheckoutFill`) and call its own field setter.
 *
 * The shopper still places the order themselves: nothing here presses Place order.
 */
export interface VoiceCheckoutFields {
  fullName?: string;
  phone?: string;
  address?: string;
  district?: string;
}

interface VoiceCheckoutState {
  /** The latest push, and a counter so the same values pushed again still count as a new push. */
  fill: VoiceCheckoutFields;
  seq: number;
  push: (fields: VoiceCheckoutFields) => void;
  /** Everything has been said on the call: the form's Place order button stands out, for the shopper to press. */
  ready: boolean;
  setReady: (ready: boolean) => void;
}

export const useVoiceCheckoutFill = create<VoiceCheckoutState>((set) => ({
  fill: {},
  seq: 0,
  ready: false,
  setReady: (ready) => set({ ready }),
  push: (fields) => {
    const clean = Object.fromEntries(Object.entries(fields).filter(([, v]) => typeof v === 'string' && v.trim())) as VoiceCheckoutFields;
    if (Object.keys(clean).length) set((s) => ({ fill: clean, seq: s.seq + 1 }));
  },
}));
