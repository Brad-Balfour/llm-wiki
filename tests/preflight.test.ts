import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { parsePreflightOptions, runPreflight } from '../src/commute/preflight.js';
import { runCommute } from '../src/commute/run.js';

const fixture = path.resolve('tests/fixtures/commute-bundles/valid-partial-bundle.json');

test('preflight writes one compact private deterministic intake record', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'llm-wiki-preflight-'));
  const bundle = path.join(directory, 'bundle.txt');
  await writeFile(bundle, await readFile(fixture, 'utf8'));
  const output = path.join(directory, '.private', 'preflight.json');
  const result = await runPreflight(
    { inputs: [{ bundle }], sharedChats: ['https://chatgpt.com/share/example'], output },
    '2026-08-23T12:00:00.000Z'
  );
  assert.equal(result.schema_version, 'commute-preflight.v1');
  assert.equal(result.intake.maintenance_candidates.length, 1);
  assert.equal(result.inventory.shared_chat_references.length, 1);
  assert.match(await readFile(output, 'utf8'), /commute-preflight.v1/);
});

test('preflight retains valid sessions when a supplied recovery queue is invalid or mismatched', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'llm-wiki-preflight-'));
  const bundle = path.join(directory, '20260720-commute-session-bundle.json');
  const secondBundle = path.join(directory, 'second-bundle.json');
  const queue = path.join(directory, 'wrong-queue.txt');
  const invalidQueue = path.join(directory, 'invalid-queue.txt');
  const output = path.join(directory, '.private', 'preflight.json');
  const bundleText = await readFile(fixture, 'utf8');
  const parsed = JSON.parse(bundleText) as {
    queue_snapshot: { queue: { items: Array<{ title: string }> } };
  };
  await writeFile(bundle, bundleText);
  await writeFile(secondBundle, bundleText);
  await writeFile(
    queue,
    JSON.stringify({
      ...parsed.queue_snapshot.queue,
      items: [
        { ...parsed.queue_snapshot.queue.items[0]!, title: 'Different valid item title' },
        ...parsed.queue_snapshot.queue.items.slice(1),
      ],
    })
  );
  await writeFile(invalidQueue, '{not json');
  const result = await runPreflight(
    {
      inputs: [
        { bundle, recoveryQueue: queue },
        { bundle: secondBundle, recoveryQueue: invalidQueue },
      ],
      sharedChats: [],
      output,
    },
    '2026-08-23T12:00:00.000Z'
  );
  assert.equal(result.intake.sessions[0]?.status, 'accepted');
  assert.equal(result.queue_comparisons[0]?.status, 'mismatched');
  assert.equal(result.queue_comparisons[1]?.status, 'unverified');
});

test('one commute command emits a single private orchestration result', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'llm-wiki-preflight-'));
  const bundle = path.join(directory, 'bundle.txt');
  const output = path.join(directory, '.private', 'commute-run.json');
  await writeFile(bundle, await readFile(fixture, 'utf8'));
  const result = await runCommute({ inputs: [{ bundle }], sharedChats: [], output });
  assert.equal(result.schema_version, 'commute-run.v1');
  assert.equal(result.output, output);
  assert.match(await readFile(output, 'utf8'), /commute-run.v1/);
});

test('a GitHub state error does not discard successful local intake', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'llm-wiki-preflight-'));
  const bundle = path.join(directory, 'bundle.txt');
  const output = path.join(directory, '.private', 'commute-run.json');
  await writeFile(bundle, await readFile(fixture, 'utf8'));
  const result = await runCommute(
    {
      inputs: [{ bundle }],
      sharedChats: [],
      output,
      githubPr: { repository: 'Brad-Balfour/llm-wiki', number: 92 },
    },
    {
      githubState: async () => {
        throw new Error('offline');
      },
      watchGithubState: async () => ({ outcome: 'timeout', state: {}, observations: 1 }),
    }
  );
  assert.equal(result.github.outcome, 'error');
  assert.match(await readFile(output, 'utf8'), /offline/);
});

test('preflight does not allow a recovery queue to be silently replaced', () => {
  assert.throws(
    () =>
      parsePreflightOptions([
        '--input',
        'bundle.txt',
        '--recover-with',
        'first.txt',
        '--recover-with',
        'second.txt',
        '--output',
        '.private/result.json',
      ]),
    /only once/
  );
});

test('a rejected bundle is retained as an unresolved orchestration item', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'llm-wiki-preflight-'));
  const bundle = path.join(directory, 'invalid-bundle.txt');
  const output = path.join(directory, '.private', 'commute-run.json');
  await writeFile(bundle, '{not json');
  const result = await runCommute({ inputs: [{ bundle }], sharedChats: [], output });
  assert.equal(result.unresolved_items[0]?.type, 'rejected_session');
});
