import assert from 'node:assert/strict';
import { copyFile, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

import { check as prettierCheck, resolveConfig as resolvePrettierConfig } from 'prettier';

const SOURCE_PATH = 'sources/tldr/2026-07-12-context-engineering.txt';

test('file compiler requires local confirmation and enforces source immutability', async () => {
  const repoRoot = await createFixtureRepo();

  const withoutConfirmation = runCompiler(repoRoot, false);
  assert.notEqual(withoutConfirmation.status, 0);
  assert.match(withoutConfirmation.stderr, /requires --confirm-public/);

  const compiled = runCompiler(repoRoot, true);
  assert.equal(compiled.status, 0, compiled.stderr);
  assert.match(compiled.stdout, /created wiki\/concepts\/context-engineering\.md/);

  const outputPath = path.join(repoRoot, 'wiki/concepts/context-engineering.md');
  const generatedOutput = await readFile(outputPath, 'utf8');
  await assertPrettierCompliant(generatedOutput);
  const processedAt = await processedAtFor(repoRoot);

  const legacyOutput = generatedOutput.replace(
    '\n\n<!-- source-item-id:',
    '\n<!-- source-item-id:'
  );
  await writeFile(outputPath, legacyOutput);
  await updateOutputHash(repoRoot, legacyOutput);
  const normalized = runCompiler(repoRoot, true);
  assert.equal(normalized.status, 0, normalized.stderr);
  assert.match(normalized.stdout, /updated wiki\/concepts\/context-engineering\.md/);
  await assertPrettierCompliant(await readFile(outputPath, 'utf8'));
  assert.equal(await processedAtFor(repoRoot), processedAt);

  const absoluteSource = path.join(repoRoot, SOURCE_PATH);
  const changed = JSON.parse(await readFile(absoluteSource, 'utf8')) as Record<string, unknown>;
  (changed.entry as Record<string, unknown>).summary = 'A changed immutable summary.';
  await writeFile(absoluteSource, `${JSON.stringify(changed, null, 2)}\n`, 'utf8');

  const recompiled = runCompiler(repoRoot, true);
  assert.notEqual(recompiled.status, 0);
  assert.match(recompiled.stderr, /Immutable source changed after compilation/);

  const collisionPath = 'sources/tldr/2026-07-13-conflicting-source.txt';
  const collision = JSON.parse(
    await readFile('tests/fixtures/wiki/approved-source-two.json', 'utf8')
  ) as Record<string, unknown>;
  const collisionSource = collision.source as Record<string, unknown>;
  collisionSource.source_item_id = 'tldr-ai-2026-07-12-context-engineering';
  collisionSource.source_path = collisionPath;
  (collision.entry as Record<string, unknown>).slug = 'different-output-slug';
  await writeFile(path.join(repoRoot, collisionPath), `${JSON.stringify(collision, null, 2)}\n`);

  const conflicting = runCompiler(repoRoot, true, collisionPath);
  assert.notEqual(conflicting.status, 0);
  assert.match(conflicting.stderr, /is already processed from/);
});

async function createFixtureRepo(): Promise<string> {
  const repoRoot = await mkdtemp(path.join(tmpdir(), 'llm-wiki-compile-'));
  await mkdir(path.join(repoRoot, 'sources/tldr'), { recursive: true });
  await mkdir(path.join(repoRoot, 'schema'), { recursive: true });
  await copyFile('tests/fixtures/wiki/approved-source-one.json', path.join(repoRoot, SOURCE_PATH));
  await copyFile('schema/compile-state.json', path.join(repoRoot, 'schema/compile-state.json'));
  return repoRoot;
}

async function updateOutputHash(repoRoot: string, markdown: string): Promise<void> {
  const statePath = path.join(repoRoot, 'schema/compile-state.json');
  const state = JSON.parse(await readFile(statePath, 'utf8')) as {
    wiki_outputs: Record<string, { hash: string }>;
  };
  state.wiki_outputs['wiki/concepts/context-engineering.md']!.hash = `sha256:${createHash('sha256')
    .update(markdown)
    .digest('hex')}`;
  await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
}

async function assertPrettierCompliant(markdown: string): Promise<void> {
  const prettierOptions = await resolvePrettierConfig('.prettierrc');
  assert.ok(prettierOptions);
  assert.equal(await prettierCheck(markdown, { ...prettierOptions, parser: 'markdown' }), true);
}

async function processedAtFor(repoRoot: string): Promise<string> {
  const state = JSON.parse(
    await readFile(path.join(repoRoot, 'schema/compile-state.json'), 'utf8')
  ) as {
    processed_sources: Record<string, { processed_at: string }>;
  };
  return state.processed_sources[SOURCE_PATH]!.processed_at;
}

function runCompiler(
  repoRoot: string,
  confirmPublic: boolean,
  sourcePath = SOURCE_PATH
): { status: number | null; stdout: string; stderr: string } {
  const args = ['dist/src/wiki/compile-file.js', '--repo-root', repoRoot, '--input', sourcePath];
  if (confirmPublic) {
    args.push('--confirm-public');
  }
  const result = spawnSync(process.execPath, args, { cwd: process.cwd(), encoding: 'utf8' });
  return {
    status: result.status,
    stdout: result.stdout.toString(),
    stderr: result.stderr.toString(),
  };
}
