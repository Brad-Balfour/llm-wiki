import {
  APPROVED_WIKI_SOURCE_SCHEMA_VERSION,
  WIKI_CONFIDENCE_LEVELS,
  WIKI_ENTRY_TYPES,
  type ApprovedWikiSource,
} from './types.js';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const SOURCE_ITEM_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const SOURCE_PATH_PATTERN = /^sources\/tldr\/[A-Za-z0-9._/-]+$/;
const RAW_HTML_PATTERN = /<\/?[A-Za-z!][^>]*>/;
const MARKDOWN_LINK_PATTERN = /!?\[[^\]]*\]\s*\(/;
const CREDENTIAL_PATTERN =
  /(?:-----BEGIN [A-Z ]*PRIVATE KEY-----|\b(?:api[_ -]?key|access[_ -]?token|client[_ -]?secret|password)\s*[:=]\s*\S+)/i;

export function parseApprovedWikiSource(text: string): ApprovedWikiSource {
  let candidate: unknown;
  try {
    candidate = JSON.parse(stripMarkdownFence(text.trim()));
  } catch (error) {
    throw new Error(`Approved wiki source is not valid JSON: ${errorMessage(error)}`);
  }
  return validateApprovedWikiSource(candidate);
}

export function validateApprovedWikiSource(candidate: unknown): ApprovedWikiSource {
  const root = requireRecord(candidate, 'source record');
  rejectUnknownKeys(root, ['schema_version', 'approval', 'source', 'entry'], 'source record');

  if (root.schema_version !== APPROVED_WIKI_SOURCE_SCHEMA_VERSION) {
    throw new Error(`schema_version must be ${APPROVED_WIKI_SOURCE_SCHEMA_VERSION}`);
  }

  const approval = requireRecord(root.approval, 'approval');
  rejectUnknownKeys(
    approval,
    ['status', 'public', 'approved_at', 'reviewed_by', 'safety_review'],
    'approval'
  );
  if (approval.status !== 'approved' || approval.public !== true) {
    throw new Error('approval must explicitly set status=approved and public=true');
  }
  if (approval.reviewed_by !== 'brad') {
    throw new Error('approval.reviewed_by must be brad');
  }
  const approvedAt = requireString(approval.approved_at, 'approval.approved_at');
  if (!/^\d{4}-\d{2}-\d{2}T/.test(approvedAt) || Number.isNaN(Date.parse(approvedAt))) {
    throw new Error('approval.approved_at must be an ISO date-time');
  }
  const safetyReview = requireRecord(approval.safety_review, 'approval.safety_review');
  rejectUnknownKeys(
    safetyReview,
    ['privacy', 'publication_rights', 'dual_use'],
    'approval.safety_review'
  );
  for (const field of ['privacy', 'publication_rights', 'dual_use'] as const) {
    if (safetyReview[field] !== 'cleared') {
      throw new Error(`approval.safety_review.${field} must be cleared`);
    }
  }

  const source = requireRecord(root.source, 'source');
  rejectUnknownKeys(
    source,
    ['source_item_id', 'source_path', 'source_type', 'title', 'url', 'newsletter', 'edition_date'],
    'source'
  );
  if (source.source_type !== 'tldr') {
    throw new Error('source.source_type must be tldr for this MVP');
  }
  const sourcePath = requireString(source.source_path, 'source.source_path');
  if (
    !SOURCE_PATH_PATTERN.test(sourcePath) ||
    sourcePath.includes('..') ||
    sourcePath.includes('//')
  ) {
    throw new Error('source.source_path must be a safe path under sources/tldr/');
  }
  const sourceItemId = requireString(source.source_item_id, 'source.source_item_id');
  if (!SOURCE_ITEM_ID_PATTERN.test(sourceItemId)) {
    throw new Error('source.source_item_id contains unsupported characters');
  }
  const editionDate = requireString(source.edition_date, 'source.edition_date');
  if (!DATE_PATTERN.test(editionDate)) {
    throw new Error('source.edition_date must use YYYY-MM-DD');
  }

  const entry = requireRecord(root.entry, 'entry');
  rejectUnknownKeys(
    entry,
    ['type', 'slug', 'title', 'aliases', 'tags', 'confidence', 'summary', 'key_ideas', 'related'],
    'entry'
  );
  const slug = requireString(entry.slug, 'entry.slug');
  if (!SLUG_PATTERN.test(slug)) {
    throw new Error('entry.slug must be lowercase kebab-case');
  }
  const keyIdeas = requireStringArray(entry.key_ideas, 'entry.key_ideas');
  if (keyIdeas.length === 0) {
    throw new Error('entry.key_ideas must contain at least one item');
  }
  const related = requireStringArray(entry.related, 'entry.related');
  if (related.some((value) => !SLUG_PATTERN.test(value))) {
    throw new Error('entry.related values must be lowercase kebab-case');
  }

  const sourceTitle = requireSafeText(source.title, 'source.title', 300);
  const sourceUrl = requireHttpUrl(source.url, 'source.url');
  const newsletter = requireSafeText(source.newsletter, 'source.newsletter', 100);
  const entryTitle = requireSafeText(entry.title, 'entry.title', 300);
  const aliases = unique(requireStringArray(entry.aliases, 'entry.aliases')).map((value, index) =>
    requireSafeText(value, `entry.aliases[${index}]`, 100)
  );
  const tags = unique(requireStringArray(entry.tags, 'entry.tags')).map((value, index) =>
    requireSafeText(value, `entry.tags[${index}]`, 100)
  );
  const summary = requireSafeText(entry.summary, 'entry.summary', 2000);
  const safeKeyIdeas = unique(keyIdeas).map((value, index) =>
    requireSafeText(value, `entry.key_ideas[${index}]`, 1000)
  );

  return {
    schema_version: APPROVED_WIKI_SOURCE_SCHEMA_VERSION,
    approval: {
      status: 'approved',
      public: true,
      approved_at: approvedAt,
      reviewed_by: 'brad',
      safety_review: {
        privacy: 'cleared',
        publication_rights: 'cleared',
        dual_use: 'cleared',
      },
    },
    source: {
      source_item_id: sourceItemId,
      source_path: sourcePath,
      source_type: 'tldr',
      title: sourceTitle,
      url: sourceUrl,
      newsletter,
      edition_date: editionDate,
    },
    entry: {
      type: requireEnum(entry.type, WIKI_ENTRY_TYPES, 'entry.type'),
      slug,
      title: entryTitle,
      aliases,
      tags,
      confidence: requireEnum(entry.confidence, WIKI_CONFIDENCE_LEVELS, 'entry.confidence'),
      summary,
      key_ideas: safeKeyIdeas,
      related: unique(related),
    },
  };
}

function requireSafeText(candidate: unknown, field: string, maxLength: number): string {
  const value = requireString(candidate, field);
  if (value.length > maxLength) {
    throw new Error(`${field} exceeds the ${maxLength}-character limit`);
  }
  if (hasDisallowedControlCharacter(value)) {
    throw new Error(`${field} must be a single line without control characters`);
  }
  if (RAW_HTML_PATTERN.test(value) || MARKDOWN_LINK_PATTERN.test(value)) {
    throw new Error(`${field} contains raw HTML or a Markdown link`);
  }
  if (/\brange\.com\b/i.test(value)) {
    throw new Error(`${field} contains private-work context and must remain in review`);
  }
  if (CREDENTIAL_PATTERN.test(value)) {
    throw new Error(`${field} appears to contain credential material`);
  }
  return value;
}

function hasDisallowedControlCharacter(value: string): boolean {
  return [...value].some((character) => {
    const code = character.charCodeAt(0);
    return code === 10 || code === 13 || code === 127 || (code < 32 && code !== 9);
  });
}

function requireHttpUrl(candidate: unknown, field: string): string {
  const value = requireString(candidate, field);
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${field} must be a valid URL`);
  }
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) {
    throw new Error(`${field} must be an http(s) URL without embedded credentials`);
  }
  if (/[\s()[\]<>]/.test(value)) {
    throw new Error(`${field} contains characters that are unsafe in a Markdown link`);
  }
  const fragmentParameters = new URLSearchParams(parsed.hash.slice(1));
  for (const key of [...parsed.searchParams.keys(), ...fragmentParameters.keys()]) {
    if (isCredentialParameter(key)) {
      throw new Error(`${field} contains a credential-like URL parameter`);
    }
  }
  return value;
}

function isCredentialParameter(key: string): boolean {
  return /^(?:(?:x[-_])?api[-_]?key|access[-_]?(?:token|key)|auth[-_]?(?:token|key)|client[-_]?secret|x[-_]amz[-_]?(?:credential|signature|security[-_]token)|credential|signature|token|secret|password)$/i.test(
    key
  );
}

function stripMarkdownFence(text: string): string {
  const match = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(text);
  return match?.[1] ?? text;
}

function requireRecord(candidate: unknown, field: string): Record<string, unknown> {
  if (typeof candidate !== 'object' || candidate === null || Array.isArray(candidate)) {
    throw new Error(`${field} must be an object`);
  }
  return candidate as Record<string, unknown>;
}

function requireString(candidate: unknown, field: string): string {
  if (typeof candidate !== 'string' || candidate.trim().length === 0) {
    throw new Error(`${field} must be a non-empty string`);
  }
  return candidate;
}

function requireStringArray(candidate: unknown, field: string): string[] {
  if (!Array.isArray(candidate)) {
    throw new Error(`${field} must be an array`);
  }
  return candidate.map((value, index) => requireString(value, `${field}[${index}]`));
}

function requireEnum<const T extends readonly string[]>(
  candidate: unknown,
  values: T,
  field: string
): T[number] {
  if (typeof candidate !== 'string' || !values.includes(candidate)) {
    throw new Error(`${field} must be one of: ${values.join(', ')}`);
  }
  return candidate as T[number];
}

function rejectUnknownKeys(
  record: Record<string, unknown>,
  allowed: readonly string[],
  field: string
): void {
  const unknown = Object.keys(record).filter((key) => !allowed.includes(key));
  if (unknown.length > 0) {
    throw new Error(`${field} contains unsupported fields: ${unknown.join(', ')}`);
  }
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
