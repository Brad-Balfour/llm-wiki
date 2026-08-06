import { createHash } from 'node:crypto';

/**
 * Content digests used as stable identifiers and drift fingerprints.
 *
 * Every digest in this project is sha256 over UTF-8, but the surrounding shapes
 * differ by purpose, so each has a named function rather than a bare
 * `createHash` chain at the point of use.
 */

/** A full `sha256:<hex>` fingerprint, used to detect drift in stored records. */
export function sha256Fingerprint(value: string): string {
  return `sha256:${createHash('sha256').update(value, 'utf8').digest('hex')}`;
}

/**
 * A short digest for readable, stable record ids. Truncation is deliberate:
 * these identify local records, they are not a security boundary.
 */
export function shortDigest(value: string, length = 16): string {
  return createHash('sha256').update(value, 'utf8').digest('hex').slice(0, length);
}
