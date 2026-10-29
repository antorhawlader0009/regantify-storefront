// "Mon 6 Oct" from the delivery estimate (tracking-plan.md Step 7). The estimate is a Bangladesh calendar
// date: "2026-10-06" from checkout, or the order's stored date as ISO midnight UTC. Formatted in UTC so it
// never shifts a day with the shopper's time zone.
export function formatExpectedDate(value: string, lang: 'en' | 'bn' = 'en'): string {
  const date = new Date(value.length === 10 ? `${value}T00:00:00Z` : value);
  if (Number.isNaN(date.getTime())) return '';
  // Bangla is written in full ("শনিবার, 31 অক্টোবর"): the short Bangla forms are cut-off words (2026-10-29, the owner's request).
  // English stays short ("Sat 31 Oct"). Digits are always English (the owner's rule).
  const bn = lang === 'bn';
  const style = bn ? 'long' : 'short';
  const parts = new Intl.DateTimeFormat(bn ? 'bn-BD-u-nu-latn' : 'en-GB', { timeZone: 'UTC', weekday: style, day: 'numeric', month: style }).formatToParts(date);
  const pick = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return bn ? `${pick('weekday')}, ${pick('day')} ${pick('month')}` : `${pick('weekday')} ${pick('day')} ${pick('month')}`;
}
