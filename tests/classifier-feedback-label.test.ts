import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  appendClassifierFeedbackLabels,
  parseClassifierFeedbackInput,
  parseClassifierFeedbackLabel,
  runClassifierFeedbackCommand,
} from '../src/classifier/feedback-label.js';

const validFixturePath = 'tests/fixtures/expected/feedback/valid-corrections.json';

test('parses exact item-bound corrections and derives stable label ids', async () => {
  const labels = parseClassifierFeedbackInput(await readFile(validFixturePath, 'utf8'));
  assert.equal(labels.length, 2);
  assert.match(labels[0]?.label_id ?? '', /^feedback_[a-f0-9]{20}$/);
  assert.equal(labels[0]?.corrected.route, 'discuss');
  assert.equal(labels[1]?.corrected.route, 'skip');
  assert.equal(parseClassifierFeedbackLabel(labels[0]).label_id, labels[0]?.label_id);
});

test('rejects incidents, synthesis, duplicate signals, missing identity, and invalid routes', async () => {
  const valid = JSON.parse(await readFile(validFixturePath, 'utf8')) as Record<string, unknown>[];
  const cases = JSON.parse(
    await readFile('tests/fixtures/expected/feedback/rejected-corrections.json', 'utf8')
  ) as Array<{ id: string; change: Record<string, unknown>; error: string }>;

  for (const fixture of cases) {
    const candidate = structuredClone(valid[0]!);
    for (const [field, value] of Object.entries(fixture.change)) {
      setNested(candidate, field, value);
    }
    assert.throws(
      () => parseClassifierFeedbackLabel(candidate),
      new RegExp(fixture.error.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      fixture.id
    );
  }
});

test('records JSON or JSONL to private append-only storage and rejects duplicates', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'llm-wiki-feedback-'));
  const inputPath = path.join(root, 'labels.json');
  const outputPath = path.join(root, '.private/classifier-feedback/labels.jsonl');
  await writeFile(inputPath, await readFile(validFixturePath, 'utf8'));

  assert.equal(
    await runClassifierFeedbackCommand(['--input', inputPath, '--output', outputPath]),
    0
  );
  const first = await readFile(outputPath, 'utf8');
  assert.equal(first.trim().split('\n').length, 2);

  await assert.rejects(
    runClassifierFeedbackCommand(['--input', inputPath, '--output', outputPath]),
    /already recorded/
  );
  assert.equal(await readFile(outputPath, 'utf8'), first);

  const labels = parseClassifierFeedbackInput(first);
  await assert.rejects(
    appendClassifierFeedbackLabels(
      path.join(root, '.private/classifier-feedback/duplicate-input.jsonl'),
      [labels[0]!, labels[0]!]
    ),
    /Duplicate feedback label in input/
  );
});

test('refuses to write feedback outside a private directory', async () => {
  await assert.rejects(
    runClassifierFeedbackCommand(['--input', validFixturePath, '--output', 'labels.jsonl']),
    /must be under a \.private directory/
  );
});

function setNested(record: Record<string, unknown>, dottedPath: string, value: unknown): void {
  const parts = dottedPath.split('.');
  let target = record;
  for (const part of parts.slice(0, -1)) {
    target = target[part] as Record<string, unknown>;
  }
  target[parts.at(-1)!] = value;
}
