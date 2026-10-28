/**
 * Text a seller typed that may hold editor HTML (a product summary pasted from the description editor, or written by the
 * product AI assistant), shown as plain text: tags removed, paragraph and line breaks kept as new lines (render it with
 * `whitespace-pre-line`), the common entities decoded. Never returns HTML, so it is safe to drop into any element.
 */
const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" };

export function plainText(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/\s*(p|div|li|h[1-6])\s*>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&(#?\w+);/g, (m, name: string) => {
      if (ENTITIES[name]) return ENTITIES[name];
      const code = name.startsWith('#x') ? parseInt(name.slice(2), 16) : name.startsWith('#') ? parseInt(name.slice(1), 10) : NaN;
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    })
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
