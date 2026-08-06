import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { parseCommuteHandoffText } from '../src/commute/handoff.js';
import type { CommuteHandoff, CommuteReviewNote } from '../src/commute/handoff.js';
import { prepareWikiReviewDrafts } from '../src/wiki/prepare-handoff-drafts.js';

test('prepares private wiki drafts without granting public approval', async () => {
  const handoff = parseCommuteHandoffText(
    await readFile('tests/fixtures/commute/valid-handoff.txt', 'utf8')
  );
  const drafts = prepareWikiReviewDrafts(handoff);

  assert.equal(drafts.length, 1);
  assert.equal(drafts[0]?.status, 'needs_enrichment_and_approval');
  assert.ok(drafts[0]?.missing_fields.includes('approval.explicit_public_confirmation'));
  assert.equal(Object.hasOwn(drafts[0] ?? {}, 'approval'), false);
});

// --- Characterization tests (issue #55 item 1) ---
// Pin the draft-shaping and slug rules before item 11 restructures this CLI.

function handoffWith(notes: CommuteReviewNote[]): CommuteHandoff {
  return {
    schema_version: 'commute-handoff.v2',
    session_id: 'session-1',
    session_date: '2026-07-20',
    voice_surface: 'chatgpt_live',
    queue_files: ['queue.txt'],
    queue_states: [{ queue_file: 'queue.txt', status: 'completed' }],
    feedback: [],
    review_notes: notes,
    issues: [],
  };
}

const completeNote: CommuteReviewNote = {
  queue_file: 'queue.txt',
  source_item_id: 'tldr_abc123',
  title: 'A Useful Article',
  url: 'https://example.com/a',
  note: 'worth a wiki page',
  destination: 'wiki_review',
};

test('keeps only wiki_review notes out of a mixed handoff', () => {
  const drafts = prepareWikiReviewDrafts(
    handoffWith([
      completeNote,
      { title: 'General', note: 'n', destination: 'general_review' },
      { title: 'Range', note: 'n', destination: 'range_review' },
    ])
  );

  assert.equal(drafts.length, 1);
  assert.equal(drafts[0]?.title, 'A Useful Article');
});

test('a complete note reports only the enrichment fields it still needs', () => {
  const draft = prepareWikiReviewDrafts(handoffWith([completeNote]))[0];

  assert.equal(draft?.source_item_id, 'tldr_abc123');
  assert.equal(draft?.url, 'https://example.com/a');
  assert.equal(draft?.queue_file, 'queue.txt');
  assert.equal(draft?.review_note, 'worth a wiki page');
  assert.equal(draft?.missing_fields.includes('source.source_item_id'), false);
  assert.equal(draft?.missing_fields.includes('source.url'), false);
  assert.deepEqual(draft?.missing_fields, [
    'source.newsletter',
    'source.edition_date',
    'entry.type',
    'entry.summary',
    'entry.key_ideas',
    'approval.safety_review',
    'approval.explicit_public_confirmation',
  ]);
});

test('normalizes the unknown source-item placeholder to a missing field', () => {
  // `unknown` is rejected at the wiki_review boundary by the handoff validator,
  // so it can only reach here through a directly constructed note. The draft
  // must still refuse to treat it as an identity.
  const draft = prepareWikiReviewDrafts(
    handoffWith([{ ...completeNote, source_item_id: 'unknown' }])
  )[0];

  assert.equal(draft?.source_item_id, null);
  assert.equal(draft?.missing_fields[0], 'source.source_item_id');
});

test('records absent identity and url as nulls plus leading missing fields', () => {
  const draft = prepareWikiReviewDrafts(
    handoffWith([{ title: 'Bare note', note: 'n', destination: 'wiki_review' }])
  )[0];

  assert.equal(draft?.source_item_id, null);
  assert.equal(draft?.url, null);
  assert.equal(draft?.queue_file, null);
  assert.deepEqual(draft?.missing_fields.slice(0, 2), ['source.url', 'source.source_item_id']);
});

test('derives a kebab-case slug and never emits an empty one', () => {
  const slugFor = (title: string): string | undefined =>
    prepareWikiReviewDrafts(handoffWith([{ ...completeNote, title }]))[0]?.suggested_slug;

  assert.equal(slugFor('A Useful Article'), 'a-useful-article');
  assert.equal(slugFor('  Spaces & Symbols!  '), 'spaces-symbols');
  assert.equal(slugFor('Mixed CASE 123'), 'mixed-case-123');
  assert.equal(slugFor('!!!'), 'wiki-review-item');
  assert.equal(slugFor('...---...'), 'wiki-review-item');
});

test('truncates a long slug to 80 characters without a trailing separator', () => {
  const draft = prepareWikiReviewDrafts(
    handoffWith([{ ...completeNote, title: `${'word '.repeat(30)}tail` }])
  )[0];

  assert.ok((draft?.suggested_slug.length ?? 0) <= 80);
  assert.equal(draft?.suggested_slug.endsWith('-'), false);
});

test('never grants approval or public status in a draft', () => {
  const draft = prepareWikiReviewDrafts(handoffWith([completeNote]))[0];

  assert.equal(draft?.status, 'needs_enrichment_and_approval');
  assert.equal(Object.hasOwn(draft ?? {}, 'approval'), false);
  assert.equal(Object.hasOwn(draft ?? {}, 'public'), false);
});
