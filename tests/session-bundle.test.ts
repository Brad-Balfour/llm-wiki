import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  bundleArtifactFilenameMatches,
  fileSha256,
  parseCommuteSessionBundleText,
  queueSnapshotFingerprint,
} from '../src/commute/session-bundle.js';

const fixturePath = path.resolve('tests/fixtures/commute-bundles/valid-partial-bundle.json');
const validBundle = JSON.parse(readFileSync(fixturePath, 'utf8')) as Record<string, unknown>;

test('validates a self-contained partial session bundle and fingerprints its embedded queue', () => {
  const parsed = parseCommuteSessionBundleText(JSON.stringify(validBundle));

  assert.equal(parsed.integrity.state, 'partial');
  assert.equal(parsed.events.length, 4);
  assert.equal(parsed.events[1]?.kind, 'item_action');
  assert.equal(
    queueSnapshotFingerprint(parsed.queue_snapshot.queue),
    'sha256:30ad6f59e21d2ef996411c12a2c7d1fb0db006581c0ac4f99b442a600b49a2fc'
  );
});

test('rejects a complete bundle without durable contemporaneous evidence for every event', () => {
  const malformed = clone(validBundle);
  const integrity = malformed.integrity as Record<string, unknown>;
  integrity.state = 'complete';
  delete integrity.incomplete_reason;

  assert.throws(
    () => parseCommuteSessionBundleText(JSON.stringify(malformed)),
    /complete integrity requires a durable event record/
  );
});

test('rejects a wiki capture without direct evidence of Brad speaking the request', () => {
  const malformed = clone(validBundle);
  const events = malformed.events as Array<Record<string, unknown>>;
  const action = events[1] as Record<string, unknown>;
  action.evidence = [{ source: 'selected_queue_snapshot', reference: 'selected queue' }];

  assert.throws(
    () => parseCommuteSessionBundleText(JSON.stringify(malformed)),
    /must include direct evidence of the user's action/
  );
});

test('rejects raw-email-shaped fields in an embedded queue snapshot', () => {
  const malformed = clone(validBundle);
  const queueSnapshot = malformed.queue_snapshot as Record<string, unknown>;
  queueSnapshot.queue = {
    queue_version: 'tldr-commute-queue.v2',
    raw_email_body: 'Do not persist this.',
  };

  assert.throws(
    () => parseCommuteSessionBundleText(JSON.stringify(malformed)),
    /raw_email_body is not allowed/
  );
});

test('rejects a captured item whose identity is not in the embedded queue', () => {
  const malformed = clone(validBundle);
  const events = malformed.events as Array<Record<string, unknown>>;
  const action = events[1] as Record<string, unknown>;
  const item = action.item as Record<string, unknown>;
  item.source_item_id = 'invented-item';

  assert.throws(
    () => parseCommuteSessionBundleText(JSON.stringify(malformed)),
    /is not present in the embedded queue snapshot/
  );
});

test('rejects feedback bound to a different current item after a later announcement', () => {
  const malformed = clone(validBundle);
  const events = malformed.events as Array<Record<string, unknown>>;
  events.push({
    event_id: 'event-005',
    sequence: 5,
    kind: 'item_action',
    action: 'mark_uninterested',
    item: {
      source_item_id: 'tldr-demo-001',
      title: 'First exact headline',
      url: 'https://example.com/first',
    },
    user_words: 'not interested',
    evidence: [{ source: 'explicit_user_capture', reference: 'Brad said: not interested' }],
  });

  assert.throws(
    () => parseCommuteSessionBundleText(JSON.stringify(malformed)),
    /does not match the currently announced item/
  );
});

test('requires a fresh announcement after repeat before accepting feedback', () => {
  const malformed = clone(validBundle);
  const events = malformed.events as Array<Record<string, unknown>>;
  events.splice(2, 0, {
    event_id: 'event-repeat',
    sequence: 3,
    kind: 'playback_transition',
    transition: 'repeat',
    item: {
      source_item_id: 'tldr-demo-001',
      title: 'First exact headline',
      url: 'https://example.com/first',
    },
    evidence: [{ source: 'selected_queue_snapshot', reference: 'Brad said repeat' }],
  });
  events[3]!.sequence = 4;
  events[4]!.sequence = 5;
  events.splice(3, 0, {
    event_id: 'event-feedback-after-repeat',
    sequence: 4,
    kind: 'item_action',
    action: 'mark_interested',
    item: {
      source_item_id: 'tldr-demo-001',
      title: 'First exact headline',
      url: 'https://example.com/first',
    },
    user_words: 'interesting',
    evidence: [{ source: 'explicit_user_capture', reference: 'Brad said: interesting' }],
  });
  events[4]!.sequence = 5;
  events[5]!.sequence = 6;

  assert.throws(
    () => parseCommuteSessionBundleText(JSON.stringify(malformed)),
    /item_action has no prior announced current item/
  );
});

