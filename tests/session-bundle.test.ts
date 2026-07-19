import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
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
    queueSnapshotFingerprint(parsed.queue_snapshot.source_utf8),
    'sha256:ab8d0fd545b4e0ae772276dd867cdf82f0586cb550860aa04adc388d6bb20a49'
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
  queueSnapshot.source_utf8 = JSON.stringify({
    headline_only: [
      {
        source_item_id: 'tldr-demo-001',
        title: 'First exact headline',
        url: 'https://example.com/first',
        raw_email_body: 'Do not persist this.',
      },
    ],
  });

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

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
