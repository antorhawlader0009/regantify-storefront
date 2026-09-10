'use client';

import { type ReactNode, createContext, useContext, useEffect, useRef, useState } from 'react';
import { useStore } from 'zustand';
import { type CartStore, createCartStore } from '@/stores/cart-store';

export type CartStoreApi = ReturnType<typeof createCartStore>;

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
