import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseJsonObject } from '../shared/json.js';
import { requireDateTime } from '../shared/time.js';
import { requireHttpUrl } from '../shared/url.js';
import {
  optionalString,
  rejectUnknownKeys,
  requireArray,
  requireEnum,
  requireRecord,
  requireString,
} from '../shared/validate.js';

const INPUT_SCHEMA_VERSION = 'commute-performance-input.v1';
const OUTPUT_SCHEMA_VERSION = 'commute-performance-run.v1';
const REASONING_EFFORTS = ['low', 'medium', 'high', 'xhigh', 'max', 'ultra'] as const;

interface PerformanceInput {
  schema_version: typeof INPUT_SCHEMA_VERSION;
  run_id: string;
  experiment: {
    epoch: string;
    assigned_model: string;
    assigned_reasoning_effort: string;
    actual_model: string;
    actual_reasoning_effort: string;
    escalated: boolean;
    escalation_reason?: string;
    representative: boolean;
    exclusion_reason?: string;
  };
  publication: {
    pr_url: string;
    head_sha: string;
  };
  phases: {
    task_invoked_at: string;
    intake_validated_at: string;
    pr_created_at: string;
    merge_authorized_at: string;
    merged_at: string;
    post_merge_completed_at: string;
  };
  activity: {
    busy_adjusted_excluded_seconds: number;
    strict_agent_active_seconds: number;
    tool_call_count: number;
    tool_execution_seconds: number;
  };
  interventions: Array<{
    reason: string;
    required: boolean;
    active_seconds: number;
  }>;
  review: {
    findings: number;
    fix_commits: number;
    failed_checks: number;
    rereview_cycles: number;
  };
  quality: {
    evidence_coverage_misses: number;
    incorrect_durable_claims: number;
    unresolved_items: number;
    manual_corrections: number;
  };
}

interface FinalizeOptions {
  input: string;
  commuteRun: string;
  output: string;
}

