// Shared cart links (TellMe idea 77): the cart is the link. [[productSlug, quantity, { option: value }], ...] as base64url JSON,
// at most 20 lines. The server looks every line up again (StorefrontService.getSharedCart), so the link carries no prices.
export const MAX_CART_LINK_LINES = 20;

export function encodeCartLink(lines: Array<{ productSlug: string; quantity: number; selectedOptions: Record<string, string> }>): string {
  const rows = lines.slice(0, MAX_CART_LINK_LINES).map((l) => (Object.keys(l.selectedOptions).length > 0 ? [l.productSlug, l.quantity, l.selectedOptions] : [l.productSlug, l.quantity]));
  const bytes = new TextEncoder().encode(JSON.stringify(rows));
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
