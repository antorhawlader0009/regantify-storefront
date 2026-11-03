'use client';

import { create } from 'zustand';
import type { ShopCartLine } from '@/lib/shopAccount';

/*
 * The Regantify Shop's browser side of "one sign-in, every shop" (2026-11-03). Every call goes to the Shop's own proxy (/shop/api/...), which
 * adds the shopper's token from its httpOnly cookie. A shopper who is not signed in keeps the cart in this browser; signing in merges it into
 * the account's cart (the same cart the Regantify app shows), the larger quantity winning.
 */

const WHO_KEY = 'rgf-shop-who';
const CART_KEY = 'rgf-shop-cart';
const MAX_LINES = 100;

export class ShopApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

/** Calls the Shop proxy; throws ShopApiError with the server's own sentence. */
export async function shopApi<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(`/shop/api/${path}`, {
    method: init?.method ?? 'GET',
    headers: init?.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: 'no-store',
  });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!res.ok) {
    if (res.status === 401) forgetWho();
    const m = (data as { message?: string | string[] } | null)?.message;
    throw new ShopApiError(Array.isArray(m) ? m[0] : m || 'Something went wrong. Please try again.', res.status);
  }
  return data as T;
}

export type ShopWho = { name: string | null };

function readWho(): ShopWho | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(WHO_KEY);
    return raw ? (JSON.parse(raw) as ShopWho) : null;
  } catch {
    return null;
  }
}

function forgetWho() {
  try {
    localStorage.removeItem(WHO_KEY);
  } catch {
    /* private mode */
  }
  useShopSession.setState({ who: null });
}

function readLocalCart(): ShopCartLine[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    const list = raw ? (JSON.parse(raw) as ShopCartLine[]) : [];
    return Array.isArray(list) ? list.filter((l) => l && typeof l.subdomain === 'string' && typeof l.slug === 'string' && l.quantity > 0).slice(0, MAX_LINES) : [];
  } catch {
    return [];
  }
}

function writeLocalCart(lines: ShopCartLine[]) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(lines));
  } catch {
    /* private mode */
  }
}

const keyOf = (l: ShopCartLine) => `${l.subdomain}|${l.slug}|${JSON.stringify(Object.entries(l.options ?? {}).sort())}`;

/** Same product and options once, the larger quantity kept (a merge never doubles what the shopper picked). */
function mergeLines(a: ShopCartLine[], b: ShopCartLine[]): ShopCartLine[] {
  const out = new Map<string, ShopCartLine>();
  for (const l of [...a, ...b]) {
    const k = keyOf(l);
    const hit = out.get(k);
    out.set(k, hit ? { ...hit, quantity: Math.min(99, Math.max(hit.quantity, l.quantity)) } : { ...l, quantity: Math.min(99, l.quantity) });
  }
  return [...out.values()].slice(0, MAX_LINES);
}

type SessionState = {
  ready: boolean;
  who: ShopWho | null;
  lines: ShopCartLine[];
  /** Reads who is signed in and the cart (server cart when signed in, this browser's otherwise). */
  load: () => Promise<void>;
  signedIn: (who: ShopWho) => Promise<void>;
  signOut: () => Promise<void>;
  add: (line: ShopCartLine) => Promise<void>;
  setQuantity: (index: number, quantity: number) => Promise<void>;
  remove: (indexes: number[]) => Promise<void>;
};

/** Only the four fields the API takes (it refuses any other field, and the server cart answer also carries productId). */
export function cleanLines(lines: ShopCartLine[]): ShopCartLine[] {
  return lines.map((l) => ({ subdomain: l.subdomain, slug: l.slug, options: l.options ?? {}, quantity: l.quantity }));
}

async function saveCart(lines: ShopCartLine[], signedIn: boolean): Promise<ShopCartLine[]> {
  const clean = cleanLines(lines);
  if (!signedIn) {
    writeLocalCart(clean);
    return clean;
  }
  const r = await shopApi<{ lines: ShopCartLine[] }>('market/cart', { method: 'PUT', body: { lines: clean } });
  return cleanLines(r.lines);
}

export const useShopSession = create<SessionState>((set, get) => ({
  ready: false,
  who: null,
  lines: [],
  load: async () => {
    const who = readWho();
    if (!who) {
      set({ ready: true, who: null, lines: readLocalCart() });
      return;
    }
    try {
      const r = await shopApi<{ lines: ShopCartLine[] }>('market/cart');
      set({ ready: true, who, lines: cleanLines(r.lines) });
    } catch (e) {
      // Signed out on the server (expired), or the Shop is paused: fall back to this browser's cart.
      if (e instanceof ShopApiError && e.status === 401) forgetWho();
      set({ ready: true, who: readWho(), lines: readLocalCart() });
    }
  },
  signedIn: async (who) => {
    try {
      localStorage.setItem(WHO_KEY, JSON.stringify(who));
    } catch {
      /* private mode */
    }
    const local = readLocalCart();
    let server: ShopCartLine[] = [];
    try {
      server = cleanLines((await shopApi<{ lines: ShopCartLine[] }>('market/cart')).lines);
    } catch {
      server = [];
    }
    let lines = mergeLines(server, local);
    if (local.length > 0) {
      lines = await saveCart(lines, true).catch(() => lines);
      writeLocalCart([]);
    }
    set({ who, lines, ready: true });
  },
  signOut: async () => {
    await shopApi('auth/sign-out', { method: 'POST' }).catch(() => undefined);
    forgetWho();
    set({ lines: readLocalCart() });
  },
  add: async (line) => {
    const lines = mergeLines(get().lines, []);
    const k = keyOf(line);
    const i = lines.findIndex((l) => keyOf(l) === k);
    if (i >= 0) lines[i] = { ...lines[i], quantity: Math.min(99, lines[i].quantity + line.quantity) };
    else if (lines.length < MAX_LINES) lines.push(line);
    else throw new ShopApiError('Your cart is full (100 products). Please remove something first.', 400);
    set({ lines: await saveCart(lines, !!get().who) });
  },
  setQuantity: async (index, quantity) => {
    const lines = get().lines.map((l, i) => (i === index ? { ...l, quantity: Math.max(1, Math.min(99, quantity)) } : l));
    set({ lines });
    set({ lines: await saveCart(lines, !!get().who) });
  },
  remove: async (indexes) => {
    const drop = new Set(indexes);
    const lines = get().lines.filter((_, i) => !drop.has(i));
    set({ lines });
    set({ lines: await saveCart(lines, !!get().who) });
  },
}));

export const taka = (n: number) => `৳${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
