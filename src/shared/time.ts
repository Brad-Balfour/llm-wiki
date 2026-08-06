import { requireString } from './validate.js';

const CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const RFC_3339 =
  /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/;

/**
 * A calendar date must be real, not merely well-shaped. `Date.parse` alone is
 * not enough: it accepts `2026-02-31` and silently rolls it forward to 3 March,
 * which previously let one validator accept a date another rejected.
 */
export function requireDate(candidate: unknown, field: string): string {
  const value = requireString(candidate, field);
  const match = CALENDAR_DATE.exec(value);
  if (match === null) {
    throw new Error(`${field} must use YYYY-MM-DD`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error(`${field} must be a real calendar date`);
  }
  return value;
}

/** An RFC 3339 date-time carrying an explicit timezone, on a real calendar date. */
export function requireDateTime(candidate: unknown, field: string): string {
  const value = requireString(candidate, field);
  if (!RFC_3339.test(value) || Number.isNaN(Date.parse(value))) {
    throw new Error(`${field} must be an RFC 3339 timestamp with a timezone`);
  }
  requireDate(value.slice(0, 10), `${field} date`);
  return value;
}

/** A permissive timestamp for records this project did not mint itself. */
export function requireIsoTimestamp(candidate: unknown, field: string): string {
  const value = requireString(candidate, field);
  if (!Number.isFinite(Date.parse(value))) {
    throw new Error(`${field} must be an ISO timestamp`);
  }
  return value;
}
