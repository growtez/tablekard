// ==========================================
// Date & Time Formatting Utilities
// ==========================================
// Single source of truth for all date/time display formatting.
// All formatters force IST (Asia/Kolkata) so output is consistent
// regardless of the user's browser timezone.

const LOCALE = 'en-IN';
const TIMEZONE = 'Asia/Kolkata';

type DateInput = string | Date | null | undefined;

// ─── Helpers ──────────────────────────────────

function toDate(input: DateInput): Date | null {
  if (!input) return null;
  const d = input instanceof Date ? input : new Date(input);
  return isNaN(d.getTime()) ? null : d;
}

// ─── Display Formatters ───────────────────────

/** "13/08/2026" — DD/MM/YYYY */
export function formatDate(input: DateInput): string {
  const d = toDate(input);
  if (!d) return '—';
  return d.toLocaleDateString(LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: TIMEZONE,
  });
}

/** "13 Aug 2026" — for cards, lists, tables */
export function formatDateShort(input: DateInput): string {
  const d = toDate(input);
  if (!d) return '—';
  return d.toLocaleDateString(LOCALE, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: TIMEZONE,
  });
}

/** "13 August 2026" — for detail pages */
export function formatDateLong(input: DateInput): string {
  const d = toDate(input);
  if (!d) return '—';
  return d.toLocaleDateString(LOCALE, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: TIMEZONE,
  });
}

/** "13/08/2026, 08:37 pm" — date + time */
export function formatDateTime(input: DateInput): string {
  const d = toDate(input);
  if (!d) return '—';
  return d.toLocaleString(LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: TIMEZONE,
  });
}

/** "13 Aug 2026, 08:37 pm" — short date + time */
export function formatDateTimeShort(input: DateInput): string {
  const d = toDate(input);
  if (!d) return '—';
  return d.toLocaleString(LOCALE, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: TIMEZONE,
  });
}

/** "13 August 2026, 08:37 pm" — long date + time (detail pages) */
export function formatDateTimeLong(input: DateInput): string {
  const d = toDate(input);
  if (!d) return '—';
  return d.toLocaleString(LOCALE, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: TIMEZONE,
  });
}

// ─── Chart / Axis Label Formatters ────────────

/** "Aug 2026" — month + year for chart grouping */
export function formatMonthYear(input: DateInput): string {
  const d = toDate(input);
  if (!d) return '—';
  return d.toLocaleDateString(LOCALE, {
    month: 'short',
    year: 'numeric',
    timeZone: TIMEZONE,
  });
}

/** "August 2026" — long month + year */
export function formatMonthYearLong(input: DateInput): string {
  const d = toDate(input);
  if (!d) return '—';
  return d.toLocaleDateString(LOCALE, {
    month: 'long',
    year: 'numeric',
    timeZone: TIMEZONE,
  });
}

/** "13 Aug" — day + short month (compact chart labels) */
export function formatDayMonth(input: DateInput): string {
  const d = toDate(input);
  if (!d) return '—';
  return d.toLocaleDateString(LOCALE, {
    day: 'numeric',
    month: 'short',
    timeZone: TIMEZONE,
  });
}

/** "Mon" — weekday short (chart axis) */
export function formatWeekday(input: DateInput): string {
  const d = toDate(input);
  if (!d) return '—';
  return d.toLocaleDateString(LOCALE, {
    weekday: 'short',
    timeZone: TIMEZONE,
  });
}

/** "Aug '26" — month + 2-digit year (compact chart labels) */
export function formatMonthYearCompact(input: DateInput): string {
  const d = toDate(input);
  if (!d) return '—';
  return d.toLocaleDateString(LOCALE, {
    month: 'short',
    year: '2-digit',
    timeZone: TIMEZONE,
  });
}

// ─── Special Formatters ──────────────────────

/** "Monday, 13 August 2026" — full date for dashboard headers */
export function formatFullDate(input: DateInput): string {
  const d = toDate(input);
  if (!d) return '—';
  return d.toLocaleDateString(LOCALE, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: TIMEZONE,
  });
}

/** "13 Aug – 19 Aug, 2026" — date range for week labels */
export function formatDateRange(start: DateInput, end: DateInput): string {
  const s = toDate(start);
  const e = toDate(end);
  if (!s || !e) return '—';
  const sStr = s.toLocaleDateString(LOCALE, { month: 'short', day: 'numeric', timeZone: TIMEZONE });
  const eStr = e.toLocaleDateString(LOCALE, { month: 'short', day: 'numeric', timeZone: TIMEZONE });
  return `${sStr} – ${eStr}, ${e.toLocaleDateString(LOCALE, { year: 'numeric', timeZone: TIMEZONE })}`;
}

/** Relative time: "Just now", "5m ago", "3h ago", "2d ago" then falls back to formatDateShort */
export function formatRelative(input: DateInput): string {
  const d = toDate(input);
  if (!d) return '—';
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDateShort(d);
}
