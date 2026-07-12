import { createHash } from 'node:crypto';

import { buildSourceItemId, PARSER_VERSION } from './parser-contract.js';
import type { ParsedTldrItem } from './parser-contract.js';

export type TldrParserReviewReason =
  'body_marker_missing' | 'ambiguous_content' | 'validation_error';

export interface TldrParserReview {
  review_id: string;
  reason: TldrParserReviewReason;
  message: string;
  newsletter: string | null;
  edition_date: string | null;
  context: {
    line_start: number;
    line_end: number;
    snippet: string[];
  };
}

export interface TldrParseResult {
  newsletter: string | null;
  edition_date: string | null;
  confirmed_body_markers: string[];
  items: ParsedTldrItem[];
  reviews: TldrParserReview[];
}

export interface ParseTldrOptions {
  extractedAt?: string;
}

interface BodyMarker {
  newsletter: string;
  editionDate: string;
  lineIndex: number;
}

interface LinkBlock {
  title: string;
  url: string;
  lineIndex: number;
}

const FOOTER_START_PATTERNS = [
  /^love tldr\?/i,
  /^share your referral link/i,
  /^want to advertise in tldr/i,
  /^want to work at tldr/i,
  /^if you have any comments or feedback/i,
  /^thanks for reading/i,
  /^manage your subscriptions/i,
  /^or if tldr/i,
  /^unsubscribe\b/i,
] as const;

const IGNORABLE_LINES = new Set(['TLDR', 'Together With', 'Sign Up', 'Advertise', 'View Online']);

const KNOWN_SECTION_HEADINGS = new Set([
  'Big Tech & Startups',
  'Science & Futuristic Technology',
  'Programming, Design & Data Science',
  'Miscellaneous',
  'Quick Links',
  'Headlines & Launches',
  'Deep Dives & Analysis',
  'Engineering & Research',
  'Tools & Apps',
  'Research & Innovation',
]);

const BODY_CONFIRMATION_MARKERS = [
  { label: 'standalone TLDR masthead', pattern: /^TLDR$/m },
  { label: 'sponsor preheader marker', pattern: /^Together With$/m },
  { label: 'view-online navigation marker', pattern: /\bView Online\b/ },
  { label: 'subscription-management footer marker', pattern: /\bManage your subscriptions\b/i },
  { label: 'reply-feedback footer marker', pattern: /\bIf you have any comments or feedback\b/i },
] as const;

export function parseTldrEditionBody(
  body: string,
  options: ParseTldrOptions = {}
): TldrParseResult {
  const extractedAt = options.extractedAt ?? new Date().toISOString();
  const lines = normalizeLines(body);
  const bodyMarker = findBodyMarker(lines);
  const confirmedBodyMarkers = findConfirmedBodyMarkers(body, bodyMarker);
  const reviews: TldrParserReview[] = [];

  if (bodyMarker === null || confirmedBodyMarkers.length < 2) {
    reviews.push(
      buildReview({
        reason: 'body_marker_missing',
        message: 'TLDR body markers were not confirmed from the email body.',
        newsletter: bodyMarker?.newsletter ?? null,
        editionDate: bodyMarker?.editionDate ?? null,
        lines,
        lineStart: bodyMarker?.lineIndex ?? 0,
        lineEnd: bodyMarker?.lineIndex ?? Math.min(lines.length - 1, 4),
      })
    );

    return {
      newsletter: bodyMarker?.newsletter ?? null,
      edition_date: bodyMarker?.editionDate ?? null,
      confirmed_body_markers: confirmedBodyMarkers,
      items: [],
      reviews,
    };
  }

  const items: ParsedTldrItem[] = [];
  const seenItemIds = new Set<string>();
  let currentSection: string | null = null;
  let index = bodyMarker.lineIndex + 1;

  while (index < lines.length) {
    const line = lines[index] ?? '';
    const trimmed = line.trim();

    if (trimmed === '') {
      index += 1;
      continue;
    }

    if (isFooterStart(trimmed)) {
      break;
    }

    if (isEmojiSeparator(trimmed) || isKnownIgnorableLine(trimmed)) {
      index += 1;
      continue;
    }

    if (isSectionHeading(trimmed)) {
      currentSection = trimmed;
      index += 1;
      continue;
    }

    const link = parseMarkdownLink(trimmed, index);
    if (link !== null) {
      const block = collectSummaryBlock(lines, index + 1);
      const candidate = buildCandidate(link, block.summaryLines, {
        newsletter: bodyMarker.newsletter,
        editionDate: bodyMarker.editionDate,
        section: currentSection,
        extractedAt,
      });

      if (candidate.kind === 'item') {
        if (!seenItemIds.has(candidate.item.source_item_id)) {
          items.push(candidate.item);
          seenItemIds.add(candidate.item.source_item_id);
        }
      } else if (candidate.kind === 'review') {
        reviews.push(
          buildReview({
            reason: candidate.reason,
            message: candidate.message,
            newsletter: bodyMarker.newsletter,
            editionDate: bodyMarker.editionDate,
            lines,
            lineStart: link.lineIndex,
            lineEnd: Math.max(link.lineIndex, block.endLineIndex),
          })
        );
      }

      index = block.nextIndex;
      continue;
    }

    if (!isKnownWrapperOrAdLine(trimmed)) {
      reviews.push(
        buildReview({
          reason: 'ambiguous_content',
          message:
            'Content inside the TLDR edition could not be classified as editorial, sponsor, or wrapper text.',
          newsletter: bodyMarker.newsletter,
          editionDate: bodyMarker.editionDate,
          lines,
          lineStart: index,
          lineEnd: index,
        })
      );
    }

    index += 1;
  }

  if (items.length === 0 && reviews.length === 0) {
    reviews.push(
      buildReview({
        reason: 'validation_error',
        message: 'No non-sponsor editorial items were extracted from a confirmed TLDR body.',
        newsletter: bodyMarker.newsletter,
        editionDate: bodyMarker.editionDate,
        lines,
        lineStart: bodyMarker.lineIndex,
        lineEnd: Math.min(lines.length - 1, bodyMarker.lineIndex + 5),
      })
    );
  }

  return {
    newsletter: bodyMarker.newsletter,
    edition_date: bodyMarker.editionDate,
    confirmed_body_markers: confirmedBodyMarkers,
    items,
    reviews,
  };
}