test('rejects an out-of-order queue announcement after a next transition', () => {
  const malformed = clone(validBundle);
  const events = malformed.events as Array<Record<string, unknown>>;
  const announcement = events[3] as Record<string, unknown>;
  announcement.item = {
    source_item_id: 'tldr-demo-001',
    title: 'First exact headline',
    url: 'https://example.com/first',
  };

  assert.throws(
    () => parseCommuteSessionBundleText(JSON.stringify(malformed)),
    /does not match the expected queue position/
  );
});

test('rejects a next transition that names its destination instead of its departing item', () => {
  const malformed = clone(validBundle);
  const events = malformed.events as Array<Record<string, unknown>>;
  const transition = events[2] as Record<string, unknown>;
  transition.item = {
    source_item_id: 'tldr-demo-002',
    title: 'Second exact headline',
    url: 'https://example.com/second',
  };

  assert.throws(
    () => parseCommuteSessionBundleText(JSON.stringify(malformed)),
    /playback_transition does not match the currently announced item/
  );
});

test('accepts a redundant next transition after a skip action', () => {
  const bundle = clone(validBundle);
  const events = bundle.events as Array<Record<string, unknown>>;
  events.splice(2, 0, {
    event_id: 'event-skip',
    sequence: 3,
    kind: 'item_action',
    action: 'skip',
    item: {
      source_item_id: 'tldr-demo-001',
      title: 'First exact headline',
      url: 'https://example.com/first',
    },
    user_words: 'skip',
    evidence: [{ source: 'explicit_user_capture', reference: 'Brad said: skip' }],
  });
  (events[3] as Record<string, unknown>).sequence = 4;
  (events[4] as Record<string, unknown>).sequence = 5;

  const parsed = parseCommuteSessionBundleText(JSON.stringify(bundle));

  assert.equal(parsed.events.length, 5);
});

test('accepts an unresolved capture without inventing a target item', () => {
  const recovered = clone(validBundle);
  const events = recovered.events as Array<Record<string, unknown>>;
  events.push({
    event_id: 'event-005',
    sequence: 5,
    kind: 'unresolved_capture',
    capture_type: 'wiki_this',
    user_words: 'wiki this',
    recovery_clues: ['Voice restarted before the current item could be verified.'],
    evidence: [
      {
        source: 'user_provided_chat_or_ui_observation',
        reference: 'Brad reported the Voice restart.',
      },
    ],
  });
  const integrity = recovered.integrity as Record<string, unknown>;
  integrity.state = 'recovered';
  integrity.incomplete_reason = 'A restart interrupted the session before exact item binding.';

  const parsed = parseCommuteSessionBundleText(JSON.stringify(recovered));

  assert.equal(parsed.integrity.state, 'recovered');
  assert.equal(parsed.events[4]?.kind, 'unresolved_capture');
});

test('accepts a v2 queue with one explicit N-of-M playback order', () => {
  const bundle = clone(validBundle);
  const queueSnapshot = bundle.queue_snapshot as Record<string, unknown>;
  queueSnapshot.queue = v2Queue();

  const parsed = parseCommuteSessionBundleText(JSON.stringify(bundle));

  assert.equal(parsed.queue_snapshot.filename, '20260720-tldr-dev.txt');
  assert.equal(parsed.events[3]?.kind, 'item_announced');
});

test('accepts a new v2 queue without a source-email subject', () => {
  const bundle = clone(validBundle);
  const queueSnapshot = bundle.queue_snapshot as Record<string, unknown>;
  const queue = v2Queue();
  delete queue.source_email.subject;
  queueSnapshot.queue = queue;

  const parsed = parseCommuteSessionBundleText(JSON.stringify(bundle));

  assert.equal(parsed.queue_snapshot.queue.source_email !== undefined, true);
});

test('rejects a v2 queue whose literal spoken position disagrees with its cursor', () => {
  const bundle = clone(validBundle);
  const queue = v2Queue();
  const secondItem = queue.items[1];
  assert.ok(secondItem);
  const playback = secondItem.playback as Record<string, unknown>;
  playback.spoken = '2 of 9';
  const queueSnapshot = bundle.queue_snapshot as Record<string, unknown>;
  queueSnapshot.queue = queue;

  assert.throws(
    () => parseCommuteSessionBundleText(JSON.stringify(bundle)),
    /must be the contiguous literal 2 of 2/
  );
});

test('rejects a v2 queue missing a schema-required classifier field', () => {
  const bundle = clone(validBundle);
  const queue = v2Queue();
  const firstItem = queue.items[0];
  assert.ok(firstItem);
  delete firstItem.route_version;
  const queueSnapshot = bundle.queue_snapshot as Record<string, unknown>;
  queueSnapshot.queue = queue;

  assert.throws(
    () => parseCommuteSessionBundleText(JSON.stringify(bundle)),
    /route_version must be a non-empty string/
  );
});

