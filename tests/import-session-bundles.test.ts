import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  maintenanceCandidateKey,
  reconcileSessionBundles,
} from '../src/commute/import-session-bundles.js';

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
    maintenance_key: maintenanceCandidateKey(
      '2026-07-20-morning-tldr-dev',
      'event-002',
      'https://example.com/first'
    ),
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
    maintenance_key: maintenanceCandidateKey(
      'reconstructed-demo',
      'save-second',
      'https://example.com/second'
    ),
    session_id: 'reconstructed-demo',
    event_id: 'save-second',
    source_item_id: 'tldr-demo-002',
    title: 'Second exact headline',
    url: 'https://example.com/second',
    status: 'pending',
  });
});

test('rejects a recovered bundle that declares an artifact claimed by a distinct session', () => {
  const queue = (JSON.parse(validBundle) as { queue_snapshot: { queue: unknown } }).queue_snapshot
    .queue;
  const malformed = {
    schema_version: 'commute-session-bundle.v1',
    session: {
      session_id: 'distinct-recovered-session',
      session_date: '2026-07-20',
      artifact_filename: artifactFilename,
      voice_surface: 'chatgpt_standard',
    },
    queue_snapshot: { filename: 'fixture-queue.txt', queue: {} },
    events: [{ event_id: 'save-first', action: 'wiki_this', item: 1 }],
  };

  const result = reconcileSessionBundles([
    { filename: artifactFilename, text: validBundle },
    {
      filename: '202607200745-morning-commute-session-bundle (1).txt',
      text: JSON.stringify(malformed),
      recoveryQueue: { filename: 'fixture-queue.txt', text: JSON.stringify(queue) },
    },
  ]);

  assert.deepEqual(
    result.sessions.map((session) => session.status),
    ['accepted', 'rejected']
  );
  assert.match(result.sessions[1]?.error ?? '', /Canonical artifact filename .* already declared/);
});

test('rejects a recovered bundle whose downloaded filename conflicts with its declaration', () => {
  const queue = (JSON.parse(validBundle) as { queue_snapshot: { queue: unknown } }).queue_snapshot
    .queue;
  const malformed = {
    schema: 'legacy-summary',
    session: {
      session_id: 'renamed-recovered-session',
      artifact_filename: artifactFilename,
      queue_filename: 'fixture-queue.txt',
    },
    queue_snapshot: { filename: 'fixture-queue.txt', queue: {} },
    events: [{ action: 'wiki', item: 1 }],
  };

  const result = reconcileSessionBundles([
    {
      filename: 'renamed-recovery.txt',
      text: JSON.stringify(malformed),
      recoveryQueue: { filename: 'fixture-queue.txt', text: JSON.stringify(queue) },
    },
  ]);

  assert.equal(result.sessions[0]?.status, 'rejected');
  assert.match(result.sessions[0]?.error ?? '', /Recovery bundle filename does not match/);
});

test('rejects a recovered bundle without a declared artifact when its filename is noncanonical', () => {
  const queue = (JSON.parse(validBundle) as { queue_snapshot: { queue: unknown } }).queue_snapshot
    .queue;
  const malformed = {
    schema: 'legacy-summary',
    session: {
      session_id: 'noncanonical-recovered-session',
      queue_filename: 'fixture-queue.txt',
    },
    queue_snapshot: { filename: 'fixture-queue.txt', queue: {} },
    events: [{ action: 'wiki', item: 1 }],
  };

  const result = reconcileSessionBundles([
    {
      filename: 'renamed-recovery.txt',
      text: JSON.stringify(malformed),
      recoveryQueue: { filename: 'fixture-queue.txt', text: JSON.stringify(queue) },
    },
  ]);

  assert.equal(result.sessions[0]?.status, 'rejected');
  assert.match(result.sessions[0]?.error ?? '', /artifact_filename must use YYYYMMDDHHmm/);
});

