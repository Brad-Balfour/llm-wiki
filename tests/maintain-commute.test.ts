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
  parseOptions,
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
  assert.match(prompt, /Do not create or modify an approved-wiki-source\.v1 record/);
  assert.match(prompt, /do not assert approved, public, reviewed_by, safety-review/);
  assert.match(prompt, /The exact wiki_this capture authorizes maintenance/);
  assert.match(prompt, /the PR diff is the review point/);
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

// --- Characterization tests (issue #55 item 1) ---
// Pin the current CLI argument contract before item 11 replaces this parser.
// Item 11 is expected to change some of these; enumerating them here makes
// each intentional change visible as a test diff rather than a silent shift.

test('parses bundles, recovery queues, and an output directory in order', () => {
  const options = parseOptions([
    '--input',
    'a.txt',
    '--recover-with',
    'queue-a.txt',
    '--input',
    'b.txt',
    '--output-dir',
    '.private/out',
    '--prior-intake',
    '.private/prior.json',
  ]);

  assert.equal(options.kind, 'maintain');
  assert.deepEqual(options.kind === 'maintain' ? options.inputs : undefined, [
    { bundle: 'a.txt', recoveryQueue: 'queue-a.txt' },
    { bundle: 'b.txt' },
  ]);
  assert.equal(options.kind === 'maintain' ? options.outputDir : undefined, '.private/out');
  assert.equal(
    options.kind === 'maintain' ? options.priorIntake : undefined,
    '.private/prior.json'
  );
});

test('omits prior intake entirely when it is not supplied', () => {
  const options = parseOptions(['--input', 'a.txt', '--output-dir', '.private/out']);

  assert.equal(options.kind === 'maintain' && Object.hasOwn(options, 'priorIntake'), false);
});

test('treats the launcher diagnosis as a standalone mode', () => {
  assert.deepEqual(parseOptions(['--diagnose-launcher']), { kind: 'diagnose_launcher' });
  assert.throws(
    () => parseOptions(['--diagnose-launcher', '--input', 'a.txt']),
    /cannot be combined with maintenance inputs/
  );
  assert.throws(
    () => parseOptions(['--diagnose-launcher', '--output-dir', '.private/out']),
    /cannot be combined with maintenance inputs/
  );
});

test('binds a recovery queue to the preceding bundle and only once', () => {
  assert.throws(
    () => parseOptions(['--recover-with', 'queue.txt', '--output-dir', '.private/out']),
    /requires a preceding --input/
  );
  assert.throws(
    () =>
      parseOptions([
        '--input',
        'a.txt',
        '--recover-with',
        'one.txt',
        '--recover-with',
        'two.txt',
        '--output-dir',
        '.private/out',
      ]),
    /at most one --recover-with queue/
  );
});

test('requires both a bundle and an output directory', () => {
  assert.throws(() => parseOptions(['--output-dir', '.private/out']), /Usage: maintain:commute/);
  assert.throws(() => parseOptions(['--input', 'a.txt']), /Usage: maintain:commute/);
  assert.throws(() => parseOptions([]), /Usage: maintain:commute/);
});

test('rejects an unknown argument rather than ignoring it', () => {
  assert.throws(
    () => parseOptions(['--input', 'a.txt', '--output-dir', '.private/out', '--publish']),
    /Unknown argument: --publish/
  );
});

test('rejects a value-taking flag with no value', () => {
  assert.throws(() => parseOptions(['--input']), /--input requires a bundle filename/);
  assert.throws(
    () => parseOptions(['--input', 'a.txt', '--output-dir']),
    /--output-dir requires a directory/
  );
  assert.throws(
    () => parseOptions(['--input', 'a.txt', '--output-dir', '.private/out', '--prior-intake']),
    /--prior-intake requires a filename/
  );
});

test('currently swallows a following flag as a value, which item 11 corrects', () => {
  // Characterizing a defect, not endorsing it: a value-taking flag consumes the
  // next token unconditionally, so a following flag becomes its value. Item 11
  // replaces this with one missing-value rule; when it lands these expectations
  // must change, and that diff is the point.

  // Silent case: the flag is absorbed and the command runs with a nonsense
  // output directory, with nothing reported.
  const silent = parseOptions(['--input', 'a.txt', '--output-dir', '--diagnose-launcher']);
  assert.equal(silent.kind, 'maintain');
  assert.equal(silent.kind === 'maintain' ? silent.outputDir : undefined, '--diagnose-launcher');

  // Misleading case: the absorbed flag leaves its own value stranded, which
  // surfaces as an unknown-argument error naming the wrong token.
  assert.throws(
    () => parseOptions(['--input', 'a.txt', '--output-dir', '--prior-intake', 'p.json']),
    /Unknown argument: p\.json/
  );
});
