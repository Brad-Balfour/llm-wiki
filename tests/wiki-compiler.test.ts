import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

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
  assert.match(result.markdown, /title: "Context Engineering"/);
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

test('fails closed when public approval is missing', async () => {
  const source = JSON.parse(await fixture('approved-source-one.json')) as Record<string, unknown>;
  source.approval = { status: 'approved', public: false, approved_at: '2026-07-12T16:00:00Z' };

  assert.throws(
    () => parseApprovedWikiSource(JSON.stringify(source)),
    /status=approved and public=true/
  );
});
