import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';

import { ingestTldrText } from '../src/tldr/ingestion.js';
import {
  isKnownWrapperOrAdLine,
  linkedBlockSkipReason,
  parseTldrEditionBody,
} from '../src/tldr/parser.js';
import { buildSourceItemId, PARSER_VERSION } from '../src/tldr/parser-contract.js';
import type { ParsedTldrItem } from '../src/tldr/parser-contract.js';

const execFileAsync = promisify(execFile);
const EXTRACTED_AT = '2026-07-06T00:00:00.000Z';

test('parser extracts sanitized non-sponsor editorial items with stable ids', async () => {
  const body = await readFile(
    resolve(process.cwd(), 'tests/fixtures/tldr/source-text/sanitized-real-shaped-tldr.txt'),
    'utf8'
  );
  const records = JSON.parse(
    await readFile(
      resolve(process.cwd(), 'tests/fixtures/expected/parser/minimal-sanitized-tldr.json'),
      'utf8'
    )
  ) as ParsedTldrItem[];
  const result = parseTldrEditionBody(body, { extractedAt: EXTRACTED_AT });

  assert.equal(result.newsletter, 'TLDR AI');
  assert.equal(result.edition_date, '2026-07-02');
  assert.match(result.confirmed_body_markers.join('\n'), /TLDR AI 2026-07-02/);
  assert.equal(result.reviews.length, 0);
  assert.deepEqual(result.items, records);

  for (const item of result.items) {
    assert.deepEqual(Object.keys(item), [
      'source_item_id',
      'newsletter',
      'edition_date',
      'section',
      'title',
      'summary',
      'url',
      'extracted_at',
      'parser_version',
    ]);
    assert.match(item.source_item_id, /^tldr_[a-f0-9]{16}$/);
    assert.equal(item.source_item_id, buildSourceItemId(item));
    assert.equal(item.parser_version, PARSER_VERSION);
    assert.equal(Object.hasOwn(item, 'raw_body'), false);
  }
});

test('ingestion routes subject-only or markerless text to review', () => {
  const result = ingestTldrText(
    [
      'Subject: TLDR AI 2026-07-02',
      '',
      '[OpenAI adds evaluation hooks for agents (2 minute read)](https://example.com/tldr/openai-agent-evals)',
      '',
      'OpenAI released new evaluation hooks for agent workflows.',
    ].join('\n'),
    { source: 'text-file', extractedAt: EXTRACTED_AT }
  );

  assert.equal(result.items.length, 0);
  assert.equal(result.review.length, 1);
  assert.equal(result.review[0]?.reason, 'body_marker_missing');
  assert.equal(result.review[0]?.route.review, 'parse_error');
});

test('ingestion routes ambiguous item validation failures to review', () => {
  const result = ingestTldrText(
    [
      'TLDR',
      '[View Online](https://a.tldrnewsletter.com/web-version)',
      '',
      'TLDR AI 2026-07-02',
      '',
      'Headlines & Launches',
      '',
      '[Unclear item without a summary (2 minute read)](https://example.com/tldr/unclear)',
    ].join('\n'),
    { source: 'text-file', extractedAt: EXTRACTED_AT }
  );

  assert.equal(result.items.length, 0);
  assert.equal(result.review.length, 1);
  assert.equal(result.review[0]?.reason, 'validation_error');
  assert.equal(result.review[0]?.route.review, 'parse_error');
  assert.match(result.review[0]?.context.snippet.join('\n') ?? '', /Unclear item/);
});

test('parser skips an unlabeled Together With sponsor block', () => {
  const result = parseTldrEditionBody(
    [
      'TLDR',
      'Together With',
      'TLDR AI 2026-07-02',
      '[Example Sponsor](https://example.com/ordinary-link)',
      'A sponsor summary without an explicit sponsor label.',
      '🚀',
      'Headlines & Launches',
      '[Editorial item (2 minute read)](https://example.com/editorial)',
      'A real editorial summary that should be retained.',
      'Manage your subscriptions',
    ].join('\n'),
    { extractedAt: EXTRACTED_AT }
  );

  assert.equal(result.reviews.length, 0);
  assert.deepEqual(
    result.items.map((item) => item.title),
    ['Editorial item']
  );
});

