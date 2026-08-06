import { execFile } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { errorCode, errorMessage } from '../shared/errors.js';
import { readOptionalFile, writeNewJsonFile } from '../shared/fs.js';

import { parseCommuteHandoffText } from '../commute/handoff.js';
import type { CommuteReviewNote } from '../commute/handoff.js';
import { parseApprovedWikiSource, validateApprovedWikiSource } from './approved-source.js';
import type { ApprovedWikiSource, WikiConfidence, WikiEntryType } from './types.js';

const execFileAsync = promisify(execFile);

interface Enrichment {
  approval: {
    reviewed_by: 'brad';
    safety_review: { privacy: 'cleared'; publication_rights: 'cleared'; dual_use: 'cleared' };
  };
  newsletter: string;
  edition_date: string;
  type: WikiEntryType;
  slug: string;
  title: string;
  aliases: string[];
  tags: string[];
  confidence: WikiConfidence;
  summary: string;
  key_ideas: string[];
  related: string[];
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  if (!options.confirmPublic) {
    throw new Error('Wiki ingestion requires --confirm-public after reviewing the entries.');
  }

  const handoff = parseCommuteHandoffText(await readFile(options.input, 'utf8'));
  const candidates = handoff.review_notes.filter(
    (note) =>
      note.destination === 'wiki_review' &&
      (options.sourceItemId === undefined || note.source_item_id === options.sourceItemId)
  );
  if (candidates.length === 0) {
    throw new Error('No matching wiki review items were found in the handoff.');
  }

  let failures = 0;
  for (const note of candidates) {
    let result: { status: BatchStatus; detail?: string };
    try {
      result = await ingestCandidate(note, options.enrichmentDir);
    } catch (error) {
      result = {
        status: 'failed',
        detail: error instanceof Error ? error.message : String(error),
      };
    }
    process.stdout.write(
      `${result.status}: ${note.title}${result.detail ? ` — ${result.detail}` : ''}\n`
    );
    if (result.status === 'failed') failures += 1;
  }
  if (failures > 0) process.exitCode = 1;
}

type BatchStatus =
  'published' | 'already published' | 'needs source details' | 'needs reviewed summary' | 'failed';

async function ingestCandidate(
  note: CommuteReviewNote,
  enrichmentDir: string
): Promise<{ status: BatchStatus; detail?: string }> {
  if (
    note.source_item_id === undefined ||
    note.source_item_id === 'unknown' ||
    note.url === undefined
  ) {
    return { status: 'needs source details', detail: 'article ID or URL is missing' };
  }

  const enrichmentPath = resolveEnrichmentPath(enrichmentDir, note.source_item_id);
  const enrichmentText = await readOptionalFile(enrichmentPath);
  if (enrichmentText === undefined) {
    return { status: 'needs reviewed summary', detail: 'no reviewed entry details were found' };
  }
  let enrichment: Enrichment;
  try {
    enrichment = JSON.parse(enrichmentText) as Enrichment;
  } catch {
    return {
      status: 'failed',
      detail: 'reviewed entry details are not valid JSON',
    };
  }
  const approved = buildApprovedSource(note, enrichment, new Date().toISOString());
  const sourcePath = approved.source.source_path;

  const compilerPath = path.resolve('dist/src/wiki/compile-file.js');
  const statePath = path.resolve('schema/compile-state.json');
  const outputPath = path.resolve(
    'wiki',
    approved.entry.type === 'person' ? 'people' : `${approved.entry.type}s`,
    `${approved.entry.slug}.md`
  );
  const stateBefore = await readFile(statePath, 'utf8');
  const outputBefore = await readOptionalFile(outputPath);
  const sourceBefore = await readOptionalFile(sourcePath);
  let sourceCreated = false;
  try {
    if (sourceBefore === undefined) {
      await writeNewJsonFile(sourcePath, approved);
      sourceCreated = true;
      process.stdout.write(`created ${sourcePath}\n`);
    } else {
      assertExistingSourceMatches(sourceBefore, approved);
    }
    const result = await execFileAsync(process.execPath, [
      compilerPath,
      '--input',
      sourcePath,
      '--confirm-public',
    ]);
    return {
      status: result.stdout.startsWith('skipped') ? 'already published' : 'published',
      detail: approved.source.source_path,
    };
  } catch (error) {
    const rollbackErrors: unknown[] = [];
    if (sourceCreated) await captureRollbackError(() => unlink(sourcePath), rollbackErrors);
    await captureRollbackError(() => writeFile(statePath, stateBefore, 'utf8'), rollbackErrors);
    if (outputBefore === undefined) {
      await captureRollbackError(() => unlinkIfPresent(outputPath), rollbackErrors);
    } else {
      await captureRollbackError(() => writeFile(outputPath, outputBefore, 'utf8'), rollbackErrors);
    }
    if (rollbackErrors.length > 0) {
      return {
        status: 'failed',
        detail: formatRollbackFailure(error, rollbackErrors),
      };
    }
    return { status: 'failed', detail: error instanceof Error ? error.message : String(error) };
  }
}

