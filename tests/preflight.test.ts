import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { runPreflight } from '../src/commute/preflight.js';

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
