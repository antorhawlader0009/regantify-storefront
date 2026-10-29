import { createStore } from 'zustand/vanilla';
import { persist, createJSONStorage } from 'zustand/middleware';
import { priceWithBreaks, type PriceBreak } from '@/lib/priceBreaks';
import { CART_MAX_LINES, useLimitNotice } from '@/lib/shopLimits';

export interface CartLine {
  // productSlug + a stable string of the selected variant options is
  // enough to uniquely identify a line - two lines with the same product
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
  // Quantity price breaks (TellMe idea 67): `unitPrice` is kept at the break price for the product's total pieces in the cart
  // (see applyBreaks); `basePrice` is the price without a step. Missing = the product has no steps.
  priceBreaks?: PriceBreak[];
  basePrice?: number;
  // The shopper's own text for the product (TellMe idea 75), by field id, with the labels for showing it, and the per-piece fee that is
  // already inside unitPrice. Lines with different text are different lines.
  customValues?: Record<string, string>;
  customDisplay?: { label: string; value: string }[];
  customFee?: number;
  // What the shopper picked for a "pick N" box (IDEA-22), per box. Lines with different picks are different lines; the shown text is in customDisplay.
  bundlePicks?: { productId: string; name: string; quantity: number }[];
  // The pre-order's expected date (YYYY-MM-DD, TellMe idea 64), shown in the cart and checkout. Missing = none.
  preOrderDate?: string;
  // Product.minOrderQuantity: the line never goes below it (the server
  // refuses a smaller one at checkout). Missing = no minimum.
  minOrderQuantity?: number | null;
  // Sold in packs (TellMe idea 102): the quantity moves in steps of this many (StorePal). Missing or 1 = one at a time.
  quantityStep?: number;
  // The most the shopper can put in this line: the stock left or the store's "most per order", whichever is smaller (StorePal's panel sets it).
  // The + button stops there. Missing = no cap known (backorder, other themes); the server still checks at checkout.
  maxQuantity?: number;
  // Product.id / ProductVariant.id, for StorePal's Meta pixel content_ids
  // (see lib/metaPixelEvents.ts). Optional: Minimal's panel doesn't set
  // them, and carts saved before these fields existed don't have them.
  productId?: string;
  variantId?: string;
  // Reseller system (RESELLER-plan.md Steps 5 and 17): the supplier key of a product this store resells (StorefrontProduct.resaleGroup).
  // A cart may mix them with the store's own products; checkout shows each supplier's part apart and the server makes one order per part.
  resaleGroup?: string;
}

// Fired on window after every addLine, with the added line (including its
// id) as detail - lets StorePal's Meta pixel send AddToCart without every
// add-to-cart button knowing about tracking.
export const CART_ADD_EVENT = 'storefront:cart-add';

// Fired on window when a line is removed or its quantity lowered, with
// the line (as it was) and how many were taken out - StorePal's Google
// Analytics remove_from_cart, same idea as CART_ADD_EVENT.
export const CART_REMOVE_EVENT = 'storefront:cart-remove';

export interface CartRemoveDetail {
  line: CartLine;
  quantity: number;
}

// Keeps a quantity within a line's cap (a whole number of packs); never below one pack.
export function capQuantity(quantity: number, max?: number, step = 1): number {
  if (max === undefined || quantity <= max) return quantity;
  return Math.max(Math.floor(max / step) * step, step);
}

function dispatchRemove(line: CartLine | undefined, quantity: number) {
  if (typeof window === 'undefined' || !line || quantity <= 0) return;
  window.dispatchEvent(new CustomEvent<CartRemoveDetail>(CART_REMOVE_EVENT, { detail: { line, quantity } }));
}