test('file ingestion command writes sanitized item and review outputs', async () => {
  const records = JSON.parse(
    await readFile(
      resolve(process.cwd(), 'tests/fixtures/expected/parser/minimal-sanitized-tldr.json'),
      'utf8'
    )
  ) as ParsedTldrItem[];
  const tempDir = await mkdtemp(resolve(tmpdir(), 'llm-wiki-tldr-'));
  const outputPath = resolve(tempDir, 'items.json');
  const reviewPath = resolve(tempDir, 'review.json');

  await execFileAsync(process.execPath, [
    resolve(process.cwd(), 'dist/src/tldr/ingest-file.js'),
    '--input',
    resolve(process.cwd(), 'tests/fixtures/tldr/source-text/sanitized-real-shaped-tldr.txt'),
    '--output',
    outputPath,
    '--review-output',
    reviewPath,
    '--source',
    'gmail-manual',
    '--source-message-id',
    'test-message-id',
    '--extracted-at',
    EXTRACTED_AT,
  ]);

  const output = JSON.parse(await readFile(outputPath, 'utf8')) as {
    input_source: string;
    source_message_id: string;
    items: ParsedTldrItem[];
    review: unknown[];
  };
  const review = JSON.parse(await readFile(reviewPath, 'utf8')) as unknown[];

  assert.equal(output.input_source, 'gmail-manual');
  assert.equal(output.source_message_id, 'test-message-id');
  assert.deepEqual(output.items, records);
  assert.deepEqual(output.review, []);
  assert.deepEqual(review, []);
});

// --- Item 15: parser data/logic separation (issue #55) ---

test('names why a linked block is not an editorial item', () => {
  const cases: Array<[string, string, string, string | null, string | null]> = [
    ['A Real Article', 'A Real Article', 'https://example.com/a', 'https://example.com/a', null],
    ['Great Tool (sponsor)', 'Great Tool', 'https://example.com/x', null, 'sponsor'],
    ['Anything', 'Anything', 'https://ads.example.com/sponsorship', null, 'sponsor'],
    ['Contact', 'Contact', 'mailto:hi@example.com', null, 'mailto'],
    [
      'TLDR is hiring engineers',
      'TLDR is hiring engineers',
      'https://x.test/j',
      null,
      'tldr_hiring',
    ],
    ['Refer', 'Refer', 'https://refer.tldr.tech/abc', null, 'referral_or_unsubscribe'],
    ['Stop', 'Stop', 'https://x.test/unsubscribe', null, 'referral_or_unsubscribe'],
    ['Advertise', 'Advertise', 'https://tldr.tech/advertise', null, 'tldr_house_page'],
    ['Jobs', 'Jobs', 'https://tldr.tech/jobs', null, 'tldr_house_page'],
  ];

  for (const [rawTitle, normalizedTitle, rawUrl, normalizedUrl, expected] of cases) {
    assert.equal(
      linkedBlockSkipReason(rawTitle, normalizedTitle, rawUrl, normalizedUrl),
      expected,
      `${rawTitle} / ${rawUrl}`
    );
  }
});

test('sponsor and wrapper line lists are data, not logic', () => {
  // These strings change whenever TLDR changes advertisers, so they live in
  // named constants. Pinning them here states that editing the constant is the
  // supported way to update, and catches an accidental deletion.
  for (const line of [
    '---------- Forwarded message ---------',
    'Begin forwarded message:',
    'From: TLDR <noreply@tldr.tech>',
    'Sent: Monday',
    'To: brad@example.com',
    'Subject: TLDR AI',
    '> Built for scale',
    '> Frontier models, one API',
    '> Reliable at scale',
    'Why teams run their agents here',
    'Coding agents only move as fast as their context',
    'Powered by Friendli',
    'Advertise with us',
    'Track your referrals',
  ]) {
    assert.equal(isKnownWrapperOrAdLine(line), true, `not recognized: ${line}`);
  }

  for (const line of [
    'Context engineering treats the prompt as an interface.',
    'Researchers published a new benchmark this week.',
  ]) {
    assert.equal(isKnownWrapperOrAdLine(line), false, `editorial text dropped: ${line}`);
  }
});
