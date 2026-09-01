import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { finalizeCommutePerformance, parsePerformanceOptions } from '../src/commute/performance.js';

const SHA = '0123456789abcdef0123456789abcdef01234567';
const PR_URL = 'https://github.com/Brad-Balfour/llm-wiki/pull/100';

function validInput() {
  return {
    schema_version: 'commute-performance-input.v1',
    run_id: '2026-08-24-tldr',
    experiment: {
      epoch: 'post-2026-08-23-policy-orchestration',
      assigned_model: 'gpt-5.6-sol',
      assigned_reasoning_effort: 'medium',
      actual_model: 'gpt-5.6-sol',
      actual_reasoning_effort: 'medium',
      actual_reasoning_effort_label: 'Medium',
      escalated: false,
      representative: true,
    },
    publication: { outcome: 'merged', pr_url: PR_URL, head_sha: SHA },
    phases: {
      task_invoked_at: '2026-08-24T00:00:00.000Z',
      intake_validated_at: '2026-08-24T00:05:00.000Z',
      pr_created_at: '2026-08-24T00:12:00.000Z',
      merge_authorized_at: '2026-08-24T00:18:00.000Z',
      merged_at: '2026-08-24T00:22:00.000Z',
      post_merge_completed_at: '2026-08-24T00:24:00.000Z',
      terminal_completed_at: '2026-08-24T00:24:00.000Z',
    },
    activity: {
      busy_adjusted_excluded_seconds: 120,
      strict_agent_active_seconds: 900,
      tool_call_count: 72,
      tool_execution_seconds: 300,
    },
    interventions: [
      { reason: 'Merge authorization', required: true, active_seconds: 30 },
      { reason: 'Routine acknowledgment', required: false, active_seconds: 10 },
    ],
    review: { findings: 2, fix_commits: 1, failed_checks: 0, rereview_cycles: 0 },
    quality: {
      evidence_coverage_misses: 0,
      incorrect_durable_claims: 0,
      unresolved_items: 0,
      manual_corrections: 0,
    },
    workload: {
      queue_items: 21,
      substantive_conversation_entries: 28,
      bundles: 2,
      queues: 2,
      shared_chats: 5,
      issue_comments: 4,
      wiki_entries_created: 0,
      wiki_entries_updated: 0,
      behavior_files_changed: 0,
      cleanup_artifacts: 8,
      pr_files: 1,
      pr_additions: 47,
      pr_deletions: 0,
    },
  };
}

function validCommuteRun(unresolvedItems: unknown[] = []) {
  return {
    schema_version: 'commute-run.v1',
    result: 'completed',
    phases: {
      intake_started_at: '2026-08-24T00:01:00.000Z',
      preflight_completed_at: '2026-08-24T00:02:00.000Z',
      github_state_completed_at: '2026-08-24T00:03:00.000Z',
      command_completed_at: '2026-08-24T00:03:00.000Z',
    },
    preflight: {
      schema_version: 'commute-preflight.v1',
      generated_at: '2026-08-24T00:01:00.000Z',
      phases: {
        intake_started_at: '2026-08-24T00:01:00.000Z',
        validation_completed_at: '2026-08-24T00:02:00.000Z',
      },
      inventory: { bundles: [], supplied_queues: [], shared_chat_references: [] },
      intake: {
        sessions: [],
        maintenance_candidates: [],
        feedback_events: [],
        general_captures: [],
        navigation_events: [],
        event_conversions: [],
        unresolved_captures: [],
        quality_incidents: [],
      },
      conversation_coverage: [],
      queue_comparisons: [],
    },
    github: { outcome: 'not_requested' },
    unresolved_items: unresolvedItems,
  };
}

function authoritativeState(overrides: Record<string, unknown> = {}) {
  return {
    data: {
      repository: {
        pullRequest: {
          number: 100,
          url: PR_URL,
          headRefOid: SHA,
          state: 'MERGED',
          createdAt: '2026-08-24T00:12:00.000Z',
          mergedAt: '2026-08-24T00:22:00.000Z',
          ...overrides,
        },
      },
    },
  };
}

