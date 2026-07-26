import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildMaintainerPrompt,
  maintenanceAttemptsFromAgentResult,
  maintenanceAttemptsFromRetrieval,
  maintenanceCandidatesForAttempt,
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

test('maps inaccessible and unsupported retrievals into retryable maintenance attempts', () => {
  const attempts = maintenanceAttemptsFromRetrieval({
    schema_version: 'commute-source-retrieval.v1',
    retrieved_at: '2026-07-20T12:00:00.000Z',
    sources: [
      {
        maintenance_key: 'session:event:https://example.com/missing',
        source_item_id: 'missing',
        requested_url: 'https://example.com/missing',
        status: 'inaccessible',
        retrieved_at: '2026-07-20T12:00:00.000Z',
        error: 'HTTP 404',
      },
      {
        maintenance_key: 'session:event:https://example.com/file',
        source_item_id: 'file',
        requested_url: 'https://example.com/file',
        status: 'unsupported_content',
        retrieved_at: '2026-07-20T12:00:00.000Z',
        content_type: 'application/pdf',
      },
      {
        maintenance_key: 'session:event:https://example.com/article',
        source_item_id: 'article',
        requested_url: 'https://example.com/article',
        status: 'retrieved',
        retrieved_at: '2026-07-20T12:00:00.000Z',
        extracted_text: 'Useful source text.',
      },
    ],
  });

  assert.deepEqual(
    attempts.map((attempt) => attempt.status),
    ['inaccessible_source', 'unsupported_source']
  );
});

test('retains no-change and unresolved maintainer results with exact candidate coverage', () => {
  const attempts = maintenanceAttemptsFromAgentResult(
    {
      schema_version: 'commute-maintenance-result.v1',
      status: 'no_change',
      branch: 'commute-maintenance-20260720120000',
      results: [
        {
          maintenance_key: 'session:event:https://example.com/covered',
          status: 'no_change',
          detail: 'The wiki already covers this source.',
        },
        {
          maintenance_key: 'session:event:https://example.com/unclear',
          status: 'unresolved',
          detail: 'The source does not establish a safe useful change.',
        },
      ],
    },
    ['session:event:https://example.com/covered', 'session:event:https://example.com/unclear'],
    '2026-07-20T12:00:00.000Z'
  );

  assert.deepEqual(
    attempts.map((attempt) => attempt.status),
    ['no_change', 'unresolved']
  );
});

test('rejects maintainer results that omit a retrievable candidate', () => {
  assert.throws(
    () =>
      maintenanceAttemptsFromAgentResult(
        {
          schema_version: 'commute-maintenance-result.v1',
          status: 'no_change',
          branch: 'commute-maintenance-20260720120000',
          results: [],
        },
        ['session:event:https://example.com/article'],
        '2026-07-20T12:00:00.000Z'
      ),
    /missing maintenance candidate/
  );
});

test('retries only pending or retryable maintenance candidates', () => {
  const completedKey = 'completed-candidate';
  const retryableKey = 'retryable-candidate';
  const candidate = (maintenanceKey: string) => ({
    maintenance_key: maintenanceKey,
    session_id: `session-${maintenanceKey}`,
    event_id: `event-${maintenanceKey}`,
    source_item_id: `item-${maintenanceKey}`,
    title: `Title ${maintenanceKey}`,
    url: `https://example.com/${maintenanceKey}`,
    status: 'pending' as const,
  });

  const candidates = maintenanceCandidatesForAttempt({
    maintenance_candidates: [candidate(completedKey), candidate(retryableKey)],
    maintenance_results: [
      {
        maintenance_key: completedKey,
        bundle_session_id: 'session-completed-candidate',
        event_id: 'event-completed-candidate',
        source_url: 'https://example.com/completed-candidate',
        latest_status: 'pr_created',
        latest_detail: 'PR created.',
        latest_attempted_at: '2026-07-20T12:00:00.000Z',
        attempt_count: 1,
        retryable: false,
      },
      {
        maintenance_key: retryableKey,
        bundle_session_id: 'session-retryable-candidate',
        event_id: 'event-retryable-candidate',
        source_url: 'https://example.com/retryable-candidate',
        latest_status: 'inaccessible_source',
        latest_detail: 'HTTP 404',
        latest_attempted_at: '2026-07-20T12:00:00.000Z',
        attempt_count: 1,
        retryable: true,
      },
    ],
  });

  assert.deepEqual(
    candidates.map((entry) => entry.maintenance_key),
    [retryableKey]
  );
});

test('records every candidate as failed when the overall maintainer pass fails', () => {
  const attempts = maintenanceAttemptsFromAgentResult(
    {
      schema_version: 'commute-maintenance-result.v1',
      status: 'failed',
      branch: 'commute-maintenance-20260720120000',
      results: [
        {
          maintenance_key: 'candidate',
          status: 'no_change',
          detail: 'Partial result before the pass failed.',
        },
      ],
    },
    ['candidate'],
    '2026-07-20T12:00:00.000Z'
  );

  assert.equal(attempts[0]?.status, 'failed');
});
