/**
 * Store > Store Away (holiday mode), from the store-info response (StoreSettingsService.activeStoreAway on
 * the backend). Null while the store is open, and on every theme but StorePal. TAKE_ORDERS = still selling,
 * delivery starts from returnDate; BROWSE_ONLY = the server refuses storefront orders until then.
 */
export interface StorefrontStoreAway {
  mode: 'TAKE_ORDERS' | 'BROWSE_ONLY';
  message: string | null;
  /** The day the store is back (YYYY-MM-DD, Dhaka); null = until the vendor turns it off. */
  returnDate: string | null;
}

/** Today in Dhaka as YYYY-MM-DD. */
function todayDhaka(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });
}

/**
 * The store-info answer is cached, so a Store Away whose return day has come may still be in it; this
 * drops it. Use it in the browser (after mount), where "today" is the shopper's real today.
 */
export function stillAway(away: StorefrontStoreAway | null | undefined): StorefrontStoreAway | null {
  if (!away) return null;
  if (away.returnDate && todayDhaka() >= away.returnDate) return null;
  return away;
}

/** "15 October" / "১৫ অক্টোবর" for the return day. */
export function formatReturnDay(day: string, language: 'en' | 'bn' = 'en'): string {
  return new Date(`${day}T00:00:00+06:00`).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    timeZone: 'Asia/Dhaka',
  });
}
