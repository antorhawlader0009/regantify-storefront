/**
 * A short-lived cache, in the shopper's browser tab, for the small public store answers the header, footer and
 * checkout pages ask for after they mount (store info, pages, FAQ, contact, locations, gift cards...). Those parts
 * remount on every page change, so without this each click asked for the same answers again (6 to 8 requests a page).
 *
 * One request per address per 2 minutes; two parts asking at once share it. A failed answer is not kept, so the next
 * page tries again. Only in the browser: on the server every call goes to the network, so nothing is shared between
 * requests.
 */
const TTL_MS = 2 * 60 * 1000;
const cache = new Map<string, { at: number; promise: Promise<unknown> }>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fetchJsonForVisit<T = any>(url: string): Promise<T | null> {
  const load = () =>
    fetch(url)
      .then((res) => (res.ok ? (res.json() as Promise<T>) : null))
      .catch(() => null);
  if (typeof window === 'undefined') return load();
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.promise as Promise<T | null>;
  const promise = load().then((data) => {
    if (data === null) cache.delete(url);
    return data;
  });
  cache.set(url, { at: Date.now(), promise });
  return promise;
}
