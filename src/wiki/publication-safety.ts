import { requireHttpUrl } from '../shared/url.js';
import {
  rejectUnknownKeys,
  requireArray,
  requireRecord,
  requireString,
} from '../shared/validate.js';

const WIKI_ENTRY_TYPES = ['concept', 'tool', 'person', 'event'] as const;
const NON_ENTRY_PATHS = new Set([
  'wiki/ENTRY_TEMPLATE.md',
  'wiki/index.md',
  'wiki/concepts/index.md',
  'wiki/tools/index.md',
  'wiki/people/index.md',
  'wiki/events/index.md',
]);
const SOURCE_ITEM_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const SOURCE_MARKER_PATTERN = /<!-- source-item-id: ([A-Za-z0-9][A-Za-z0-9._:-]*) -->/g;
const RAW_HTML_PATTERN = /<\/?[A-Za-z!][^>]*>/;
const MARKDOWN_LINK_PATTERN = /!?\[[^\]\n]*\]\(([^()\n]*)\)/g;
const MARKDOWN_REFERENCE_PATTERN = /^ {0,3}\[[^\]\n]+\]:\s*(?:<([^>\n]+)>|(\S+))(?:\s+.*)?$/gm;
const CREDENTIAL_PATTERN =
  /(?:-----BEGIN [A-Z ]*PRIVATE KEY-----|\b(?:api[_ -]?key|access[_ -]?token|client[_ -]?secret|password)\s*[:=]\s*\S+)/i;

export interface PublishedWikiDocument {
  path: string;
  markdown: string;
  frontmatter: unknown;
}

export function validatePublishedWikiDocuments(documents: PublishedWikiDocument[]): void {
  const sourceUrls = new Map<string, { path: string; url: string }>();

  for (const document of documents) {
    const frontmatter = requireRecord(document.frontmatter, `${document.path} frontmatter`);
    if (NON_ENTRY_PATHS.has(document.path)) {
      continue;
    }
    if (!WIKI_ENTRY_TYPES.includes(frontmatter.type as (typeof WIKI_ENTRY_TYPES)[number])) {
      throw new Error(
        `${document.path} frontmatter.type must be one of: ${WIKI_ENTRY_TYPES.join(', ')}`
      );
    }

    const evidence = validatePublishedMarkdown(document);
    const provenance = requireArray(
      frontmatter.provenance,
      `${document.path} frontmatter.provenance`
    );
    if (provenance.length === 0) {
      throw new Error(`${document.path} frontmatter.provenance must not be empty`);
    }

    const documentSourceIds = new Set<string>();
    for (const [index, candidate] of provenance.entries()) {
      const field = `${document.path} frontmatter.provenance[${index}]`;
      const record = requireRecord(candidate, field);
      rejectUnknownKeys(record, ['source_item_id', 'url'], field);
      const sourceItemId = requireString(record.source_item_id, `${field}.source_item_id`);
      if (!SOURCE_ITEM_ID_PATTERN.test(sourceItemId)) {
        throw new Error(`${field}.source_item_id contains unsupported characters`);
      }
      if (documentSourceIds.has(sourceItemId)) {
        throw new Error(`${document.path} repeats source_item_id ${sourceItemId}`);
      }
      documentSourceIds.add(sourceItemId);
      const url = requireHttpUrl(record.url, `${field}.url`, {
        rejectCredentials: true,
        markdownSafe: true,
        rejectCredentialParams: true,
      });
      const prior = sourceUrls.get(sourceItemId);
      if (prior && prior.url !== url) {
        throw new Error(
          `Conflicting provenance for source_item_id ${sourceItemId}: ${prior.path} uses ${prior.url}, but ${document.path} uses ${url}`
        );
      }
      sourceUrls.set(sourceItemId, { path: document.path, url });
      if (document.path !== 'wiki/ENTRY_TEMPLATE.md' && !evidence.linkDestinations.has(url)) {
        throw new Error(`${document.path} does not link provenance URL ${url}`);
      }
    }

    if (document.path !== 'wiki/ENTRY_TEMPLATE.md') {
      for (const sourceItemId of documentSourceIds) {
        if (!evidence.sourceMarkers.has(sourceItemId)) {
          throw new Error(`${document.path} does not trace source_item_id ${sourceItemId}`);
        }
      }
      for (const sourceItemId of evidence.sourceMarkers) {
        if (!documentSourceIds.has(sourceItemId)) {
          throw new Error(`${document.path} has an unprovenanced source-item-id ${sourceItemId}`);
        }
      }
    }
  }
}

function validatePublishedMarkdown(document: PublishedWikiDocument): {
  linkDestinations: Set<string>;
  sourceMarkers: Set<string>;
} {
  const linkDestinations = new Set<string>();
  for (const match of document.markdown.matchAll(MARKDOWN_LINK_PATTERN)) {
    const destination = requireString(match[1], `${document.path} Markdown link destination`);
    linkDestinations.add(destination);
    validateLinkDestination(destination, document.path);
  }
  for (const match of document.markdown.matchAll(MARKDOWN_REFERENCE_PATTERN)) {
    const destination = requireString(
      match[1] ?? match[2],
      `${document.path} Markdown reference destination`
    );
    linkDestinations.add(destination);
    validateLinkDestination(destination, document.path);
  }

  const withoutLinks = document.markdown.replace(MARKDOWN_LINK_PATTERN, '');
  if (/]\(/.test(withoutLinks)) {
    throw new Error(`${document.path} contains a malformed or unsafe Markdown link`);
  }

  const sourceMarkers = new Set(
    [...document.markdown.matchAll(SOURCE_MARKER_PATTERN)].map((match) => match[1] ?? '')
  );
  const withoutSourceMarkers = document.markdown.replace(SOURCE_MARKER_PATTERN, '');
  if (RAW_HTML_PATTERN.test(withoutSourceMarkers)) {
    throw new Error(`${document.path} contains raw HTML`);
  }
  if (/\brange\.com\b/i.test(document.markdown)) {
    throw new Error(`${document.path} contains private-work context`);
  }
  if (CREDENTIAL_PATTERN.test(document.markdown)) {
    throw new Error(`${document.path} appears to contain credential material`);
  }
  if ([...document.markdown].some(hasDisallowedControlCharacter)) {
    throw new Error(`${document.path} contains disallowed control characters`);
  }
  return { linkDestinations, sourceMarkers };
}

function validateLinkDestination(destination: string, path: string): void {
  if (destination !== destination.trim() || /[\s<>]/.test(destination)) {
    throw new Error(`${path} contains an unsafe Markdown link destination`);
  }
  if (/^https?:\/\//i.test(destination)) {
    requireHttpUrl(destination, `${path} Markdown link`, {
      rejectCredentials: true,
      markdownSafe: true,
      rejectCredentialParams: true,
    });
  } else if (/^(?:[A-Za-z][A-Za-z0-9+.-]*:|\/\/)/.test(destination)) {
    throw new Error(`${path} contains a non-HTTP(S) Markdown link`);
  }
}

function hasDisallowedControlCharacter(character: string): boolean {
  const code = character.charCodeAt(0);
  return code === 13 || code === 127 || (code < 32 && code !== 9 && code !== 10);
}
