import { createHash } from 'node:crypto';

export const PARSER_VERSION = 'tldr-parser.v1';

export interface ParsedTldrItem {
  source_item_id: string;
  newsletter: string;
  edition_date: string;
  section: string | null;
  title: string;
  summary: string;
  url: string;
  extracted_at: string;
  parser_version: typeof PARSER_VERSION;
}

export function buildSourceItemId(
  item: Pick<ParsedTldrItem, 'newsletter' | 'edition_date' | 'title' | 'summary' | 'url'>
): string {
  const stableInput = [item.newsletter, item.edition_date, item.title, item.summary, item.url]
    .map((value) => value.trim().toLowerCase())
    .join('\n');

  return `tldr_${createHash('sha256').update(stableInput).digest('hex').slice(0, 16)}`;
}
