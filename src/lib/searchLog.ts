// What shoppers type into the store's search box, for the vendor's Analytics > Products > "What shoppers search
// for": the word and how many products it found, sent to the store's own API (nothing goes to an ad platform).
// Once per word per visit session, fire-and-forget: never awaited, never throws, never slows the shopper down.
// The server drops words that look like a phone number, an email or a link before counting anything.

import { apiOrigin } from './visitSession';

const MAX_REMEMBERED = 30;

export function logSearch(subdomain: string, term: string, results: number) {
  try {
    const word = term.trim();
    if (word.length < 2) return;
    const key = `regantify-search-log:${subdomain}`;
    const seen: string[] = JSON.parse(sessionStorage.getItem(key) ?? '[]');
    const lower = word.toLowerCase();
    if (seen.includes(lower)) return;
    sessionStorage.setItem(key, JSON.stringify([...seen, lower].slice(-MAX_REMEMBERED)));
    void fetch(`${apiOrigin()}/v1/store/${subdomain}/searches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ term: word.slice(0, 200), results }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // sessionStorage can throw in some private modes; a search word is never worth an error.
  }
}