function assertExistingSourceMatches(sourceText: string, approved: ApprovedWikiSource): void {
  const existing = parseApprovedWikiSource(sourceText);
  const candidateWithExistingApprovalTime = {
    ...approved,
    approval: { ...approved.approval, approved_at: existing.approval.approved_at },
  };
  if (JSON.stringify(existing) !== JSON.stringify(candidateWithExistingApprovalTime)) {
    throw new Error(
      `Existing approved source ${approved.source.source_path} does not match the current reviewed entry details.`
    );
  }
}

export function formatRollbackFailure(originalError: unknown, rollbackErrors: unknown[]): string {
  return `Wiki ingestion failed: ${errorMessage(originalError)} Cleanup also failed: ${rollbackErrors
    .map(errorMessage)
    .join('; ')}`;
}

export function buildApprovedSource(
  note: CommuteReviewNote,
  enrichment: Enrichment,
  approvedAt: string
): ApprovedWikiSource {
  if (
    note.source_item_id === undefined ||
    note.source_item_id === 'unknown' ||
    note.url === undefined
  ) {
    throw new Error('Wiki review note requires source_item_id and url.');
  }
  const { approval, newsletter, edition_date, ...entry } = enrichment;
  return validateApprovedWikiSource({
    schema_version: 'approved-wiki-source.v1',
    approval: {
      status: 'approved',
      public: true,
      approved_at: approvedAt,
      reviewed_by: approval.reviewed_by,
      safety_review: approval.safety_review,
    },
    source: {
      source_item_id: note.source_item_id,
      source_path: `sources/tldr/${edition_date}-${entry.slug}.txt`,
      source_type: 'tldr',
      title: note.title,
      url: note.url,
      newsletter,
      edition_date,
    },
    entry,
  });
}

export function resolveEnrichmentPath(enrichmentDir: string, sourceItemId: string): string {
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(sourceItemId)) {
    throw new Error('Selected source_item_id contains unsupported characters.');
  }
  const enrichmentRoot = path.resolve(enrichmentDir);
  const enrichmentPath = path.resolve(enrichmentRoot, `${sourceItemId}.json`);
  if (!enrichmentPath.startsWith(`${enrichmentRoot}${path.sep}`)) {
    throw new Error('Enrichment path escapes the configured directory.');
  }
  return enrichmentPath;
}

async function unlinkIfPresent(filePath: string): Promise<void> {
  try {
    await unlink(filePath);
  } catch (error) {
    if (errorCode(error) !== 'ENOENT') throw error;
  }
}

export async function captureRollbackError(
  action: () => Promise<unknown>,
  rollbackErrors: unknown[]
): Promise<void> {
  try {
    await action();
  } catch (error) {
    rollbackErrors.push(error);
  }
}

export function parseOptions(args: string[]): {
  input: string;
  enrichmentDir: string;
  sourceItemId?: string;
  confirmPublic: boolean;
} {
  let input: string | undefined;
  let enrichmentDir = '.private/wiki-enrichments';
  let sourceItemId: string | undefined;
  let confirmPublic = false;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--input') {
      input = args[index + 1];
      index += 1;
    } else if (arg === '--enrichment-dir') {
      enrichmentDir = args[index + 1] ?? enrichmentDir;
      index += 1;
    } else if (arg === '--source-item-id') {
      sourceItemId = args[index + 1];
      index += 1;
    } else if (arg === '--confirm-public') {
      confirmPublic = true;
    } else {
      throw new Error(`Unknown argument: ${arg ?? ''}`);
    }
  }
  if (!input) throw new Error('Usage: ingest:wiki -- --input <handoff.txt> --confirm-public');
  return {
    input,
    enrichmentDir,
    ...(sourceItemId === undefined ? {} : { sourceItemId }),
    confirmPublic,
  };
}

if (
  realpathSync(fileURLToPath(import.meta.url)) === realpathSync(path.resolve(process.argv[1] ?? ''))
)
  await main();
