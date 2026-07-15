import assert from 'node:assert/strict';
import test from 'node:test';

import { parseCommuteHandoffText } from '../src/commute/handoff.js';

const validHandoff = {
  schema_version: 'commute-handoff.v1',
  session_id: '2026-07-13-morning-tldr',
  session_date: '2026-07-13',
  voice_surface: 'chatgpt_live',
  queue_files: ['20260713-tldr-ai-headline.txt'],
  feedback: [
    {
      queue_file: '20260713-tldr-ai-headline.txt',
      source_item_id: 'tldr-ai-2026-07-13-example',
      action: 'promote_to_in_depth',
      note: 'Worth discussing tomorrow.',
    },
  ],
  review_notes: [
    {
      queue_file: '20260713-tldr-ai-headline.txt',
      source_item_id: 'tldr-ai-2026-07-13-example',
      title: 'Example article',
      url: 'https://example.com/article',
      note: 'Possible reusable wiki idea.',
      destination: 'wiki_review',
    },
  ],
  issues: [],
};

const validV2Handoff = {
  ...validHandoff,
  schema_version: 'commute-handoff.v2',
  queue_states: [
    {
      queue_file: '20260713-tldr-ai-headline.txt',
      status: 'partial',
      last_completed_source_item_id: '20260713-ai-003',
      current_source_item_id: '20260713-ai-004',
      resume_source_item_id: '20260713-ai-004',
    },
  ],
};

test('parses a commute handoff stored as JSON in a txt file', () => {
  const parsed = parseCommuteHandoffText(JSON.stringify(validHandoff));

  assert.equal(parsed.session_id, '2026-07-13-morning-tldr');
  assert.equal(parsed.feedback[0]?.action, 'promote_to_in_depth');
  assert.equal(parsed.review_notes[0]?.destination, 'wiki_review');
});

test('accepts a fenced JSON response copied from a chat', () => {
  const parsed = parseCommuteHandoffText(`\`\`\`json\n${JSON.stringify(validHandoff)}\n\`\`\``);

  assert.equal(parsed.schema_version, 'commute-handoff.v1');
});

test('fails closed when a transcript is included', () => {
  assert.throws(
    () => parseCommuteHandoffText(JSON.stringify({ ...validHandoff, transcript: 'private' })),
    /unsupported fields: transcript/
  );
});

test('rejects a wiki review note without the exact source queue and article identity', () => {
  const malformed = JSON.parse(JSON.stringify(validHandoff)) as {
    review_notes: Array<Record<string, unknown>>;
  };
  delete malformed.review_notes[0]?.queue_file;
  assert.throws(() => parseCommuteHandoffText(JSON.stringify(malformed)), /queue_file is required/);
});

test('parses a v2 handoff with an exact partial-queue resume cursor', () => {
  const parsed = parseCommuteHandoffText(JSON.stringify(validV2Handoff));

  assert.equal(parsed.schema_version, 'commute-handoff.v2');
  assert.equal(parsed.queue_states?.[0]?.status, 'partial');
  assert.equal(parsed.queue_states?.[0]?.resume_source_item_id, '20260713-ai-004');
});

test('requires one v2 queue state for every queue file', () => {
  const malformed = { ...validV2Handoff, queue_states: [] };

  assert.throws(
    () => parseCommuteHandoffText(JSON.stringify(malformed)),
    /exactly one entry for every queue_files value/
  );
});

test('requires an exact resume id for a partial v2 queue', () => {
  const malformed = JSON.parse(JSON.stringify(validV2Handoff)) as {
    queue_states: Array<Record<string, unknown>>;
  };
  delete malformed.queue_states[0]?.resume_source_item_id;

  assert.throws(
    () => parseCommuteHandoffText(JSON.stringify(malformed)),
    /resume_source_item_id is required/
  );
});

test('rejects resume state on a completed v2 queue', () => {
  const malformed = JSON.parse(JSON.stringify(validV2Handoff)) as {
    queue_states: Array<Record<string, unknown>>;
  };
  malformed.queue_states[0]!.status = 'completed';

  assert.throws(
    () => parseCommuteHandoffText(JSON.stringify(malformed)),
    /only include current or resume ids when status is partial/
  );
});

test('keeps v1 backward compatibility without queue state', () => {
  const parsed = parseCommuteHandoffText(JSON.stringify(validHandoff));

  assert.equal(parsed.schema_version, 'commute-handoff.v1');
  assert.equal(parsed.queue_states, undefined);
});
