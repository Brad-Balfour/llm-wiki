import {
  APPROVED_WIKI_SOURCE_SCHEMA_VERSION,
  WIKI_CONFIDENCE_LEVELS,
  WIKI_ENTRY_TYPES,
  type ApprovedWikiSource,
} from './types.js';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

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
  rejectUnknownKeys(approval, ['status', 'public', 'approved_at'], 'approval');
  if (approval.status !== 'approved' || approval.public !== true) {
    throw new Error('approval must explicitly set status=approved and public=true');
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
  if (!sourcePath.startsWith('sources/tldr/')) {
    throw new Error('source.source_path must be under sources/tldr/');
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

  return {
    schema_version: APPROVED_WIKI_SOURCE_SCHEMA_VERSION,
    approval: {
      status: 'approved',
      public: true,
      approved_at: requireString(approval.approved_at, 'approval.approved_at'),
    },
    source: {
      source_item_id: requireString(source.source_item_id, 'source.source_item_id'),
      source_path: sourcePath,
      source_type: 'tldr',
      title: requireString(source.title, 'source.title'),
      url: requireString(source.url, 'source.url'),
      newsletter: requireString(source.newsletter, 'source.newsletter'),
      edition_date: editionDate,
    },
    entry: {
      type: requireEnum(entry.type, WIKI_ENTRY_TYPES, 'entry.type'),
      slug,
      title: requireString(entry.title, 'entry.title'),
      aliases: unique(requireStringArray(entry.aliases, 'entry.aliases')),
      tags: unique(requireStringArray(entry.tags, 'entry.tags')),
      confidence: requireEnum(entry.confidence, WIKI_CONFIDENCE_LEVELS, 'entry.confidence'),
      summary: requireString(entry.summary, 'entry.summary'),
      key_ideas: unique(keyIdeas),
      related: unique(related),
    },
  };
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
