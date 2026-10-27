// "My wishlist" share link, shared by every template: the list is the link (no account, nothing stored on the server). base64url JSON
// { n: the sharer's name (optional), s: product slugs }. The page looks every slug up in the store's live catalog, so a hidden or
// deleted product just drops out and prices are today's.
export const MAX_SHARED_WISHLIST = 24;
const MAX_NAME = 40;

export interface SharedWishlist {
  name: string | null;
  slugs: string[];
}

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function encodeWishlistLink(slugs: string[], name?: string): string {
  const n = (name ?? '').replace(/\s+/g, ' ').trim().slice(0, MAX_NAME);
  return toBase64Url(JSON.stringify({ ...(n ? { n } : {}), s: slugs.slice(0, MAX_SHARED_WISHLIST) }));
}

/** The list inside a link, or null when it isn't one (works on the server and in the browser). */
export function decodeWishlistLink(code: string): SharedWishlist | null {
  try {
    if (!/^[A-Za-z0-9_-]{1,4000}$/.test(code)) return null;
    const b64 = code.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((code.length + 3) % 4);
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const data = JSON.parse(new TextDecoder().decode(bytes)) as { n?: unknown; s?: unknown };
    if (!Array.isArray(data.s)) return null;
    const slugs = [...new Set(data.s.filter((s): s is string => typeof s === 'string' && /^[^/?#\s]{1,200}$/.test(s)))].slice(0, MAX_SHARED_WISHLIST);
    if (slugs.length === 0) return null;
    const name = typeof data.n === 'string' ? data.n.replace(/\s+/g, ' ').trim().slice(0, MAX_NAME) || null : null;
    return { name, slugs };
  } catch {
    return null;
  }
}
