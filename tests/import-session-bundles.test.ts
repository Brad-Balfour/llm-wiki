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

test('recovers an exact wiki capture when the period label contradicts the artifact time', () => {
  const malformed = JSON.parse(validBundle) as {
    session: Record<string, unknown>;
    queue_snapshot: { queue: unknown };
  };
  const mismatchedPeriodFilename = '202607201304-morning-commute-session-bundle.txt';
  malformed.session.artifact_filename = mismatchedPeriodFilename;

  const result = reconcileSessionBundles([
    {
      filename: mismatchedPeriodFilename,
      text: JSON.stringify(malformed),
      recoveryQueue: {
        filename: '20260720-tldr-dev.txt',
        text: JSON.stringify(malformed.queue_snapshot.queue),
      },
    },
  ]);

  assert.equal(result.sessions[0]?.status, 'accepted');
  assert.equal(result.sessions[0]?.integrity_state, 'recovered');
  assert.equal(result.maintenance_candidates.length, 1);
  assert.equal(result.maintenance_candidates[0]?.source_item_id, 'tldr-demo-001');
  assert.match(result.sessions[0]?.recovery_warnings?.[0] ?? '', /from 1200 onward as morning/);
});

test('warns but recovers when a distinct session reuses an artifact filename', () => {
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
    ['accepted', 'accepted']
  );
  assert.match(result.sessions[1]?.recovery_warnings?.[0] ?? '', /also declared by session/);
});

test('warns but recovers when the downloaded filename conflicts with its declaration', () => {
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

  assert.equal(result.sessions[0]?.status, 'accepted');
  assert.equal(result.maintenance_candidates.length, 1);
  assert.ok(
    result.sessions[0]?.recovery_warnings?.some((warning) =>
      warning.includes('does not match declared artifact filename')
    )
  );
});

test('warns but recovers without a declared artifact when its filename is noncanonical', () => {
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

  assert.equal(result.sessions[0]?.status, 'accepted');
  assert.equal(result.maintenance_candidates.length, 1);
  assert.ok(
    result.sessions[0]?.recovery_warnings?.some((warning) =>
      warning.includes('does not declare session.artifact_filename')
    )
  );
});

test('uses canonical evidence for a recovered fallback session identity', () => {
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

  const reformattedAndRenamed = JSON.parse(JSON.stringify(malformed)) as {
    session: Record<string, unknown>;
  };
  reformattedAndRenamed.session.artifact_filename = librarySuffixFilename;

  const result = reconcileSessionBundles([
    {
      filename: artifactFilename,
      text: JSON.stringify(malformed),
      recoveryQueue: { filename: 'fixture-queue.txt', text: JSON.stringify(queue) },
    },
    {
      filename: librarySuffixFilename,
      text: JSON.stringify(reformattedAndRenamed, null, 2),
      recoveryQueue: { filename: 'fixture-queue.txt', text: JSON.stringify(queue) },
    },
  ]);

  assert.equal(result.sessions[0]?.status, 'accepted');
  assert.equal(result.sessions[1]?.status, 'rejected');
  assert.match(result.sessions[1]?.error ?? '', /Duplicate session_id recovered-/);
});

