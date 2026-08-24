import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import { finalizeCommutePerformance, parsePerformanceOptions } from '../src/commute/performance.js';

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
      escalated: false,
      representative: true,
    },
    publication: {
      pr_url: 'https://github.com/Brad-Balfour/llm-wiki/pull/100',
      head_sha: '0123456789abcdef0123456789abcdef01234567',
    },
    phases: {
      task_invoked_at: '2026-08-24T00:00:00.000Z',
      intake_validated_at: '2026-08-24T00:05:00.000Z',
      pr_created_at: '2026-08-24T00:12:00.000Z',
      merge_authorized_at: '2026-08-24T00:18:00.000Z',
      merged_at: '2026-08-24T00:22:00.000Z',
      post_merge_completed_at: '2026-08-24T00:24:00.000Z',
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
  };
}

async function setup(input = validInput()) {
  const privateRoot = path.join(process.cwd(), '.private');
  await mkdir(privateRoot, { recursive: true });
  const directory = await mkdtemp(path.join(privateRoot, 'performance-test-'));
  const inputPath = path.join(directory, 'input.json');
  const commuteRunPath = path.join(directory, 'commute-run.json');
  const outputPath = path.join(directory, 'metrics.json');
  await writeFile(inputPath, JSON.stringify(input));
  await writeFile(commuteRunPath, JSON.stringify({ schema_version: 'commute-run.v1' }));
  return { inputPath, commuteRunPath, outputPath };
}

test('finalizer derives comparable phase and attention metrics once', async () => {
  const paths = await setup();
  const result = await finalizeCommutePerformance({
    input: paths.inputPath,
    commuteRun: paths.commuteRunPath,
    output: paths.outputPath,
  });
  assert.equal(result.schema_version, 'commute-performance-run.v1');
  assert.equal(result.durations_seconds.gross_lifecycle, 1_440);
  assert.equal(result.durations_seconds.busy_adjusted_lifecycle, 1_320);
  assert.equal(result.durations_seconds.pre_pr, 720);
  assert.equal(result.durations_seconds.pr_to_merge, 600);
  assert.equal(result.durations_seconds.post_merge, 120);
  assert.equal(result.durations_seconds.agent_orchestration, 600);
  assert.equal(result.activity.intervention_count, 2);
  assert.equal(result.activity.required_intervention_count, 1);
  assert.equal(result.activity.user_attention_seconds, 40);
  assert.match(await readFile(paths.outputPath, 'utf8'), /commute-performance-run\.v1/);
});

test('finalizer rejects out-of-order phase timestamps', async () => {
  const input = validInput();
  input.phases.merged_at = '2026-08-24T00:11:00.000Z';
  const paths = await setup(input);
  await assert.rejects(
    finalizeCommutePerformance({
      input: paths.inputPath,
      commuteRun: paths.commuteRunPath,
      output: paths.outputPath,
    }),
    /merged_at must not precede pr_created_at/
  );
});

test('finalizer rejects unknown telemetry fields instead of ignoring typos', async () => {
  const input = validInput() as ReturnType<typeof validInput> & {
    activity: ReturnType<typeof validInput>['activity'] & { tool_calls?: number };
  };
  input.activity.tool_calls = 72;
  const paths = await setup(input);
  await assert.rejects(
    finalizeCommutePerformance({
      input: paths.inputPath,
      commuteRun: paths.commuteRunPath,
      output: paths.outputPath,
    }),
    /activity contains unsupported fields: tool_calls/
  );
});

test('finalizer rejects impossible UTC calendar timestamps', async () => {
  const input = validInput();
  input.phases.task_invoked_at = '2026-02-31T00:00:00.000Z';
  const paths = await setup(input);
  await assert.rejects(
    finalizeCommutePerformance({
      input: paths.inputPath,
      commuteRun: paths.commuteRunPath,
      output: paths.outputPath,
    }),
    /phases\.task_invoked_at date must be a real calendar date/
  );
});

test('preauthorized merge adds no authorization wait or in-process intervention', async () => {
  const input = validInput();
  input.phases.merge_authorized_at = input.phases.task_invoked_at;
  input.interventions = [];
  const paths = await setup(input);
  const result = await finalizeCommutePerformance({
    input: paths.inputPath,
    commuteRun: paths.commuteRunPath,
    output: paths.outputPath,
  });
  assert.equal(result.durations_seconds.merge_authorization_wait, 0);
  assert.equal(result.activity.required_intervention_count, 0);
});

test('finalizer requires reasons for escalated and excluded runs', async () => {
  const input = validInput();
  input.experiment.escalated = true;
  input.experiment.representative = false;
  const paths = await setup(input);
  await assert.rejects(
    finalizeCommutePerformance({
      input: paths.inputPath,
      commuteRun: paths.commuteRunPath,
      output: paths.outputPath,
    }),
    /escalation_reason is required/
  );
});

test('finalizer rejects impossible active and tool durations', async () => {
  const input = validInput();
  input.activity.strict_agent_active_seconds = 1_400;
  const paths = await setup(input);
  await assert.rejects(
    finalizeCommutePerformance({
      input: paths.inputPath,
      commuteRun: paths.commuteRunPath,
      output: paths.outputPath,
    }),
    /strict_agent_active_seconds cannot exceed busy-adjusted duration/
  );
});

test('all telemetry paths must remain private', async () => {
  const paths = await setup();
  await assert.rejects(
    finalizeCommutePerformance({
      input: 'input.json',
      commuteRun: paths.commuteRunPath,
      output: paths.outputPath,
    }),
    /--input must be inside the gitignored \.private directory/
  );
  assert.throws(
    () => parsePerformanceOptions(['--input', 'one.json']),
    /Usage: finalize:commute-performance/
  );
});

test('finalizer refuses to replace an existing measurement', async () => {
  const paths = await setup();
  await writeFile(paths.outputPath, 'preserve me');
  await assert.rejects(
    finalizeCommutePerformance({
      input: paths.inputPath,
      commuteRun: paths.commuteRunPath,
      output: paths.outputPath,
    }),
    /EEXIST/
  );
  assert.equal(await readFile(paths.outputPath, 'utf8'), 'preserve me');
});
