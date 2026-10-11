// Shop and support hours (TellMe idea 73): Sunday ("0") to Saturday ("6"), Dhaka time. Information only.

export type DayHours = { open: boolean; from: string; to: string };
export type BusinessHours = Record<string, DayHours>;

const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;

function dhakaParts(now: Date): { day: number; minutes: number } {
  const d = new Date(now.getTime() + DHAKA_OFFSET_MS);
  return { day: d.getUTCDay(), minutes: d.getUTCHours() * 60 + d.getUTCMinutes() };
}

const toMinutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

/** "10:00 AM" from "10:00". */
export function timeLabel(t: string): string {
  const h = Number(t.slice(0, 2));
  return `${h % 12 === 0 ? 12 : h % 12}:${t.slice(3, 5)} ${h < 12 ? 'AM' : 'PM'}`;
}

/** True while the shop is inside today's hours. */
export function isOpenNow(hours: BusinessHours, now = new Date()): boolean {
  const { day, minutes } = dhakaParts(now);
  const today = hours[String(day)];
  return !!today?.open && minutes >= toMinutes(today.from) && minutes < toMinutes(today.to);
}

/** When the shop opens next: today (still ahead), or the next open day. Null when no day is open. */
export function nextOpening(hours: BusinessHours, now = new Date()): { daysAhead: number; from: string; dayIndex: number } | null {
  const { day, minutes } = dhakaParts(now);
  for (let ahead = 0; ahead < 8; ahead++) {
    const idx = (day + ahead) % 7;
    const h = hours[String(idx)];
    if (h?.open && (ahead > 0 || minutes < toMinutes(h.from))) return { daysAhead: ahead, from: h.from, dayIndex: idx };
  }
  return null;
}