test('rejects a v1 queue explicitly after the v2 cutover', () => {
  const bundle = clone(validBundle);
  const queueSnapshot = bundle.queue_snapshot as Record<string, unknown>;
  queueSnapshot.queue = {
    queue_version: 'tldr-commute-queue.v1',
    newsletter: 'TLDR Dev',
    edition_date: '2026-07-20',
    source_email: {
      gmail_message_id: 'legacy',
      subject: 'Legacy',
      sender: 'TLDR Dev',
      delivered_at: '2026-07-20T07:45:00-04:00',
    },
  };

  assert.throws(
    () => parseCommuteSessionBundleText(JSON.stringify(bundle)),
    /must be tldr-commute-queue.v2/
  );
});

test('rejects impossible timestamp or time-of-day label in bundle filenames', () => {
  const impossibleTime = clone(validBundle);
  const impossibleSession = impossibleTime.session as Record<string, unknown>;
  impossibleSession.artifact_filename = '202607209999-morning-commute-session-bundle.txt';
  assert.throws(
    () => parseCommuteSessionBundleText(JSON.stringify(impossibleTime)),
    /HHmm must be a real local time/
  );

  const mismatchedLabel = clone(validBundle);
  const mismatchedSession = mismatchedLabel.session as Record<string, unknown>;
  mismatchedSession.artifact_filename = '202607201800-morning-commute-session-bundle.txt';
  assert.throws(
    () => parseCommuteSessionBundleText(JSON.stringify(mismatchedLabel)),
    /morning must use a local time before 1200/
  );
});

test('accepts a Library-added suffix as the canonical bundle artifact', () => {
  const canonical = '202607200745-morning-commute-session-bundle.txt';
  assert.equal(
    bundleArtifactFilenameMatches('202607200745-morning-commute-session-bundle (1).txt', canonical),
    true
  );
  assert.equal(
    bundleArtifactFilenameMatches('unrelated-commute-session-bundle (1).txt', canonical),
    false
  );
  assert.equal(
    bundleArtifactFilenameMatches('202607200745-morning-commute-session-bundle(1).txt', canonical),
    true
  );
});

test('hashes a durable record byte-for-byte, not as canonical JSON', () => {
  assert.notEqual(fileSha256('{"b":2,"a":1}'), fileSha256('{"a":1,"b":2}'));
});

test('rejects a bare or unparseable bundle artifact filename', () => {
  const malformed = clone(validBundle);
  const session = malformed.session as Record<string, unknown>;
  session.artifact_filename = 'commute-session-bundle.txt';

  assert.throws(
    () => parseCommuteSessionBundleText(JSON.stringify(malformed)),
    /artifact_filename must use YYYYMMDDHHmm-morning\|evening/
  );
});

function v2Queue(): {
  queue_version: string;
  newsletter: string;
  edition_date: string;
  source_email: Record<string, string>;
  total_items: number;
  items: Array<Record<string, unknown>>;
} {
  return {
    queue_version: 'tldr-commute-queue.v2',
    newsletter: 'TLDR Dev',
    edition_date: '2026-07-20',
    source_email: {
      gmail_message_id: 'demo-message',
      subject: 'Demo TLDR Dev',
      sender: 'TLDR Dev <dan@tldrnewsletter.com>',
      delivered_at: '2026-07-20T07:45:00-04:00',
    },
    total_items: 2,
    items: [
      {
        playback: { position: 1, total: 2, spoken: '1 of 2' },
        source_item_id: 'tldr-demo-001',
        title: 'First exact headline',
        summary: 'First summary',
        url: 'https://example.com/first',
        interest_level: 'interested',
        interest_score: 0.9,
        consumption_depth: 'headline_only',
        depth_score: 0.2,
        commute_behavior: 'brief',
        signals: ['fixture'],
        reason: 'Fixture item.',
        profile_version: 'fixture',
        prompt_version: 'fixture',
        provider: 'fixture',
        model: 'fixture',
        parser_version: 'fixture',
        route_version: 'fixture',
        classified_at: '2026-07-20T07:45:00-04:00',
        routed_at: '2026-07-20T07:45:00-04:00',
      },
      {
        playback: { position: 2, total: 2, spoken: '2 of 2' },
        source_item_id: 'tldr-demo-002',
        title: 'Second exact headline',
        summary: 'Second summary',
        url: 'https://example.com/second',
        interest_level: 'maybe',
        interest_score: 0.7,
        consumption_depth: 'in_depth',
        depth_score: 0.8,
        commute_behavior: 'detail',
        signals: ['fixture'],
        reason: 'Fixture item.',
        profile_version: 'fixture',
        prompt_version: 'fixture',
        provider: 'fixture',
        model: 'fixture',
        parser_version: 'fixture',
        route_version: 'fixture',
        classified_at: '2026-07-20T07:45:00-04:00',
        routed_at: '2026-07-20T07:45:00-04:00',
      },
    ],
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