async function setup(input: unknown = validInput(), commuteRun: unknown = validCommuteRun()) {
  const privateRoot = path.join(process.cwd(), '.private');
  await mkdir(privateRoot, { recursive: true });
  const directory = await mkdtemp(path.join(privateRoot, 'performance-test-'));
  const normalizedInput = structuredClone(input);
  if (
    typeof normalizedInput === 'object' &&
    normalizedInput !== null &&
    'run_id' in normalizedInput &&
    normalizedInput.run_id === '2026-08-24-tldr'
  )
    normalizedInput.run_id = `test-${path.basename(directory).toLowerCase()}`;
  const inputPath = path.join(directory, 'input.json');
  const commuteRunPath = path.join(directory, 'commute-run.json');
  const runId =
    typeof normalizedInput === 'object' &&
    normalizedInput !== null &&
    'run_id' in normalizedInput &&
    typeof normalizedInput.run_id === 'string' &&
    /^[a-z0-9][a-z0-9_-]{0,127}$/.test(normalizedInput.run_id)
      ? normalizedInput.run_id
      : 'invalid-run';
  const outputPath = path.join(privateRoot, 'commute-performance', `${runId}.json`);
  await writeFile(inputPath, JSON.stringify(normalizedInput));
  await writeFile(commuteRunPath, JSON.stringify(commuteRun));
  return { directory, inputPath, commuteRunPath, outputPath };
}

async function finalize(
  paths: Awaited<ReturnType<typeof setup>>,
  githubState: (repository: string, pr: number) => Promise<unknown> = async () =>
    authoritativeState()
) {
  return finalizeCommutePerformance(
    { input: paths.inputPath, commuteRun: paths.commuteRunPath, output: paths.outputPath },
    { githubState, now: () => new Date('2026-08-24T01:00:00.000Z') }
  );
}

test('finalizer derives metrics and verifies publication in one GitHub call', async () => {
  const paths = await setup();
  const calls: Array<[string, number]> = [];
  const result = await finalize(paths, async (repository, pr) => {
    calls.push([repository, pr]);
    return authoritativeState();
  });
  assert.deepEqual(calls, [['Brad-Balfour/llm-wiki', 100]]);
  assert.equal(result.schema_version, 'commute-performance-run.v1');
  assert.equal(result.finalized_at, '2026-08-24T01:00:00.000Z');
  assert.equal(result.durations_seconds.gross_lifecycle, 1_440);
  assert.equal(result.durations_seconds.busy_adjusted_lifecycle, 1_320);
  assert.equal(result.durations_seconds.pre_pr, 720);
  assert.equal(result.durations_seconds.pr_to_merge, 600);
  assert.equal(result.durations_seconds.post_merge, 120);
  assert.equal(result.durations_seconds.agent_orchestration, 600);
  assert.equal(result.activity.required_intervention_count, 1);
  assert.equal(result.activity.user_attention_seconds, 40);
  assert.equal(result.workload?.queue_items, 21);
  assert.match(await readFile(paths.outputPath, 'utf8'), /commute-performance-run\.v1/);
});

test('desktop Light label maps only to low reasoning effort', async () => {
  const input = validInput();
  input.experiment.actual_reasoning_effort_label = 'Light';
  await assert.rejects(
    finalize(await setup(input)),
    /actual_reasoning_effort_label Light maps to low, not medium/
  );

  input.experiment.assigned_reasoning_effort = 'low';
  input.experiment.actual_reasoning_effort = 'low';
  const result = await finalize(await setup(input));
  assert.equal(result.experiment.actual_reasoning_effort, 'low');
  assert.equal(result.experiment.actual_reasoning_effort_label, 'Light');
});

