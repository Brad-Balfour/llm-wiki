import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { check as prettierCheck, resolveConfig as resolvePrettierConfig } from 'prettier';

import { parseApprovedWikiSource } from '../src/wiki/approved-source.js';
import { compileApprovedWikiSource } from '../src/wiki/compiler.js';

async function fixture(name: string): Promise<string> {
  return readFile(`tests/fixtures/wiki/${name}`, 'utf8');
}

test('creates an OKF entry from an explicitly approved TLDR source', async () => {
  const source = parseApprovedWikiSource(await fixture('approved-source-one.json'));
  const result = compileApprovedWikiSource(source, undefined, '2026-07-12');

  assert.equal(result.status, 'created');
  assert.equal(result.output_path, 'wiki/concepts/context-engineering.md');
  assert.equal(result.provenance_count, 1);
  assert.match(result.markdown, /^---\ntype: concept\n/);
  assert.match(result.markdown, /title: 'Context Engineering'/);
  assert.match(result.markdown, /created: 2026-07-12/);
  assert.match(result.markdown, /updated: 2026-07-12/);
  assert.match(result.markdown, /confidence: medium/);
  assert.match(result.markdown, /"source_item_id":"tldr-ai-2026-07-12-context-engineering"/);
});

test('updates an entry without losing prior provenance', async () => {
  const first = parseApprovedWikiSource(await fixture('approved-source-one.json'));
  const second = parseApprovedWikiSource(await fixture('approved-source-two.json'));
  const created = compileApprovedWikiSource(first, undefined, '2026-07-12');
  const updated = compileApprovedWikiSource(second, created.markdown, '2026-07-13');

  assert.equal(updated.status, 'updated');
  assert.equal(updated.provenance_count, 2);
  assert.match(updated.markdown, /tldr-ai-2026-07-12-context-engineering/);
  assert.match(updated.markdown, /tldr-dev-2026-07-13-context-debugging/);
  assert.match(updated.markdown, /aliases: \["agent context engineering","context design"\]/);
  assert.match(updated.markdown, /tags: \["agents","llm","debugging"\]/);
  assert.match(updated.markdown, /created: 2026-07-12/);
  assert.match(updated.markdown, /updated: 2026-07-13/);
  assert.match(updated.markdown, /- \[\[prompt-engineering\]\]/);
  assert.match(updated.markdown, /- \[\[agent-observability\]\]/);
});

test('is idempotent when the same source is compiled again', async () => {
  const source = parseApprovedWikiSource(await fixture('approved-source-one.json'));
  const created = compileApprovedWikiSource(source, undefined, '2026-07-12');
  const repeated = compileApprovedWikiSource(source, created.markdown, '2026-07-13');

  assert.equal(repeated.status, 'skipped');
  assert.equal(repeated.markdown, created.markdown);
  assert.equal(repeated.provenance_count, 1);
});

test('emits Prettier-compliant Markdown for created and updated entries', async () => {
  const first = parseApprovedWikiSource(await fixture('approved-source-one.json'));
  const second = parseApprovedWikiSource(await fixture('approved-source-two.json'));
  const created = compileApprovedWikiSource(first, undefined, '2026-07-12');
  const updated = compileApprovedWikiSource(second, created.markdown, '2026-07-13');
  const prettierOptions = await resolvePrettierConfig('.prettierrc');
  assert.ok(prettierOptions);

  for (const result of [created, updated]) {
    assert.equal(
      await prettierCheck(result.markdown, { ...prettierOptions, parser: 'markdown' }),
      true
    );
  }
});

test('keeps summaries and key ideas out of Source Notes', async () => {
  const source = parseApprovedWikiSource(await fixture('approved-source-one.json'));
  const result = compileApprovedWikiSource(source, undefined, '2026-07-12');
  const sourceNotes = result.markdown.split('## Source Notes\n\n')[1];

  assert.ok(sourceNotes);
  assert.match(sourceNotes, /TLDR AI, 2026-07-12\./);
  assert.doesNotMatch(sourceNotes, /Context engineering treats the information/);
  assert.doesNotMatch(sourceNotes, /Reliable agents need deliberate context/);
});