export async function finalizeCommutePerformance(options: FinalizeOptions) {
  assertPrivatePath(options.input, '--input');
  assertPrivatePath(options.commuteRun, '--commute-run');
  assertPrivatePath(options.output, '--output');
  const [inputText, commuteRunText] = await Promise.all([
    readFile(options.input, 'utf8'),
    readFile(options.commuteRun, 'utf8'),
  ]);
  const input = validatePerformanceInput(parseJsonObject(inputText, options.input));
  const commuteRun = validateCommuteRun(parseJsonObject(commuteRunText, options.commuteRun));
  const timestamps = validatePhaseOrder(input.phases);
  const grossSeconds = secondsBetween(
    timestamps.task_invoked_at,
    timestamps.post_merge_completed_at
  );
  const busyAdjustedSeconds = grossSeconds - input.activity.busy_adjusted_excluded_seconds;
  if (busyAdjustedSeconds < 0)
    throw new Error('activity.busy_adjusted_excluded_seconds cannot exceed gross duration');
  if (input.activity.strict_agent_active_seconds > busyAdjustedSeconds)
    throw new Error('activity.strict_agent_active_seconds cannot exceed busy-adjusted duration');
  if (input.activity.tool_execution_seconds > input.activity.strict_agent_active_seconds)
    throw new Error('activity.tool_execution_seconds cannot exceed strict agent-active duration');

  const result = {
    schema_version: OUTPUT_SCHEMA_VERSION,
    finalized_at: new Date().toISOString(),
    run_id: input.run_id,
    experiment: input.experiment,
    publication: input.publication,
    phases: input.phases,
    durations_seconds: {
      gross_lifecycle: grossSeconds,
      busy_adjusted_lifecycle: busyAdjustedSeconds,
      strict_agent_active: input.activity.strict_agent_active_seconds,
      pre_pr: secondsBetween(timestamps.task_invoked_at, timestamps.pr_created_at),
      pr_to_merge: secondsBetween(timestamps.pr_created_at, timestamps.merged_at),
      post_merge: secondsBetween(timestamps.merged_at, timestamps.post_merge_completed_at),
      merge_authorization_wait: Math.max(
        0,
        secondsBetween(timestamps.pr_created_at, timestamps.merge_authorized_at)
      ),
      tool_execution: input.activity.tool_execution_seconds,
      agent_orchestration:
        input.activity.strict_agent_active_seconds - input.activity.tool_execution_seconds,
    },
    activity: {
      tool_call_count: input.activity.tool_call_count,
      interventions: input.interventions,
      intervention_count: input.interventions.length,
      required_intervention_count: input.interventions.filter(({ required }) => required).length,
      user_attention_seconds: input.interventions.reduce(
        (total, intervention) => total + intervention.active_seconds,
        0
      ),
    },
    review: input.review,
    quality: input.quality,
    orchestration: {
      schema_version: commuteRun.schema_version,
      source_path: path.relative('.', options.commuteRun),
      sha256: `sha256:${createHash('sha256').update(commuteRunText).digest('hex')}`,
    },
  };
  await mkdir(path.dirname(options.output), { recursive: true });
  await writeFile(options.output, `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' });
  return { ...result, output: options.output };
}

function validatePerformanceInput(value: unknown): PerformanceInput {
  const input = requireRecord(value, 'input');
  rejectUnknownKeys(
    input,
    [
      'schema_version',
      'run_id',
      'experiment',
      'publication',
      'phases',
      'activity',
      'interventions',
      'review',
      'quality',
    ],
    'input'
  );
  if (input.schema_version !== INPUT_SCHEMA_VERSION)
    throw new Error(`input.schema_version must be ${INPUT_SCHEMA_VERSION}`);
  const experiment = requireRecord(input.experiment, 'experiment');
  rejectUnknownKeys(
    experiment,
    [
      'epoch',
      'assigned_model',
      'assigned_reasoning_effort',
      'actual_model',
      'actual_reasoning_effort',
      'escalated',
      'escalation_reason',
      'representative',
      'exclusion_reason',
    ],
    'experiment'
  );
  const publication = requireRecord(input.publication, 'publication');
  rejectUnknownKeys(publication, ['pr_url', 'head_sha'], 'publication');
  const phases = requireRecord(input.phases, 'phases');
  rejectUnknownKeys(
    phases,
    [
      'task_invoked_at',
      'intake_validated_at',
      'pr_created_at',
      'merge_authorized_at',
      'merged_at',
      'post_merge_completed_at',
    ],
    'phases'
  );
  const activity = requireRecord(input.activity, 'activity');
  rejectUnknownKeys(
    activity,
    [
      'busy_adjusted_excluded_seconds',
      'strict_agent_active_seconds',
      'tool_call_count',
      'tool_execution_seconds',
    ],
    'activity'
  );
  const review = requireRecord(input.review, 'review');
  const quality = requireRecord(input.quality, 'quality');
  const escalated = boolean(experiment.escalated, 'experiment.escalated');
  const representative = boolean(experiment.representative, 'experiment.representative');
  const escalationReason = optionalString(
    experiment.escalation_reason,
    'experiment.escalation_reason'
  );
  const exclusionReason = optionalString(
    experiment.exclusion_reason,
    'experiment.exclusion_reason'
  );
  if (escalated !== (escalationReason !== undefined))
    throw new Error('experiment.escalation_reason is required exactly when escalated is true');
  if (representative === (exclusionReason !== undefined))
    throw new Error('experiment.exclusion_reason is required exactly when representative is false');
  const assignedEffort = requireEnum(
    experiment.assigned_reasoning_effort,
    REASONING_EFFORTS,
    'experiment.assigned_reasoning_effort'
  );
  const actualEffort = requireEnum(
    experiment.actual_reasoning_effort,
    REASONING_EFFORTS,
    'experiment.actual_reasoning_effort'
  );
  const interventionsValue = requireArray(input.interventions, 'interventions');

  return {
    schema_version: INPUT_SCHEMA_VERSION,
    run_id: requireString(input.run_id, 'run_id'),
    experiment: {
      epoch: requireString(experiment.epoch, 'experiment.epoch'),
      assigned_model: requireString(experiment.assigned_model, 'experiment.assigned_model'),
      assigned_reasoning_effort: assignedEffort,
      actual_model: requireString(experiment.actual_model, 'experiment.actual_model'),
      actual_reasoning_effort: actualEffort,
      escalated,
      ...(escalationReason === undefined ? {} : { escalation_reason: escalationReason }),
      representative,
      ...(exclusionReason === undefined ? {} : { exclusion_reason: exclusionReason }),
    },
    publication: {
      pr_url: pullRequestUrl(publication.pr_url),
      head_sha: sha(publication.head_sha),
    },
    phases: {
      task_invoked_at: utcTimestamp(phases.task_invoked_at, 'phases.task_invoked_at'),
      intake_validated_at: utcTimestamp(phases.intake_validated_at, 'phases.intake_validated_at'),
      pr_created_at: utcTimestamp(phases.pr_created_at, 'phases.pr_created_at'),
      merge_authorized_at: utcTimestamp(phases.merge_authorized_at, 'phases.merge_authorized_at'),
      merged_at: utcTimestamp(phases.merged_at, 'phases.merged_at'),
      post_merge_completed_at: utcTimestamp(
        phases.post_merge_completed_at,
        'phases.post_merge_completed_at'
      ),
    },
    activity: {
      busy_adjusted_excluded_seconds: nonNegativeNumber(
        activity.busy_adjusted_excluded_seconds,
        'activity.busy_adjusted_excluded_seconds'
      ),
      strict_agent_active_seconds: nonNegativeNumber(
        activity.strict_agent_active_seconds,
        'activity.strict_agent_active_seconds'
      ),
      tool_call_count: nonNegativeInteger(activity.tool_call_count, 'activity.tool_call_count'),
      tool_execution_seconds: nonNegativeNumber(
        activity.tool_execution_seconds,
        'activity.tool_execution_seconds'
      ),
    },
    interventions: interventionsValue.map((entry, index) => {
      const field = `interventions[${index}]`;
      const intervention = requireRecord(entry, field);
      rejectUnknownKeys(intervention, ['reason', 'required', 'active_seconds'], field);
      return {
        reason: requireString(intervention.reason, `${field}.reason`),
        required: boolean(intervention.required, `interventions[${index}].required`),
        active_seconds: nonNegativeNumber(
          intervention.active_seconds,
          `interventions[${index}].active_seconds`
        ),
      };
    }),
    review: countRecord(review, 'review', [
      'findings',
      'fix_commits',
      'failed_checks',
      'rereview_cycles',
    ]),
    quality: countRecord(quality, 'quality', [
      'evidence_coverage_misses',
      'incorrect_durable_claims',
      'unresolved_items',
      'manual_corrections',
    ]),
  };
}

function validateCommuteRun(value: unknown): { schema_version: 'commute-run.v1' } {
  const commuteRun = requireRecord(value, 'commute run');
  rejectUnknownKeys(
    commuteRun,
    ['schema_version', 'result', 'phases', 'preflight', 'github', 'unresolved_items'],
    'commute run'
  );
  if (commuteRun.schema_version !== 'commute-run.v1')
    throw new Error('commute run schema_version must be commute-run.v1');
  return { schema_version: 'commute-run.v1' };
}

function validatePhaseOrder(phases: PerformanceInput['phases']) {
  const timestamps = Object.fromEntries(
    Object.entries(phases).map(([name, value]) => [name, timestamp(value, name)])
  ) as Record<keyof PerformanceInput['phases'], number>;
  const lifecycle = [
    'task_invoked_at',
    'intake_validated_at',
    'pr_created_at',
    'merged_at',
    'post_merge_completed_at',
  ] as const;
  for (let index = 1; index < lifecycle.length; index += 1) {
    const current = lifecycle[index]!;
    const previous = lifecycle[index - 1]!;
    if (timestamps[current] < timestamps[previous])
      throw new Error(`${current} must not precede ${previous}`);
  }
  if (timestamps.merge_authorized_at < timestamps.task_invoked_at)
    throw new Error('merge_authorized_at must not precede task_invoked_at');
  if (timestamps.merge_authorized_at > timestamps.merged_at)
    throw new Error('merge_authorized_at must not follow merged_at');
  return timestamps;
}

function countRecord<T extends string>(
  record: Record<string, unknown>,
  label: string,
  keys: readonly T[]
): Record<T, number> {
  rejectUnknownKeys(record, keys, label);
  return Object.fromEntries(
    keys.map((key) => [key, nonNegativeInteger(record[key], `${label}.${key}`)])
  ) as Record<T, number>;
}

function boolean(value: unknown, label: string): boolean {
  if (typeof value !== 'boolean') throw new Error(`${label} must be a boolean`);
  return value;
}

function nonNegativeNumber(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0)
    throw new Error(`${label} must be a non-negative finite number`);
  return value;
}

function nonNegativeInteger(value: unknown, label: string): number {
  const number = nonNegativeNumber(value, label);
  if (!Number.isInteger(number)) throw new Error(`${label} must be an integer`);
  return number;
}

function pullRequestUrl(value: unknown): string {
  const url = requireHttpUrl(value, 'publication.pr_url', {
    exactSpelling: true,
    httpsOnly: true,
    rejectCredentials: true,
  });
  const parsed = new URL(url);
  if (
    parsed.hostname !== 'github.com' ||
    !/^\/[^/]+\/[^/]+\/pull\/\d+$/.test(parsed.pathname) ||
    parsed.search !== '' ||
    parsed.hash !== ''
  )
    throw new Error('publication.pr_url must be a GitHub pull request URL');
  return url;
}

function sha(value: unknown): string {
  const result = requireString(value, 'publication.head_sha');
  if (!/^[0-9a-f]{40}$/.test(result))
    throw new Error('publication.head_sha must be a 40-character lowercase commit SHA');
  return result;
}

function utcTimestamp(value: unknown, label: string): string {
  const result = requireDateTime(value, label);
  if (!result.endsWith('Z')) throw new Error(`${label} must be an ISO 8601 UTC timestamp`);
  return result;
}

function timestamp(value: string, label: string): number {
  return Date.parse(utcTimestamp(value, label));
}

function secondsBetween(start: number, end: number): number {
  return (end - start) / 1_000;
}

function assertPrivatePath(filename: string, flag: string): void {
  const privateRoot = path.resolve('.private');
  const resolved = path.resolve(filename);
  if (resolved !== privateRoot && !resolved.startsWith(`${privateRoot}${path.sep}`))
    throw new Error(`${flag} must be inside the gitignored .private directory`);
}

export function parsePerformanceOptions(args: string[]): FinalizeOptions {
  let input: string | undefined;
  let commuteRun: string | undefined;
  let output: string | undefined;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const value = args[index + 1];
    if (arg === '--input' && value) input = value;
    else if (arg === '--commute-run' && value) commuteRun = value;
    else if (arg === '--output' && value) output = value;
    else throw new Error(`Unknown or incomplete argument: ${arg ?? ''}`);
    index += 1;
  }
  if (!input || !commuteRun || !output)
    throw new Error(
      'Usage: finalize:commute-performance -- --input <private-input.json> --commute-run <private-commute-run.json> --output <private-metrics.json>'
    );
  return { input, commuteRun, output };
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))
) {
  const result = await finalizeCommutePerformance(parsePerformanceOptions(process.argv.slice(2)));
  process.stdout.write(
    `${result.durations_seconds.gross_lifecycle}s gross; ${result.activity.required_intervention_count} required intervention(s)\n`
  );
}
