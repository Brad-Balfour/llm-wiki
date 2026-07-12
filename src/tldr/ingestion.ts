import { deriveParserFailureRoute } from '../routing/derive.js';
import { parseTldrEditionBody } from './parser.js';
import type { RouteDecision } from '../routing/derive.js';
import type { ParsedTldrItem } from './parser-contract.js';
import type { TldrParserReview } from './parser.js';

export const TLDR_INGESTION_VERSION = 'tldr-ingestion.v1';

export type TldrInputSource = 'text-file' | 'gmail-manual';

export interface IngestTldrTextOptions {
  source: TldrInputSource;
  extractedAt?: string;
  sourceMessageId?: string;
}

export interface TldrIngestionReviewRecord extends TldrParserReview {
  route: RouteDecision;
}

export interface TldrIngestionResult {
  ingestion_version: typeof TLDR_INGESTION_VERSION;
  input_source: TldrInputSource;
  source_message_id?: string;
  newsletter: string | null;
  edition_date: string | null;
  confirmed_body_markers: string[];
  items: ParsedTldrItem[];
  review: TldrIngestionReviewRecord[];
}

export function ingestTldrText(body: string, options: IngestTldrTextOptions): TldrIngestionResult {
  const parseOptions =
    options.extractedAt === undefined ? {} : { extractedAt: options.extractedAt };
  const parsed = parseTldrEditionBody(body, parseOptions);
  const result: TldrIngestionResult = {
    ingestion_version: TLDR_INGESTION_VERSION,
    input_source: options.source,
    newsletter: parsed.newsletter,
    edition_date: parsed.edition_date,
    confirmed_body_markers: parsed.confirmed_body_markers,
    items: parsed.items,
    review: parsed.reviews.map((record) => ({
      ...record,
      route: deriveParserFailureRoute(),
    })),
  };

  if (options.sourceMessageId !== undefined) {
    result.source_message_id = options.sourceMessageId;
  }

  return result;
}
