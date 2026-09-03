import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { requireDateTime } from '../shared/time.js';
import {
  rejectUnknownKeys,
  requireArray,
  requireEnum,
  requireRecord,
  requireString,
} from '../shared/validate.js';
import { assertPrivateInputPath, assertPrivateOutputPath } from './performance.js';

export const PHASES = [
  'acquisition',
  'evidence_processing',
  'repository_work',
  'verification_publication',
  'cleanup_finalization',
] as const;
const METRICS = [
  'active_seconds',
  'tool_execution_seconds',
  'tool_call_count',
  'retry_seconds',
  'work_units',
] as const;
const TOLERANCE_SECONDS = 2;

function number(value: unknown, field: string, integer = false): number {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < 0 ||
    (integer && !Number.isSafeInteger(value))
  )
    throw new Error(`${field} must be a finite nonnegative ${integer ? 'integer' : 'number'}`);
  return value;
}

export function validatePhaseProfile(value: unknown, finalized: unknown) {
  const profile = requireRecord(value, 'profile');
  rejectUnknownKeys(
    profile,
    ['schema_version', 'run_id', 'model', 'reasoning_effort', 'phases'],
    'profile'
  );
  if (profile.schema_version !== 'commute-phase-profile.v1')
    throw new Error('Expected commute-phase-profile.v1');
  const run = requireRecord(finalized, 'finalized run');
  if (run.schema_version !== 'commute-performance-run.v1')
    throw new Error('Expected finalized commute-performance-run.v1');
  const runId = requireString(profile.run_id, 'run_id');
  if (!/^[a-z0-9][a-z0-9_-]{0,127}$/.test(runId) || runId !== run.run_id)
    throw new Error('run_id must match finalized run');
  const experiment = requireRecord(run.experiment, 'experiment');
  const model = requireString(profile.model, 'model');
  const effort = requireEnum(
    profile.reasoning_effort,
    ['low', 'medium', 'high', 'xhigh', 'max', 'ultra'],
    'reasoning_effort'
  );
  if (model !== experiment.actual_model || effort !== experiment.actual_reasoning_effort)
    throw new Error('Model/effort must match finalized run');
  const lifecycle = requireRecord(run.phases, 'lifecycle');
  const start = Date.parse(requireDateTime(lifecycle.task_invoked_at, 'task_invoked_at'));
  const end = Date.parse(requireDateTime(lifecycle.terminal_completed_at, 'terminal_completed_at'));
  const bundles = number(requireRecord(run.workload, 'workload').bundles, 'bundles', true);
  const phases = requireArray(profile.phases, 'phases').map((value) => {
    const entry = requireRecord(value, 'phase');
    rejectUnknownKeys(entry, ['phase', 'started_at', 'completed_at', ...METRICS, 'note'], 'phase');
    const phase = requireEnum(entry.phase, PHASES, 'phase');
    const startedAt = requireDateTime(entry.started_at, 'started_at');
    const completedAt = requireDateTime(entry.completed_at, 'completed_at');
    const active = number(entry.active_seconds, 'active_seconds');
    const tool = number(entry.tool_execution_seconds, 'tool_execution_seconds');
    const calls = number(entry.tool_call_count, 'tool_call_count', true);
    const retry = number(entry.retry_seconds, 'retry_seconds');
    const units = number(entry.work_units, 'work_units', true);
    const note = entry.note === null ? null : requireString(entry.note, 'note');
    if (note !== null && note.length > 160) throw new Error('note must be at most 160 characters');
    if (
      Date.parse(startedAt) < start ||
      Date.parse(completedAt) > end ||
      (Date.parse(completedAt) - Date.parse(startedAt)) / 1000 < active
    )
      throw new Error('Phase duration must fit its timestamps and finalized lifecycle');
    if (tool > active || retry > tool || (calls === 0 && tool > 0))
      throw new Error('Require retry <= tool <= active, with calls for tool time');
    if (active === 0 && calls === 0 && (note === null || tool !== 0 || retry !== 0 || units !== 0))
      throw new Error('Skipped phase requires zero values and a reason');
    if ((active > 0 || calls > 0) && units !== bundles)
      throw new Error('work_units must equal finalized workload.bundles');
    return {
      phase,
      started_at: startedAt,
      completed_at: completedAt,
      active_seconds: active,
      tool_execution_seconds: tool,
      tool_call_count: calls,
      retry_seconds: retry,
      work_units: units,
      note,
    };
  });
  if (
    phases.length !== PHASES.length ||
    new Set(phases.map(({ phase }) => phase)).size !== PHASES.length
  )
    throw new Error('Require exactly five unique phases');
  phases.sort((a, b) => PHASES.indexOf(a.phase) - PHASES.indexOf(b.phase));
  const durations = requireRecord(run.durations_seconds, 'durations_seconds');
  for (const [metric, expected] of [
    ['active_seconds', durations.strict_agent_active],
    ['tool_execution_seconds', durations.tool_execution],
  ] as const) {
    const total = phases.reduce((sum, phase) => sum + phase[metric], 0);
    if (!Number.isFinite(total) || Math.abs(total - number(expected, metric)) > TOLERANCE_SECONDS)
      throw new Error(`${metric} must reconcile with finalized run within 2 seconds`);
  }
  if (
    phases.reduce((sum, phase) => sum + phase.tool_call_count, 0) !==
    number(requireRecord(run.activity, 'activity').tool_call_count, 'tool_call_count', true)
  )
    throw new Error('tool_call_count must reconcile with finalized run');
  return {
    schema_version: 'commute-phase-profile.v1' as const,
    run_id: runId,
    model,
    reasoning_effort: effort,
    phases,
  };
}

