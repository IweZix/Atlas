import { fromZonedTime, toZonedTime } from 'date-fns-tz';

export const SITE_TIMEZONE = 'Europe/Brussels';

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function parseDateOnly(dateOnly: string) {
  const match = dateOnly.match(DATE_ONLY_PATTERN);
  if (!match) throw new Error(`Invalid date-only string: ${dateOnly}`);
  const [, year, month, day] = match;
  return { year: Number(year), month: Number(month), day: Number(day) };
}

function formatDateOnly(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Pure UTC integer arithmetic — never date-fns's addDays/subDays, which
 * decompose using the runtime's LOCAL timezone and would silently
 * reintroduce the server-timezone dependency this module exists to avoid.
 */
function shiftDateString(dateOnly: string, deltaDays: number): string {
  const { year, month, day } = parseDateOnly(dateOnly);
  const shifted = new Date(Date.UTC(year, month - 1, day + deltaDays));
  return formatDateOnly(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth() + 1,
    shifted.getUTCDate(),
  );
}

export function startDateInputToUtc(dateOnly: string): Date {
  return fromZonedTime(`${dateOnly}T00:00:00`, SITE_TIMEZONE);
}

export function endDateInputToUtc(dateOnly: string): Date {
  const nextDay = shiftDateString(dateOnly, 1);
  return fromZonedTime(`${nextDay}T00:00:00`, SITE_TIMEZONE);
}

/**
 * Reads a UTC timestamp back via the zoned Date's LOCAL getters — this is
 * how date-fns-tz's toZonedTime() is designed to be read: it shifts the
 * underlying instant so that local getters (not UTC getters) yield the
 * wall-clock time in SITE_TIMEZONE, independent of the runtime's own local
 * timezone. Verified empirically across three different process TZs
 * (Europe/Brussels, America/New_York, Asia/Tokyo) — local getters gave the
 * identical, correct Brussels date in every case; UTC getters did not.
 */
function zonedDateToInputValue(utc: string | Date): string {
  const zoned = toZonedTime(utc, SITE_TIMEZONE);
  return formatDateOnly(
    zoned.getFullYear(),
    zoned.getMonth() + 1,
    zoned.getDate(),
  );
}

export function utcToStartDateInputValue(utc: string | Date): string {
  return zonedDateToInputValue(utc);
}

export function utcToEndDateInputValue(utc: string | Date): string {
  return shiftDateString(zonedDateToInputValue(utc), -1);
}

/** Locale-aware display of a full timestamp, e.g. "20 août 2026, 14:32". */
export function formatDisplayDateTime(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: SITE_TIMEZONE,
  }).format(new Date(iso));
}

/** Locale-aware display of a "YYYY-MM-DD" value, e.g. "20 août" / "August 20". */
export function formatDisplayDate(dateOnly: string, locale: string): string {
  const { year, month, day } = parseDateOnly(dateOnly);
  const date = new Date(Date.UTC(year, month - 1, day));
  const monthName = new Intl.DateTimeFormat(locale, {
    month: 'long',
    timeZone: 'UTC',
  }).format(date);

  if (locale.startsWith('fr')) {
    return day === 1 ? `1er ${monthName}` : `${day} ${monthName}`;
  }
  return `${monthName} ${day}`;
}

export type AnnouncementPeriod =
  | { kind: 'unlimited' }
  | { kind: 'from'; date: string }
  | { kind: 'until'; date: string }
  | { kind: 'range'; start: string; end: string };

/**
 * Structure only — raw "YYYY-MM-DD" values, no locale text. Callers format
 * each date via formatDisplayDate() and supply the sentence via tKeys.
 */
export function getAnnouncementPeriod(
  startsAt: string | null,
  endsAt: string | null,
): AnnouncementPeriod {
  const start = startsAt ? utcToStartDateInputValue(startsAt) : null;
  const end = endsAt ? utcToEndDateInputValue(endsAt) : null;

  if (start && end) return { kind: 'range', start, end };
  if (start) return { kind: 'from', date: start };
  if (end) return { kind: 'until', date: end };
  return { kind: 'unlimited' };
}
