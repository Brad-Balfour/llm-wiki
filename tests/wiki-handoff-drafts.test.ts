import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { parseCommuteHandoffText } from '../src/commute/handoff.js';
import { prepareWikiReviewDrafts } from '../src/wiki/prepare-handoff-drafts.js';

test('prepares private wiki drafts without granting public approval', async () => {
  const handoff = parseCommuteHandoffText(
    await readFile('tests/fixtures/commute/valid-handoff.txt', 'utf8')
  );
  const drafts = prepareWikiReviewDrafts(handoff);

  assert.equal(drafts.length, 1);
  assert.equal(drafts[0]?.status, 'needs_enrichment_and_approval');
  assert.ok(drafts[0]?.missing_fields.includes('approval.explicit_public_confirmation'));
  assert.equal(Object.hasOwn(drafts[0] ?? {}, 'approval'), false);
});
