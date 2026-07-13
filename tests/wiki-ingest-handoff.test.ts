import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { access, cp, mkdir, mkdtemp, readFile, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';

import {
  buildApprovedSource,
  captureRollbackError,
  formatRollbackFailure,
  resolveEnrichmentPath,
} from '../src/wiki/ingest-handoff.js';

const execFileAsync = promisify(execFile);

const note = {
  source_item_id: 'tldr-dev-2026-06-23-001',
  title: 'Transformer architecture',
  url: 'https://example.com/transformers',
  note: 'Wiki this.',
  destination: 'wiki_review' as const,
};

const enrichment = {
  approval: {
    reviewed_by: 'brad' as const,
    safety_review: {
      privacy: 'cleared' as const,
      publication_rights: 'cleared' as const,
      dual_use: 'cleared' as const,
    },
  },
  newsletter: 'TLDR Dev',
  edition_date: '2026-06-23',
  type: 'concept' as const,
  slug: 'transformer-architecture',
  title: 'Transformer Architecture',
  aliases: [],
  tags: ['llm'],
  confidence: 'high' as const,
  summary: 'Transformers use attention to model relationships among tokens.',
  key_ideas: ['Attention replaces recurrent state for token relationships.'],
  related: [],
};

test('builds approval from reviewed enrichment plus explicit runtime confirmation', () => {
  const approved = buildApprovedSource(note, enrichment, '2026-07-13T01:00:00.000Z');
  assert.equal(approved.approval.reviewed_by, 'brad');
  assert.equal(approved.approval.safety_review.privacy, 'cleared');
  assert.equal(approved.source.source_item_id, note.source_item_id);
});

test('rejects source item ids that could escape the enrichment directory', () => {
  assert.throws(() => resolveEnrichmentPath('.private/wiki-enrichments', '../../secret'));
  assert.match(
    resolveEnrichmentPath('.private/wiki-enrichments', note.source_item_id),
    /tldr-dev-2026-06-23-001\.json$/
  );
});

test('rejects the unknown placeholder before public source construction', () => {
  assert.throws(() =>
    buildApprovedSource(
      { ...note, source_item_id: 'unknown' },
      enrichment,
      '2026-07-13T01:00:00.000Z'
    )
  );
});

test('captures a rollback failure without preventing later restoration steps', async () => {
  const errors: unknown[] = [];
  let stateRestored = false;
  await captureRollbackError(async () => {
    throw new Error('source remained locked');
  }, errors);
  await captureRollbackError(async () => {
    stateRestored = true;
  }, errors);
  assert.equal(stateRestored, true);
  assert.equal(errors.length, 1);
});

test('reports the original ingestion error and every cleanup error', () => {
  assert.equal(
    formatRollbackFailure(new Error('compiler rejected the source'), [
      new Error('source file could not be removed'),
      new Error('compile state could not be restored'),
    ]),
    'Wiki ingestion failed: compiler rejected the source Cleanup also failed: source file could not be removed; compile state could not be restored'
  );
});

test('CLI requires confirmation, rolls back compiler failure, and succeeds on retry', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'llm-wiki-ingest-'));
  await cp('dist/src', path.join(root, 'dist/src'), { recursive: true });
  await mkdir(path.join(root, '.private/wiki-enrichments'), { recursive: true });
  await mkdir(path.join(root, 'schema'), { recursive: true });
  const handoffPath = path.join(root, 'handoff.txt');
  const enrichmentPath = path.join(root, '.private/wiki-enrichments/tldr-dev-2026-06-23-001.json');
  await writeFile(
    handoffPath,
    JSON.stringify({
      schema_version: 'commute-handoff.v1',
      session_id: 'test-session',
      session_date: '2026-07-12',
      voice_surface: 'chatgpt_advanced',
      queue_files: ['queue.txt'],
      feedback: [],
      review_notes: [
        note,
        {
          source_item_id: 'tldr-missing-enrichment',
          title: 'Needs reviewed summary',
          url: 'https://example.com/missing-enrichment',
          note: 'Wiki this.',
          destination: 'wiki_review',
        },
        {
          source_item_id: 'tldr-invalid-enrichment',
          title: 'Invalid reviewed summary',
          url: 'https://example.com/invalid-enrichment',
          note: 'Wiki this.',
          destination: 'wiki_review',
        },
        {
          source_item_id: 'unknown',
          title: 'Needs source details',
          note: 'Topic-level preference.',
          destination: 'wiki_review',
        },
      ],
      issues: [],
    })
  );
  await writeFile(enrichmentPath, JSON.stringify(enrichment));
  await writeFile(
    path.join(root, '.private/wiki-enrichments/tldr-invalid-enrichment.json'),
    'not valid JSON'
  );
  const statePath = path.join(root, 'schema/compile-state.json');
  const existingOutputPath = path.join(root, 'wiki/concepts/transformer-architecture.md');
  await mkdir(path.dirname(existingOutputPath), { recursive: true });
  await writeFile(existingOutputPath, 'existing output\n');
  const conflictingState = compileState(
    {
      'sources/tldr/other.txt': {
        hash: 'sha256:old',
        output_path: 'wiki/concepts/other.md',
        source_item_id: 'different-source-item',
        processed_at: '2026-07-12T00:00:00.000Z',
      },
    },
    {
      'wiki/concepts/transformer-architecture.md': {
        hash: 'sha256:not-the-existing-output',
        updated: '2026-07-12T00:00:00.000Z',
        provenance_count: 1,
      },
    }
  );
  await writeFile(statePath, conflictingState);
  const cli = path.join(root, 'dist/src/wiki/ingest-handoff.js');
  const args = ['--input', handoffPath, '--source-item-id', note.source_item_id];

  await assert.rejects(execFileAsync(process.execPath, [cli, ...args], { cwd: root }));
  await assert.rejects(
    access(path.join(root, 'sources/tldr/2026-06-23-transformer-architecture.txt'))
  );

  await assert.rejects(
    execFileAsync(process.execPath, [cli, ...args, '--confirm-public'], { cwd: root })
  );
  assert.equal(await readFile(statePath, 'utf8'), conflictingState);
  assert.equal(await readFile(existingOutputPath, 'utf8'), 'existing output\n');
  await assert.rejects(
    access(path.join(root, 'sources/tldr/2026-06-23-transformer-architecture.txt'))
  );

  await unlink(existingOutputPath);
  await writeFile(statePath, compileState({}));
  await execFileAsync(process.execPath, [cli, ...args, '--confirm-public'], { cwd: root });
  const approvedSourcePath = path.join(
    root,
    'sources/tldr/2026-06-23-transformer-architecture.txt'
  );
  await access(approvedSourcePath);
  await access(path.join(root, 'wiki/concepts/transformer-architecture.md'));

  const conflictHandoffPath = path.join(root, 'conflict-handoff.txt');
  await writeFile(
    conflictHandoffPath,
    JSON.stringify({
      schema_version: 'commute-handoff.v1',
      session_id: 'conflict-session',
      session_date: '2026-07-12',
      voice_surface: 'chatgpt_advanced',
      queue_files: ['queue.txt'],
      feedback: [],
      review_notes: [{ ...note, url: 'https://example.com/different-source' }],
      issues: [],
    })
  );
  const sourceBeforeConflict = await readFile(approvedSourcePath, 'utf8');
  await assert.rejects(
    execFileAsync(process.execPath, [cli, '--input', conflictHandoffPath, '--confirm-public'], {
      cwd: root,
    }),
    (error: Error & { stdout?: string }) => {
      assert.match(error.stdout ?? '', /does not match the current reviewed entry details/);
      return true;
    }
  );
  assert.equal(await readFile(approvedSourcePath, 'utf8'), sourceBeforeConflict);

  await unlink(existingOutputPath);
  const rebuilt = await execFileAsync(process.execPath, [cli, ...args, '--confirm-public'], {
    cwd: root,
  });
  assert.match(rebuilt.stdout, /published: Transformer architecture/);
  await access(existingOutputPath);

  let batchFailure: unknown;
  try {
    await execFileAsync(process.execPath, [cli, '--input', handoffPath, '--confirm-public'], {
      cwd: root,
    });
  } catch (error) {
    batchFailure = error;
  }
  assert.ok(batchFailure instanceof Error);
  const batchOutput = (batchFailure as Error & { stdout: string }).stdout;
  assert.match(batchOutput, /already published: Transformer architecture/);
  assert.match(batchOutput, /needs reviewed summary: Needs reviewed summary/);
  assert.match(
    batchOutput,
    /failed: Invalid reviewed summary — reviewed entry details are not valid JSON/
  );
  assert.match(batchOutput, /needs source details: Needs source details/);
});

function compileState(
  processedSources: Record<string, unknown>,
  wikiOutputs: Record<string, unknown> = {}
): string {
  return `${JSON.stringify(
    {
      manifest_version: 1,
      schema_version: 'compile-state.v1',
      created: '2026-07-12',
      updated: null,
      processed_sources: processedSources,
      wiki_outputs: wikiOutputs,
      runs: [],
    },
    null,
    2
  )}\n`;
}
