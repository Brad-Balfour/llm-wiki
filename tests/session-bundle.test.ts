import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  bundleArtifactFilenameMatches,
  fileSha256,
  parseCommuteSessionBundleText,
  queueSnapshotFingerprint,
  renderQueuePlaybackText,
  renderQueueSweepPlayback,
  validateTldrCommuteQueue,
} from '../src/commute/session-bundle.js';

const fixturePath = path.resolve('tests/fixtures/commute-bundles/valid-partial-bundle.json');
const validBundle = JSON.parse(readFileSync(fixturePath, 'utf8')) as Record<string, unknown>;
const nonlinearFixturePath = path.resolve(
  'tests/fixtures/commute-bundles/valid-nonlinear-navigation-bundle.json'
);

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

test('fixture accepts item 5 as the first announcement and non-linear subset playback', () => {
  const parsed = parseCommuteSessionBundleText(readFileSync(nonlinearFixturePath, 'utf8'));
  const firstEvent = parsed.events[0];

  assert.equal(firstEvent?.kind, 'item_announced');
  if (firstEvent?.kind !== 'item_announced') assert.fail('fixture must start with an announcement');
  assert.equal(firstEvent.item.source_item_id, 'tldr-demo-005');
  assert.equal(parsed.playback.status, 'completed');
  assert.equal(parsed.events.length, 9);
});

test('accepts a completed bundle that retains its final current item as a revisit cursor', () => {
  const bundle = clone(validBundle);
  const playback = bundle.playback as Record<string, unknown>;
  playback.status = 'completed';

  const parsed = parseCommuteSessionBundleText(JSON.stringify(bundle));

  assert.equal(parsed.playback.status, 'completed');
  assert.equal(parsed.playback.resume_source_item_id, 'tldr-demo-002');
});

test('rejects a completed bundle whose revisit cursor contradicts the final announced item', () => {
  const bundle = clone(validBundle);
  const playback = bundle.playback as Record<string, unknown>;
  playback.status = 'completed';
  playback.resume_source_item_id = 'tldr-demo-001';

  assert.throws(
    () => parseCommuteSessionBundleText(JSON.stringify(bundle)),
    /completed playback resume cursor must match the final current item/
  );
});

test('rejects a completed revisit cursor when no current item can be verified', () => {
  const bundle = clone(validBundle);
  bundle.events = [];
  const playback = bundle.playback as Record<string, unknown>;
  playback.status = 'completed';

  assert.throws(
    () => parseCommuteSessionBundleText(JSON.stringify(bundle)),
    /completed playback resume cursor requires a final verified current item/
  );
});