test('finalizer captures its clock once and rejects future terminal lifecycle phases', async () => {
  const input = validInput();
  input.phases.post_merge_completed_at = '2026-08-24T01:01:00.000Z';
  input.phases.terminal_completed_at = '2026-08-24T01:01:00.000Z';
  const paths = await setup(input);
  let clockCalls = 0;
  await assert.rejects(
    finalizeCommutePerformance(
      { input: paths.inputPath, commuteRun: paths.commuteRunPath, output: paths.outputPath },
      {
        githubState: async () => authoritativeState(),
        now: () => {
          clockCalls += 1;
          return new Date('2026-08-24T01:00:00.000Z');
        },
      }
    ),
    /lifecycle phases later than finalized_at:.*phases\.terminal_completed_at.*phases\.post_merge_completed_at/
  );
  assert.equal(clockCalls, 1);
});

test('no-change run retains telemetry without GitHub or PR-only metrics', async () => {
  const input = validInput();
  const noChange = {
    ...input,
    publication: { outcome: 'no_change' },
    phases: {
      task_invoked_at: input.phases.task_invoked_at,
      intake_validated_at: input.phases.intake_validated_at,
      terminal_completed_at: input.phases.terminal_completed_at,
    },
    review: { findings: 0, fix_commits: 0, failed_checks: 0, rereview_cycles: 0 },
  };
  const paths = await setup(noChange);
  let calls = 0;
  const result = await finalize(paths, async () => {
    calls += 1;
    throw new Error('must not call GitHub');
  });
  assert.equal(calls, 0);
  assert.equal(result.publication.outcome, 'no_change');
  assert.equal(result.durations_seconds.pre_pr, null);
  assert.equal(result.durations_seconds.pr_to_merge, null);
  assert.equal(result.durations_seconds.post_merge, null);
  assert.equal(result.durations_seconds.merge_authorization_wait, null);
});

test('finalizer rejects truncated commute-run artifacts', async () => {
  const paths = await setup(validInput(), { schema_version: 'commute-run.v1' });
  await assert.rejects(finalize(paths), /commute run\.result must be completed/);
});

test('quality unresolved count must match deterministic orchestration', async () => {
  const paths = await setup(validInput(), validCommuteRun([{ type: 'rejected_session' }]));
  await assert.rejects(finalize(paths), /quality\.unresolved_items must equal.*\(1\)/);
});

test('authoritative GitHub state must match URL, head, and merged timestamp', async () => {
  for (const [override, message] of [
    [{ number: 101 }, /PR number does not match/],
    [{ url: 'https://github.com/Brad-Balfour/llm-wiki/pull/101' }, /pr_url does not match/],
    [{ headRefOid: 'f'.repeat(40) }, /head_sha does not match/],
    [{ state: 'OPEN', mergedAt: null }, /must be merged/],
    [{ createdAt: '2026-08-24T00:13:00.000Z' }, /pr_created_at does not match/],
    [{ mergedAt: '2026-08-24T00:23:00.000Z' }, /merged_at does not match/],
  ] as const) {
    const paths = await setup();
    await assert.rejects(
      finalize(paths, async () => authoritativeState(override)),
      message
    );
  }
});

test('PR URL requires a positive canonical number', async () => {
  for (const number of ['0', '0100']) {
    const input = validInput();
    input.publication.pr_url = `https://github.com/Brad-Balfour/llm-wiki/pull/${number}`;
    const paths = await setup(input);
    await assert.rejects(finalize(paths), /positive canonical GitHub PR number/);
  }
});

test('finalizer rejects out-of-order and impossible timestamps', async () => {
  const input = validInput();
  input.phases.merged_at = '2026-08-24T00:11:00.000Z';
  let paths = await setup(input);
  await assert.rejects(finalize(paths), /merged_at must not precede pr_created_at/);
  input.phases.merged_at = '2026-08-24T00:22:00.000Z';
  input.phases.task_invoked_at = '2026-02-31T00:00:00.000Z';
  paths = await setup(input);
  await assert.rejects(finalize(paths), /task_invoked_at date must be a real calendar date/);
});

