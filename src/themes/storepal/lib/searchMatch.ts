/**
 * Does this product answer a search? Its name, or one of the hidden words the store added ("also found as", TellMe
 * idea 23: "kurta, কুর্তা" on a Panjabi). Plain case-insensitive "contains", the same rule the name always used, so a
 * store with no search words searches exactly as before. `query` is already trimmed and lower-cased by the caller.
 */
export function matchesSearch(product: { name: string; searchKeywords?: string[] | null }, query: string): boolean {
  if (!query) return true;
  if (product.name.toLowerCase().includes(query)) return true;
  return (product.searchKeywords ?? []).some((word) => word.toLowerCase().includes(query));
}
