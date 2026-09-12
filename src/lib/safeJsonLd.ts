/**
 * Safely serializes an object for use inside a
 * <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ... }} />
 * tag.
 *
 * Why this exists: JSON.stringify() alone is NOT safe here. A product's
 * name/description/brand can contain arbitrary vendor-entered text
 * (e.g. `</script><script>alert(1)</script>`), and JSON.stringify does
 * nothing to it — it's valid JSON either way. The browser's HTML parser
 * doesn't know or care that it's "inside JSON"; it just scans for the
 * literal characters "</script" and closes the tag right there,
 * letting whatever text follows run as a brand-new, real <script>. That
 * was a live stored-XSS hole: a product named
 * `<script>alert(1)</script>` executed on its own storefront page.
 *
 * The fix is the same one Next.js's own docs recommend for this exact
 * pattern: escape the handful of characters that can affect HTML/script
 * parsing, using their JSON \uXXXX unicode-escape form (valid inside a
 * JSON string, invisible to JSON.parse, but no longer meaningful to the
 * HTML tokenizer):
 *  - "<" and ">"      -> can't form "</script>" or any other tag
 *  - "&"              -> can't form an HTML entity
 *  - U+2028 / U+2029  -> legal in JSON strings but illegal as raw
 *                        characters in some older JS parsers/edge cases
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
