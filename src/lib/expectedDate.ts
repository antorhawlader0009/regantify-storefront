// "Mon 6 Oct" from the delivery estimate (tracking-plan.md Step 7). The estimate is a Bangladesh calendar
// date: "2026-10-06" from checkout, or the order's stored date as ISO midnight UTC. Formatted in UTC so it
// never shifts a day with the shopper's time zone.
export function formatExpectedDate(value: string, lang: 'en' | 'bn' = 'en'): string {
  const date = new Date(value.length === 10 ? `${value}T00:00:00Z` : value);
  if (Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat(lang === 'bn' ? 'bn-BD' : 'en-GB', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' }).formatToParts(date);
  const pick = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${pick('weekday')} ${pick('day')} ${pick('month')}`;
}