/** Gives every line the break price for its product's total pieces in the cart (TellMe idea 67); lines without steps stay as they are. */
export function applyBreaks(lines: CartLine[]): CartLine[] {
  const totals = new Map<string, number>();
  for (const l of lines) if (l.priceBreaks?.length) totals.set(`${l.subdomain}|${l.productSlug}`, (totals.get(`${l.subdomain}|${l.productSlug}`) ?? 0) + l.quantity);
  if (totals.size === 0) return lines;
  return lines.map((l) => {
    if (!l.priceBreaks?.length) return l;
    const base = l.basePrice ?? l.unitPrice;
    const unitPrice = priceWithBreaks(base, l.priceBreaks, totals.get(`${l.subdomain}|${l.productSlug}`) ?? l.quantity) + (l.customFee ?? 0);
    return unitPrice === l.unitPrice && l.basePrice === base ? l : { ...l, basePrice: base, unitPrice };
  });
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

export function lineId(productSlug: string, selectedOptions: Record<string, string>, customValues?: Record<string, string>, bundlePicks?: { productId: string; quantity: number }[]): string {
  const picks = bundlePicks && bundlePicks.length > 0 ? `::b:${[...bundlePicks].sort((a, b) => a.productId.localeCompare(b.productId)).map((p) => `${p.productId}x${p.quantity}`).join('|')}` : '';
  const custom = customValues && Object.keys(customValues).length > 0
    ? `::c:${Object.entries(customValues).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join('|')}`
    : '';
  const optionsKey = Object.entries(selectedOptions)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join('|');
  return `${productSlug}::${optionsKey}${custom}${picks}`;
}

// Store factory - called fresh per request via CartStoreProvider (see
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
          // Packs (TellMe idea 102): never below the minimum or one pack, and always a whole number of packs.
          const step = input.quantityStep ?? 1;
          const floor = Math.max(input.minOrderQuantity ?? 1, step);
          const wanted = Math.max(input.quantity, floor);
          const line = { ...input, quantity: step > 1 ? Math.ceil(wanted / step) * step : wanted };
          const id = lineId(line.productSlug, line.selectedOptions, line.customValues, line.bundlePicks);
          // At most CART_MAX_LINES different products per store (lib/shopLimits.ts); more of one already in the cart is fine.
          const current = get().lines;
          if (!current.some((l) => l.id === id) && current.filter((l) => l.subdomain === line.subdomain).length >= CART_MAX_LINES) {
            const bn = typeof document !== 'undefined' && document.documentElement.lang === 'bn';
            useLimitNotice
              .getState()
              .show(
                bn
                  ? `কার্টে সর্বোচ্চ ${CART_MAX_LINES}টি আলাদা পণ্য রাখা যায়। নতুন কিছু যোগ করতে আগে একটি সরান বা অর্ডার করুন।`
                  : `Your cart can hold up to ${CART_MAX_LINES} different products. Remove one or check out to add more.`,
              );
            return;
          }
          set((state) => {
            const existing = state.lines.find((l) => l.id === id);
            if (existing) {
              return {
                lines: state.lines.map((l) =>
                  l.id === id
                    ? {
                        ...l,
                        maxQuantity: line.maxQuantity ?? l.maxQuantity,
                        quantity: capQuantity(l.quantity + line.quantity, line.maxQuantity ?? l.maxQuantity, l.quantityStep),
                        productId: l.productId ?? line.productId,
                        variantId: l.variantId ?? line.variantId,
                        minOrderQuantity: line.minOrderQuantity ?? l.minOrderQuantity,
                        priceBreaks: line.priceBreaks ?? l.priceBreaks,
                        basePrice: line.basePrice ?? l.basePrice,
                      }
                    : l,
                ),
              };
            }
            return { lines: [...state.lines, { ...line, id }] };
          });
          set((state) => ({ lines: applyBreaks(state.lines) }));
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent<CartLine>(CART_ADD_EVENT, { detail: { ...line, id } }));
          }
        },

        removeLine: (id) => {
          const removed = get().lines.find((l) => l.id === id);
          set((state) => ({ lines: applyBreaks(state.lines.filter((l) => l.id !== id)) }));
          dispatchRemove(removed, removed?.quantity ?? 0);
        },

        setQuantity: (id, requested) => {
          const before = get().lines.find((l) => l.id === id);
          // Above 0 never goes below the product's minimum; 0 still removes the line.
          // A line sold in packs (TellMe idea 102) moves one pack per +/- press, whichever button the theme draws.
          const step = before?.quantityStep ?? 1;
          let target = requested;
          if (step > 1 && before && requested > 0) target = requested > before.quantity ? before.quantity + step : before.quantity - step;
          const quantity = requested > 0 ? capQuantity(Math.max(target, before?.minOrderQuantity ?? 1, step), before?.maxQuantity, step) : requested;
          set((state) => ({
            lines: applyBreaks(
              quantity <= 0 ? state.lines.filter((l) => l.id !== id) : state.lines.map((l) => (l.id === id ? { ...l, quantity } : l)),
            ),
          }));
          if (before) dispatchRemove(before, before.quantity - Math.max(quantity, 0));
        },

        // Each vendor's storefront is a separate shop - clearing after an
        // order should only clear that vendor's lines, not a shopper's
        // cart for a different store they also have open.
        clearStore: (subdomain) =>
          set(() => ({ lines: get().lines.filter((l) => l.subdomain !== subdomain) })),

        resetFor: (ownerId) => set({ lines: [], ownerId }),
        claimFor: (ownerId) => set({ ownerId }),
        // A cart put back from a link or a saved account cart keeps at most CART_MAX_LINES lines per store.
        setLines: (lines) => {
          const perStore = new Map<string, number>();
          const kept = lines.filter((l) => {
            const n = (perStore.get(l.subdomain) ?? 0) + 1;
            perStore.set(l.subdomain, n);
            return n <= CART_MAX_LINES;
          });
          set({ lines: applyBreaks(kept) });
        },
      }),
      {
        name: 'regantify-cart',
        storage: createJSONStorage(() => localStorage),
        // SSR-safe: the persist middleware skips hydration on the server
        // (no localStorage there) and rehydrates once mounted client-side,
        // which is also why cart-reading components should treat the
        // store as empty until mounted - see CartStoreProvider.
        skipHydration: true,
      },
    ),
  );
};
