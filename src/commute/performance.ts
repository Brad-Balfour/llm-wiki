import { createHash } from 'node:crypto';
import { lstat, mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { errorCode } from '../shared/errors.js';
import { parseJsonObject } from '../shared/json.js';
import { requireDateTime } from '../shared/time.js';
import { requireHttpUrl } from '../shared/url.js';
import {
  optionalString,
  rejectUnknownKeys,
  requireArray,
  requireEnum,
  requirePositiveInteger,
  requireRecord,
  requireString,
} from '../shared/validate.js';
import { githubState } from './github-state.js';

const INPUT_VERSION = 'commute-performance-input.v1';
const OUTPUT_VERSION = 'commute-performance-run.v1';
const RUN_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{0,127}$/;
const EFFORTS = ['low', 'medium', 'high', 'xhigh', 'max', 'ultra'] as const;
const REVIEW_KEYS = ['findings', 'fix_commits', 'failed_checks', 'rereview_cycles'] as const;
const QUALITY_KEYS = [
  'evidence_coverage_misses',
  'incorrect_durable_claims',
  'unresolved_items',
  'manual_corrections',
] as const;

interface Experiment {
  epoch: string;
  assigned_model: string;
  assigned_reasoning_effort: string;
  actual_model: string;
  actual_reasoning_effort: string;
  escalated: boolean;
  escalation_reason?: string;
  representative: boolean;
  exclusion_reason?: string;
}

interface ActivityInput {
  busy_adjusted_excluded_seconds: number;
  strict_agent_active_seconds: number;
  tool_call_count: number;
  tool_execution_seconds: number;
}

interface Intervention {
  reason: string;
  required: boolean;
  active_seconds: number;
}

interface CommonPhases {
  task_invoked_at: string;
  intake_validated_at: string;
  terminal_completed_at: string;
}

interface MergedPhases extends CommonPhases {
  pr_created_at: string;
  merge_authorized_at: string;
  merged_at: string;
  post_merge_completed_at: string;
}

interface MergedPublication {
  outcome: 'merged';
  pr_url: string;
  head_sha: string;
}

interface NoChangePublication {
  outcome: 'no_change';
}

interface PerformanceInput {
  schema_version: typeof INPUT_VERSION;
  run_id: string;
  experiment: Experiment;
  publication: MergedPublication | NoChangePublication;
  phases: MergedPhases | CommonPhases;
  activity: ActivityInput;
  interventions: Intervention[];
  review: Record<(typeof REVIEW_KEYS)[number], number>;
  quality: Record<(typeof QUALITY_KEYS)[number], number>;
}

interface FinalizeOptions {
  input: string;
  commuteRun: string;
  output: string;
}

interface FinalizeDependencies {
  githubState: typeof githubState;
  now: () => Date;
}

const defaultDependencies: FinalizeDependencies = { githubState, now: () => new Date() };

export async function finalizeCommutePerformance(
  options: FinalizeOptions,
  dependencyOverrides: Partial<FinalizeDependencies> = {}
) {
  const dependencies = { ...defaultDependencies, ...dependencyOverrides };
  const finalizedAt = dependencies.now().toISOString();
  await Promise.all([
    assertPrivateInputPath(options.input, '--input'),
    assertPrivateInputPath(options.commuteRun, '--commute-run'),
    assertPrivateOutputPath(options.output, '--output'),
  ]);
  const [inputText, commuteRunText] = await Promise.all([
    readFile(options.input, 'utf8'),
    readFile(options.commuteRun, 'utf8'),
  ]);
  const input = validatePerformanceInput(parseJsonObject(inputText, options.input));
  const commuteRun = validateCommuteRun(parseJsonObject(commuteRunText, options.commuteRun));
  assertCanonicalOutputPath(options.output, input.run_id);
  rejectFutureLifecyclePhases(input.phases, finalizedAt);
  validateCommuteRunEnvelope(commuteRun.phases, input.phases);
  if (input.quality.unresolved_items !== commuteRun.unresolved_items.length)
    throw new Error(
      `quality.unresolved_items must equal commute run unresolved_items length (${commuteRun.unresolved_items.length})`
    );

  const durations = deriveDurations(input);
  const userAttentionSeconds = sumUserAttention(input.interventions);
  if (userAttentionSeconds > durations.gross_lifecycle)
    throw new Error('summed intervention active_seconds cannot exceed gross lifecycle duration');

  if (input.publication.outcome === 'merged') {
    const identity = parsePullRequestUrl(input.publication.pr_url);
    const state = await dependencies.githubState(identity.repository, identity.number);
    validateAuthoritativePublication(
      state,
      input.publication,
      input.phases as MergedPhases,
      identity.number
    );
  }

  const result = {
    schema_version: OUTPUT_VERSION,
    finalized_at: finalizedAt,
    run_id: input.run_id,
    experiment: input.experiment,
    publication: input.publication,
    phases: input.phases,
    durations_seconds: durations,
    activity: {
      tool_call_count: input.activity.tool_call_count,
      interventions: input.interventions,
      intervention_count: input.interventions.length,
      required_intervention_count: input.interventions.filter(({ required }) => required).length,
      user_attention_seconds: userAttentionSeconds,
    },
    review: input.review,
    quality: input.quality,
    orchestration: {
      schema_version: commuteRun.schema_version,
      source_path: path.relative('.', options.commuteRun),
      sha256: `sha256:${createHash('sha256').update(commuteRunText).digest('hex')}`,
    },
  };
  await assertPrivateOutputPath(options.output, '--output', true);
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
  if (input.schema_version !== INPUT_VERSION)
    throw new Error(`input.schema_version must be ${INPUT_VERSION}`);
  const publication = validatePublication(input.publication);
  return {
    schema_version: INPUT_VERSION,
    run_id: requireRunId(input.run_id),
    experiment: validateExperiment(input.experiment),
    publication,
    phases: validatePhases(input.phases, publication.outcome),
    activity: validateActivity(input.activity),
    interventions: requireArray(input.interventions, 'interventions').map((entry, index) =>
      validateIntervention(entry, index)
    ),
    review: countRecord(requireRecord(input.review, 'review'), 'review', REVIEW_KEYS),
    quality: countRecord(requireRecord(input.quality, 'quality'), 'quality', QUALITY_KEYS),
  };
}

function validateExperiment(value: unknown): Experiment {
  const record = requireRecord(value, 'experiment');
  rejectUnknownKeys(
    record,
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
  const escalated = requireBoolean(record.escalated, 'experiment.escalated');
  const representative = requireBoolean(record.representative, 'experiment.representative');
  const escalationReason = optionalString(record.escalation_reason, 'experiment.escalation_reason');
  const exclusionReason = optionalString(record.exclusion_reason, 'experiment.exclusion_reason');
  if (escalated !== (escalationReason !== undefined))
    throw new Error('experiment.escalation_reason is required exactly when escalated is true');
  if (representative === (exclusionReason !== undefined))
    throw new Error('experiment.exclusion_reason is required exactly when representative is false');
  const assignedModel = requireString(record.assigned_model, 'experiment.assigned_model');
  const assignedEffort = requireEnum(
    record.assigned_reasoning_effort,
    EFFORTS,
    'experiment.assigned_reasoning_effort'
  );
  const actualModel = requireString(record.actual_model, 'experiment.actual_model');
  const actualEffort = requireEnum(
    record.actual_reasoning_effort,
    EFFORTS,
    'experiment.actual_reasoning_effort'
  );
  if ((assignedModel !== actualModel || assignedEffort !== actualEffort) && !escalated)
    throw new Error('experiment model or effort mismatch requires escalated=true and a reason');
  return {
    epoch: requireString(record.epoch, 'experiment.epoch'),
    assigned_model: assignedModel,
    assigned_reasoning_effort: assignedEffort,
    actual_model: actualModel,
    actual_reasoning_effort: actualEffort,
    escalated,
    ...(escalationReason === undefined ? {} : { escalation_reason: escalationReason }),
    representative,
    ...(exclusionReason === undefined ? {} : { exclusion_reason: exclusionReason }),
  };
}

function validatePublication(value: unknown): MergedPublication | NoChangePublication {
  const record = requireRecord(value, 'publication');
  const outcome = requireEnum(
    record.outcome,
    ['merged', 'no_change'] as const,
    'publication.outcome'
  );
  if (outcome === 'no_change') {
    rejectUnknownKeys(record, ['outcome'], 'publication');
    return { outcome };
  }
  rejectUnknownKeys(record, ['outcome', 'pr_url', 'head_sha'], 'publication');
  return {
    outcome,
    pr_url: parsePullRequestUrl(record.pr_url).url,
    head_sha: requireSha(record.head_sha, 'publication.head_sha'),
  };
}

function validatePhases(
  value: unknown,
  outcome: MergedPublication['outcome'] | NoChangePublication['outcome']
): MergedPhases | CommonPhases {
  const record = requireRecord(value, 'phases');
  const common = {
    task_invoked_at: utcTimestamp(record.task_invoked_at, 'phases.task_invoked_at'),
    intake_validated_at: utcTimestamp(record.intake_validated_at, 'phases.intake_validated_at'),
    terminal_completed_at: utcTimestamp(
      record.terminal_completed_at,
      'phases.terminal_completed_at'
    ),
  };
  if (outcome === 'no_change') {
    rejectUnknownKeys(
      record,
      ['task_invoked_at', 'intake_validated_at', 'terminal_completed_at'],
      'phases'
    );
    return common;
  }
  rejectUnknownKeys(
    record,
    [
      'task_invoked_at',
      'intake_validated_at',
      'pr_created_at',
      'merge_authorized_at',
      'merged_at',
      'post_merge_completed_at',
      'terminal_completed_at',
    ],
    'phases'
  );
  return {
    ...common,
    pr_created_at: utcTimestamp(record.pr_created_at, 'phases.pr_created_at'),
    merge_authorized_at: utcTimestamp(record.merge_authorized_at, 'phases.merge_authorized_at'),
    merged_at: utcTimestamp(record.merged_at, 'phases.merged_at'),
    post_merge_completed_at: utcTimestamp(
      record.post_merge_completed_at,
      'phases.post_merge_completed_at'
    ),
  };
}

function validateActivity(value: unknown): ActivityInput {
  const record = requireRecord(value, 'activity');
  rejectUnknownKeys(
    record,
    [
      'busy_adjusted_excluded_seconds',
      'strict_agent_active_seconds',
      'tool_call_count',
      'tool_execution_seconds',
    ],
    'activity'
  );
  return {
    busy_adjusted_excluded_seconds: requireNonNegativeNumber(
      record.busy_adjusted_excluded_seconds,
      'activity.busy_adjusted_excluded_seconds'
    ),
    strict_agent_active_seconds: requireNonNegativeNumber(
      record.strict_agent_active_seconds,
      'activity.strict_agent_active_seconds'
    ),
    tool_call_count: requireNonNegativeInteger(record.tool_call_count, 'activity.tool_call_count'),
    tool_execution_seconds: requireNonNegativeNumber(
      record.tool_execution_seconds,
      'activity.tool_execution_seconds'
    ),
  };
}

function validateIntervention(value: unknown, index: number): Intervention {
  const field = `interventions[${index}]`;
  const record = requireRecord(value, field);
  rejectUnknownKeys(record, ['reason', 'required', 'active_seconds'], field);
  return {
    reason: requireString(record.reason, `${field}.reason`),
    required: requireBoolean(record.required, `${field}.required`),
    active_seconds: requireNonNegativeNumber(record.active_seconds, `${field}.active_seconds`),
  };
}

interface ValidatedCommuteRun {
  schema_version: 'commute-run.v1';
  phases: CommuteRunPhases;
  unresolved_items: unknown[];
}

interface CommuteRunPhases {
  intake_started_at: string;
  preflight_completed_at: string;
  github_state_completed_at: string;
  command_completed_at: string;
}

function validateCommuteRun(value: unknown): ValidatedCommuteRun {
  const run = requireRecord(value, 'commute run');
  rejectUnknownKeys(
    run,
    ['schema_version', 'result', 'phases', 'preflight', 'github', 'unresolved_items'],
    'commute run'
  );
  if (run.schema_version !== 'commute-run.v1')
    throw new Error('commute run.schema_version must be commute-run.v1');
  if (run.result !== 'completed') throw new Error('commute run.result must be completed');
  const phases = validateCommuteRunPhases(run.phases);
  validatePreflight(run.preflight);
  validateGithubResult(run.github);
  return {
    schema_version: 'commute-run.v1',
    phases,
    unresolved_items: requireArray(run.unresolved_items, 'commute run.unresolved_items'),
  };
}

function validateCommuteRunPhases(value: unknown): CommuteRunPhases {
  const record = requireRecord(value, 'commute run.phases');
  const keys = [
    'intake_started_at',
    'preflight_completed_at',
    'github_state_completed_at',
    'command_completed_at',
  ] as const;
  rejectUnknownKeys(record, keys, 'commute run.phases');
  const phases = Object.fromEntries(
    keys.map((key) => [key, utcTimestamp(record[key], `commute run.phases.${key}`)])
  ) as unknown as CommuteRunPhases;
  validateOrderedTimestamps(keys.map((key) => [key, phases[key]]));
  return phases;
}

function validatePreflight(value: unknown): void {
  const preflight = requireRecord(value, 'commute run.preflight');
  rejectUnknownKeys(
    preflight,
    [
      'schema_version',
      'generated_at',
      'phases',
      'inventory',
      'intake',
      'conversation_coverage',
      'queue_comparisons',
    ],
    'commute run.preflight'
  );
  if (preflight.schema_version !== 'commute-preflight.v1')
    throw new Error('commute run.preflight.schema_version must be commute-preflight.v1');
  utcTimestamp(preflight.generated_at, 'commute run.preflight.generated_at');
  const phases = requireRecord(preflight.phases, 'commute run.preflight.phases');
  rejectUnknownKeys(
    phases,
    ['intake_started_at', 'validation_completed_at'],
    'commute run.preflight.phases'
  );
  validateOrderedTimestamps([
    [
      'intake_started_at',
      utcTimestamp(phases.intake_started_at, 'commute run.preflight.phases.intake_started_at'),
    ],
    [
      'validation_completed_at',
      utcTimestamp(
        phases.validation_completed_at,
        'commute run.preflight.phases.validation_completed_at'
      ),
    ],
  ]);
  const inventory = requireRecord(preflight.inventory, 'commute run.preflight.inventory');
  const inventoryKeys = ['bundles', 'supplied_queues', 'shared_chat_references'] as const;
  rejectUnknownKeys(inventory, inventoryKeys, 'commute run.preflight.inventory');
  for (const key of inventoryKeys)
    requireArray(inventory[key], `commute run.preflight.inventory.${key}`);
  const intake = requireRecord(preflight.intake, 'commute run.preflight.intake');
  const intakeKeys = [
    'sessions',
    'maintenance_candidates',
    'feedback_events',
    'general_captures',
    'navigation_events',
    'event_conversions',
    'unresolved_captures',
    'quality_incidents',
  ] as const;
  rejectUnknownKeys(intake, intakeKeys, 'commute run.preflight.intake');
  for (const key of intakeKeys) requireArray(intake[key], `commute run.preflight.intake.${key}`);
  requireArray(preflight.conversation_coverage, 'commute run.preflight.conversation_coverage');
  requireArray(preflight.queue_comparisons, 'commute run.preflight.queue_comparisons');
}

function validateGithubResult(value: unknown): void {
  const record = requireRecord(value, 'commute run.github');
  const outcome = requireEnum(
    record.outcome,
    ['not_requested', 'snapshot', 'state_changed', 'timeout', 'error'] as const,
    'commute run.github.outcome'
  );
  if (outcome === 'not_requested') {
    rejectUnknownKeys(record, ['outcome'], 'commute run.github');
  } else if (outcome === 'error') {
    rejectUnknownKeys(record, ['outcome', 'error'], 'commute run.github');
    requireString(record.error, 'commute run.github.error');
  } else if (outcome === 'snapshot') {
    rejectUnknownKeys(record, ['outcome', 'state'], 'commute run.github');
    requireRecord(record.state, 'commute run.github.state');
  } else {
    rejectUnknownKeys(record, ['outcome', 'state', 'observations'], 'commute run.github');
    requireRecord(record.state, 'commute run.github.state');
    requirePositiveInteger(record.observations, 'commute run.github.observations');
  }
}

function deriveDurations(input: PerformanceInput) {
  const common = commonTimestamps(input.phases);
  const gross = secondsBetween(common.task_invoked_at, common.terminal_completed_at);
  const busyAdjusted = gross - input.activity.busy_adjusted_excluded_seconds;
  if (busyAdjusted < 0)
    throw new Error('activity.busy_adjusted_excluded_seconds cannot exceed gross duration');
  if (input.activity.strict_agent_active_seconds > busyAdjusted)
    throw new Error('activity.strict_agent_active_seconds cannot exceed busy-adjusted duration');
  if (input.activity.tool_execution_seconds > input.activity.strict_agent_active_seconds)
    throw new Error('activity.tool_execution_seconds cannot exceed strict agent-active duration');
  const base = {
    gross_lifecycle: gross,
    busy_adjusted_lifecycle: busyAdjusted,
    strict_agent_active: input.activity.strict_agent_active_seconds,
    tool_execution: input.activity.tool_execution_seconds,
    agent_orchestration:
      input.activity.strict_agent_active_seconds - input.activity.tool_execution_seconds,
  };
  if (input.publication.outcome === 'no_change')
    return {
      ...base,
      pre_pr: null,
      pr_to_merge: null,
      post_merge: null,
      merge_authorization_wait: null,
    };

  const phases = input.phases as MergedPhases;
  validateOrderedTimestamps([
    ['task_invoked_at', phases.task_invoked_at],
    ['intake_validated_at', phases.intake_validated_at],
    ['pr_created_at', phases.pr_created_at],
    ['merged_at', phases.merged_at],
    ['post_merge_completed_at', phases.post_merge_completed_at],
    ['terminal_completed_at', phases.terminal_completed_at],
  ]);
  const prCreated = timestamp(phases.pr_created_at, 'phases.pr_created_at');
  const authorized = timestamp(phases.merge_authorized_at, 'phases.merge_authorized_at');
  const merged = timestamp(phases.merged_at, 'phases.merged_at');
  const postMerge = timestamp(phases.post_merge_completed_at, 'phases.post_merge_completed_at');
  if (authorized < common.task_invoked_at)
    throw new Error('merge_authorized_at must not precede task_invoked_at');
  if (authorized > merged) throw new Error('merge_authorized_at must not follow merged_at');
  if (
    authorized > common.task_invoked_at &&
    !input.interventions.some((intervention) => intervention.required)
  )
    throw new Error(
      'merge authorization after task invocation requires at least one required intervention'
    );
  return {
    ...base,
    pre_pr: secondsBetween(common.task_invoked_at, prCreated),
    pr_to_merge: secondsBetween(prCreated, merged),
    post_merge: secondsBetween(merged, postMerge),
    merge_authorization_wait: Math.max(0, secondsBetween(prCreated, authorized)),
  };
}

function rejectFutureLifecyclePhases(
  phases: MergedPhases | CommonPhases,
  finalizedAt: string
): void {
  const finalizedMilliseconds = timestamp(finalizedAt, 'finalized_at');
  const future = Object.entries(phases)
    .filter(([name, value]) => timestamp(value, `phases.${name}`) > finalizedMilliseconds)
    .map(([name]) => `phases.${name}`);
  if (future.length > 0)
    throw new Error(`lifecycle phases later than finalized_at: ${future.join(', ')}`);
}

function validateCommuteRunEnvelope(
  commutePhases: CommuteRunPhases,
  performancePhases: MergedPhases | CommonPhases
): void {
  const start = timestamp(performancePhases.task_invoked_at, 'phases.task_invoked_at');
  const end = timestamp(performancePhases.terminal_completed_at, 'phases.terminal_completed_at');
  const outside = Object.entries(commutePhases)
    .filter(([name, value]) => {
      const measured = timestamp(value, `commute run.phases.${name}`);
      return measured < start || measured > end;
    })
    .map(([name]) => `commute run.phases.${name}`);
  if (outside.length > 0)
    throw new Error(`commute run phases outside performance lifecycle: ${outside.join(', ')}`);
}

function commonTimestamps(phases: CommonPhases) {
  validateOrderedTimestamps([
    ['task_invoked_at', phases.task_invoked_at],
    ['intake_validated_at', phases.intake_validated_at],
    ['terminal_completed_at', phases.terminal_completed_at],
  ]);
  return {
    task_invoked_at: timestamp(phases.task_invoked_at, 'phases.task_invoked_at'),
    terminal_completed_at: timestamp(phases.terminal_completed_at, 'phases.terminal_completed_at'),
  };
}

function validateOrderedTimestamps(entries: ReadonlyArray<readonly [string, string]>): void {
  for (let index = 1; index < entries.length; index += 1) {
    const current = entries[index]!;
    const previous = entries[index - 1]!;
    if (timestamp(current[1], current[0]) < timestamp(previous[1], previous[0]))
      throw new Error(`${current[0]} must not precede ${previous[0]}`);
  }
}

function validateAuthoritativePublication(
  value: unknown,
  publication: MergedPublication,
  phases: MergedPhases,
  expectedNumber: number
): void {
  const root = requireRecord(value, 'GitHub state');
  const data = requireRecord(root.data, 'GitHub state.data');
  const repository = requireRecord(data.repository, 'GitHub state.data.repository');
  const pullRequest = requireRecord(
    repository.pullRequest,
    'GitHub state.data.repository.pullRequest'
  );
  if (pullRequest.number !== expectedNumber)
    throw new Error('publication PR number does not match authoritative GitHub state');
  if (pullRequest.url !== publication.pr_url)
    throw new Error('publication.pr_url does not match authoritative GitHub state');
  if (pullRequest.headRefOid !== publication.head_sha)
    throw new Error('publication.head_sha does not match authoritative GitHub state');
  if (pullRequest.state !== 'MERGED' || pullRequest.mergedAt === null)
    throw new Error('publication pull request must be merged in authoritative GitHub state');
  const createdAt = utcTimestamp(
    pullRequest.createdAt,
    'GitHub state.data.repository.pullRequest.createdAt'
  );
  if (Date.parse(createdAt) !== Date.parse(phases.pr_created_at))
    throw new Error('phases.pr_created_at does not match authoritative GitHub state');
  const mergedAt = utcTimestamp(
    pullRequest.mergedAt,
    'GitHub state.data.repository.pullRequest.mergedAt'
  );
  if (Date.parse(mergedAt) !== Date.parse(phases.merged_at))
    throw new Error('phases.merged_at does not match authoritative GitHub state');
}

interface PullRequestIdentity {
  url: string;
  repository: string;
  number: number;
}

function parsePullRequestUrl(value: unknown): PullRequestIdentity {
  const url = requireHttpUrl(value, 'publication.pr_url', {
    exactSpelling: true,
    httpsOnly: true,
    rejectCredentials: true,
  });
  const parsed = new URL(url);
  const match = /^\/([^/]+)\/([^/]+)\/pull\/([1-9]\d*)$/.exec(parsed.pathname);
  if (
    parsed.hostname !== 'github.com' ||
    match === null ||
    parsed.search !== '' ||
    parsed.hash !== ''
  )
    throw new Error('publication.pr_url must contain a positive canonical GitHub PR number');
  const number = Number(match[3]);
  if (!Number.isSafeInteger(number))
    throw new Error('publication.pr_url must contain a positive canonical GitHub PR number');
  return { url, repository: `${match[1]}/${match[2]}`, number };
}

function requireSha(value: unknown, field: string): string {
  const result = requireString(value, field);
  if (!/^[0-9a-f]{40}$/.test(result))
    throw new Error(`${field} must be a 40-character lowercase commit SHA`);
  return result;
}

function requireRunId(value: unknown): string {
  const result = requireString(value, 'run_id');
  if (!RUN_ID_PATTERN.test(result))
    throw new Error('run_id must contain only lowercase letters, digits, underscores, or hyphens');
  return result;
}

function requireBoolean(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean') throw new Error(`${field} must be a boolean`);
  return value;
}

function requireNonNegativeNumber(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0)
    throw new Error(`${field} must be a non-negative finite number`);
  return value;
}

function requireNonNegativeInteger(value: unknown, field: string): number {
  const result = requireNonNegativeNumber(value, field);
  if (!Number.isSafeInteger(result)) throw new Error(`${field} must be a safe integer`);
  return result;
}

function utcTimestamp(value: unknown, field: string): string {
  const result = requireDateTime(value, field);
  if (!result.endsWith('Z')) throw new Error(`${field} must be an ISO 8601 UTC timestamp`);
  return result;
}

function timestamp(value: string, field: string): number {
  return Date.parse(utcTimestamp(value, field));
}

function secondsBetween(start: number, end: number): number {
  return (end - start) / 1_000;
}

function countRecord<T extends string>(
  record: Record<string, unknown>,
  field: string,
  keys: readonly T[]
): Record<T, number> {
  rejectUnknownKeys(record, keys, field);
  return Object.fromEntries(
    keys.map((key) => [key, requireNonNegativeInteger(record[key], `${field}.${key}`)])
  ) as Record<T, number>;
}

function sumUserAttention(interventions: Intervention[]): number {
  let total = 0;
  for (const intervention of interventions) {
    const next = total + intervention.active_seconds;
    if (!Number.isFinite(next)) throw new Error('summed intervention active_seconds overflowed');
    total = next;
  }
  return total;
}

function isWithin(root: string, candidate: string): boolean {
  return candidate === root || candidate.startsWith(`${root}${path.sep}`);
}

async function privateRoot(): Promise<string> {
  const lexical = path.resolve('.private');
  await mkdir(lexical, { recursive: true });
  const physical = await realpath(lexical);
  if (physical !== lexical) throw new Error('.private must not be a symbolic link');
  return physical;
}

async function assertPrivateInputPath(filename: string, flag: string): Promise<void> {
  const root = await privateRoot();
  const lexical = path.resolve(filename);
  if (!isWithin(root, lexical))
    throw new Error(`${flag} must be inside the gitignored .private directory`);
  const physical = await realpath(lexical);
  if (!isWithin(root, physical))
    throw new Error(`${flag} must not resolve outside the gitignored .private directory`);
}

async function assertPrivateOutputPath(
  filename: string,
  flag: string,
  createParent = false
): Promise<void> {
  const root = await privateRoot();
  const lexical = path.resolve(filename);
  if (!isWithin(root, lexical) || lexical === root)
    throw new Error(`${flag} must be inside the gitignored .private directory`);
  const parent = path.dirname(lexical);
  const ancestor = await nearestExistingAncestor(parent);
  const physicalAncestor = await realpath(ancestor);
  if (!isWithin(root, physicalAncestor))
    throw new Error(`${flag} parent must not resolve outside the gitignored .private directory`);
  if (createParent) await mkdir(parent, { recursive: true });
  if (await exists(parent)) {
    const physicalParent = await realpath(parent);
    if (!isWithin(root, physicalParent))
      throw new Error(`${flag} parent must not resolve outside the gitignored .private directory`);
  }
  if (await exists(lexical)) {
    const physicalTarget = await realpath(lexical);
    if (!isWithin(root, physicalTarget))
      throw new Error(`${flag} must not resolve outside the gitignored .private directory`);
  }
}

function assertCanonicalOutputPath(filename: string, runId: string): void {
  const expected = path.resolve('.private', 'commute-performance', `${runId}.json`);
  if (path.resolve(filename) !== expected)
    throw new Error(`--output must be .private/commute-performance/${runId}.json`);
}

async function nearestExistingAncestor(filename: string): Promise<string> {
  let current = filename;
  while (!(await exists(current))) {
    const parent = path.dirname(current);
    if (parent === current) return current;
    current = parent;
  }
  return current;
}

async function exists(filename: string): Promise<boolean> {
  try {
    await lstat(filename);
    return true;
  } catch (error) {
    if (errorCode(error) === 'ENOENT') return false;
    throw error;
  }
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
