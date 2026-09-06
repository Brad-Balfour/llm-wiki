import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { playbackFileFingerprint } from '../src/commute/session-bundle.js';

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

  const bareOrigin = parseClassifierFeedbackInput(
    JSON.stringify({ ...inputs[0]!, url: 'https://example.com' })
  );
  assert.equal(bareOrigin[0]?.url, 'https://example.com');
  assert.equal(
    bindClassifierFeedbackLabels(bareOrigin, [queueInput(bareOrigin)])[0]?.url,
    'https://example.com'
  );
});

test('binds v4 corrections using producer versions from the reference root', async () => {
  const input = (await validInputs())[0]!;
  const mainFilename = input.queue_filename;
  const mode = input.original.consumption_depth === 'in_depth' ? 'In depth' : 'Headline only';
  const prefix = `1 of 1. ${mode}. ${input.title}`;
  const description = 'Sanitized fixture description.';
  const main = {
    sweep_playback: prefix,
    items: [
      {
        item_playback:
          input.original.consumption_depth === 'in_depth' ? `${prefix}\n${description}` : prefix,
      },
    ],
  };
  const reference = {
    queue_version: 'tldr-commute-queue.v4',
    main_filename: mainFilename,
    main_sha256: playbackFileFingerprint(main),
    newsletter: 'Sanitized Fixture',
    edition_date: '2026-07-01',
    source_email: {
      gmail_message_id: 'fixture-message',
      sender: 'TLDR <fixture@example.com>',
      delivered_at: '2026-07-01T08:00:00Z',
    },
    daily_generation_id: '20260701-daily-tldr',
    total_items: 1,
    profile_version: input.profile_version,
    prompt_version: input.prompt_version,
    provider: input.provider,
    model: input.model,
    parser_version: 'fixture-parser.v1',
    route_version: input.route_version,
    coverage_decisions: [],
    items: [
      {
        position: 1,
        source_item_id: input.source_item_id,
        title: input.title,
        description,
        author: 'No authors listed',
        publication: 'example.com',
        url: input.url,
        attribution: {
          resolved_url: input.url,
          author_source: 'no_authors_listed',
          publication_source: 'hostname_fallback',
          lookup_attempts: 1,
        },
        source_occurrences: [
          {
            occurrence_id: `fixture-${input.source_item_id}`,
            newsletter: 'Sanitized Fixture',
            source_item_id: input.source_item_id,
            source_order: 1,
            title: input.title,
            description,
            url: input.url,
          },
        ],
        selected_source_occurrence_id: `fixture-${input.source_item_id}`,
        coverage: {
          status: 'original',
          related_retained_item: null,
          decision_reason: 'No repeated daily coverage found.',
          update_note: null,
        },
        playback_context: {
          headline_context: null,
          excerpt_source_occurrence_id: null,
          unusually_long_excerpt: false,
          update_prefix: null,
        },
        interest_level: input.original.interest_level,
        interest_score: input.original.interest_score,
        consumption_depth: input.original.consumption_depth,
        depth_score: input.original.depth_score,
        commute_behavior: input.original.route,
        signals: ['sanitized_fixture'],
        reason: 'Sanitized original classifier reason.',
        classified_at: '2026-07-01T11:00:00Z',
        routed_at: '2026-07-01T11:00:01Z',
      },
    ],
  };

  const labels = bindClassifierFeedbackLabels(
    [input],
    [
      {
        filename: mainFilename,
        text: JSON.stringify(main),
        reference: {
          filename: mainFilename.replace(/\.txt$/, '-reference.txt'),
          text: JSON.stringify(reference),
        },
      },
    ]
  );
  assert.equal(labels[0]?.profile_version, input.profile_version);
  assert.equal(labels[0]?.route_version, input.route_version);
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

  const wrongRouteQueue = JSON.parse(queue.text) as {
    items: Array<{ route_version: string }>;
  };
  wrongRouteQueue.items[0]!.route_version = 'routing-rules.v2';
  assert.throws(
    () =>
      bindClassifierFeedbackLabels(
        [inputs[0]!],
        [{ filename: queue.filename, text: JSON.stringify(wrongRouteQueue) }]
      ),
    /route_version does not match/
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

  const stalePath = path.join(root, '.private/classifier-feedback/stale.jsonl');
  await writeFile(
    `${stalePath}.lock`,
    `${JSON.stringify({ pid: 999_999_999, created_at: '2026-07-01T00:00:00Z' })}\n`
  );
  await assert.rejects(
    appendClassifierFeedbackLabels(stalePath, [labels[0]!]),
    /has a stale lock.*inspect and remove it/
  );

  const unreadablePath = path.join(root, '.private/classifier-feedback/unreadable.jsonl');
  await writeFile(`${unreadablePath}.lock`, 'not-json\n');
  await assert.rejects(
    appendClassifierFeedbackLabels(unreadablePath, [labels[0]!]),
    /has an unreadable lock requiring review/
  );

  const lockedPath = path.join(root, '.private/classifier-feedback/locked.jsonl');
  await writeFile(
    `${lockedPath}.lock`,
    `${JSON.stringify({ pid: process.pid, created_at: new Date().toISOString() })}\n`
  );
  await assert.rejects(
    appendClassifierFeedbackLabels(lockedPath, [labels[0]!]),
    /locked by recorder process/
  );
});

test('keeps URL spelling exact while rejecting schema-incompatible forms', async () => {
  const [input] = await validInputs();
  assert.throws(
    () =>
      parseClassifierFeedbackInput(
        JSON.stringify({ ...input!, url: 'HTTPS://example.com/article' })
      ),
    /credential-free HTTP\(S\) URL/
  );
  assert.throws(
    () =>
      parseClassifierFeedbackInput(
        JSON.stringify({ ...input!, url: ' https://example.com/article ' })
      ),
    /credential-free HTTP\(S\) URL/
  );

  const schema = JSON.parse(
    await readFile('schema/classifier-feedback-label-v1.schema.json', 'utf8')
  ) as { properties: { url: { pattern: string } } };
  const schemaPattern = new RegExp(schema.properties.url.pattern);
  assert.equal(schemaPattern.test('https://example.com/article'), true);
  assert.equal(schemaPattern.test('https://user:secret@example.com/article'), false);
  assert.equal(schemaPattern.test('https://example.com/has space'), false);
});

test('refuses to write feedback outside a private directory', async () => {
  const inputs = await validInputs();
  const [label] = bindClassifierFeedbackLabels(inputs, [queueInput(inputs)]);
  await assert.rejects(
    appendClassifierFeedbackLabels(path.join(tmpdir(), 'tracked-looking-feedback.jsonl'), [label!]),
    /must be under a \.private directory/
  );

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
    route_version: input.route_version,
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
