// Store > GDPR Prompt's consent flag — the Accept click in StorePal's
// GdprPrompt writes it, and anything that tracks shoppers (the Meta pixel,
// see lib/metaPixel.ts) reads it. Per store, in localStorage only; never
// sent to the server.

export const GDPR_CONSENT_EVENT = 'storepal:gdpr-consent';

const storageKey = (subdomain: string) => `storepal:gdpr-consent:${subdomain}`;

export function hasGdprConsent(subdomain: string): boolean {
  try {
    return localStorage.getItem(storageKey(subdomain)) === 'accepted';
  } catch {
    return false;
  }
}

/** Remembers the shopper's Accept and tells listeners (same tab) right away. */
export function grantGdprConsent(subdomain: string) {
  try {
    localStorage.setItem(storageKey(subdomain), 'accepted');
  } catch {
    // Storage blocked (private mode etc.) — consent still counts for this page view.
  }
  window.dispatchEvent(new CustomEvent(GDPR_CONSENT_EVENT, { detail: { subdomain } }));
}
