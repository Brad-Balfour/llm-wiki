import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  appendClassifierFeedbackLabels,
  bindClassifierFeedbackLabels,
  parseClassifierFeedbackInput,
  parseClassifierFeedbackLabel,
  runClassifierFeedbackCommand,
  type ClassifierFeedbackLabelInput,
} from '../src/classifier/feedback-label.js';

const validFixturePath = 'tests/fixtures/expected/feedback/valid-corrections.json';
const queueFilename = '20260701-sanitized-feedback.txt';

test('binds exact corrections to a validated queue and derives stable label ids', async () => {
  const inputs = await validInputs();
  const labels = bindClassifierFeedbackLabels(inputs, [queueInput(inputs)]);
  assert.equal(labels.length, 2);
  assert.match(labels[0]?.label_id ?? '', /^feedback_[a-f0-9]{20}$/);
  assert.match(labels[0]?.queue_sha256 ?? '', /^sha256:[a-f0-9]{64}$/);
  assert.equal(labels[0]?.corrected.route, 'discuss');
  assert.equal(labels[1]?.corrected.route, 'skip');
  assert.equal(parseClassifierFeedbackLabel(labels[0]).label_id, labels[0]?.label_id);
});

test('rejects wrong queue filenames, item ids, titles, URLs, and original classifier data', async () => {
  const inputs = await validInputs();
  const queue = queueInput(inputs);
  assert.throws(
    () => bindClassifierFeedbackLabels([{ ...inputs[0]!, queue_filename: 'other.txt' }], [queue]),
    /No --queue file supplied/
  );
  assert.throws(
    () => bindClassifierFeedbackLabels([{ ...inputs[0]!, source_item_id: 'wrong-id' }], [queue]),
    /has no item with source_item_id/
  );
  assert.throws(
    () => bindClassifierFeedbackLabels([{ ...inputs[0]!, title: 'Wrong title' }], [queue]),
    /title does not match/
  );
  assert.throws(
    () =>
      bindClassifierFeedbackLabels([{ ...inputs[0]!, url: 'https://example.com/wrong' }], [queue]),
    /url does not match/
  );
  assert.throws(
    () =>
      bindClassifierFeedbackLabels(
        [
          {
            ...inputs[0]!,
            original: { ...inputs[0]!.original, depth_score: 0.51 },
          },
        ],
        [queue]
      ),
    /depth_score does not match/
  );
});

test('rejects incidents, synthesis, duplicates, mixed dimensions, and invalid dates', async () => {
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
      () => parseClassifierFeedbackInput(JSON.stringify(candidate)),
      new RegExp(fixture.error.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      fixture.id
    );
  }
});

test('accepts an explicit route-only correction without changing classifier labels', async () => {
  const inputs = await validInputs();
  const routeCorrection: ClassifierFeedbackLabelInput = {
    ...inputs[0]!,
    correction_type: 'route',
    corrected: {
      interest_level: inputs[0]!.original.interest_level,
      consumption_depth: inputs[0]!.original.consumption_depth,
      route: 'discuss',
    },
    reason: 'Discuss this item despite its default quick-read route.',
  };
  const [label] = bindClassifierFeedbackLabels([routeCorrection], [queueInput(inputs)]);
  assert.equal(label?.correction_type, 'route');
  assert.equal(label?.corrected.route, 'discuss');
});

test('records to locked private JSONL, repairs a missing newline, and rejects semantic duplicates', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'llm-wiki-feedback-'));
  const inputs = await validInputs();
  const inputPath = path.join(root, 'labels.json');
  const queuePath = path.join(root, queueFilename);
  const outputPath = path.join(root, '.private/classifier-feedback/labels.jsonl');
  await writeFile(inputPath, JSON.stringify(inputs));
  await writeFile(queuePath, queueInput(inputs).text);

  assert.equal(
    await runClassifierFeedbackCommand([
      '--input',
      inputPath,
      '--queue',
      queuePath,
      '--output',
      outputPath,
    ]),
    0
  );
  const first = await readFile(outputPath, 'utf8');
  assert.equal(first.trim().split('\n').length, 2);

  const changedTimestamps = inputs.map((input) => ({
    ...input,
    recorded_at: '2026-07-02T10:00:00Z',
  }));
  await writeFile(inputPath, JSON.stringify(changedTimestamps));
  await assert.rejects(
    runClassifierFeedbackCommand([
      '--input',
      inputPath,
      '--queue',
      queuePath,
      '--output',
      outputPath,
    ]),
    /already recorded/
  );
  assert.equal(await readFile(outputPath, 'utf8'), first);

  const labels = bindClassifierFeedbackLabels(inputs, [queueInput(inputs)]);
  const noNewlinePath = path.join(root, '.private/classifier-feedback/no-newline.jsonl');
  await writeFile(noNewlinePath, JSON.stringify(labels[0]));
  await appendClassifierFeedbackLabels(noNewlinePath, [labels[1]!]);
  assert.equal((await readFile(noNewlinePath, 'utf8')).trim().split('\n').length, 2);

  const lockedPath = path.join(root, '.private/classifier-feedback/locked.jsonl');
  await writeFile(`${lockedPath}.lock`, 'held');
  await assert.rejects(
    appendClassifierFeedbackLabels(lockedPath, [labels[0]!]),
    /locked by another recorder/
  );
});

test('refuses to write feedback outside a private directory', async () => {
  await assert.rejects(
    runClassifierFeedbackCommand([
      '--input',
      validFixturePath,
      '--queue',
      validFixturePath,
      '--output',
      'labels.jsonl',
    ]),
    /must be under a \.private directory/
  );
});

async function validInputs(): Promise<ClassifierFeedbackLabelInput[]> {
  return parseClassifierFeedbackInput(await readFile(validFixturePath, 'utf8'));
}

function queueInput(inputs: ClassifierFeedbackLabelInput[]): { filename: string; text: string } {
  const items = inputs.map((input, index) => ({
    source_item_id: input.source_item_id,
    title: input.title,
    summary: 'Sanitized fixture summary.',
    url: input.url,
    interest_level: input.original.interest_level,
    interest_score: input.original.interest_score,
    consumption_depth: input.original.consumption_depth,
    depth_score: input.original.depth_score,
    commute_behavior: input.original.route,
    signals: ['sanitized_fixture'],
    reason: 'Sanitized original classifier reason.',
    profile_version: input.profile_version,
    prompt_version: input.prompt_version,
    provider: input.provider,
    model: input.model,
    parser_version: 'fixture-parser.v1',
    route_version: 'routing-rules.v1',
    classified_at: '2026-07-01T11:00:00Z',
    routed_at: '2026-07-01T11:00:01Z',
    playback: {
      position: index + 1,
      total: inputs.length,
      spoken: `${index + 1} of ${inputs.length}`,
    },
  }));
  return {
    filename: queueFilename,
    text: JSON.stringify({
      queue_version: 'tldr-commute-queue.v2',
      newsletter: 'Sanitized Fixture',
      edition_date: '2026-07-01',
      source_email: {
        gmail_message_id: 'fixture-message',
        sender: 'Fixture Sender <fixture@example.com>',
        delivered_at: '2026-07-01T10:00:00Z',
      },
      items,
      total_items: items.length,
    }),
  };
}

function setNested(record: Record<string, unknown>, dottedPath: string, value: unknown): void {
  const parts = dottedPath.split('.');
  let target = record;
  for (const part of parts.slice(0, -1)) {
    target = target[part] as Record<string, unknown>;
  }
  target[parts.at(-1)!] = value;
}