test('uses the canonical artifact name for a recovered fallback session identity', () => {
  const queue = (JSON.parse(validBundle) as { queue_snapshot: { queue: unknown } }).queue_snapshot
    .queue;
  const malformed = {
    schema: 'legacy-summary',
    session: {
      session_date: '2026-07-20',
      queue_filename: 'fixture-queue.txt',
    },
    queue_snapshot: { filename: 'fixture-queue.txt', queue: {} },
    events: [{ action: 'wiki', item: 1 }],
  };
  const librarySuffixFilename = '202607200745-morning-commute-session-bundle (1).txt';

  const result = reconcileSessionBundles([
    {
      filename: artifactFilename,
      text: JSON.stringify(malformed),
      recoveryQueue: { filename: 'fixture-queue.txt', text: JSON.stringify(queue) },
    },
    {
      filename: librarySuffixFilename,
      text: JSON.stringify(malformed),
      recoveryQueue: { filename: 'fixture-queue.txt', text: JSON.stringify(queue) },
    },
  ]);

  assert.equal(result.sessions[0]?.status, 'accepted');
  assert.equal(result.sessions[1]?.status, 'rejected');
  assert.match(result.sessions[1]?.error ?? '', /Duplicate session_id recovered-/);
});

test('keeps distinct maintenance candidates whose colon-delimited identities would collide', () => {
  const first = JSON.parse(validBundle) as {
    session: Record<string, unknown>;
    events: Array<Record<string, unknown>>;
  };
  first.session.session_id = 'a';
  first.events[1]!.event_id = 'b:c';

  const second = JSON.parse(validBundle) as {
    session: Record<string, unknown>;
    events: Array<Record<string, unknown>>;
  };
  second.session.session_id = 'a:b';
  second.session.artifact_filename = '202607200815-morning-commute-session-bundle.txt';
  second.events[1]!.event_id = 'c';

  const result = reconcileSessionBundles([
    { filename: artifactFilename, text: JSON.stringify(first) },
    {
      filename: '202607200815-morning-commute-session-bundle.txt',
      text: JSON.stringify(second),
    },
  ]);

  assert.deepEqual(
    result.sessions.map((session) => session.status),
    ['accepted', 'accepted']
  );
  assert.equal(result.maintenance_candidates.length, 2);
  assert.notEqual(
    result.maintenance_candidates[0]?.maintenance_key,
    result.maintenance_candidates[1]?.maintenance_key
  );
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

test('converts a redundant depth promotion into a quality incident without rejecting the session', () => {
  const bundle = JSON.parse(validBundle) as {
    queue_snapshot: { queue: { items: Array<Record<string, unknown>> } };
    events: Array<Record<string, unknown>>;
  };
  const firstItem = bundle.queue_snapshot.queue.items[0];
  assert.ok(firstItem);
  firstItem.consumption_depth = 'in_depth';
  const action = bundle.events[1];
  assert.ok(action);
  action.action = 'promote_to_in_depth';
  action.user_words = 'This should have been in depth.';

  const result = reconcileSessionBundles(
    [{ filename: artifactFilename, text: JSON.stringify(bundle) }],
    '2026-07-25T12:00:00.000Z'
  );

  assert.equal(result.sessions[0]?.status, 'accepted');
  assert.equal(result.feedback_events.length, 0);
  assert.equal(result.quality_incidents.length, 1);
  assert.equal(result.event_conversions.length, 1);
  assert.equal(result.event_conversions[0]?.original_event.kind, 'item_action');
  assert.equal(result.event_conversions[0]?.converted_event.kind, 'quality_incident');
  assert.equal(
    result.event_conversions[0]?.converted_event.event_id,
    result.event_conversions[0]?.original_event.event_id
  );
  assert.match(
    result.event_conversions[0]?.reason ?? '',
    /playback\/process evidence, not classifier feedback/
  );
});

test('does not turn an already-wikied reference into a new maintenance candidate', () => {
  const bundle = JSON.parse(validBundle) as { events: Array<Record<string, unknown>> };
  const action = bundle.events[1];
  assert.ok(action);
  action.user_words = 'I already wikked this, so you can move on to the next.';

  const result = reconcileSessionBundles(
    [{ filename: artifactFilename, text: JSON.stringify(bundle) }],
    '2026-08-05T12:00:00.000Z'
  );

  assert.equal(result.sessions[0]?.status, 'accepted');
  assert.equal(result.maintenance_candidates.length, 0);
  assert.equal(result.quality_incidents.length, 1);
  assert.equal(result.event_conversions.length, 1);
  assert.match(result.event_conversions[0]?.reason ?? '', /already completed wiki save/);
});

test('does not recover an already-wikied reference as a new maintenance candidate', () => {
  const queue = (JSON.parse(validBundle) as { queue_snapshot: { queue: unknown } }).queue_snapshot
    .queue;
  const malformed = {
    schema_version: 'commute-session-bundle.v1',
    session: {
      session_id: 'reconstructed-prior-save',
      session_date: '2026-07-20',
      artifact_filename: artifactFilename,
      voice_surface: 'chatgpt_live',
    },
    queue_snapshot: { filename: 'fixture-queue.txt', queue: {} },
    events: [
      {
        event_id: 'prior-save',
        sequence: 1,
        kind: 'item_action',
        action: 'wiki_this',
        item: { source_item_id: 'tldr-demo-001' },
        user_words: 'I already wikied this last week.',
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
  assert.equal(result.maintenance_candidates.length, 0);
  assert.equal(result.quality_incidents.length, 1);
  const incident = result.quality_incidents[0]?.event;
  assert.equal(incident?.kind, 'quality_incident');
  if (incident?.kind === 'quality_incident') {
    assert.match(incident.observed_behavior, /prior wiki save/);
  }
});

test('preserves source identity when another event uses the old synthesized incident suffix', () => {
  const bundle = JSON.parse(validBundle) as {
    queue_snapshot: { queue: { items: Array<Record<string, unknown>> } };
    events: Array<Record<string, unknown>>;
  };
  const firstItem = bundle.queue_snapshot.queue.items[0];
  assert.ok(firstItem);
  firstItem.consumption_depth = 'in_depth';
  const action = bundle.events[1];
  assert.ok(action);
  action.event_id = 'feedback';
  action.action = 'promote_to_in_depth';
  action.user_words = 'This should have been in depth.';
  bundle.events.push({
    event_id: 'feedback:quality-incident',
    sequence: 5,
    kind: 'quality_incident',
    observed_behavior: 'A separate playback issue.',
    boundary: 'playback',
    evidence: [
      {
        source: 'user_provided_chat_or_ui_observation',
        reference: 'Visible conversation',
      },
    ],
  });

  const result = reconcileSessionBundles(
    [{ filename: artifactFilename, text: JSON.stringify(bundle) }],
    '2026-07-25T12:00:00.000Z'
  );

  assert.equal(result.sessions[0]?.status, 'accepted');
  assert.deepEqual(
    result.quality_incidents.map((incident) => incident.event_id),
    ['feedback', 'feedback:quality-incident']
  );
});

test('keeps a genuine depth promotion as classifier feedback', () => {
  const bundle = JSON.parse(validBundle) as {
    events: Array<Record<string, unknown>>;
  };
  const action = bundle.events[1];
  assert.ok(action);
  action.action = 'promote_to_in_depth';
  action.user_words = 'This should have been in depth.';

  const result = reconcileSessionBundles(
    [{ filename: artifactFilename, text: JSON.stringify(bundle) }],
    '2026-07-25T12:00:00.000Z'
  );

  assert.equal(result.sessions[0]?.status, 'accepted');
  assert.equal(result.feedback_events.length, 1);
  assert.equal(result.quality_incidents.length, 0);
  assert.equal(result.event_conversions.length, 0);
});
