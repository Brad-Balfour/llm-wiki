import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

import { validateClassifierBatch } from '../src/classifier/validation.js';
import type { ClassificationRecord, ClassifierInputItem } from '../src/classifier/types.js';

const classifierInputs: ClassifierInputItem[] = [
  {
    classifier_item_id: 'item-openai-evals',
    source_item_id: 'tldr_fixture_openai',
    newsletter: 'TLDR AI',
    edition_date: '2026-07-02',
    section: 'AI',
    title: 'OpenAI adds evaluation hooks for agents',
    summary: 'OpenAI released new evaluation hooks for agent workflows.',
    url: 'https://example.com/tldr/openai-agent-evals',
  },
  {
    classifier_item_id: 'item-camera-update',
    source_item_id: 'tldr_fixture_camera',
    newsletter: 'TLDR AI',
    edition_date: '2026-07-02',
    section: 'AI',
    title: 'Smartphone maker previews a minor camera update',
    summary: 'A device launch added a modest camera mode.',
    url: 'https://example.com/tldr/minor-camera-update',
  },
];

const firstInput = classifierInputs[0];

if (!firstInput) {
  throw new Error('Classifier input fixture is missing the first item.');
}

test('accepts source-neutral classifier records that match the schema and score bands', async () => {
  const validBatch = await readValidBatch();
  const result = validateClassifierBatch(validBatch, classifierInputs);

  if (!result.ok) {
    assert.fail(JSON.stringify(result.errors));
  }

  assert.deepEqual(result.records, validBatch);
});

test('rejects downstream behavior fields from classifier output', async () => {
  const [validRecord] = await readValidBatch();
  assertRecord(validRecord);
  const outputWithRoute = {
    ...validRecord,
    voice_behavior: 'discuss',
  };

  const result = validateClassifierBatch(outputWithRoute, [firstInput]);

  if (result.ok) {
    assert.fail('Expected classifier validation to reject voice_behavior.');
  }

  assert.equal(
    result.errors.some((error) => error.code === 'forbidden_downstream_field'),
    true
  );
  assert.equal(
    result.errors.some((error) => error.field === 'voice_behavior'),
    true
  );
});

test('rejects malformed schema fields before routing', async () => {
  const [validRecord] = await readValidBatch();
  assertRecord(validRecord);
  const malformed = {
    ...validRecord,
    interest_level: 'urgent',
    interest_score: 1.2,
    signals: [],
  };

  const result = validateClassifierBatch(malformed, [firstInput]);

  if (result.ok) {
    assert.fail('Expected malformed classifier output to fail validation.');
  }

  assert.deepEqual(result.errors.map((error) => error.code).sort(), [
    'invalid_enum',
    'invalid_score',
    'invalid_signals',
  ]);
});

test('rejects score and label mismatches', async () => {
  const [validRecord] = await readValidBatch();
  assertRecord(validRecord);
  const mismatched = {
    ...validRecord,
    interest_level: 'maybe',
    interest_score: 0.91,
  };

  const result = validateClassifierBatch(mismatched, [firstInput]);

  if (result.ok) {
    assert.fail('Expected score/label mismatch to fail validation.');
  }

  assert.equal(
    result.errors.some((error) => error.code === 'score_label_mismatch'),
    true
  );
});

test('rejects missing, duplicate, and unknown classifier item ids', async () => {
  const [firstRecord, secondRecord] = await readValidBatch();
  assertRecord(firstRecord);
  assertRecord(secondRecord);
  const output = [
    firstRecord,
    {
      ...secondRecord,
      classifier_item_id: firstRecord.classifier_item_id,
    },
    {
      ...secondRecord,
      classifier_item_id: 'unknown-item',
    },
  ];

  const result = validateClassifierBatch(output, classifierInputs);

  if (result.ok) {
    assert.fail('Expected id reconciliation errors.');
  }

  assert.equal(
    result.errors.some((error) => error.code === 'batch_size_mismatch'),
    true
  );
  assert.equal(
    result.errors.some((error) => error.code === 'duplicate_classifier_item_id'),
    true
  );
  assert.equal(
    result.errors.some((error) => error.code === 'unknown_classifier_item_id'),
    true
  );
  assert.equal(
    result.errors.some((error) => error.code === 'missing_classifier_item_id'),
    true
  );
});

async function readValidBatch(): Promise<ClassificationRecord[]> {
  return JSON.parse(
    await readFile(
      resolve(process.cwd(), 'tests/fixtures/expected/classifier/valid-batch.json'),
      'utf8'
    )
  ) as ClassificationRecord[];
}

function assertRecord(
  record: ClassificationRecord | undefined
): asserts record is ClassificationRecord {
  if (!record) {
    assert.fail('Expected classifier fixture record.');
  }
}
