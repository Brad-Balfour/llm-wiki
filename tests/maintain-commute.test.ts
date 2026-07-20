import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildMaintainerPrompt,
  parseAgentResult,
  resolveMaintainerCodexExecutable,
} from '../src/wiki/maintain-commute.js';

test('uses the app-bundled Codex unless an explicit maintainer executable is configured', () => {
  assert.equal(
    resolveMaintainerCodexExecutable({}),
    '/Applications/ChatGPT.app/Contents/Resources/codex'
  );
  assert.equal(
    resolveMaintainerCodexExecutable({ COMMUTE_MAINTAINER_CODEX: '/opt/tools/codex' }),
    '/opt/tools/codex'
  );
  assert.equal(
    resolveMaintainerCodexExecutable({ COMMUTE_MAINTAINER_CODEX: '  ' }),
    '/Applications/ChatGPT.app/Contents/Resources/codex'
  );
});

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

test('accepts a structured PR result from the isolated maintainer branch', () => {
  const result = parseAgentResult(
    {
      schema_version: 'commute-maintenance-result.v1',
      status: 'pr_created',
      branch: 'commute-maintenance-20260720120000',
      pr_url: 'https://github.com/Brad-Balfour/llm-wiki/pull/99',
      results: [
        {
          maintenance_key: 'session:event:https://example.com/article',
          status: 'updated_existing_page',
          detail: 'Added a concise source-grounded note.',
        },
      ],
    },
    'commute-maintenance-20260720120000'
  );

  assert.equal(result.status, 'pr_created');
  assert.equal(result.pr_url, 'https://github.com/Brad-Balfour/llm-wiki/pull/99');
});

test('rejects a PR result that does not identify its pull request', () => {
  assert.throws(
    () =>
      parseAgentResult(
        {
          schema_version: 'commute-maintenance-result.v1',
          status: 'pr_created',
          branch: 'commute-maintenance-20260720120000',
          results: [],
        },
        'commute-maintenance-20260720120000'
      ),
    /pr_created requires pr_url/
  );
});
