'use client';

import { type ReactNode, createContext, useContext, useEffect, useRef, useState } from 'react';
import { useStore } from 'zustand';
import { type CustomerAuthStore, createCustomerAuthStore } from '@/stores/customer-auth-store';
import { refreshCustomerSession, customerLogout as apiLogout } from '@/lib/customerAuthApi';

export type CustomerAuthStoreApi = ReturnType<typeof createCustomerAuthStore>;

const CustomerAuthStoreContext = createContext<CustomerAuthStoreApi | undefined>(undefined);
// Same purpose as CartHydratedContext — lets a page tell "definitely
// logged out" apart from "haven't finished checking yet" so it doesn't
// flash a logged-out state before the silent refresh below has a chance
// to run.
const CustomerAuthHydratedContext = createContext(false);

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<CustomerAuthStoreApi | null>(null);
  if (storeRef.current === null) {
    storeRef.current = createCustomerAuthStore();
  }

  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const store = storeRef.current;
    if (!store) return;

    const unsub = store.persist.onFinishHydration(() => {
      // Once the persisted `customer` profile (if any) has been read
      // back from localStorage, try to silently turn that into a real
      // session using the httpOnly refresh cookie — the access token
      // itself is never persisted (see customer-auth-store.ts), so a
      // fresh page load always needs this to actually be "logged in"
      // again rather than just showing a stale name with no working
      // token. If refresh fails (cookie missing/expired), the persisted
      // profile is cleared too, so the UI doesn't keep claiming the
      // shopper is logged in when they no longer have a valid session.
      const { customer } = store.getState();
      if (!customer) {
        setHydrated(true);
        return;
      }
      refreshCustomerSession()
        .then((result) => store.getState().setSession(result.customer, result.accessToken))
        .catch(() => store.getState().clearSession())
        .finally(() => setHydrated(true));
    });
    store.persist.rehydrate();
    return unsub;
  }, []);

  return (
    <CustomerAuthStoreContext.Provider value={storeRef.current}>
      <CustomerAuthHydratedContext.Provider value={hydrated}>{children}</CustomerAuthHydratedContext.Provider>
    </CustomerAuthStoreContext.Provider>
  );
}

export function useCustomerAuthStore<T>(selector: (store: CustomerAuthStore) => T): T {
  const context = useContext(CustomerAuthStoreContext);
  if (!context) {
    throw new Error('useCustomerAuthStore must be used within CustomerAuthProvider');
  }
  return useStore(context, selector);
}

/** True once the initial session check (persisted profile + silent refresh) has finished, either way. */
export function useCustomerAuthHydrated(): boolean {
  return useContext(CustomerAuthHydratedContext);
}

/** Logs the customer out: clears local state and best-effort notifies the server to invalidate the refresh cookie. */
export function useCustomerLogout() {
  const context = useContext(CustomerAuthStoreContext);
  if (!context) {
    throw new Error('useCustomerLogout must be used within CustomerAuthProvider');
  }
  return async () => {
    const { accessToken, clearSession } = context.getState();
    if (accessToken) await apiLogout(accessToken);
    clearSession();
  };
}
