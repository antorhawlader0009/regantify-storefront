// Quantity price breaks (TellMe idea 67). The same rule as the server's products/price-breaks.ts (checkout and the order use
// that one; this only shows the price while shopping, so a page and its order always agree).

export interface PriceBreak {
  minQty: number;
  price: number;
}

/** The break price for this many pieces of the product (all variants together), or null when no step applies. */
export function breakPriceFor(breaks: PriceBreak[] | null | undefined, quantity: number): number | null {
  if (!Array.isArray(breaks)) return null;
  let found: number | null = null;
  for (const b of breaks) {
    if (quantity >= b.minQty && (found === null || b.price < found)) found = b.price;
  }
  return found;
}

/** What a piece costs: the lowest of the price it would have had and the break price. A break never raises a price. */
export function priceWithBreaks(unitPrice: number, breaks: PriceBreak[] | null | undefined, quantity: number): number {
  const b = breakPriceFor(breaks, quantity);
  return b !== null && b < unitPrice ? b : unitPrice;
}
