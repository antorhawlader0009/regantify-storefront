// What a shopper sees as the order number (tracking-plan.md Step 2): the public code
// ("FAS-261003-7K3M9QD"), or the old "ORDER-12" for an order that has none yet.
export function orderLabel(order: { publicCode?: string | null; invoiceNumber: number }): string {
  return order.publicCode ?? `ORDER-${order.invoiceNumber}`;
}

/**
 * Reads what a shopper typed into an order-number box: digits (with an optional "ORDER-" or "#")
 * are the old serial, anything else is sent as a public code for the server to check.
 */
export function parseOrderReference(input: string): number | string | null {
  const text = input.trim();
  if (!text) return null;
  const stripped = text.replace(/^#|^ORDER-(?=\d+$)/i, '');
  if (/^\d{1,9}$/.test(stripped)) return Number(stripped);
  return text;
}
