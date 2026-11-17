/**
 * Security review P-29 (login CSRF): a store page swaps a `?rgf_login=` code for a sign-in only when THIS tab started that sign-in.
 *
 * Before sending the shopper to the central Regantify page, the store page keeps a random value in sessionStorage and puts it on the
 * address the central page returns to (`rgf_state`); the server keeps that address as it is and only adds `rgf_login`. Back on the store,
 * RegantifyLoginCatcher swaps the code only when the two match. A link someone else made (with a code for THEIR account) has no matching
 * value in the shopper's tab, so it can't sign the shopper in as someone else.
 *
 * The Regantify Android app passes codes it made itself (no central page in between), so pages inside the app (window.RegantifyApp) skip it.
 */

const KEY = 'rgf-login-state';
export const LOGIN_STATE_PARAM = 'rgf_state';

function randomState(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** `href` with a fresh state on it, remembered for this tab. Call right before leaving for the central page. */
export function withLoginState(href: string): string {
  const state = randomState();
  try {
    sessionStorage.setItem(KEY, state);
  } catch {
    // Storage blocked: the sign-in then can't be finished on this tab, which is the safe side.
  }
  const url = new URL(href);
  url.searchParams.set(LOGIN_STATE_PARAM, state);
  return url.toString();
}

/** True when `state` (from the returned address) is the one this tab kept. The kept value is used once. */
export function takeLoginState(state: string | null): boolean {
  let kept: string | null = null;
  try {
    kept = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
  } catch {
    return false;
  }
  return !!state && !!kept && state === kept;
}
