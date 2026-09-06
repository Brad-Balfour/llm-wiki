import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

import {
  createQueueV4Snapshot,
  parseCommuteSessionBundleText,
  playbackFileFingerprint,
  validateTldrCommuteDailyPairs,
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
        source_occurrences: [
          {
            occurrence_id: `dev-example-${position}`,
            newsletter: 'TLDR Dev',
            source_item_id: `example-${position}`,
            source_order: position,
            title,
            description,
            url: `https://example.com/${position}`,
          },
        ],
        selected_source_occurrence_id: `dev-example-${position}`,
        coverage: {
          status: 'original' as 'original' | 'deduplicated' | 'useful_update' | 'uncertain',
          related_retained_item: null as null | {
            main_filename: string;
            source_item_id: string;
          },
          decision_reason: 'No repeated daily coverage found.',
          update_note: null as string | null,
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
    daily_generation_id: '20260906-daily-tldr',
    total_items: itemCount,
    profile_version: 'interest-profile.v1.4',
    prompt_version: 'classifier-instructions.v1',
    provider: 'openai',
    model: 'project-model',
    parser_version: 'tldr-parser.v1',
    route_version: 'routing-rules.v1',
    coverage_decisions: [] as Array<{
      source_occurrence_id: string;
      outcome: 'removed_exact_url' | 'removed_same_story' | 'kept_update' | 'kept_uncertain';
      retained_item: { main_filename: string; source_item_id: string };
      reason: string;
      new_information: string | null;
    }>,
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

test('validates exact-URL and different-URL same-story removal across daily editions', () => {
  for (const outcome of ['removed_exact_url', 'removed_same_story'] as const) {
    const retained = pair(1);
    const removed = pair(0);
    removed.reference.main_filename = '20260906-tldr-ai.txt';
    removed.reference.newsletter = 'TLDR AI';
    removed.reference.source_email.gmail_message_id = `ai-${outcome}`;
    const removedOccurrence = {
      occurrence_id: `ai-${outcome}`,
      newsletter: 'TLDR AI',
      source_item_id: `ai-${outcome}`,
      source_order: 1,
      title: outcome === 'removed_exact_url' ? 'Example 1' : 'The same launch',
      description: 'Alternate literal coverage of the same announcement.',
      url:
        outcome === 'removed_exact_url'
          ? 'https://example.com/1'
          : 'https://reporter.example.net/the-same-launch',
    };
    retained.reference.items[0]!.source_occurrences.push(removedOccurrence);
    removed.reference.coverage_decisions.push({
      source_occurrence_id: removedOccurrence.occurrence_id,
      outcome,
      retained_item: {
        main_filename: retained.reference.main_filename,
        source_item_id: retained.reference.items[0]!.source_item_id,
      },
      reason:
        outcome === 'removed_exact_url'
          ? 'The resolved destination URL is identical.'
          : 'The two URLs cover the same announcement without additional facts.',
      new_information: null,
    });

    assert.doesNotThrow(() =>
      validateTldrCommuteDailyPairs([
        {
          mainFilename: retained.reference.main_filename,
          playbackFile: retained.main,
          referenceFile: retained.reference,
        },
        {
          mainFilename: removed.reference.main_filename,
          playbackFile: removed.main,
          referenceFile: removed.reference,
        },
      ])
    );
  }
});

test('keeps a meaningful update and unrelated coverage while preserving daily links', () => {
  const original = pair(1);
  const update = pair(1);
  update.reference.main_filename = '20260906-tldr-fintech.txt';
  update.reference.newsletter = 'TLDR Fintech';
  update.reference.source_email.gmail_message_id = 'fintech-update';
  const updateItem = update.reference.items[0]!;
  updateItem.source_item_id = 'fintech-update';
  updateItem.url = 'https://finance.example.net/example-update';
  updateItem.attribution.resolved_url = updateItem.url;
  updateItem.source_occurrences[0]!.occurrence_id = 'fintech-update';
  updateItem.source_occurrences[0]!.source_item_id = updateItem.source_item_id;
  updateItem.source_occurrences[0]!.url = updateItem.url;
  updateItem.selected_source_occurrence_id = 'fintech-update';
  updateItem.coverage = {
    status: 'useful_update',
    related_retained_item: {
      main_filename: original.reference.main_filename,
      source_item_id: original.reference.items[0]!.source_item_id,
    },
    decision_reason: 'This report adds the announced price and launch date.',
    update_note: 'Update: this report adds the announced price and launch date.',
  };
  update.reference.coverage_decisions.push({
    source_occurrence_id: updateItem.source_occurrences[0]!.occurrence_id,
    outcome: 'kept_update',
    retained_item: {
      main_filename: update.reference.main_filename,
      source_item_id: updateItem.source_item_id,
    },
    reason: updateItem.coverage.decision_reason,
    new_information: 'The announced price and launch date.',
  });

  const unrelated = pair(1);
  unrelated.reference.main_filename = '20260906-tldr-ai.txt';
  unrelated.reference.newsletter = 'TLDR AI';
  unrelated.reference.source_email.gmail_message_id = 'ai-unrelated';
  const unrelatedItem = unrelated.reference.items[0]!;
  unrelatedItem.source_item_id = 'ai-unrelated';
  unrelatedItem.url = 'https://ai.example.org/unrelated-research';
  unrelatedItem.attribution.resolved_url = unrelatedItem.url;
  unrelatedItem.source_occurrences[0]!.occurrence_id = 'ai-unrelated';
  unrelatedItem.source_occurrences[0]!.source_item_id = unrelatedItem.source_item_id;
  unrelatedItem.source_occurrences[0]!.url = unrelatedItem.url;
  unrelatedItem.selected_source_occurrence_id = 'ai-unrelated';

  assert.doesNotThrow(() =>
    validateTldrCommuteDailyPairs([
      {
        mainFilename: original.reference.main_filename,
        playbackFile: original.main,
        referenceFile: original.reference,
      },
      {
        mainFilename: update.reference.main_filename,
        playbackFile: update.main,
        referenceFile: update.reference,
      },
      {
        mainFilename: unrelated.reference.main_filename,
        playbackFile: unrelated.main,
        referenceFile: unrelated.reference,
      },
    ])
  );
});

test('rejects missing retained targets and occurrence ownership across daily pairs', () => {
  const retained = pair(1);
  const removed = pair(0);
  removed.reference.main_filename = '20260906-tldr-ai.txt';
  removed.reference.coverage_decisions.push({
    source_occurrence_id: 'missing-occurrence',
    outcome: 'removed_same_story',
    retained_item: {
      main_filename: retained.reference.main_filename,
      source_item_id: retained.reference.items[0]!.source_item_id,
    },
    reason: 'Invented broken relationship.',
    new_information: null,
  });
  assert.throws(
    () =>
      validateTldrCommuteDailyPairs([
        {
          mainFilename: retained.reference.main_filename,
          playbackFile: retained.main,
          referenceFile: retained.reference,
        },
        {
          mainFilename: removed.reference.main_filename,
          playbackFile: removed.main,
          referenceFile: removed.reference,
        },
      ]),
    /is not stored on retained item/
  );
});
