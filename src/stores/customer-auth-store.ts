import { createStore } from 'zustand/vanilla';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Customer } from '@/lib/customerAuthApi';

export interface CustomerAuthState {
  customer: Customer | null;
  // The access token is short-lived (15m) and only ever obtained fresh
  // from login/signup/refresh calls — deliberately NOT persisted to
  // localStorage (only `customer` is, via partialize below), so a stale
  // expired token is never read back on a later visit. A page reload
  // always starts with accessToken: null and relies on the refresh
  // cookie (see refreshCustomerSession) to silently re-establish a
  // session if one is still valid.
  accessToken: string | null;
}

export interface CustomerAuthActions {
  setSession: (customer: Customer, accessToken: string) => void;
  updateCustomer: (customer: Customer) => void;
  clearSession: () => void;
}

export type CustomerAuthStore = CustomerAuthState & CustomerAuthActions;

export const defaultInitState: CustomerAuthState = { customer: null, accessToken: null };

// Store factory — called fresh per request via CustomerAuthProvider, same
// reasoning as createCartStore: never at module scope, or one shopper's
// session could leak into another's SSR response.
export const createCustomerAuthStore = (initState: CustomerAuthState = defaultInitState) => {
  return createStore<CustomerAuthStore>()(
    persist(
      (set) => ({
        ...initState,
        setSession: (customer, accessToken) => set({ customer, accessToken }),
        // Refreshes the persisted profile in place after Account > Edit
        // Profile saves — the access token is untouched, since a
        // profile edit doesn't invalidate the current session.
        updateCustomer: (customer) => set({ customer }),
        clearSession: () => set({ customer: null, accessToken: null }),
      }),
      {
        name: 'regantify-customer',
        storage: createJSONStorage(() => localStorage),
        skipHydration: true,
        // Only the customer profile survives a reload — see the
        // accessToken comment above for why the token itself doesn't.
        partialize: (state) => ({ customer: state.customer }),
      },
    ),
  );
};
