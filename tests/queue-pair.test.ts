import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

import {
  createQueueV4Snapshot,
  parseCommuteSessionBundleText,
  playbackFileFingerprint,
  validateTldrCommuteQueuePair,
} from '../src/commute/session-bundle.js';

function pair(itemCount = 2) {
  const items = Array.from({ length: itemCount }, (_, index) => {
    const position = index + 1;
    const consumptionDepth = index === 0 ? 'headline_only' : 'in_depth';
    const title = `Example ${position}`;
    const description = `Literal description ${position}.`;
    const prefix = `${position} of ${itemCount}. ${consumptionDepth === 'headline_only' ? 'Headline only' : 'In depth'}. ${title}`;
    return {
      playback: {
        item_playback: consumptionDepth === 'headline_only' ? prefix : `${prefix}\n${description}`,
      },
      reference: {
        position,
        source_item_id: `example-${position}`,
        title,
        description,
        author: `Author ${position}`,
        publication: 'Example Publication',
        url: `https://example.com/${position}`,
        attribution: {
          resolved_url: `https://example.com/${position}`,
          author_source: 'newsletter',
          publication_source: 'newsletter',
          lookup_attempts: 0,
        },
        interest_level: 'interested',
        interest_score: 0.9,
        consumption_depth: consumptionDepth,
        depth_score: consumptionDepth === 'in_depth' ? 0.8 : 0.3,
        commute_behavior: consumptionDepth === 'in_depth' ? 'discuss' : 'quick_read',
        signals: ['invented fixture'],
        reason: 'Invented test classification.',
        classified_at: '2026-09-06T11:00:00-04:00',
        routed_at: '2026-09-06T11:00:00-04:00',
      },
      sweep: prefix,
    };
  });
  const main = {
    sweep_playback: items.map((item) => item.sweep).join('\n'),
    items: items.map((item) => item.playback),
  };
  const reference = {
    queue_version: 'tldr-commute-queue.v4',
    main_filename: '20260906-tldr-dev.txt',
    main_sha256: playbackFileFingerprint(main),
    newsletter: 'TLDR Dev',
    edition_date: '2026-09-06',
    source_email: {
      gmail_message_id: 'invented-message',
      sender: 'TLDR Dev <dev@example.com>',
      delivered_at: '2026-09-06T07:00:00-04:00',
    },
    total_items: itemCount,
    profile_version: 'interest-profile.v1.4',
    prompt_version: 'classifier-instructions.v1',
    provider: 'openai',
    model: 'project-model',
    parser_version: 'tldr-parser.v1',
    route_version: 'routing-rules.v1',
    items: items.map((item) => item.reference),
  };
  return { main, reference };
}

test('validates a v4 playback/reference pair and its canonical main hash', () => {
  const { main, reference } = pair();
  const validated = validateTldrCommuteQueuePair(
    main,
    reference,
    '20260906-tldr-dev.txt',
    '20260906-tldr-dev-reference.txt'
  );

  assert.equal(validated.referenceFile.total_items, 2);
  assert.equal(Object.keys(validated.playbackFile).join(','), 'sweep_playback,items');
});

test('rejects missing, swapped, stale, and reordered v4 references', () => {
  const { main, reference } = pair();
  const stale = structuredClone(reference);
  stale.main_sha256 = `sha256:${'0'.repeat(64)}`;
  assert.throws(() => validateTldrCommuteQueuePair(main, stale), /does not match/);

  assert.throws(
    () =>
      validateTldrCommuteQueuePair(
        main,
        reference,
        '20260906-tldr-ai.txt',
        '20260906-tldr-ai-reference.txt'
      ),
    /main_filename/
  );

  const reordered = structuredClone(reference);
  reordered.items.reverse();
  assert.throws(() => validateTldrCommuteQueuePair(main, reordered), /position must be 1/);
});

test('rejects extra main fields and item metadata', () => {
  const { main, reference } = pair();
  assert.throws(
    () => validateTldrCommuteQueuePair({ ...main, total_items: 2 }, reference),
    /keys must be sweep_playback then items/
  );
  const leaked = structuredClone(main) as Record<string, unknown>;
  const items = leaked.items as Array<Record<string, unknown>>;
  items[0]!.url = 'https://example.com/leak';
  assert.throws(() => validateTldrCommuteQueuePair(leaked, reference), /unsupported fields: url/);
});

test('accepts a valid empty v4 pair', () => {
  const { main, reference } = pair(0);
  assert.equal(main.sweep_playback, '');
  assert.equal(validateTldrCommuteQueuePair(main, reference).referenceFile.total_items, 0);
});

test('v4 bundle wrapper keeps complete identities for saves without preloading reference data', () => {
  const { main, reference } = pair(1);
  const snapshot = createQueueV4Snapshot(main, reference);
  const identity = {
    source_item_id: 'example-1',
    title: 'Example 1',
    url: 'https://example.com/1',
  };
  const bundle = {
    schema_version: 'commute-session-bundle.v1',
    session: {
      session_id: 'v4-export-example',
      session_date: '2026-09-06',
      artifact_filename: '202609060745-morning-commute-session-bundle.txt',
      voice_surface: 'chatgpt_live',
    },
    queue_snapshot: { filename: '20260906-tldr-dev.txt', queue: snapshot },
    playback: {
      status: 'completed',
      last_announced_source_item_id: 'example-1',
      resume_source_item_id: 'example-1',
    },
    integrity: {
      state: 'partial',
      incomplete_reason: 'The chat is the evidence record.',
      unresolved_event_ids: [],
    },
    events: [
      {
        event_id: 'announce-1',
        sequence: 1,
        kind: 'item_announced',
        item: identity,
        evidence: [{ source: 'selected_queue_snapshot', reference: 'Exact v4 reference item.' }],
      },
      {
        event_id: 'save-1',
        sequence: 2,
        kind: 'item_action',
        action: 'wiki_this',
        item: identity,
        user_words: 'Wiki this.',
        evidence: [{ source: 'explicit_user_capture', reference: 'Brad said: Wiki this.' }],
      },
    ],
  };

  const parsed = parseCommuteSessionBundleText(JSON.stringify(bundle));
  assert.equal(parsed.events[1]?.kind, 'item_action');
  assert.equal(parsed.events[1]?.item.source_item_id, 'example-1');
});

