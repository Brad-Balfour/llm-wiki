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
      source_item_id: 'tldr-ai-2026-07-13-example',
      action: 'promote_to_in_depth',
      note: 'Worth discussing tomorrow.',
    },
  ],
  review_notes: [
    {
      source_item_id: 'tldr-ai-2026-07-13-example',
      title: 'Example article',
      note: 'Possible reusable wiki idea.',
      destination: 'wiki_review',
    },
  ],
  issues: [],
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