test('fails closed when public approval is missing', async () => {
  const source = JSON.parse(await fixture('approved-source-one.json')) as Record<string, unknown>;
  source.approval = {
    status: 'approved',
    public: false,
    approved_at: '2026-07-12T16:00:00Z',
    reviewed_by: 'brad',
    safety_review: {
      privacy: 'cleared',
      publication_rights: 'cleared',
      dual_use: 'cleared',
    },
  };

  assert.throws(
    () => parseApprovedWikiSource(JSON.stringify(source)),
    /status=approved and public=true/
  );
});

test('rejects conflicting reuse of a source item id', async () => {
  const first = parseApprovedWikiSource(await fixture('approved-source-one.json'));
  const conflictingJson = JSON.parse(await fixture('approved-source-two.json')) as Record<
    string,
    unknown
  >;
  const conflictingSource = conflictingJson.source as Record<string, unknown>;
  conflictingSource.source_item_id = first.source.source_item_id;
  const conflicting = parseApprovedWikiSource(JSON.stringify(conflictingJson));
  const created = compileApprovedWikiSource(first, undefined, '2026-07-12');

  assert.throws(
    () => compileApprovedWikiSource(conflicting, created.markdown, '2026-07-13'),
    /Conflicting provenance/
  );
});

test('rejects unsafe URLs, raw HTML, and private-work context', async () => {
  const base = JSON.parse(await fixture('approved-source-one.json')) as Record<string, unknown>;

  const unsafeUrl = structuredClone(base);
  (unsafeUrl.source as Record<string, unknown>).url = 'javascript:alert(1)';
  assert.throws(() => parseApprovedWikiSource(JSON.stringify(unsafeUrl)), /http\(s\) URL/);

  const credentialUrl = structuredClone(base);
  (credentialUrl.source as Record<string, unknown>).url =
    'https://example.com/article?access-token=secret';
  assert.throws(
    () => parseApprovedWikiSource(JSON.stringify(credentialUrl)),
    /credential-like URL parameter/
  );

  for (const key of ['client_secret', 'x-api-key', 'auth_token']) {
    const variant = structuredClone(base);
    (variant.source as Record<string, unknown>).url = `https://example.com/article?${key}=secret`;
    assert.throws(
      () => parseApprovedWikiSource(JSON.stringify(variant)),
      /credential-like URL parameter/
    );
  }

  for (const url of [
    'https://example.com/#access_token=oops',
    'https://example.com/?X-Amz-Credential=oops&X-Amz-Signature=oops',
  ]) {
    const signedOrFragment = structuredClone(base);
    (signedOrFragment.source as Record<string, unknown>).url = url;
    assert.throws(
      () => parseApprovedWikiSource(JSON.stringify(signedOrFragment)),
      /credential-like URL parameter/
    );
  }

  const rawHtml = structuredClone(base);
  (rawHtml.entry as Record<string, unknown>).summary = '<script>alert(1)</script>';
  assert.throws(() => parseApprovedWikiSource(JSON.stringify(rawHtml)), /raw HTML/);

  const privateWork = structuredClone(base);
  (privateWork.entry as Record<string, unknown>).summary = 'Confidential Range.com workflow';
  assert.throws(
    () => parseApprovedWikiSource(JSON.stringify(privateWork)),
    /must remain in review/
  );
});

test('escapes Markdown control characters in approved plain text', async () => {
  const candidate = JSON.parse(await fixture('approved-source-one.json')) as Record<
    string,
    unknown
  >;
  (candidate.entry as Record<string, unknown>).title = 'Context *Engineering*';
  const source = parseApprovedWikiSource(JSON.stringify(candidate));
  const result = compileApprovedWikiSource(source, undefined, '2026-07-12');

  assert.match(result.markdown, /# Context \\\*Engineering\\\*/);
});