test('v4 bundle snapshot filename must match its embedded reference', () => {
  const { main, reference } = pair(1);
  const snapshot = createQueueV4Snapshot(main, reference);
  const bundle = {
    schema_version: 'commute-session-bundle.v1',
    session: {
      session_id: 'mismatched-v4-filename',
      session_date: '2026-09-06',
      artifact_filename: '202609060745-morning-commute-session-bundle.txt',
      voice_surface: 'chatgpt_live',
    },
    queue_snapshot: { filename: '20260906-tldr-ai.txt', queue: snapshot },
    playback: { status: 'not_started' },
    integrity: {
      state: 'partial',
      incomplete_reason: 'No playback occurred.',
      unresolved_event_ids: [],
    },
    events: [],
  };

  assert.throws(
    () => parseCommuteSessionBundleText(JSON.stringify(bundle)),
    /main_filename does not match/
  );
});

test('bundle validator rejects a missing --reference value as usage error', () => {
  const result = spawnSync(
    process.execPath,
    ['dist/src/commute/validate-session-bundle.js', '--reference'],
    { encoding: 'utf8' }
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /--reference requires a filename/);
});

test('validates all generation-time attribution outcomes', () => {
  const cases = [
    {
      author: 'Newsletter Author',
      publication: 'Newsletter Publication',
      author_source: 'newsletter',
      publication_source: 'newsletter',
      lookup_attempts: 0,
    },
    {
      author: 'Page Author',
      publication: 'Page Publication',
      author_source: 'article_page',
      publication_source: 'article_page',
      lookup_attempts: 1,
    },
    {
      author: 'First Author and Second Author',
      publication: 'Multi-author Journal',
      author_source: 'article_page',
      publication_source: 'article_page',
      lookup_attempts: 1,
    },
    {
      author: 'No authors listed',
      publication: 'example.com',
      author_source: 'no_authors_listed',
      publication_source: 'hostname_fallback',
      lookup_attempts: 1,
    },
    {
      author: 'Author lookup failed',
      publication: 'example.com',
      author_source: 'lookup_failed',
      publication_source: 'hostname_fallback',
      lookup_attempts: 2,
    },
  ];

  for (const attributionCase of cases) {
    const { main, reference } = pair(1);
    const item = reference.items[0]!;
    item.author = attributionCase.author;
    item.publication = attributionCase.publication;
    item.attribution = {
      resolved_url: item.url,
      author_source: attributionCase.author_source,
      publication_source: attributionCase.publication_source,
      lookup_attempts: attributionCase.lookup_attempts,
    };
    assert.doesNotThrow(() => validateTldrCommuteQueuePair(main, reference));
  }
});

test('rejects null attribution and status strings presented as verified authors', () => {
  const { main, reference } = pair(1);
  reference.items[0]!.author = null as unknown as string;
  assert.throws(
    () => validateTldrCommuteQueuePair(main, reference),
    /author must be a non-empty string/
  );

  const second = pair(1);
  second.reference.items[0]!.author = 'Author lookup failed';
  second.reference.items[0]!.attribution.author_source = 'article_page';
  second.reference.items[0]!.attribution.lookup_attempts = 1;
  assert.throws(
    () => validateTldrCommuteQueuePair(second.main, second.reference),
    /status strings are not verified author names/
  );

  const fallback = pair(1);
  fallback.reference.items[0]!.publication = 'Wrong Site';
  fallback.reference.items[0]!.attribution.publication_source = 'hostname_fallback';
  fallback.reference.items[0]!.attribution.lookup_attempts = 1;
  assert.throws(
    () => validateTldrCommuteQueuePair(fallback.main, fallback.reference),
    /publication must equal example\.com/
  );
});

test('rejects attribution sources with inconsistent lookup attempt counts', () => {
  const newsletter = pair(1);
  newsletter.reference.items[0]!.attribution.lookup_attempts = 1;
  assert.throws(
    () => validateTldrCommuteQueuePair(newsletter.main, newsletter.reference),
    /must be 0 when newsletter attribution is sufficient/
  );

  const page = pair(1);
  page.reference.items[0]!.attribution.author_source = 'article_page';
  assert.throws(
    () => validateTldrCommuteQueuePair(page.main, page.reference),
    /must be at least 1 for non-newsletter attribution/
  );

  const failed = pair(1);
  failed.reference.items[0]!.author = 'Author lookup failed';
  failed.reference.items[0]!.publication = 'example.com';
  failed.reference.items[0]!.attribution.author_source = 'lookup_failed';
  failed.reference.items[0]!.attribution.publication_source = 'hostname_fallback';
  failed.reference.items[0]!.attribution.lookup_attempts = 1;
  assert.throws(
    () => validateTldrCommuteQueuePair(failed.main, failed.reference),
    /must be 2 for a failed lookup after retry/
  );
});
