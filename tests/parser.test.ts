import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

import { buildSourceItemId, PARSER_VERSION } from '../src/tldr/parser-contract.js';
import type { ParsedTldrItem } from '../src/tldr/parser-contract.js';

test('parser output records use the sanitized item-level shape and stable ids', async () => {
  const records = JSON.parse(
    await readFile(
      resolve(process.cwd(), 'tests/fixtures/expected/parser/minimal-sanitized-tldr.json'),
      'utf8'
    )
  ) as ParsedTldrItem[];

  assert.equal(records.length, 2);

  for (const item of records) {
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
