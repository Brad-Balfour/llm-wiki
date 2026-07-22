import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { reconcileSessionBundles } from '../src/commute/import-session-bundles.js';

const fixturePath = path.resolve('tests/fixtures/commute-bundles/valid-partial-bundle.json');
const validBundle = readFileSync(fixturePath, 'utf8');
const artifactFilename = '202607200745-morning-commute-session-bundle.txt';

test('reconciles a valid partial bundle without a second approval step', () => {
  const result = reconcileSessionBundles(
    [{ filename: artifactFilename, text: validBundle }],
    '2026-07-20T12:00:00.000Z'
  );

  assert.equal(result.sessions.length, 1);
  assert.equal(result.sessions[0]?.status, 'accepted');
  assert.equal(result.maintenance_candidates.length, 1);
  assert.deepEqual(result.maintenance_candidates[0], {
    maintenance_key: '2026-07-20-morning-tldr-dev:event-002:https://example.com/first',
    session_id: '2026-07-20-morning-tldr-dev',
    event_id: 'event-002',
    source_item_id: 'tldr-demo-001',
    title: 'First exact headline',
    url: 'https://example.com/first',
    status: 'pending',
  });
});

test('preserves an invalid bundle as a rejected independent session', () => {
  const result = reconcileSessionBundles(
    [
      { filename: artifactFilename, text: validBundle },
      { filename: 'broken.txt', text: '{not JSON' },
    ],
    '2026-07-20T12:00:00.000Z'
  );

  assert.equal(result.sessions[0]?.status, 'accepted');
  assert.equal(result.sessions[1]?.status, 'rejected');
  assert.match(result.sessions[1]?.error ?? '', /not valid JSON/);
  assert.equal(result.maintenance_candidates.length, 1);
});

test('isolates a bundle whose downloaded filename conflicts with its declaration', () => {
  const result = reconcileSessionBundles(
    [{ filename: 'commute-session-bundle.txt', text: validBundle }],
    '2026-07-20T12:00:00.000Z'
  );

  assert.equal(result.sessions[0]?.status, 'rejected');
  assert.match(result.sessions[0]?.error ?? '', /Bundle filename does not match/);
});

test('recovers a malformed v1-shaped bundle from its named supplied queue', () => {
  const queue = (JSON.parse(validBundle) as { queue_snapshot: { queue: unknown } }).queue_snapshot
    .queue;
  const malformed = {
    schema_version: 'commute-session-bundle.v1',
    session: {
      session_id: 'reconstructed-demo',
      session_date: '2026-07-20',
      artifact_filename: artifactFilename,
      voice_surface: 'chatgpt_standard',
    },
    queue_snapshot: { filename: 'fixture-queue.txt', queue: {} },
    playback: { status: 'partial' },
    integrity: { state: 'partial', incomplete_reason: 'Queue omitted.', unresolved_event_ids: [] },
    events: [
      {
        event_id: 'save-second',
        sequence: 1,
        kind: 'item_action',
        action: 'wiki_this',
        item: { source_item_id: '2', title: 'stale title', url: 'https://example.invalid' },
        user_words: 'Save this for the wiki.',
        evidence: [{ source: 'explicit_user_capture', reference: 'Conversation' }],
      },
    ],
  };

  const result = reconcileSessionBundles([
    {
      filename: artifactFilename,
      text: JSON.stringify(malformed),
      recoveryQueue: { filename: 'fixture-queue.txt', text: JSON.stringify(queue) },
    },
  ]);

  assert.equal(result.sessions[0]?.status, 'accepted');
  assert.equal(result.sessions[0]?.integrity_state, 'recovered');
  assert.deepEqual(result.maintenance_candidates[0], {
    maintenance_key: 'reconstructed-demo:save-second:https://example.com/second',
    session_id: 'reconstructed-demo',
    event_id: 'save-second',
    source_item_id: 'tldr-demo-002',
    title: 'Second exact headline',
    url: 'https://example.com/second',
    status: 'pending',
  });
});

test('recovers a legacy numeric wiki marker without a memorized spoken command', () => {
  const queue = (JSON.parse(validBundle) as { queue_snapshot: { queue: unknown } }).queue_snapshot
    .queue;
  const malformed = {
    schema: 'legacy-summary',
    session: {
      session_date: '2026-07-20',
      artifact_filename: artifactFilename,
      queue_filename: 'fixture-queue.txt',
    },
    queue_snapshot: { filename: 'fixture-queue.txt', queue: {} },
    integrity: 'partial',
    events: [{ item: 1, action: 'wiki', feedback: 'Saved during commute.' }],
  };

  const result = reconcileSessionBundles([
    {
      filename: artifactFilename,
      text: JSON.stringify(malformed),
      recoveryQueue: { filename: 'fixture-queue.txt', text: JSON.stringify(queue) },
    },
  ]);

  assert.equal(result.sessions[0]?.status, 'accepted');
  assert.equal(result.maintenance_candidates[0]?.source_item_id, 'tldr-demo-001');
  assert.equal(result.maintenance_candidates[0]?.url, 'https://example.com/first');
});