test('commute-run phases must stay inside the measured lifecycle', async () => {
  const commuteRun = validCommuteRun();
  commuteRun.phases.intake_started_at = '2026-08-23T23:59:00.000Z';
  commuteRun.phases.preflight_completed_at = '2026-08-24T00:02:00.000Z';
  const paths = await setup(validInput(), commuteRun);
  await assert.rejects(
    finalize(paths),
    /commute run phases outside performance lifecycle: commute run\.phases\.intake_started_at/
  );
});

test('unknown telemetry fields fail closed', async () => {
  const input = validInput() as ReturnType<typeof validInput> & {
    activity: ReturnType<typeof validInput>['activity'] & { tool_calls?: number };
  };
  input.activity.tool_calls = 72;
  const paths = await setup(input);
  await assert.rejects(finalize(paths), /activity contains unsupported fields: tool_calls/);
});

test('preauthorized merge adds no authorization wait or intervention', async () => {
  const input = validInput();
  input.phases.merge_authorized_at = input.phases.task_invoked_at;
  input.interventions = [];
  const paths = await setup(input);
  const result = await finalize(paths);
  assert.equal(result.durations_seconds.merge_authorization_wait, 0);
  assert.equal(result.activity.required_intervention_count, 0);
});

test('later merge authorization requires a required intervention', async () => {
  const input = validInput();
  input.interventions = [];
  const paths = await setup(input);
  await assert.rejects(finalize(paths), /requires at least one required intervention/);
});

test('configuration mismatch requires escalation, while attempted same-config escalation is retained', async () => {
  let input = validInput();
  input.experiment.actual_model = 'gpt-5.6-terra';
  let paths = await setup(input);
  await assert.rejects(finalize(paths), /model or effort mismatch requires escalated=true/);

  const attempted = validInput() as ReturnType<typeof validInput> & {
    experiment: ReturnType<typeof validInput>['experiment'] & { escalation_reason?: string };
  };
  attempted.experiment.escalated = true;
  attempted.experiment.escalation_reason = 'Attempted escalation reverted before substantive work.';
  paths = await setup(attempted);
  const result = await finalize(paths);
  assert.equal(result.experiment.escalated, true);
  assert.equal(result.experiment.actual_model, result.experiment.assigned_model);
});

test('finalizer rejects impossible active, attention, and overflow durations', async () => {
  let input = validInput();
  input.activity.strict_agent_active_seconds = 1_400;
  let paths = await setup(input);
  await assert.rejects(finalize(paths), /strict_agent_active_seconds cannot exceed/);

  input = validInput();
  input.interventions = [
    { reason: 'one', required: true, active_seconds: 1_000 },
    { reason: 'two', required: true, active_seconds: 500 },
  ];
  paths = await setup(input);
  await assert.rejects(finalize(paths), /cannot exceed gross lifecycle/);

  input = validInput();
  input.interventions = [
    { reason: 'one', required: true, active_seconds: Number.MAX_VALUE },
    { reason: 'two', required: true, active_seconds: Number.MAX_VALUE },
  ];
  paths = await setup(input);
  await assert.rejects(finalize(paths), /active_seconds overflowed/);
});

test('finalizer requires reasons for escalated and excluded runs', async () => {
  const input = validInput();
  input.experiment.escalated = true;
  input.experiment.representative = false;
  const paths = await setup(input);
  await assert.rejects(finalize(paths), /escalation_reason is required/);
});

