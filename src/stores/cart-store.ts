import { createStore } from 'zustand/vanilla';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartLine {
  // productSlug + a stable string of the selected variant options is
  // enough to uniquely identify a line — two lines with the same product
  // but different variant selections (e.g. Size: M vs Size: L) must stay
  // separate.
  id: string;
  subdomain: string;
  storeName: string;
  productSlug: string;
  name: string;
  image?: string;
  unitPrice: number;
  originalUnitPrice?: number;
  quantity: number;
  selectedOptions: Record<string, string>;
  isPreOrder: boolean;
  // Product.minOrderQuantity: the line never goes below it (the server
  // refuses a smaller one at checkout). Missing = no minimum.
  minOrderQuantity?: number | null;
  // Product.id / ProductVariant.id, for StorePal's Meta pixel content_ids
  // (see lib/metaPixelEvents.ts). Optional: Minimal's panel doesn't set
  // them, and carts saved before these fields existed don't have them.
  productId?: string;
  variantId?: string;
}

// Fired on window after every addLine, with the added line (including its
// id) as detail — lets StorePal's Meta pixel send AddToCart without every
// add-to-cart button knowing about tracking.
export const CART_ADD_EVENT = 'storefront:cart-add';

// Fired on window when a line is removed or its quantity lowered, with
// the line (as it was) and how many were taken out — StorePal's Google
// Analytics remove_from_cart, same idea as CART_ADD_EVENT.
export const CART_REMOVE_EVENT = 'storefront:cart-remove';

export interface CartRemoveDetail {
  line: CartLine;
  quantity: number;
}

function dispatchRemove(line: CartLine | undefined, quantity: number) {
  if (typeof window === 'undefined' || !line || quantity <= 0) return;
  window.dispatchEvent(new CustomEvent<CartRemoveDetail>(CART_REMOVE_EVENT, { detail: { line, quantity } }));
}

export interface CartState {
  lines: CartLine[];
  // The Customer account this cart belongs to, or null for a guest cart. Lets the cart be emptied when
  // the account changes (logout, someone else logs in) instead of being handed on to the next shopper
  // on the same browser. Carts saved before this field existed read as a guest cart.
  ownerId?: string | null;
}

export interface CartActions {
  addLine: (line: Omit<CartLine, 'id'>) => void;
  removeLine: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  clearStore: (subdomain: string) => void;
  // Empties the cart (every store) and gives it a new owner.
  resetFor: (ownerId: string | null) => void;
  // Marks the cart as belonging to an account, keeping its lines (a guest cart becomes theirs on login).
  claimFor: (ownerId: string) => void;
  // Replaces the lines, e.g. with the account's cart merged in from the server.
  setLines: (lines: CartLine[]) => void;
}

export type CartStore = CartState & CartActions;

export const defaultInitState: CartState = { lines: [], ownerId: null };

function lineId(productSlug: string, selectedOptions: Record<string, string>): string {
  const optionsKey = Object.entries(selectedOptions)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join('|');
  return `${productSlug}::${optionsKey}`;
}

// Store factory — called fresh per request via CartStoreProvider (see
// zustand's official Next.js App Router guide). Never call createStore()
// at module scope here: that would create one store shared across every
// visitor the server handles, leaking one shopper's cart into another's
// response during SSR.
export const createCartStore = (initState: CartState = defaultInitState) => {
  return createStore<CartStore>()(
    persist(
      (set, get) => ({
        ...initState,

        addLine: (input) => {
          const line = { ...input, quantity: Math.max(input.quantity, input.minOrderQuantity ?? 1) };
          const id = lineId(line.productSlug, line.selectedOptions);
          set((state) => {
            const existing = state.lines.find((l) => l.id === id);
            if (existing) {
              return {
                lines: state.lines.map((l) =>
                  l.id === id
                    ? {
                        ...l,
                        quantity: l.quantity + line.quantity,
                        productId: l.productId ?? line.productId,
                        variantId: l.variantId ?? line.variantId,
                        minOrderQuantity: line.minOrderQuantity ?? l.minOrderQuantity,
                      }
                    : l,
                ),
              };
            }
            return { lines: [...state.lines, { ...line, id }] };
          });
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent<CartLine>(CART_ADD_EVENT, { detail: { ...line, id } }));
          }
        },

        removeLine: (id) => {
          const removed = get().lines.find((l) => l.id === id);
          set((state) => ({ lines: state.lines.filter((l) => l.id !== id) }));
          dispatchRemove(removed, removed?.quantity ?? 0);
        },

        setQuantity: (id, requested) => {
          const before = get().lines.find((l) => l.id === id);
          // Above 0 never goes below the product's minimum; 0 still removes the line.
          const quantity = requested > 0 ? Math.max(requested, before?.minOrderQuantity ?? 1) : requested;
          set((state) => ({
            lines: quantity <= 0
              ? state.lines.filter((l) => l.id !== id)
              : state.lines.map((l) => (l.id === id ? { ...l, quantity } : l)),
          }));
          if (before) dispatchRemove(before, before.quantity - Math.max(quantity, 0));
        },

        // Each vendor's storefront is a separate shop — clearing after an
        // order should only clear that vendor's lines, not a shopper's
        // cart for a different store they also have open.
        clearStore: (subdomain) =>
          set(() => ({ lines: get().lines.filter((l) => l.subdomain !== subdomain) })),

        resetFor: (ownerId) => set({ lines: [], ownerId }),
        claimFor: (ownerId) => set({ ownerId }),
        setLines: (lines) => set({ lines }),
      }),
      {
        name: 'regantify-cart',
        storage: createJSONStorage(() => localStorage),
        // SSR-safe: the persist middleware skips hydration on the server
        // (no localStorage there) and rehydrates once mounted client-side,
        // which is also why cart-reading components should treat the
        // store as empty until mounted — see CartStoreProvider.
        skipHydration: true,
      },
    ),
  );
};
