/**
 * Structural validation primitives shared by every contract parser.
 *
 * These were previously redeclared in nine modules under four different names,
 * with wording and rules that had drifted apart. One declaration per rule, one
 * message per failure class. Every message names the offending field first, so
 * an operator can locate the problem without reading the validator.
 */

export function requireRecord(candidate: unknown, field: string): Record<string, unknown> {
  if (typeof candidate !== 'object' || candidate === null || Array.isArray(candidate)) {
    throw new Error(`${field} must be an object`);
  }
  return candidate as Record<string, unknown>;
}

export function optionalRecord(candidate: unknown): Record<string, unknown> | undefined {
  if (typeof candidate !== 'object' || candidate === null || Array.isArray(candidate)) {
    return undefined;
  }
  return candidate as Record<string, unknown>;
}

export function requireArray(candidate: unknown, field: string): unknown[] {
  if (!Array.isArray(candidate)) {
    throw new Error(`${field} must be an array`);
  }
  return candidate;
}

/** A contract string is always non-empty; whitespace alone is not a value. */
export function requireString(candidate: unknown, field: string): string {
  if (typeof candidate !== 'string' || candidate.trim().length === 0) {
    throw new Error(`${field} must be a non-empty string`);
  }
  return candidate;
}

export function optionalString(candidate: unknown, field: string): string | undefined {
  return candidate === undefined ? undefined : requireString(candidate, field);
}

export function requireStringArray(candidate: unknown, field: string): string[] {
  return requireArray(candidate, field).map((item, index) =>
    requireString(item, `${field}[${index}]`)
  );
}

export function requireEnum<const T extends readonly string[]>(
  candidate: unknown,
  values: T,
  field: string
): T[number] {
  if (typeof candidate !== 'string' || !values.includes(candidate)) {
    throw new Error(`${field} must be one of: ${values.join(', ')}`);
  }
  return candidate as T[number];
}

export function requirePositiveInteger(candidate: unknown, field: string): number {
  if (typeof candidate !== 'number' || !Number.isInteger(candidate) || candidate < 1) {
    throw new Error(`${field} must be a positive integer`);
  }
  return candidate;
}

/** Classifier and routing scores are always a 0-through-1 confidence. */
export function requireScore(candidate: unknown, field: string): number {
  if (
    typeof candidate !== 'number' ||
    !Number.isFinite(candidate) ||
    candidate < 0 ||
    candidate > 1
  ) {
    throw new Error(`${field} must be a number from 0 through 1`);
  }
  return candidate;
}

export function requireUniqueStrings(values: string[], field: string): void {
  if (new Set(values).size !== values.length) {
    throw new Error(`${field} must contain unique values`);
  }
}

export function rejectUnknownKeys(
  record: Record<string, unknown>,
  allowed: readonly string[],
  field: string
): void {
  const unsupported = Object.keys(record).filter((key) => !allowed.includes(key));
  if (unsupported.length > 0) {
    throw new Error(`${field} contains unsupported fields: ${unsupported.join(', ')}`);
  }
}
