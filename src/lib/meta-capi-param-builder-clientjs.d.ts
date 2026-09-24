// Meta's client-side Conversions API parameter builder ships no types.
// Only the calls this app uses are declared. See
// https://github.com/facebook/capi-param-builder/tree/main/client_js
declare module 'meta-capi-param-builder-clientjs' {
  /** Reads fbclid from the URL/referrer (or the FB/IG in-app browser), writes the _fbc/_fbp cookies and returns them. */
  export function processAndCollectAllParams(
    url?: string | null,
    getIpFn?: () => string | Promise<string>,
  ): Promise<{ _fbc?: string; _fbp?: string; _fbi?: string }>;
  export function getFbc(): string;
  export function getFbp(): string;
}
