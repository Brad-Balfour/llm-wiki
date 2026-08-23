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

test('warns without dropping events when a downloaded filename conflicts with its declaration', () => {
  const result = reconcileSessionBundles(
    [{ filename: 'commute-session-bundle.txt', text: validBundle }],
    '2026-07-20T12:00:00.000Z'
  );

  assert.equal(result.sessions[0]?.status, 'accepted');
  assert.match(result.sessions[0]?.recovery_warnings?.[0] ?? '', /does not match declared/);
  assert.equal(result.maintenance_candidates.length, 1);
  assert.equal(result.navigation_events.length, 1);
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

test('retains supported non-item observations while recovering a malformed bundle', () => {
  const queue = (JSON.parse(validBundle) as { queue_snapshot: { queue: unknown } }).queue_snapshot
    .queue;
  const malformed = {
    schema_version: 'commute-session-bundle.v1',
    session: {
      session_id: 'recovered-observations',
      session_date: '2026-07-20',
      artifact_filename: artifactFilename,
      voice_surface: 'chatgpt_standard',
    },
    queue_snapshot: { filename: 'fixture-queue.txt', queue: {} },
    playback: { status: 'partial' },
    integrity: { state: 'partial', incomplete_reason: 'Queue omitted.', unresolved_event_ids: [] },
    events: [
      {
        event_id: 'quality-001',
        sequence: 1,
        kind: 'quality_incident',
        observed_behavior: 'Voice reported a bundle before creating a download.',
        boundary: 'bundle export',
        evidence: [
          { source: 'durable_contemporaneous_record', reference: 'Downloaded artifact list' },
        ],
      },
      {
        event_id: 'capture-001',
        sequence: 2,
        kind: 'general_capture',
        user_words: 'Preserve this product observation for later review.',
        evidence: [{ source: 'explicit_user_capture', reference: 'Brad said this.' }],
      },
      {
        event_id: 'capture-malformed',
        sequence: 3,
        kind: 'general_capture',
        user_words: 'This lacks direct evidence and must not be promoted.',
        evidence: [{ source: 'selected_queue_snapshot', reference: 'Queue only' }],
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
  assert.equal(result.quality_incidents.length, 1);
  assert.equal(result.quality_incidents[0]?.event_id, 'quality-001');
  assert.equal(result.general_captures.length, 1);
  assert.equal(result.general_captures[0]?.event_id, 'capture-001');
  assert.equal(result.maintenance_candidates.length, 0);
  assert.ok(
    result.sessions[0]?.recovery_warnings?.some((warning) =>
      warning.includes('general capture lacks direct supported evidence')
    )
  );
});

test('recovers from an embedded queue snapshot missing v2 metadata', () => {
  const malformed = JSON.parse(validBundle) as {
    queue_snapshot: { filename: string; queue: Record<string, unknown> };
  };
  delete malformed.queue_snapshot.queue.queue_version;

  const result = reconcileSessionBundles([
    {
      filename: artifactFilename,
      text: JSON.stringify(malformed),
      recoveryQueue: {
        filename: malformed.queue_snapshot.filename,
        text: JSON.stringify(
          (JSON.parse(validBundle) as { queue_snapshot: { queue: unknown } }).queue_snapshot.queue
        ),
      },
    },
  ]);

  assert.equal(result.sessions[0]?.status, 'accepted');
  assert.equal(result.sessions[0]?.integrity_state, 'recovered');
  assert.equal(result.maintenance_candidates.length, 1);
});

test('gives a recovered wiki capture precedence over a duplicate non-item event id', () => {
  const queue = (JSON.parse(validBundle) as { queue_snapshot: { queue: unknown } }).queue_snapshot
    .queue;
  const events = [
    {
      event_id: 'shared-event-id',
      sequence: 1,
      kind: 'quality_incident',
      observed_behavior: 'The download was announced before it existed.',
      boundary: 'bundle export',
      evidence: [{ source: 'durable_contemporaneous_record', reference: 'Artifact list' }],
    },
    { event_id: 'shared-event-id', sequence: 2, action: 'wiki', item: 1 },
  ];

  for (const orderedEvents of [events, [...events].reverse()]) {
    const malformed = {
      schema_version: 'commute-session-bundle.v1',
      session: { session_id: `duplicate-id-${orderedEvents[0]!.kind ?? 'wiki'}` },
      queue_snapshot: { filename: 'fixture-queue.txt', queue: {} },
      events: orderedEvents,
    };
    const result = reconcileSessionBundles([
      {
        filename: artifactFilename,
        text: JSON.stringify(malformed),
        recoveryQueue: { filename: 'fixture-queue.txt', text: JSON.stringify(queue) },
      },
    ]);

    assert.equal(result.sessions[0]?.status, 'accepted');
    assert.equal(result.maintenance_candidates.length, 1);
    assert.equal(result.quality_incidents.length, 0);
    assert.ok(
      result.sessions[0]?.recovery_warnings?.some((warning) =>
        warning.includes('reserved for a wiki capture')
      )
    );
  }
});

test('omits duplicate recovered non-item event ids regardless of event order', () => {
  const queue = (JSON.parse(validBundle) as { queue_snapshot: { queue: unknown } }).queue_snapshot
    .queue;
  const events = [
    {
      event_id: 'duplicate-non-item-id',
      sequence: 1,
      kind: 'quality_incident',
      observed_behavior: 'The download was announced before it existed.',
      boundary: 'bundle export',
      evidence: [{ source: 'durable_contemporaneous_record', reference: 'Artifact list' }],
    },
    {
      event_id: 'duplicate-non-item-id',
      sequence: 2,
      kind: 'general_capture',
      user_words: 'Keep this unrelated observation.',
      evidence: [{ source: 'explicit_user_capture', reference: 'Brad said this.' }],
    },
  ];

  for (const orderedEvents of [events, [...events].reverse()]) {
    const result = reconcileSessionBundles([
      {
        filename: artifactFilename,
        text: JSON.stringify({
          schema_version: 'commute-session-bundle.v1',
          session: { session_id: `duplicate-non-item-${orderedEvents[0]!.kind}` },
          queue_snapshot: { filename: 'fixture-queue.txt', queue: {} },
          events: orderedEvents,
        }),
        recoveryQueue: { filename: 'fixture-queue.txt', text: JSON.stringify(queue) },
      },
    ]);

    assert.equal(result.sessions[0]?.status, 'accepted');
    assert.equal(result.quality_incidents.length, 0);
    assert.equal(result.general_captures.length, 0);
    assert.equal(
      result.sessions[0]?.recovery_warnings?.filter((warning) =>
        warning.includes('reuses non-item event identity')
      ).length,
      2
    );
  }
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
  assert.equal(result.sessions[0]?.integrity_state, 'partial');
  assert.equal(result.maintenance_candidates.length, 1);
  assert.equal(result.maintenance_candidates[0]?.source_item_id, 'tldr-demo-001');
  assert.equal(result.navigation_events.length, 1);
  assert.ok(
    result.sessions[0]?.recovery_warnings?.some((warning) =>
      warning.includes('from 1200 onward as morning')
    )
  );
});

test('preserves full validated events when the declared artifact filename is missing or blank', () => {
  for (const artifactFilenameValue of [undefined, '   ']) {
    const malformed = JSON.parse(validBundle) as {
      session: Record<string, unknown>;
      queue_snapshot: { queue: unknown };
    };
    if (artifactFilenameValue === undefined) {
      delete malformed.session.artifact_filename;
    } else {
      malformed.session.artifact_filename = artifactFilenameValue;
    }

    const result = reconcileSessionBundles([
      {
        filename: artifactFilename,
        text: JSON.stringify(malformed),
        recoveryQueue: {
          filename: '20260720-tldr-dev.txt',
          text: JSON.stringify(malformed.queue_snapshot.queue),
        },
      },
    ]);

    assert.equal(result.sessions[0]?.status, 'accepted');
    assert.equal(result.sessions[0]?.integrity_state, 'partial');
    assert.equal(result.maintenance_candidates.length, 1);
    assert.equal(result.navigation_events.length, 1);
    assert.ok(
      result.sessions[0]?.recovery_warnings?.some((warning) =>
        warning.includes('does not declare a non-empty session.artifact_filename')
      )
    );
  }
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

  const reversed = reconcileSessionBundles([
    {
      filename: '202607200745-morning-commute-session-bundle (1).txt',
      text: JSON.stringify(malformed),
      recoveryQueue: { filename: 'fixture-queue.txt', text: JSON.stringify(queue) },
    },
    { filename: artifactFilename, text: validBundle },
  ]);

  assert.deepEqual(
    reversed.sessions.map((session) => session.status),
    ['accepted', 'accepted']
  );
  assert.match(reversed.sessions[0]?.recovery_warnings?.[0] ?? '', /also declared by session/);
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

test('warns when only the declared artifact filename has a Library suffix', () => {
  const queue = (JSON.parse(validBundle) as { queue_snapshot: { queue: unknown } }).queue_snapshot
    .queue;
  const malformed = {
    schema: 'legacy-summary',
    session: {
      session_id: 'reverse-library-suffix-session',
      artifact_filename: '202607200745-morning-commute-session-bundle (1).txt',
      queue_filename: 'fixture-queue.txt',
    },
    queue_snapshot: { filename: 'fixture-queue.txt', queue: {} },
    events: [{ action: 'wiki', item: 1 }],
  };

  const result = reconcileSessionBundles([
    {
      filename: artifactFilename,
      text: JSON.stringify(malformed),
      recoveryQueue: { filename: 'fixture-queue.txt', text: JSON.stringify(queue) },
    },
  ]);

  assert.equal(result.sessions[0]?.status, 'accepted');
  assert.ok(
    result.sessions[0]?.recovery_warnings?.some((warning) =>
      warning.includes('does not match declared artifact filename')
    )
  );
});

test('does not invent a shape warning for a valid no-space Library suffix', () => {
  const queue = (JSON.parse(validBundle) as { queue_snapshot: { queue: unknown } }).queue_snapshot
    .queue;
  const noSpaceSuffix = '202607200745-morning-commute-session-bundle(1).txt';
  const malformed = {
    schema: 'legacy-summary',
    session: {
      session_id: 'no-space-library-suffix-session',
      session_date: '2026-07-20',
      artifact_filename: noSpaceSuffix,
      queue_filename: 'fixture-queue.txt',
    },
    queue_snapshot: { filename: 'fixture-queue.txt', queue: {} },
    events: [{ action: 'wiki', item: 1 }],
  };

  const result = reconcileSessionBundles([
    {
      filename: noSpaceSuffix,
      text: JSON.stringify(malformed),
      recoveryQueue: { filename: 'fixture-queue.txt', text: JSON.stringify(queue) },
    },
  ]);

  assert.equal(result.sessions[0]?.status, 'accepted');
  assert.equal(result.sessions[0]?.recovery_warnings, undefined);
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
    events: Array<Record<string, unknown>>;
  };
  reformattedAndRenamed.session.artifact_filename = librarySuffixFilename;
  reformattedAndRenamed.session.queue_filename = 'ignored-stale-queue-alias.txt';
  reformattedAndRenamed.events.unshift({ action: 'skip', item: 2 });
  reformattedAndRenamed.events[1]!.item = {
    source_item_id: 'tldr-demo-001',
    title: 'stale legacy title ignored by recovery',
    url: 'https://example.invalid/stale',
  };

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

test('canonicalizes explicit recovered capture order for fallback session identity', () => {
  const queue = (JSON.parse(validBundle) as { queue_snapshot: { queue: unknown } }).queue_snapshot
    .queue;
  const malformed = {
    schema: 'legacy-summary',
    session: {
      session_date: '2026-07-20',
      queue_filename: 'fixture-queue.txt',
    },
    queue_snapshot: { filename: 'fixture-queue.txt', queue: {} },
    events: [
      { event_id: 'save-first', sequence: 1, action: 'wiki', item: 1 },
      { event_id: 'save-second', sequence: 2, action: 'wiki', item: 2 },
    ],
  };
  const reordered = JSON.parse(JSON.stringify(malformed)) as {
    events: Array<Record<string, unknown>>;
  };
  reordered.events.reverse();

  const result = reconcileSessionBundles([
    {
      filename: artifactFilename,
      text: JSON.stringify(malformed),
      recoveryQueue: { filename: 'fixture-queue.txt', text: JSON.stringify(queue) },
    },
    {
      filename: '202607200745-morning-commute-session-bundle (1).txt',
      text: JSON.stringify(reordered),
      recoveryQueue: { filename: 'fixture-queue.txt', text: JSON.stringify(queue) },
    },
  ]);

  assert.equal(result.sessions[0]?.status, 'accepted');
  assert.equal(result.sessions[1]?.status, 'rejected');
  assert.match(result.sessions[1]?.error ?? '', /Duplicate session_id recovered-/);
  assert.equal(result.maintenance_candidates.length, 2);
});

test('canonicalizes missing recovered capture ids across event reordering', () => {
  const queue = (JSON.parse(validBundle) as { queue_snapshot: { queue: unknown } }).queue_snapshot
    .queue;
  const malformed = {
    schema: 'legacy-summary',
    session: {
      session_date: '2026-07-20',
      queue_filename: 'fixture-queue.txt',
    },
    queue_snapshot: { filename: 'fixture-queue.txt', queue: {} },
    events: [
      { sequence: 1, action: 'wiki', item: 1 },
      { sequence: 2, action: 'wiki', item: 2 },
    ],
  };
  const reordered = JSON.parse(JSON.stringify(malformed)) as {
    events: Array<Record<string, unknown>>;
  };
  reordered.events.reverse();

  const result = reconcileSessionBundles([
    {
      filename: artifactFilename,
      text: JSON.stringify(malformed),
      recoveryQueue: { filename: 'fixture-queue.txt', text: JSON.stringify(queue) },
    },
    {
      filename: '202607200745-morning-commute-session-bundle (1).txt',
      text: JSON.stringify(reordered),
      recoveryQueue: { filename: 'fixture-queue.txt', text: JSON.stringify(queue) },
    },
  ]);

  assert.equal(result.sessions[0]?.status, 'accepted');
  assert.equal(result.sessions[1]?.status, 'rejected');
  assert.match(result.sessions[1]?.error ?? '', /Duplicate session_id recovered-/);
  assert.equal(result.maintenance_candidates.length, 2);
});

test('rejects ambiguous repeated same-item saves without event ids', () => {
  const queue = (JSON.parse(validBundle) as { queue_snapshot: { queue: unknown } }).queue_snapshot
    .queue;
  const malformed = {
    schema: 'legacy-summary',
    session: {
      session_date: '2026-07-20',
      queue_filename: 'fixture-queue.txt',
    },
    queue_snapshot: { filename: 'fixture-queue.txt', queue: {} },
    events: [
      { sequence: 1, action: 'wiki', item: 1 },
      { sequence: 2, action: 'wiki', item: 1 },
    ],
  };

  const result = reconcileSessionBundles([
    {
      filename: artifactFilename,
      text: JSON.stringify(malformed),
      recoveryQueue: { filename: 'fixture-queue.txt', text: JSON.stringify(queue) },
    },
  ]);

  assert.equal(result.sessions[0]?.status, 'rejected');
  assert.match(result.sessions[0]?.error ?? '', /distinct actions are ambiguous/);
  assert.equal(result.maintenance_candidates.length, 0);
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
  assert.equal(result.sessions[0]?.integrity_state, 'partial');
  assert.ok(
    result.sessions[0]?.recovery_warnings?.some((warning) =>
      warning.includes('does not match session.session_date 2026-07-20')
    )
  );
});

test('retains both invalid-time and contradictory-date filename warnings', () => {
  const malformed = JSON.parse(validBundle) as {
    session: Record<string, unknown>;
    queue_snapshot: { queue: unknown };
  };
  const multiplyInvalidFilename = '202607212560-morning-commute-session-bundle.txt';
  malformed.session.artifact_filename = multiplyInvalidFilename;

  const result = reconcileSessionBundles([
    {
      filename: multiplyInvalidFilename,
      text: JSON.stringify(malformed),
      recoveryQueue: {
        filename: '20260720-tldr-dev.txt',
        text: JSON.stringify(malformed.queue_snapshot.queue),
      },
    },
  ]);

  assert.equal(result.sessions[0]?.status, 'accepted');
  assert.equal(result.sessions[0]?.integrity_state, 'partial');
  assert.ok(
    result.sessions[0]?.recovery_warnings?.some((warning) =>
      warning.includes('does not contain a real local time')
    )
  );
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