export function summarizePhaseProfile(profile: ReturnType<typeof validatePhaseProfile>): string {
  const rows = profile.phases.map((phase) => [
    phase.phase,
    phase.active_seconds,
    phase.tool_execution_seconds,
    phase.active_seconds - phase.tool_execution_seconds,
    phase.retry_seconds,
    phase.work_units === 0 ? 'n/a' : phase.active_seconds / phase.work_units,
  ]);
  const totals = METRICS.map((metric) =>
    profile.phases.reduce((sum, phase) => sum + phase[metric], 0)
  );
  const active = totals[0]!;
  const tool = totals[1]!;
  const bundles = Math.max(...profile.phases.map((phase) => phase.work_units));
  rows.push([
    'Total',
    active,
    tool,
    active - tool,
    totals[3]!,
    bundles === 0 ? 'n/a' : active / bundles,
  ]);
  return [
    '| Phase | Active time | Tool time | Orchestration residual | Retry time | Seconds/bundle |',
    '| --- | ---: | ---: | ---: | ---: | ---: |',
    ...rows.map(
      (row) =>
        `| ${row.map((cell) => (typeof cell === 'number' ? cell.toFixed(2) : cell)).join(' | ')} |`
    ),
  ].join('\n');
}

export function includeFinalization(value: unknown, finalized: unknown) {
  const run = requireRecord(finalized, 'finalized run');
  if (run.finalization === undefined) return validatePhaseProfile(value, run);
  const measurement = requireRecord(run.finalization, 'finalization');
  const elapsed = number(measurement.tool_execution_seconds, 'finalization.tool_execution_seconds');
  const baseline = structuredClone(run);
  const durations = requireRecord(baseline.durations_seconds, 'durations_seconds');
  durations.strict_agent_active =
    number(durations.strict_agent_active, 'strict_agent_active') - elapsed;
  durations.tool_execution = number(durations.tool_execution, 'tool_execution') - elapsed;
  const activity = requireRecord(baseline.activity, 'activity');
  activity.tool_call_count = number(activity.tool_call_count, 'tool_call_count', true) - 1;
  requireRecord(baseline.phases, 'phases').terminal_completed_at =
    measurement.input_terminal_completed_at;
  const profile = validatePhaseProfile(value, baseline);
  const cleanup = profile.phases.find(({ phase }) => phase === 'cleanup_finalization')!;
  cleanup.completed_at = requireDateTime(measurement.completed_at, 'finalization.completed_at');
  cleanup.active_seconds += elapsed;
  cleanup.tool_execution_seconds += elapsed;
  cleanup.tool_call_count += 1;
  cleanup.work_units = number(requireRecord(run.workload, 'workload').bundles, 'bundles', true);
  return validatePhaseProfile(profile, run);
}

export async function phaseProfileFile(
  mode: 'record' | 'summary',
  input: string,
  finalized: string
) {
  await Promise.all([
    assertPrivateInputPath(input, 'profile'),
    assertPrivateInputPath(finalized, 'finalized run'),
  ]);
  const [profileText, runText] = await Promise.all([
    readFile(input, 'utf8'),
    readFile(finalized, 'utf8'),
  ]);
  const profile = (mode === 'record' ? includeFinalization : validatePhaseProfile)(
    JSON.parse(profileText),
    JSON.parse(runText)
  );
  if (
    path.resolve(finalized) !==
    path.resolve('.private/commute-performance', `${profile.run_id}.json`)
  )
    throw new Error('Use the canonical finalized run path');
  const output = path.join('.private/commute-performance', `${profile.run_id}-phase-profile.json`);
  if (mode === 'record') {
    await assertPrivateOutputPath(output, 'profile output', true);
    await writeFile(output, `${JSON.stringify(profile, null, 2)}\n`, { flag: 'wx' });
  }
  return summarizePhaseProfile(profile);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [mode, input, finalized, ...extra] = process.argv.slice(2);
  if ((mode !== 'record' && mode !== 'summary') || !input || !finalized || extra.length)
    throw new Error(
      'Usage: node dist/src/commute/phase-profile.js <record|summary> <private-profile.json> <finalized-run.json>'
    );
  process.stdout.write(`${await phaseProfileFile(mode, input, finalized)}\n`);
}
