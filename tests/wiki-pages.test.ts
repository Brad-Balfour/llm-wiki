import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const INDEXES = [
  ['wiki/index.md', '/wiki/'],
  ['wiki/concepts/index.md', '/wiki/concepts/'],
  ['wiki/tools/index.md', '/wiki/tools/'],
  ['wiki/people/index.md', '/wiki/people/'],
  ['wiki/events/index.md', '/wiki/events/'],
] as const;

test('wiki landing and taxonomy indexes have stable Jekyll routes', async () => {
  for (const [file, permalink] of INDEXES) {
    const markdown = await readFile(file, 'utf8');
    assert.match(markdown, /^---\n/);
    assert.match(markdown, /\nlayout: default\n/);
    assert.match(markdown, new RegExp(`\\npermalink: ${escapeRegExp(permalink)}\\n`));
    if (file !== 'wiki/index.md') {
      assert.match(markdown, /site\.pages/);
      assert.match(markdown, /entry\.url \| relative_url/);
    }
  }

  const wikiIndex = await readFile('wiki/index.md', 'utf8');
  assert.doesNotMatch(wikiIndex, /README\.md/);
  assert.match(wikiIndex, /\(concepts\/\)/);
  assert.match(wikiIndex, /## Recent Additions/);
  assert.match(
    wikiIndex,
    /assign typed_entries = site\.pages \| where_exp: "entry", "entry\.type"/
  );
  assert.match(
    wikiIndex,
    /assign dated_entries = typed_entries \| where_exp: "entry", "entry\.updated"/
  );
  assert.match(
    wikiIndex,
    /assign publishable_entries = dated_entries \| where_exp: "entry", "entry\.path != 'wiki\/ENTRY_TEMPLATE\.md'"/
  );
  assert.doesNotMatch(wikiIndex, /where_exp: "entry", "[^"\n]*\b(?:and|or)\b/);
  assert.match(wikiIndex, /sort: "updated" \| reverse/);
  assert.match(wikiIndex, /recent_entries limit: 10/);
  assert.match(wikiIndex, /entry\.url \| relative_url/);
});

test('Jekyll applies the default layout to generated wiki entries', async () => {
  const config = await readFile('_config.yml', 'utf8');
  assert.ok(
    config.includes('defaults:\n  - scope:\n      path: wiki\n    values:\n      layout: default')
  );
  assert.ok(config.includes('\n  - wiki/ENTRY_TEMPLATE.md\n'));
});

test('typed wiki entries preserve typed routes and have no unrendered wiki-link syntax', async () => {
  for (const directory of ['concepts', 'tools', 'people', 'events']) {
    const names = await readdir(path.join('wiki', directory));
    for (const name of names) {
      if (!name.endsWith('.md') || name === 'index.md') continue;
      const slug = name.slice(0, -3);
      const markdown = await readFile(path.join('wiki', directory, name), 'utf8');
      assert.match(markdown, new RegExp(`\\nwiki_slug: ${escapeRegExp(slug)}\\n`));
      assert.doesNotMatch(markdown, /\npermalink: /);
      assert.doesNotMatch(markdown, /\[\[[a-z0-9-]+\]\]/);
    }
  }
});

test('related-link include resolves typed entry URLs instead of inventing flat routes', async () => {
  const include = await readFile('_includes/wiki-related-link.md', 'utf8');
  assert.match(include, /where: "wiki_slug", include\.slug/);
  assert.match(include, /related_entry\.url \| relative_url/);
  assert.doesNotMatch(include, /\/wiki\/\{\{/);
});

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