test('warns when an otherwise canonical artifact filename contradicts the session date', () => {
  const malformed = JSON.parse(validBundle) as {
    session: Record<string, unknown>;
    queue_snapshot: { queue: unknown };
  };
  const wrongDateFilename = '202607210745-morning-commute-session-bundle.txt';
  malformed.session.artifact_filename = wrongDateFilename;

  const result = reconcileSessionBundles([
    {
      filename: wrongDateFilename,
      text: JSON.stringify(malformed),
      recoveryQueue: {
        filename: '20260720-tldr-dev.txt',
        text: JSON.stringify(malformed.queue_snapshot.queue),
      },
    },
  ]);

  assert.equal(result.sessions[0]?.status, 'accepted');
  assert.equal(result.sessions[0]?.integrity_state, 'recovered');
  assert.ok(
    result.sessions[0]?.recovery_warnings?.some((warning) =>
      warning.includes('does not match session.session_date 2026-07-20')
    )
  );
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

test('does not treat a playback skip as classifier feedback', () => {
  const bundle = JSON.parse(validBundle) as { events: Array<Record<string, unknown>> };
  const action = bundle.events[1];
  assert.ok(action);
  action.action = 'skip';
  action.user_words = 'Skip to next.';

  const result = reconcileSessionBundles(
    [{ filename: artifactFilename, text: JSON.stringify(bundle) }],
    '2026-08-12T22:00:00.000Z'
  );

  assert.equal(result.sessions[0]?.status, 'accepted');
  assert.equal(result.feedback_events.length, 0);
  assert.equal(result.maintenance_candidates.length, 0);
  const retainedSkip = result.navigation_events.find(
    ({ event }) => event.kind === 'item_action' && event.action === 'skip'
  );
  assert.ok(retainedSkip);
  assert.deepEqual(retainedSkip.event, action);
  assert.equal(retainedSkip.event.user_words, 'Skip to next.');
  assert.ok(result.navigation_events.some(({ event }) => event.kind === 'playback_transition'));
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
  const incident = result.quality_incidents[0]?.event;
  assert.ok(incident);
  assert.deepEqual(incident.evidence.at(-1), {
    source: 'explicit_user_capture',
    reference: 'User words: I already wikked this, so you can move on to the next.',
  });
});

test('preserves a later explicit wiki command after reporting a prior save', () => {
  const bundle = JSON.parse(validBundle) as { events: Array<Record<string, unknown>> };
  const action = bundle.events[1];
  assert.ok(action);
  action.user_words = 'I already wikied this, but wiki it again.';

  const result = reconcileSessionBundles([
    { filename: artifactFilename, text: JSON.stringify(bundle) },
  ]);

  assert.equal(result.maintenance_candidates.length, 1);
  assert.equal(result.quality_incidents.length, 0);
  assert.equal(result.event_conversions.length, 0);
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
    assert.equal(incident.sequence, 1);
  }
  assert.equal(result.event_conversions.length, 1);
  const original = result.event_conversions[0]?.original_event;
  assert.equal(original?.kind, 'item_action');
  if (original?.kind === 'item_action') {
    assert.equal(original.item.source_item_id, 'tldr-demo-001');
    assert.equal(original.item.url, 'https://example.com/first');
    assert.equal(original.user_words, 'I already wikied this last week.');
  }
});

test('keeps recovered contradictory captures ordered and bound to exact queue items', () => {
  const queue = (JSON.parse(validBundle) as { queue_snapshot: { queue: unknown } }).queue_snapshot
    .queue;
  const malformed = {
    schema_version: 'commute-session-bundle.v1',
    session: {
      session_id: 'reconstructed-multiple-prior-saves',
      artifact_filename: artifactFilename,
    },
    queue_snapshot: { filename: 'fixture-queue.txt', queue: {} },
    events: [
      {
        event_id: 'prior-save-first',
        sequence: 4,
        kind: 'item_action',
        action: 'wiki_this',
        item: { source_item_id: 'tldr-demo-001' },
        user_words: 'I already wikied this.',
      },
      {
        event_id: 'prior-save-second',
        sequence: 7,
        kind: 'item_action',
        action: 'wiki_this',
        item: { source_item_id: 'tldr-demo-002' },
        user_words: 'I previously wikked this.',
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

  assert.deepEqual(
    result.quality_incidents.map((incident) => incident.event.sequence),
    [4, 7]
  );
  assert.deepEqual(
    result.event_conversions.map((conversion) => {
      const original = conversion.original_event;
      assert.equal(original.kind, 'item_action');
      return [original.item.source_item_id, original.item.url];
    }),
    [
      ['tldr-demo-001', 'https://example.com/first'],
      ['tldr-demo-002', 'https://example.com/second'],
    ]
  );
});

test('recovers a later explicit wiki command after reporting a prior save', () => {
  const queue = (JSON.parse(validBundle) as { queue_snapshot: { queue: unknown } }).queue_snapshot
    .queue;
  const malformed = {
    schema_version: 'commute-session-bundle.v1',
    session: { session_id: 'reconstructed-resave', artifact_filename: artifactFilename },
    queue_snapshot: { filename: 'fixture-queue.txt', queue: {} },
    events: [
      {
        event_id: 'resave',
        kind: 'item_action',
        action: 'wiki_this',
        item: { source_item_id: 'tldr-demo-001' },
        user_words: 'I already wikied this, but wiki it again.',
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

  assert.equal(result.maintenance_candidates.length, 1);
  assert.equal(result.quality_incidents.length, 0);
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
