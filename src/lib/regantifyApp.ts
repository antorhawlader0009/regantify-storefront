/**
 * `window.RegantifyApp`: the small object the Regantify Android app puts on a shop's page (the app's Bridge). It exists only inside the
 * app, only for the shop that is open, and never carries a token. Outside the app it is undefined, so every use must be optional.
 */
export interface RegantifyAppBridge {
  isApp: boolean;
  version: string;
  flavor: string;
  /** Shares a text and a link with the phone's share sheet. */
  share(text: string, url: string): void;
  /** Opens the app's own sign-in (Google account of the phone, or a texted code); the app then reloads this shop signed in. Returns nothing. */
  signIn(): void;
  /** Own app only: opens an address of the central Regantify sign-in in the phone's browser (Custom Tabs). The app checks the address. */
  signInBrowser?(url: string): void;
}

export function getRegantifyApp(): RegantifyAppBridge | null {
  if (typeof window === 'undefined') return null;
  const bridge = (window as unknown as { RegantifyApp?: RegantifyAppBridge }).RegantifyApp;
  return bridge && bridge.isApp ? bridge : null;
}
