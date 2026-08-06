import { requireString } from './validate.js';

/**
 * URL rules differ by destination, so callers declare the strictness they need
 * instead of each owning a copy. Four variants of this check previously existed
 * and had drifted: one let the URL constructor throw a bare TypeError, one
 * rejected embedded credentials, one also guarded Markdown safety.
 */
export interface HttpUrlRules {
  /** Reject `user:pass@` in the authority. Changes the failure wording. */
  rejectCredentials?: boolean;
  /** Reject characters that would break out of a Markdown link. */
  markdownSafe?: boolean;
  /** Reject credential-like query or fragment parameters. */
  rejectCredentialParams?: boolean;
  /** Restrict to HTTPS only. */
  httpsOnly?: boolean;
  /**
   * Require the value to be spelled as a canonical URL: a lowercase scheme and
   * no whitespace anywhere. The URL constructor normalizes both, so `HTTPS://x`
   * and a space-padded value would otherwise parse as valid. Records that must
   * match a stored URL byte-for-byte need this.
   */
  exactSpelling?: boolean;
}

export function requireHttpUrl(
  candidate: unknown,
  field: string,
  rules: HttpUrlRules = {}
): string {
  const value = requireString(candidate, field);
  const description = rules.rejectCredentials
    ? 'a credential-free HTTP(S) URL'
    : rules.httpsOnly
      ? 'an HTTPS URL'
      : 'an HTTP(S) URL';

  if (rules.exactSpelling && !/^https?:\/\/\S+$/.test(value)) {
    throw new Error(`${field} must be ${description}`);
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${field} must be ${description}`);
  }

  const allowedProtocols = rules.httpsOnly ? ['https:'] : ['http:', 'https:'];
  if (!allowedProtocols.includes(parsed.protocol)) {
    throw new Error(`${field} must be ${description}`);
  }
  if (rules.rejectCredentials && (parsed.username || parsed.password)) {
    throw new Error(`${field} must be ${description}`);
  }
  if (rules.markdownSafe && /[\s()[\]<>]/.test(value)) {
    throw new Error(`${field} contains characters that are unsafe in a Markdown link`);
  }
  if (rules.rejectCredentialParams) {
    const fragmentParameters = new URLSearchParams(parsed.hash.slice(1));
    for (const key of [...parsed.searchParams.keys(), ...fragmentParameters.keys()]) {
      if (isCredentialParameter(key)) {
        throw new Error(`${field} contains a credential-like URL parameter`);
      }
    }
  }
  return value;
}

export function isCredentialParameter(key: string): boolean {
  return /^(?:(?:x[-_])?api[-_]?key|access[-_]?(?:token|key)|auth[-_]?(?:token|key)|client[-_]?secret|x[-_]amz[-_]?(?:credential|signature|security[-_]token)|credential|signature|token|secret|password)$/i.test(
    key
  );
}
