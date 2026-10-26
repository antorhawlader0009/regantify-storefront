// Which storefront features shoppers use (IDEA-30): one small beacon per use, to the store's own API (nothing goes to an ad platform). Only the
// feature's key is sent, never anything about the shopper, and the server stores only "this store, this feature, this day: N". The keys are
// the list in server/src/storefront/feature-use.ts (the server refuses any other); add a key there first.
//
// Fire-and-forget: never awaited, never throws, never slows the shopper down. A feature that is only "opened" (a page, a dialog) is sent once
// per visit session (`oncePerSession`), so a refresh or a back button does not count it again; an action (a tick, a tap) counts every time.

import { apiOrigin } from './visitSession';
import { getShopperStore } from './customerAuthApi';

export type FeatureKey =
  | 'VOICE_SEARCH'
  | 'PHOTO_SEARCH'
  | 'COMPARE_ADD'
  | 'QUICK_ADD'
  | 'SIZE_GUIDE_OPEN'
  | 'DELIVERY_CHECK'
  | 'SHARE_OPEN'
  | 'WISHLIST_ADD'
  | 'BOX_ADDED'
  | 'GIFT_TICK'
  | 'CART_SHARE'
  | 'MAGAZINE_VIEW'
  | 'FAQ_VIEW'
  | 'LOCATIONS_VIEW'
  | 'GIFT_CARD_PAGE'
  | 'CONTACT_SENT'
  | 'INSTALL_APP_CLICK'
  | 'AI_CHAT_OPEN'
  | 'VOICE_CALL';

export function trackFeature(key: FeatureKey, opts: { oncePerSession?: boolean } = {}): void {
  try {
    const subdomain = getShopperStore();
    if (!subdomain) return;
    if (opts.oncePerSession) {
      const mark = `regantify-feature:${subdomain}:${key}`;
      if (sessionStorage.getItem(mark)) return;
      sessionStorage.setItem(mark, '1');
    }
    void fetch(`${apiOrigin()}/v1/store/${subdomain}/feature-use`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feature: key }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // sessionStorage can throw in some private modes; a count is never worth an error.
  }
}