test('rejects a completed revisit cursor after a terminal transition clears the current item', () => {
  const bundle = clone(validBundle);
  const events = bundle.events as Array<Record<string, unknown>>;
  events.push({
    event_id: 'event-interrupted-after-final-announcement',
    sequence: 5,
    kind: 'playback_transition',
    transition: 'interrupted',
    item: {
      source_item_id: 'tldr-demo-002',
      title: 'Second exact headline',
      url: 'https://example.com/second',
    },
    evidence: [{ source: 'explicit_user_capture', reference: 'Brad reported an interruption.' }],
  });
  const playback = bundle.playback as Record<string, unknown>;
  playback.status = 'completed';

  assert.throws(
    () => parseCommuteSessionBundleText(JSON.stringify(bundle)),
    /completed playback resume cursor requires a final verified current item/
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

test('accepts a natural-language wiki save when the action has direct evidence and an exact item', () => {
  const bundle = clone(validBundle);
  const events = bundle.events as Array<Record<string, unknown>>;
  const action = events[1] as Record<string, unknown>;
  action.user_words = 'Please save the Codex outage tracker, item one.';

  const parsed = parseCommuteSessionBundleText(JSON.stringify(bundle));

  assert.equal(parsed.events[1]?.kind, 'item_action');
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
    evidence: [{ source: 'explicit_user_capture', reference: 'Brad said repeat' }],
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

test('accepts previous-item navigation while keeping the transition bound to the departing item', () => {
  const bundle = clone(validBundle);
  const events = bundle.events as Array<Record<string, unknown>>;
  events.push(
    {
      event_id: 'event-previous',
      sequence: 5,
      kind: 'playback_transition',
      transition: 'previous',
      item: {
        source_item_id: 'tldr-demo-002',
        title: 'Second exact headline',
        url: 'https://example.com/second',
      },
      evidence: [
        {
          source: 'explicit_user_capture',
          reference: 'Brad said: go back from seven to six so we can discuss it more.',
        },
      ],
    },
    {
      event_id: 'event-reannounced-previous',
      sequence: 6,
      kind: 'item_announced',
      item: {
        source_item_id: 'tldr-demo-001',
        title: 'First exact headline',
        url: 'https://example.com/first',
      },
      evidence: [{ source: 'selected_queue_snapshot', reference: 'Returned to item one.' }],
    }
  );
  const playback = bundle.playback as Record<string, unknown>;
  playback.last_announced_source_item_id = 'tldr-demo-001';
  playback.resume_source_item_id = 'tldr-demo-001';

  const parsed = parseCommuteSessionBundleText(JSON.stringify(bundle));

  assert.equal(parsed.events[4]?.kind, 'playback_transition');
  assert.equal(parsed.events[4]?.transition, 'previous');
  assert.equal(parsed.playback.resume_source_item_id, 'tldr-demo-001');
});

test('rejects previous-item navigation before the first queue item', () => {
  const malformed = clone(validBundle);
  const events = malformed.events as Array<Record<string, unknown>>;
  events.splice(1, events.length - 1, {
    event_id: 'event-previous-before-first',
    sequence: 2,
    kind: 'playback_transition',
    transition: 'previous',
    item: {
      source_item_id: 'tldr-demo-001',
      title: 'First exact headline',
      url: 'https://example.com/first',
    },
    evidence: [{ source: 'explicit_user_capture', reference: 'Brad asked to go back.' }],
  });

  assert.throws(
    () => parseCommuteSessionBundleText(JSON.stringify(malformed)),
    /previous transition cannot move before the first queue item/
  );
});

test('accepts a direct jump without inventing intervening announcements', () => {
  const bundle = clone(validBundle);
  const queueSnapshot = bundle.queue_snapshot as Record<string, unknown>;
  const queue = queueSnapshot.queue as Record<string, unknown>;
  const items = queue.items as Array<Record<string, unknown>>;
  const third = clone(items[1]!) as Record<string, unknown>;
  third.playback = { position: 3, total: 3, spoken: '3 of 3' };
  third.source_item_id = 'tldr-demo-003';
  third.title = 'Third exact headline';
  third.summary = 'Third summary';
  third.url = 'https://example.com/third';
  items.push(third);
  queue.total_items = 3;
  (items[0]!.playback as Record<string, unknown>).total = 3;
  (items[0]!.playback as Record<string, unknown>).spoken = '1 of 3';
  (items[1]!.playback as Record<string, unknown>).total = 3;
  (items[1]!.playback as Record<string, unknown>).spoken = '2 of 3';

  const events = bundle.events as Array<Record<string, unknown>>;
  events.splice(
    2,
    2,
    {
      event_id: 'event-jump',
      sequence: 3,
      kind: 'playback_transition',
      transition: 'jump',
      item: {
        source_item_id: 'tldr-demo-001',
        title: 'First exact headline',
        url: 'https://example.com/first',
      },
      evidence: [
        {
          source: 'explicit_user_capture',
          reference: 'Brad said: take me directly to item 3 of 3.',
        },
      ],
    },
    {
      event_id: 'event-announced-jump-destination',
      sequence: 4,
      kind: 'item_announced',
      item: {
        source_item_id: 'tldr-demo-003',
        title: 'Third exact headline',
        url: 'https://example.com/third',
      },
      evidence: [{ source: 'selected_queue_snapshot', reference: 'Jumped to item 3 of 3.' }],
    }
  );
  const playback = bundle.playback as Record<string, unknown>;
  playback.last_announced_source_item_id = 'tldr-demo-003';
  playback.resume_source_item_id = 'tldr-demo-003';

  const parsed = parseCommuteSessionBundleText(JSON.stringify(bundle));

  assert.equal(parsed.events[2]?.kind, 'playback_transition');
  assert.equal(parsed.events[2]?.transition, 'jump');
  assert.equal(parsed.events[3]?.kind, 'item_announced');
  assert.equal(parsed.events[3]?.item.source_item_id, 'tldr-demo-003');
  assert.equal(parsed.playback.resume_source_item_id, 'tldr-demo-003');
});

test('accepts arbitrary and non-linear playback without requiring every queue item', () => {
  const bundle = clone(validBundle);
  const queueSnapshot = bundle.queue_snapshot as Record<string, unknown>;
  queueSnapshot.queue = queueWithItemCount(8);
  const item = (position: number) => ({
    source_item_id: `tldr-demo-${String(position).padStart(3, '0')}`,
    title: `Exact headline ${position}`,
    url: `https://example.com/item-${position}`,
  });
  bundle.events = [
    announcedEvent('event-start-at-five', 1, item(5)),
    announcedEvent('event-missing-backward-jump', 2, item(2)),
    announcedEvent('event-missing-forward-jump', 3, item(7)),
    transitionEvent('event-repeat-seven', 4, 'repeat', item(7)),
    announcedEvent('event-repeated-seven', 5, item(7)),
    transitionEvent('event-previous-from-seven', 6, 'previous', item(7)),
    announcedEvent('event-announced-six', 7, item(6)),
    transitionEvent('event-jump-from-six', 8, 'jump', item(6)),
    announcedEvent('event-announced-eight', 9, item(8)),
  ];
  bundle.playback = {
    status: 'completed',
    last_announced_source_item_id: 'tldr-demo-008',
    resume_source_item_id: 'tldr-demo-008',
  };
  bundle.integrity = {
    state: 'recovered',
    incomplete_reason:
      'Exporter evidence omitted the transitions before the item 2 and item 7 announcements.',
    unresolved_event_ids: [],
  };

  const parsed = parseCommuteSessionBundleText(JSON.stringify(bundle));

  assert.equal(parsed.playback.status, 'completed');
  assert.equal(parsed.events[0]?.kind, 'item_announced');
  assert.equal(parsed.events[0]?.item.source_item_id, 'tldr-demo-005');
  assert.equal(parsed.playback.resume_source_item_id, 'tldr-demo-008');
});

test('accepts any exact first announcement even with complete event integrity', () => {
  const bundle = clone(validBundle);
  const queueSnapshot = bundle.queue_snapshot as Record<string, unknown>;
  queueSnapshot.queue = queueWithItemCount(8);
  const evidence = [
    { source: 'durable_contemporaneous_record', reference: 'durable-session-events.jsonl' },
  ];
  bundle.events = [
    {
      event_id: 'event-start',
      sequence: 1,
      kind: 'session_boundary',
      boundary: 'start',
      evidence,
    },
    {
      ...announcedEvent('event-announced-five', 2, {
        source_item_id: 'tldr-demo-005',
        title: 'Exact headline 5',
        url: 'https://example.com/item-5',
      }),
      evidence,
    },
    {
      event_id: 'event-end',
      sequence: 3,
      kind: 'session_boundary',
      boundary: 'end',
      evidence,
    },
  ];
  bundle.playback = {
    status: 'completed',
    last_announced_source_item_id: 'tldr-demo-005',
    resume_source_item_id: 'tldr-demo-005',
  };
  bundle.integrity = {
    state: 'complete',
    unresolved_event_ids: [],
    durable_event_record: {
      filename: 'durable-session-events.jsonl',
      sha256: `sha256:${'0'.repeat(64)}`,
      covered_event_ids: ['event-start', 'event-announced-five', 'event-end'],
    },
  };

  const parsed = parseCommuteSessionBundleText(JSON.stringify(bundle));

  assert.equal(parsed.events[1]?.kind, 'item_announced');
  assert.equal(parsed.events[1]?.item.source_item_id, 'tldr-demo-005');
});

test('rejects a jump that re-announces the departing item', () => {
  const malformed = clone(validBundle);
  const events = malformed.events as Array<Record<string, unknown>>;
  events[2]!.transition = 'jump';
  events[2]!.evidence = [
    { source: 'explicit_user_capture', reference: 'Brad requested a direct jump.' },
  ];
  const destination = events[3]!.item as Record<string, unknown>;
  destination.source_item_id = 'tldr-demo-001';
  destination.title = 'First exact headline';
  destination.url = 'https://example.com/first';

  assert.throws(
    () => parseCommuteSessionBundleText(JSON.stringify(malformed)),
    /jump transition must announce a different queue item/
  );
});

test('requires direct user evidence for previous, jump, and repeat navigation', () => {
  for (const transition of ['previous', 'jump', 'repeat']) {
    const malformed = clone(validBundle);
    const events = malformed.events as Array<Record<string, unknown>>;
    events.push({
      event_id: `event-${transition}-without-user-evidence`,
      sequence: 5,
      kind: 'playback_transition',
      transition,
      item: {
        source_item_id: 'tldr-demo-002',
        title: 'Second exact headline',
        url: 'https://example.com/second',
      },
      evidence: [{ source: 'selected_queue_snapshot', reference: 'Queue identity only.' }],
    });

    assert.throws(
      () => parseCommuteSessionBundleText(JSON.stringify(malformed)),
      /must include direct evidence of the user's action/
    );
  }
});

test('requires direct user evidence for next without an evidenced skip', () => {
  const malformed = clone(validBundle);
  const events = malformed.events as Array<Record<string, unknown>>;
  events[2]!.evidence = [{ source: 'selected_queue_snapshot', reference: 'Queue identity only.' }];

  assert.throws(
    () => parseCommuteSessionBundleText(JSON.stringify(malformed)),
    /next transition must include direct user evidence or follow an evidenced skip action/
  );
});

test('rejects a complete bundle whose jump never announces its destination', () => {
  const malformed = clone(validBundle);
  const durableEvidence = [
    {
      source: 'durable_contemporaneous_record',
      reference: 'durable-session-events.jsonl',
    },
  ];
  const events = malformed.events as Array<Record<string, unknown>>;
  events.splice(
    0,
    events.length,
    {
      event_id: 'event-start',
      sequence: 1,
      kind: 'session_boundary',
      boundary: 'start',
      evidence: durableEvidence,
    },
    {
      event_id: 'event-announced',
      sequence: 2,
      kind: 'item_announced',
      item: {
        source_item_id: 'tldr-demo-001',
        title: 'First exact headline',
        url: 'https://example.com/first',
      },
      evidence: durableEvidence,
    },
    {
      event_id: 'event-jump-without-destination',
      sequence: 3,
      kind: 'playback_transition',
      transition: 'jump',
      item: {
        source_item_id: 'tldr-demo-001',
        title: 'First exact headline',
        url: 'https://example.com/first',
      },
      evidence: durableEvidence,
    },
    {
      event_id: 'event-end',
      sequence: 4,
      kind: 'session_boundary',
      boundary: 'end',
      evidence: durableEvidence,
    }
  );
  malformed.integrity = {
    state: 'complete',
    unresolved_event_ids: [],
    durable_event_record: {
      filename: 'durable-session-events.jsonl',
      sha256: `sha256:${'0'.repeat(64)}`,
      covered_event_ids: events.map((event) => event.event_id),
    },
  };
  malformed.playback = {
    status: 'partial',
    last_announced_source_item_id: 'tldr-demo-001',
    resume_source_item_id: 'tldr-demo-001',
  };

  assert.throws(
    () => parseCommuteSessionBundleText(JSON.stringify(malformed)),
    /complete integrity cannot end with navigation awaiting its destination announcement/
  );
});

test('rejects a complete bundle whose previous transition never announces its destination', () => {
  const malformed = clone(validBundle);
  const durableEvidence = [
    {
      source: 'durable_contemporaneous_record',
      reference: 'durable-session-events.jsonl',
    },
  ];
  const events = malformed.events as Array<Record<string, unknown>>;
  events.unshift({
    event_id: 'event-start',
    sequence: 1,
    kind: 'session_boundary',
    boundary: 'start',
    evidence: durableEvidence,
  });
  events.push(
    {
      event_id: 'event-previous-without-destination',
      sequence: events.length + 1,
      kind: 'playback_transition',
      transition: 'previous',
      item: {
        source_item_id: 'tldr-demo-002',
        title: 'Second exact headline',
        url: 'https://example.com/second',
      },
      evidence: durableEvidence,
    },
    {
      event_id: 'event-end',
      sequence: events.length + 2,
      kind: 'session_boundary',
      boundary: 'end',
      evidence: durableEvidence,
    }
  );
  events.forEach((event, index) => {
    event.sequence = index + 1;
    event.evidence = durableEvidence;
  });
  malformed.integrity = {
    state: 'complete',
    unresolved_event_ids: [],
    durable_event_record: {
      filename: 'durable-session-events.jsonl',
      sha256: `sha256:${'0'.repeat(64)}`,
      covered_event_ids: events.map((event) => event.event_id),
    },
  };

  assert.throws(
    () => parseCommuteSessionBundleText(JSON.stringify(malformed)),
    /complete integrity cannot end with navigation awaiting its destination announcement/
  );
});

test('rejects an impossible queue announcement after a next transition', () => {
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
    /impossible destination for the recorded relative transition/
  );
});

test('rejects next from the final queue item', () => {
  const malformed = clone(validBundle);
  malformed.events = [
    announcedEvent('event-announced-two', 1, {
      source_item_id: 'tldr-demo-002',
      title: 'Second exact headline',
      url: 'https://example.com/second',
    }),
    transitionEvent('event-next-from-final', 2, 'next', {
      source_item_id: 'tldr-demo-002',
      title: 'Second exact headline',
      url: 'https://example.com/second',
    }),
  ];

  assert.throws(
    () => parseCommuteSessionBundleText(JSON.stringify(malformed)),
    /next transition cannot move beyond the final queue item/
  );
});

test('rejects an unexplained later announcement in a complete event history', () => {
  const malformed = clone(validBundle);
  const evidence = [
    { source: 'durable_contemporaneous_record', reference: 'durable-session-events.jsonl' },
  ];
  malformed.events = [
    {
      event_id: 'event-start',
      sequence: 1,
      kind: 'session_boundary',
      boundary: 'start',
      evidence,
    },
    { ...announcedEvent('event-announced-one', 2, queueIdentity(1)), evidence },
    { ...announcedEvent('event-announced-two', 3, queueIdentity(2)), evidence },
    {
      event_id: 'event-end',
      sequence: 4,
      kind: 'session_boundary',
      boundary: 'end',
      evidence,
    },
  ];
  malformed.integrity = {
    state: 'complete',
    unresolved_event_ids: [],
    durable_event_record: {
      filename: 'durable-session-events.jsonl',
      sha256: `sha256:${'0'.repeat(64)}`,
      covered_event_ids: ['event-start', 'event-announced-one', 'event-announced-two', 'event-end'],
    },
  };

  assert.throws(
    () => parseCommuteSessionBundleText(JSON.stringify(malformed)),
    /item_announced must follow a valid next, previous, jump, or repeat transition/
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
  (events[3] as Record<string, unknown>).evidence = [
    { source: 'selected_queue_snapshot', reference: 'Queue identity after skip.' },
  ];
  (events[4] as Record<string, unknown>).sequence = 5;

  const parsed = parseCommuteSessionBundleText(JSON.stringify(bundle));

  assert.equal(parsed.events.length, 5);
});

test('rejects an implicit skip destination beyond the immediate successor', () => {
  const malformed = clone(validBundle);
  const queueSnapshot = malformed.queue_snapshot as Record<string, unknown>;
  queueSnapshot.queue = queueWithItemCount(8);
  const events = malformed.events as Array<Record<string, unknown>>;
  events.splice(
    0,
    events.length,
    announcedEvent('event-announced-five', 1, {
      source_item_id: 'tldr-demo-005',
      title: 'Exact headline 5',
      url: 'https://example.com/item-5',
    }),
    {
      event_id: 'event-skip-five',
      sequence: 2,
      kind: 'item_action',
      action: 'skip',
      item: {
        source_item_id: 'tldr-demo-005',
        title: 'Exact headline 5',
        url: 'https://example.com/item-5',
      },
      user_words: 'skip',
      evidence: [{ source: 'explicit_user_capture', reference: 'Brad said: skip' }],
    },
    announcedEvent('event-announced-eight', 3, {
      source_item_id: 'tldr-demo-008',
      title: 'Exact headline 8',
      url: 'https://example.com/item-8',
    })
  );
  malformed.playback = {
    status: 'partial',
    last_announced_source_item_id: 'tldr-demo-008',
    resume_source_item_id: 'tldr-demo-008',
  };

  assert.throws(
    () => parseCommuteSessionBundleText(JSON.stringify(malformed)),
    /impossible destination for the recorded relative transition/
  );
});

test('accepts a recovered next transition whose exact departing item follows a missing announcement', () => {
  const bundle = clone(validBundle);
  const queueSnapshot = bundle.queue_snapshot as Record<string, unknown>;
  const queue = queueSnapshot.queue as Record<string, unknown>;
  const items = queue.items as Array<Record<string, unknown>>;
  const third = clone(items[1]!);
  third.playback = { position: 3, total: 3, spoken: '3 of 3' };
  third.source_item_id = 'tldr-demo-003';
  third.title = 'Third exact headline';
  third.summary = 'Third summary';
  third.url = 'https://example.com/third';
  items.push(third);
  queue.total_items = 3;
  (items[0]!.playback as Record<string, unknown>).total = 3;
  (items[0]!.playback as Record<string, unknown>).spoken = '1 of 3';
  (items[1]!.playback as Record<string, unknown>).total = 3;
  (items[1]!.playback as Record<string, unknown>).spoken = '2 of 3';
  const events = bundle.events as Array<Record<string, unknown>>;
  events.splice(3, 0, {
    event_id: 'event-unresolved',
    sequence: 4,
    kind: 'unresolved_capture',
    capture_type: 'wiki_this',
    user_words: 'Good, wiki this.',
    recovery_clues: ['The assistant announced the wrong title for the next position.'],
    evidence: [{ source: 'explicit_user_capture', reference: 'Brad said: wiki this' }],
  });
  events.splice(4, 1, {
    event_id: 'event-recovered-next',
    sequence: 5,
    kind: 'playback_transition',
    transition: 'next',
    item: {
      source_item_id: 'tldr-demo-002',
      title: 'Second exact headline',
      url: 'https://example.com/second',
    },
    evidence: [{ source: 'explicit_user_capture', reference: 'Brad asked for the next item.' }],
  });
  const integrity = bundle.integrity as Record<string, unknown>;
  integrity.state = 'recovered';
  integrity.incomplete_reason = 'Voice omitted the item announcement.';
  const playback = bundle.playback as Record<string, unknown>;
  playback.status = 'partial';
  playback.last_announced_source_item_id = 'tldr-demo-001';
  playback.resume_source_item_id = 'tldr-demo-002';

  const parsed = parseCommuteSessionBundleText(JSON.stringify(bundle));

  assert.equal(parsed.integrity.state, 'recovered');
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

test('rejects a source-email subject from queue v3', () => {
  const queue = v3Queue();
  queue.source_email.subject = 'Not part of the queue-v3 contract';

  assert.throws(
    () => validateTldrCommuteQueue(queue),
    /queue_snapshot\.queue\.source_email contains unsupported fields: subject/
  );
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

test('validates queue v3 deterministic playback for headline-only and in-depth items', () => {
  const queue = v3Queue();

  const validated = validateTldrCommuteQueue(queue);

  assert.equal(validated.queue_version, 'tldr-commute-queue.v3');
  assert.equal(
    queue.sweep_playback,
    '1 of 2. Headline only. Headline: "quoted"\n2 of 2. In depth. Title already punctuated!'
  );
  assert.equal(queue.items[0]?.author, null);
  assert.equal(queue.items[0]?.publication, null);
  assert.equal(queue.items[1]?.author, 'Example Author');
  assert.equal(queue.items[1]?.publication, 'Example Engineering Blog');
  assert.equal(queue.items[0]?.playback_text, '1 of 2. Headline only. Headline: "quoted"');
  assert.equal(
    queue.items[1]?.playback_text,
    '2 of 2. In depth. Title already punctuated!\nDescription with "quotes" and punctuation.'
  );
});

test('accepts a session bundle with a complete queue v3 snapshot', () => {
  const bundle = clone(validBundle);
  const queue = v3Queue();
  const queueSnapshot = bundle.queue_snapshot as Record<string, unknown>;
  queueSnapshot.queue = queue;

  const itemsById = new Map(queue.items.map((item) => [item.source_item_id, item]));
  for (const event of bundle.events as Array<Record<string, unknown>>) {
    const eventItem = event.item as Record<string, unknown> | undefined;
    if (!eventItem) continue;
    const queueItem = itemsById.get(eventItem.source_item_id);
    if (!queueItem) continue;
    eventItem.title = queueItem.title;
    eventItem.url = queueItem.url;
  }

  const parsed = parseCommuteSessionBundleText(JSON.stringify(bundle));

  assert.equal(parsed.queue_snapshot.queue.queue_version, 'tldr-commute-queue.v3');
  assert.equal(parsed.queue_snapshot.queue.sweep_playback, queue.sweep_playback);
});

test('rejects queue v3 sweep playback that drifts from the ordered items', () => {
  const queue = v3Queue();
  queue.sweep_playback = '1 of 2. Headline only. Invented headline';

  assert.throws(
    () => validateTldrCommuteQueue(queue),
    /sweep_playback must equal the deterministic rendered sweep/
  );
});

test('requires explicit nullable author and publication fields in queue v3', () => {
  const queue = v3Queue();
  delete queue.items[0]!.author;

  assert.throws(
    () => validateTldrCommuteQueue(queue),
    /items\[0\]\.author must be a non-empty string/
  );
});

test('rejects queue v3 playback text that drifts from canonical fields', () => {
  const queue = v3Queue();
  queue.items[1]!.playback_text = 'A generated paraphrase.';

  assert.throws(
    () => validateTldrCommuteQueue(queue),
    /playback_text must equal the deterministic rendered playback/
  );
});

test('queue v3 rejects the queue-v2 summary field instead of silently migrating it', () => {
  const queue = v3Queue();
  const first = queue.items[0]!;
  first.summary = first.description;
  delete first.description;

  assert.throws(() => validateTldrCommuteQueue(queue), /unsupported fields: summary/);
});

function v3Queue(): ReturnType<typeof v2Queue> & { sweep_playback: string } {
  const queue = v2Queue() as ReturnType<typeof v2Queue> & { sweep_playback: string };
  queue.queue_version = 'tldr-commute-queue.v3';
  delete queue.source_email.subject;
  queue.items[0]!.title = 'Headline: "quoted"';
  queue.items[1]!.title = 'Title already punctuated!';
  queue.items[1]!.summary = 'Description with "quotes" and punctuation.';
  for (const [index, item] of queue.items.entries()) {
    item.description = item.summary;
    delete item.summary;
    item.author = index === 0 ? null : 'Example Author';
    item.publication = index === 0 ? null : 'Example Engineering Blog';
    item.playback_text = renderQueuePlaybackText({
      playback: item.playback as { spoken: string },
      consumption_depth: item.consumption_depth as 'headline_only' | 'in_depth',
      title: item.title as string,
      description: item.description as string,
    });
  }
  queue.sweep_playback = renderQueueSweepPlayback(
    queue.items.map((item) => ({
      playback: item.playback as { spoken: string },
      consumption_depth: item.consumption_depth as 'headline_only' | 'in_depth',
      title: item.title as string,
    }))
  );
  return queue;
}

function queueWithItemCount(count: number): ReturnType<typeof v2Queue> {
  const queue = v2Queue();
  const template = queue.items[0]!;
  queue.total_items = count;
  queue.items = Array.from({ length: count }, (_, index) => {
    const position = index + 1;
    return {
      ...clone(template),
      playback: { position, total: count, spoken: `${position} of ${count}` },
      source_item_id: `tldr-demo-${String(position).padStart(3, '0')}`,
      title: `Exact headline ${position}`,
      summary: `Exact summary ${position}`,
      url: `https://example.com/item-${position}`,
    };
  });
  return queue;
}

function queueIdentity(position: number): Record<string, string> {
  const words = ['First', 'Second'];
  return {
    source_item_id: `tldr-demo-${String(position).padStart(3, '0')}`,
    title: `${words[position - 1]} exact headline`,
    url: `https://example.com/${position === 1 ? 'first' : 'second'}`,
  };
}

function announcedEvent(
  eventId: string,
  sequence: number,
  item: Record<string, string>
): Record<string, unknown> {
  return {
    event_id: eventId,
    sequence,
    kind: 'item_announced',
    item,
    evidence: [{ source: 'selected_queue_snapshot', reference: 'Exact embedded queue item.' }],
  };
}

function transitionEvent(
  eventId: string,
  sequence: number,
  transition: 'next' | 'previous' | 'jump' | 'repeat',
  item: Record<string, string>
): Record<string, unknown> {
  return {
    event_id: eventId,
    sequence,
    kind: 'playback_transition',
    transition,
    item,
    evidence: [{ source: 'explicit_user_capture', reference: `Brad requested ${transition}.` }],
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
