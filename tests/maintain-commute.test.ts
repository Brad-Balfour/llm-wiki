import assert from 'node:assert/strict';
import test from 'node:test';

import { buildMaintainerPrompt } from '../src/wiki/maintain-commute.js';

test('builds a maintainer prompt with no intermediate approval gate', () => {
  const prompt = buildMaintainerPrompt({
    intakePath: '/private/intake.json',
    retrievalPath: '/private/sources.json',
    resultPath: '/private/result.json',
    branch: 'commute-maintenance-20260720120000',
  });

  assert.match(prompt, /There is no approval or intake-review gate/);
  assert.match(prompt, /create one GitHub PR with gh/);
  assert.match(prompt, /\/private\/sources\.json/);
});