function normalizeLines(body: string): string[] {
  return body.replace(/\r\n?/g, '\n').split('\n');
}

function findBodyMarker(lines: string[]): BodyMarker | null {
  for (const [lineIndex, line] of lines.entries()) {
    const match = /^(TLDR(?: [A-Za-z0-9][A-Za-z0-9 &+/.-]*)?)\s+(\d{4}-\d{2}-\d{2})$/.exec(
      line.trim()
    );

    if (match !== null) {
      const newsletter = match[1];
      const editionDate = match[2];

      if (newsletter === undefined || editionDate === undefined) {
        continue;
      }

      return {
        newsletter,
        editionDate,
        lineIndex,
      };
    }
  }

  return null;
}

function findConfirmedBodyMarkers(body: string, bodyMarker: BodyMarker | null): string[] {
  const markers: string[] = [];

  if (bodyMarker !== null) {
    markers.push(`${bodyMarker.newsletter} ${bodyMarker.editionDate}`);
  }

  for (const marker of BODY_CONFIRMATION_MARKERS) {
    if (marker.pattern.test(body)) {
      markers.push(marker.label);
    }
  }

  return markers;
}

function isFooterStart(line: string): boolean {
  return FOOTER_START_PATTERNS.some((pattern) => pattern.test(line));
}

function isEmojiSeparator(line: string): boolean {
  return line.length <= 4 && !/[A-Za-z0-9]/.test(line);
}

function isKnownIgnorableLine(line: string): boolean {
  if (IGNORABLE_LINES.has(line)) {
    return true;
  }

  return line.includes('|') && line.includes('View Online');
}

