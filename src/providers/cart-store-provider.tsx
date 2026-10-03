'use client';

import { type ReactNode, createContext, useContext, useEffect, useRef, useState } from 'react';
import { useStore } from 'zustand';
import { type CartLine, type CartStore, createCartStore } from '@/stores/cart-store';
import {
  type CustomerAuthStoreApi,
  useCustomerAuthHydrated,
  useCustomerAuthStore,
  useCustomerAuthStoreApi,
} from '@/providers/customer-auth-store-provider';
import { getMyCart, refreshCustomerSession, saveMyCart } from '@/lib/customerAuthApi';

export type CartStoreApi = ReturnType<typeof createCartStore>;

// Runs an authenticated call for one account. The 15-minute access token may have run out, so a failed
// call is retried once with a refreshed one. Gives up if the logged-in account is no longer `accountId`,
// so a save that started for one shopper can never land in another's cart.
async function withAccountToken<T>(
  authStore: CustomerAuthStoreApi,
  accountId: string,
  call: (accessToken: string) => Promise<T>,
): Promise<T> {
  const isStillThem = () => authStore.getState().customer?.id === accountId;
  if (!isStillThem()) throw new Error('Account changed.');
  const token = authStore.getState().accessToken;
  if (token) {
    try {
      return await call(token);
    } catch {
      // Probably an expired token — refresh below.
    }
  }
  const session = await refreshCustomerSession();
  if (session.customer.id !== accountId || !isStillThem()) throw new Error('Account changed.');
  authStore.getState().setSession(session.customer, session.accessToken);
  return call(session.accessToken);
}

// Same line in both lists (same id) becomes one line; quantities add up for a guest cart merged into an
// account, otherwise the larger one wins.
function mergeLines(base: CartLine[], extra: CartLine[], addQuantities: boolean): CartLine[] {
  const byId = new Map(base.map((l) => [l.id, l]));
  for (const line of extra) {
    const existing = byId.get(line.id);
    const quantity = existing
      ? addQuantities
        ? existing.quantity + line.quantity
        : Math.max(existing.quantity, line.quantity)
      : line.quantity;
    byId.set(line.id, { ...existing, ...line, quantity });
  }
  return [...byId.values()];
}

const CartStoreContext = createContext<CartStoreApi | undefined>(undefined);
// Separate from the cart data itself — lets a page tell "cart is
// genuinely empty" apart from "hasn't finished reading localStorage yet"
// and avoid flashing an empty-cart message on first paint.
const CartHydratedContext = createContext(false);

export function CartStoreProvider({ children }: { children: ReactNode }) {
  // Created once per component instance (per request on the server, once
  // on the client) — never at module scope, so one shopper's cart can
  // never leak into another's SSR response. See src/stores/cart-store.ts.
  const storeRef = useRef<CartStoreApi | null>(null);
  if (storeRef.current === null) {
    storeRef.current = createCartStore();
  }

  const [hydrated, setHydrated] = useState(false);

  // persist() is created with skipHydration so server and first client
  // render both start from the same empty state (no mismatch) — this
  // rehydrates from localStorage right after mount, and onFinishHydration
  // flips `hydrated` once that's actually done.
  useEffect(() => {
    const unsub = storeRef.current?.persist.onFinishHydration(() => setHydrated(true));
    storeRef.current?.persist.rehydrate();
    return unsub;
  }, []);

  // A cart belongs to whoever was logged in when it was filled (see CartState.ownerId), and a
  // logged-in shopper's cart is also saved on the server (CustomerCart), so it is still theirs after
  // logout, in another browser or on another device:
  //  - logout / session end: the local cart is emptied, so the next shopper never inherits it;
  //  - login: the account's saved cart is loaded (a guest cart filled before login is merged in);
  //  - someone else was the owner: their local cart is dropped, the new account's loads instead;
  //  - every change while logged in is saved to the server.
  const authStore = useCustomerAuthStoreApi();
  const authHydrated = useCustomerAuthHydrated();
  const customerId = useCustomerAuthStore((s) => s.customer?.id ?? null);
  const hasToken = useCustomerAuthStore((s) => s.accessToken !== null);
  const [loadRetry, setLoadRetry] = useState(0);
  const sync = useRef<{ loadedFor: string | null; loadingFor: string | null }>({ loadedFor: null, loadingFor: null });

  useEffect(() => {
    const store = storeRef.current;
    if (!store || !hydrated || !authHydrated) return;
    const s = sync.current;

    if (customerId === null) {
      s.loadedFor = null;
      s.loadingFor = null;
      if ((store.getState().ownerId ?? null) !== null) store.getState().resetFor(null);
      return;
    }

    // The token arrives with the login or the silent refresh on page load.
    if (!hasToken || s.loadedFor === customerId || s.loadingFor === customerId) return;
    s.loadingFor = customerId;

    const owner = store.getState().ownerId ?? null;
    if (owner === null) store.getState().claimFor(customerId);
    else if (owner !== customerId) store.getState().resetFor(customerId);
    const linesBefore = store.getState().lines;

    withAccountToken(authStore, customerId, getMyCart)
      .then((serverLines) => {
        if (s.loadingFor !== customerId) return; // logged out or switched account meanwhile
        const current = store.getState().lines;
        // The account's saved cart is the truth. Items put in before it arrived (a guest cart, or a click
        // during the load) are added on top rather than lost.
        const merged = current === linesBefore && owner === customerId ? serverLines : mergeLines(serverLines, current, owner === null);
        s.loadedFor = customerId;
        s.loadingFor = null;
        store.getState().setLines(merged); // also saves it, through the subscription below
      })
      .catch(() => {
        if (s.loadingFor !== customerId) return;
        s.loadingFor = null;
        setTimeout(() => setLoadRetry((n) => n + 1), 5000);
      });
  }, [hydrated, authHydrated, customerId, hasToken, loadRetry, authStore]);

  useEffect(() => {
    const store = storeRef.current;
    if (!store || !customerId) return;
    let inFlight = false;
    let dirty = false;
    const flush = async () => {
      if (inFlight) {
        dirty = true;
        return;
      }
      inFlight = true;
      try {
        do {
          dirty = false;
          if (sync.current.loadedFor !== customerId) break;
          const lines = store.getState().lines;
          try {
            await withAccountToken(authStore, customerId, (token) => saveMyCart(token, lines));
          } catch {
            // Offline or the session ended: the cart stays on this device and is saved on the next change.
          }
        } while (dirty);
      } finally {
        inFlight = false;
      }
    };
    return store.subscribe((state, prev) => {
      if (state.lines !== prev.lines && sync.current.loadedFor === customerId) void flush();
    });
  }, [customerId, authStore]);

  return (
    <CartStoreContext.Provider value={storeRef.current}>
      <CartHydratedContext.Provider value={hydrated}>{children}</CartHydratedContext.Provider>
    </CartStoreContext.Provider>
  );
}

export function useCartStore<T>(selector: (store: CartStore) => T): T {
  const context = useContext(CartStoreContext);
  if (!context) {
    throw new Error('useCartStore must be used within CartStoreProvider');
  }
  return useStore(context, selector);
}

/** True once the cart has finished reading its persisted state from localStorage. */
export function useCartHydrated(): boolean {
  return useContext(CartHydratedContext);
}
