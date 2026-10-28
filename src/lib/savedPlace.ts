/**
 * The shopper's delivery place (district + thana/upazila), remembered in this browser per store (2026-10-28, the owner's
 * request: picked once, it shows everywhere). The product page's delivery check and the checkout both read it and both
 * write it when the shopper changes it, so the two always show the same place. Nothing is stored on the server.
 * Older browsers may still hold only a district under the previous key; it is read as a fallback.
 */
const KEY = 'storepal-delivery-place:';
const OLD_DISTRICT_KEY = 'storepal-delivery-district:';

export interface SavedPlace {
  district: string;
  thana: string;
  /** The area inside the thana (optional, "Mirpur-10"); older saves have none. */
  area?: string;
}

export function readSavedPlace(subdomain: string): SavedPlace | null {
  try {
    const raw = localStorage.getItem(KEY + subdomain);
    if (raw) {
      const p = JSON.parse(raw) as Partial<SavedPlace>;
      if (typeof p.district === 'string' && p.district.trim()) {
        return {
          district: p.district.slice(0, 100),
          thana: typeof p.thana === 'string' ? p.thana.slice(0, 100) : '',
          area: typeof p.area === 'string' ? p.area.slice(0, 100) : '',
        };
      }
    }
    const old = localStorage.getItem(OLD_DISTRICT_KEY + subdomain);
    return old ? { district: old.slice(0, 100), thana: '' } : null;
  } catch {
    return null;
  }
}

export function writeSavedPlace(subdomain: string, place: SavedPlace): void {
  try {
    if (place.district.trim()) {
      // A save that doesn't name an area (the checkout) keeps the one already saved for the same thana.
      let area = place.area;
      if (area === undefined) {
        const before = readSavedPlace(subdomain);
        area = before && before.district === place.district && before.thana === place.thana ? (before.area ?? '') : '';
      }
      localStorage.setItem(KEY + subdomain, JSON.stringify({ district: place.district, thana: place.thana, area }));
    }
    else localStorage.removeItem(KEY + subdomain);
    localStorage.removeItem(OLD_DISTRICT_KEY + subdomain);
  } catch {
    // Storage blocked: the place is just not remembered.
  }
}