test('private path checks reject symlink escapes for inputs and output', async () => {
  const paths = await setup();
  const outside = await mkdtemp(path.join(os.tmpdir(), 'llm-wiki-performance-outside-'));
  const outsideInput = path.join(outside, 'input.json');
  await writeFile(outsideInput, JSON.stringify(validInput()));
  const linkedInput = path.join(paths.directory, 'linked-input.json');
  await symlink(outsideInput, linkedInput);
  await assert.rejects(
    finalizeCommutePerformance(
      { input: linkedInput, commuteRun: paths.commuteRunPath, output: paths.outputPath },
      {
        githubState: async () => authoritativeState(),
        now: () => new Date('2026-08-24T01:00:00.000Z'),
      }
    ),
    /--input must not resolve outside/
  );

  const linkedParent = path.join(paths.directory, 'linked-parent');
  await symlink(outside, linkedParent);
  await assert.rejects(
    finalizeCommutePerformance(
      {
        input: paths.inputPath,
        commuteRun: paths.commuteRunPath,
        output: path.join(linkedParent, 'metrics.json'),
      },
      {
        githubState: async () => authoritativeState(),
        now: () => new Date('2026-08-24T01:00:00.000Z'),
      }
    ),
    /--output parent must not resolve outside/
  );

  const targetPaths = await setup();
  const outsideTarget = path.join(outside, 'existing-metrics.json');
  await writeFile(outsideTarget, 'outside');
  await symlink(outsideTarget, targetPaths.outputPath);
  await assert.rejects(
    finalizeCommutePerformance(
      {
        input: targetPaths.inputPath,
        commuteRun: targetPaths.commuteRunPath,
        output: targetPaths.outputPath,
      },
      {
        githubState: async () => authoritativeState(),
        now: () => new Date('2026-08-24T01:00:00.000Z'),
      }
    ),
    /--output must not resolve outside/
  );
});

test('all telemetry paths remain private and output is immutable', async () => {
  const paths = await setup();
  await assert.rejects(
    finalizeCommutePerformance(
      { input: 'input.json', commuteRun: paths.commuteRunPath, output: paths.outputPath },
      {
        githubState: async () => authoritativeState(),
        now: () => new Date('2026-08-24T01:00:00.000Z'),
      }
    ),
    /--input must be inside the gitignored \.private directory/
  );
  assert.throws(
    () => parsePerformanceOptions(['--input', 'one.json']),
    /Usage: finalize:commute-performance/
  );
  await writeFile(paths.outputPath, 'preserve me');
  await assert.rejects(finalize(paths), /EEXIST/);
  assert.equal(await readFile(paths.outputPath, 'utf8'), 'preserve me');
});

test('run id and output path form one canonical private record', async () => {
  let input = validInput();
  input.run_id = '../escape';
  let paths = await setup(input);
  await assert.rejects(finalize(paths), /run_id must contain only lowercase/);

  input = validInput();
  paths = await setup(input);
  await assert.rejects(
    finalizeCommutePerformance(
      {
        input: paths.inputPath,
        commuteRun: paths.commuteRunPath,
        output: path.join(paths.directory, 'wrong.json'),
      },
      {
        githubState: async () => authoritativeState(),
        now: () => new Date('2026-08-24T01:00:00.000Z'),
      }
    ),
    /--output must be \.private\/commute-performance\/.*\.json/
  );
});

test('tracked schemas retain runtime versions and fail-closed unions', async () => {
  const inputSchema = JSON.parse(
    await readFile('schema/commute-performance-input-v1.schema.json', 'utf8')
  ) as {
    properties: { schema_version: { const: string }; run_id: { pattern: string } };
    additionalProperties: boolean;
    $defs: { publication: { oneOf: unknown[] }; merged_phases: { additionalProperties: boolean } };
  };
  const runSchema = JSON.parse(
    await readFile('schema/commute-performance-run-v1.schema.json', 'utf8')
  ) as {
    properties: { schema_version: { const: string }; run_id: { pattern: string } };
    additionalProperties: boolean;
    allOf: unknown[];
  };
  assert.equal(inputSchema.properties.schema_version.const, 'commute-performance-input.v1');
  assert.equal(inputSchema.properties.run_id.pattern, '^[a-z0-9][a-z0-9_-]{0,127}$');
  assert.equal(inputSchema.additionalProperties, false);
  assert.equal(inputSchema.$defs.publication.oneOf.length, 2);
  assert.equal(inputSchema.$defs.merged_phases.additionalProperties, false);
  assert.equal(runSchema.properties.schema_version.const, 'commute-performance-run.v1');
  assert.equal(runSchema.properties.run_id.pattern, '^[a-z0-9][a-z0-9_-]{0,127}$');
  assert.equal(runSchema.additionalProperties, false);
  assert.equal(runSchema.allOf.length, 1);
});