function isSectionHeading(line: string): boolean {
  if (KNOWN_SECTION_HEADINGS.has(line)) {
    return true;
  }

  return /^[A-Z][A-Za-z0-9 '&,+/-]+$/.test(line) && !line.includes('(') && !line.includes(')');
}

function parseMarkdownLink(line: string, lineIndex: number): LinkBlock | null {
  const match = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(line);

  if (match === null) {
    return null;
  }

  const title = match[1];
  const url = match[2];

  if (title === undefined || url === undefined) {
    return null;
  }

  return {
    title,
    url,
    lineIndex,
  };
}

function collectSummaryBlock(
  lines: string[],
  startIndex: number
): { summaryLines: string[]; nextIndex: number; endLineIndex: number } {
  const summaryLines: string[] = [];
  let index = startIndex;
  let lastContentIndex = startIndex - 1;

  while (index < lines.length) {
    const trimmed = (lines[index] ?? '').trim();

    if (trimmed === '') {
      index += 1;
      continue;
    }

    if (
      isFooterStart(trimmed) ||
      isEmojiSeparator(trimmed) ||
      isSectionHeading(trimmed) ||
      parseMarkdownLink(trimmed, index) !== null
    ) {
      break;
    }

    summaryLines.push(trimmed);
    lastContentIndex = index;
    index += 1;
  }

  return {
    summaryLines,
    nextIndex: index,
    endLineIndex: lastContentIndex,
  };
}

type CandidateResult =
  | { kind: 'item'; item: ParsedTldrItem }
  | { kind: 'skip' }
  | { kind: 'review'; reason: TldrParserReviewReason; message: string };

function buildCandidate(
  link: LinkBlock,
  summaryLines: string[],
  metadata: {
    newsletter: string;
    editionDate: string;
    section: string | null;
    extractedAt: string;
  }
): CandidateResult {
  const rawTitle = link.title.trim();
  const normalizedTitle = normalizeTitle(rawTitle);
  const normalizedUrl = normalizeUrl(link.url);

  if (shouldSkipLinkedBlock(rawTitle, normalizedTitle, link.url, normalizedUrl)) {
    return { kind: 'skip' };
  }

  if (normalizedUrl === null) {
    return {
      kind: 'review',
      reason: 'validation_error',
      message: `Editorial item "${normalizedTitle}" did not include a valid HTTP URL.`,
    };
  }

  const summary = normalizeSummary(summaryLines);

  if (normalizedTitle === '' || summary === '') {
    return {
      kind: 'review',
      reason: 'validation_error',
      message: `Editorial item "${normalizedTitle || rawTitle}" was missing a title or summary.`,
    };
  }

  const itemWithoutId: Omit<ParsedTldrItem, 'source_item_id'> = {
    newsletter: metadata.newsletter,
    edition_date: metadata.editionDate,
    section: metadata.section,
    title: normalizedTitle,
    summary,
    url: normalizedUrl,
    extracted_at: metadata.extractedAt,
    parser_version: PARSER_VERSION,
  };

  return {
    kind: 'item',
    item: {
      source_item_id: buildSourceItemId(itemWithoutId),
      ...itemWithoutId,
    },
  };
}

function normalizeTitle(title: string): string {
  return title
    .replace(/\s+\((?:~?\d+\s+)?(?:minute|minutes|min|mins)\s+read\)$/i, '')
    .replace(/\s+\(sponsor\)$/i, '')
    .trim();
}

function normalizeSummary(summaryLines: string[]): string {
  return summaryLines
    .filter((line) => !isKnownWrapperOrAdLine(line))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeUrl(rawUrl: string): string | null {
  if (/^mailto:/i.test(rawUrl)) {
    return null;
  }

  const decodedUrl = unwrapTldrTrackingUrl(rawUrl);

  try {
    const url = new URL(decodedUrl);

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }

    for (const key of [...url.searchParams.keys()]) {
      if (key.toLowerCase().startsWith('utm_')) {
        url.searchParams.delete(key);
      }
    }

    return url.toString();
  } catch {
    return null;
  }
}

function unwrapTldrTrackingUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);

    if (url.hostname !== 'tracking.tldrnewsletter.com') {
      return rawUrl;
    }

    const parts = url.pathname.split('/').filter(Boolean);

    if (parts[0] !== 'CL0' || parts[1] === undefined) {
      return rawUrl;
    }

    return decodeURIComponent(parts[1]);
  } catch {
    return rawUrl;
  }
}

function shouldSkipLinkedBlock(
  rawTitle: string,
  normalizedTitle: string,
  rawUrl: string,
  normalizedUrl: string | null
): boolean {
  const normalizedTitleLower = normalizedTitle.toLowerCase();
  const rawTitleLower = rawTitle.toLowerCase();
  const urlLower = (normalizedUrl ?? rawUrl).toLowerCase();

  if (rawTitleLower.includes('(sponsor)') || urlLower.includes('sponsorship')) {
    return true;
  }

  if (rawUrl.toLowerCase().startsWith('mailto:')) {
    return true;
  }

  if (normalizedTitleLower.includes('tldr is hiring')) {
    return true;
  }

  if (urlLower.includes('refer.tldr.tech') || urlLower.includes('/unsubscribe')) {
    return true;
  }

  if (urlLower.includes('tldr.tech') && /advertis|jobs|manage/.test(urlLower)) {
    return true;
  }

  return false;
}

function isKnownWrapperOrAdLine(line: string): boolean {
  const lower = line.toLowerCase();

  return (
    lower.startsWith('---------- forwarded message') ||
    lower.startsWith('begin forwarded message') ||
    lower.startsWith('from:') ||
    lower.startsWith('sent:') ||
    lower.startsWith('to:') ||
    lower.startsWith('subject:') ||
    lower.startsWith('> built for') ||
    lower.startsWith('> frontier models') ||
    lower.startsWith('> reliable at scale') ||
    lower.startsWith('why teams run') ||
    lower.startsWith('coding agents only move') ||
    lower.includes('friendli') ||
    lower.includes('advertise with us') ||
    lower.includes('track your referrals')
  );
}

function buildReview(input: {
  reason: TldrParserReviewReason;
  message: string;
  newsletter: string | null;
  editionDate: string | null;
  lines: string[];
  lineStart: number;
  lineEnd: number;
}): TldrParserReview {
  const lineStart = Math.max(0, input.lineStart);
  const lineEnd = Math.max(lineStart, input.lineEnd);
  const snippet = input.lines
    .slice(lineStart, lineEnd + 1)
    .map((line) => line.trim())
    .filter((line) => line !== '');
  const stableInput = [
    input.reason,
    input.message,
    input.newsletter ?? '',
    input.editionDate ?? '',
    ...snippet,
  ].join('\n');

  return {
    review_id: `tldr_review_${createHash('sha256').update(stableInput).digest('hex').slice(0, 16)}`,
    reason: input.reason,
    message: input.message,
    newsletter: input.newsletter,
    edition_date: input.editionDate,
    context: {
      line_start: lineStart + 1,
      line_end: lineEnd + 1,
      snippet,
    },
  };
}
