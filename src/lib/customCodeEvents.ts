/**
 * The shop's events for a store's own custom code (Store > Design > Custom Code): every ecommerce event the
 * storefront builds (lib/ecommerceEvents.ts, Google Analytics 4 names and parameters) is also sent as one browser
 * event, `regantify:event`, with `{ name, params }`. Custom code listens with `Regantify.on('add_to_cart', fn)`
 * (components/StoreCodeHooks.tsx) or `window.addEventListener('regantify:event', ...)`. No personal details are ever
 * in it (no name, phone or address). Not the same as lib/storeEvents.ts (the store's own Analytics funnel).
 */
export const CUSTOM_CODE_EVENT = 'regantify:event';

export interface CustomCodeEventDetail {
  name: string;
  params: Record<string, unknown>;
}

/** The events of this page load so far (at most 50), kept so code that starts later still hears them (Regantify.on replays). */
export function recentCustomCodeEvents(): CustomCodeEventDetail[] {
  if (typeof window === 'undefined') return [];
  const w = window as Window & { __rgEvents?: CustomCodeEventDetail[] };
  return (w.__rgEvents ??= []);
}

export function sendCustomCodeEvent(name: string, params: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  const recent = recentCustomCodeEvents();
  recent.push({ name, params });
  if (recent.length > 50) recent.shift();
  try {
    window.dispatchEvent(new CustomEvent<CustomCodeEventDetail>(CUSTOM_CODE_EVENT, { detail: { name, params } }));
  } catch {
    // A store's own listener throwing must never break the shop.
  }
}
