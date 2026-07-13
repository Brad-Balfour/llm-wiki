import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseCommuteHandoffText } from '../commute/handoff.js';
import type { CommuteHandoff, CommuteReviewNote } from '../commute/handoff.js';

export const WIKI_REVIEW_DRAFT_SCHEMA_VERSION = 'wiki-review-drafts.v1';

export interface WikiReviewDraft {
  source_item_id: string | null;
  title: string;
  url: string | null;
  review_note: string;
  suggested_slug: string;
  status: 'needs_enrichment_and_approval';
  missing_fields: string[];
}

export function prepareWikiReviewDrafts(handoff: CommuteHandoff): WikiReviewDraft[] {
  return handoff.review_notes.filter((note) => note.destination === 'wiki_review').map(toDraft);
}

function toDraft(note: CommuteReviewNote): WikiReviewDraft {
  const missingFields = [
    'source.newsletter',
    'source.edition_date',
    'entry.type',
    'entry.summary',
    'entry.key_ideas',
    'approval.safety_review',
    'approval.explicit_public_confirmation',
  ];
  if (note.source_item_id === undefined || note.source_item_id === 'unknown') {
    missingFields.unshift('source.source_item_id');
  }
  if (note.url === undefined) {
    missingFields.unshift('source.url');
  }

  return {
    source_item_id:
      note.source_item_id === undefined || note.source_item_id === 'unknown'
        ? null
        : note.source_item_id,
    title: note.title,
    url: note.url ?? null,
    review_note: note.note,
    suggested_slug: slugify(note.title),
    status: 'needs_enrichment_and_approval',
    missing_fields: missingFields,
  };
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80)
      .replace(/-$/g, '') || 'wiki-review-item'
  );
}

async function main(): Promise<void> {
  const { input, outputDir } = parseOptions(process.argv.slice(2));
  const handoff = parseCommuteHandoffText(await readFile(input, 'utf8'));
  const drafts = prepareWikiReviewDrafts(handoff);
  const safeSessionId = handoff.session_id.replace(/[^a-zA-Z0-9._-]+/g, '-');
  const outputPath = path.join(outputDir, `${safeSessionId}.json`);
  const output = {
    schema_version: WIKI_REVIEW_DRAFT_SCHEMA_VERSION,
    session_id: handoff.session_id,
    session_date: handoff.session_date,
    source_handoff: input,
    drafts,
  };

  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, { flag: 'wx' });
  process.stdout.write(`${outputPath}\n${drafts.length} wiki review draft(s)\n`);
}

function parseOptions(args: string[]): { input: string; outputDir: string } {
  let input: string | undefined;
  let outputDir = '.private/wiki-drafts';
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--input') {
      input = args[index + 1];
      index += 1;
    } else if (arg === '--output-dir') {
      outputDir = args[index + 1] ?? outputDir;
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${arg ?? ''}`);
    }
  }
  if (!input) {
    throw new Error('Usage: prepare:wiki-drafts -- --input <handoff.txt>');
  }
  return { input, outputDir };
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] ?? '')) {
  await main();
}
