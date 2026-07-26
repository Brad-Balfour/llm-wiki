import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildMaintainerPrompt,
  maintenanceAttemptsFromAgentFailure,
  maintenanceAttemptsFromAgentResult,
  maintenanceAttemptsFromRetrieval,
  maintenanceCandidatesForAttempt,
  parseAgentResult,
  reportedAgentPrUrl,
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
  assert.match(prompt, /Use per-candidate status "pr_created" only/);
  assert.match(prompt, /Do not create a second page for a concept the wiki already covers/);
  assert.match(prompt, /preserving its useful content and provenance/);
  assert.match(prompt, /link-only change is useful only when it materially improves navigation/);
  assert.match(prompt, /For each "pr_created".*name every affected wiki path/);
  assert.match(prompt, /For a duplicate-concept "no_change", name the existing wiki path/);
  assert.match(prompt, /Other "no_change" results may omit a path/);
  assert.match(
    prompt,
    /For "insufficient_source", "unresolved", or "failed", do not invent a wiki path/
  );
  assert.doesNotMatch(prompt, /updated_existing_page/);
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
          status: 'pr_created',
          detail: 'Added a concise source-grounded note.',
        },
      ],
    },
    'commute-maintenance-20260720120000'
  );

  assert.equal(result.status, 'pr_created');
  assert.equal(result.pr_url, 'https://github.com/Brad-Balfour/llm-wiki/pull/99');
});

test('rejects an unsupported per-candidate status instead of treating it as PR success', () => {
  assert.throws(
    () =>
      parseAgentResult(
        {
          schema_version: 'commute-maintenance-result.v1',
          status: 'pr_created',
          branch: 'commute-maintenance-20260720120000',
          pr_url: 'https://github.com/Brad-Balfour/llm-wiki/pull/99',
          results: [
            {
              maintenance_key: 'candidate',
              status: 'updated_existing_page',
              detail: 'Updated an existing page.',
            },
          ],
        },
        'commute-maintenance-20260720120000'
      ),
    /results\[0\]\.status has an unsupported status/
  );
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

test('routes a reported PR with a conflicting overall status to manual review', () => {
  const candidate = {
    schema_version: 'commute-maintenance-result.v1',
    status: 'failed',
    branch: 'commute-maintenance-20260720120000',
    pr_url: 'https://github.com/Brad-Balfour/llm-wiki/pull/99',
    results: [],
  };

  assert.equal(
    reportedAgentPrUrl(candidate, 'commute-maintenance-20260720120000'),
    'https://github.com/Brad-Balfour/llm-wiki/pull/99'
  );
  assert.throws(
    () => parseAgentResult(candidate, 'commute-maintenance-20260720120000'),
    /pr_url requires pr_created status/
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

test('requires an explicit PR-created candidate before closing retry state', () => {
  assert.throws(
    () =>
      maintenanceAttemptsFromAgentResult(
        {
          schema_version: 'commute-maintenance-result.v1',
          status: 'pr_created',
          branch: 'commute-maintenance-20260720120000',
          pr_url: 'https://github.com/Brad-Balfour/llm-wiki/pull/99',
          results: [
            {
              maintenance_key: 'candidate',
              status: 'no_change',
              detail: 'No change for this candidate.',
            },
          ],
        },
        ['candidate'],
        '2026-07-20T12:00:00.000Z'
      ),
    /must explicitly identify at least one PR-created candidate/
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

test('requires manual review instead of retrying when a malformed result names a created PR', () => {
  const candidate = {
    schema_version: 'commute-maintenance-result.v1',
    status: 'pr_created',
    branch: 'commute-maintenance-20260720120000',
    pr_url: 'https://github.com/Brad-Balfour/llm-wiki/pull/99',
    results: [],
  };
  const prUrl = reportedAgentPrUrl(candidate, 'commute-maintenance-20260720120000');
  const attempts = maintenanceAttemptsFromAgentFailure(
    ['candidate-a', 'candidate-b'],
    'Maintainer agent result is missing maintenance candidate(s): candidate-b',
    '2026-07-20T12:00:00.000Z',
    prUrl
  );

  assert.equal(prUrl, 'https://github.com/Brad-Balfour/llm-wiki/pull/99');
  assert.deepEqual(
    attempts.map((attempt) => attempt.status),
    ['review_required', 'review_required']
  );
  assert.match(attempts[0]?.detail ?? '', /pull\/99/);
});

test('does not trust a reported PR URL from the wrong maintainer branch', () => {
  assert.equal(
    reportedAgentPrUrl(
      {
        status: 'pr_created',
        branch: 'different-branch',
        pr_url: 'https://github.com/Brad-Balfour/llm-wiki/pull/99',
      },
      'commute-maintenance-20260720120000'
    ),
    undefined
  );
});
