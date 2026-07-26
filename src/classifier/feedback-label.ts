import { createHash } from 'node:crypto';
import { appendFile, mkdir, open, readFile, unlink, type FileHandle } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { queueSnapshotFingerprint, validateTldrCommuteQueueV2 } from '../commute/session-bundle.js';
import {
  deriveRouteFromClassification,
  ROUTE_VERSION,
  type CommuteBehavior,
} from '../routing/derive.js';
import {
  CONSUMPTION_DEPTHS,
  INTEREST_LEVELS,
  type ConsumptionDepth,
  type InterestLevel,
} from './types.js';

export const CLASSIFIER_FEEDBACK_LABEL_SCHEMA_VERSION = 'classifier-feedback-label.v1';
const CORRECTION_TYPES = ['interest', 'depth', 'route'] as const;
const COMMUTE_BEHAVIORS = [
  'none',
  'skip',
  'quick_read',
  'discuss',
  'optional_quick_read',
  'optional_discuss_or_teaser',
] as const;

export type ClassifierCorrectionType = (typeof CORRECTION_TYPES)[number];

export interface ClassifierFeedbackValues {
  interest_level: InterestLevel;
  consumption_depth: ConsumptionDepth;
  route: CommuteBehavior;
}

export interface OriginalClassifierFeedbackValues extends ClassifierFeedbackValues {
  interest_score: number;
  depth_score: number;
}

export interface ClassifierFeedbackLabelInput {
  schema_version: typeof CLASSIFIER_FEEDBACK_LABEL_SCHEMA_VERSION;
  queue_filename: string;
  source_item_id: string;
  title: string;
  url: string;
  correction_type: ClassifierCorrectionType;
  original: OriginalClassifierFeedbackValues;
  corrected: ClassifierFeedbackValues;
  reason: string;
  session_date: string;
  recorded_at: string;
  profile_version: string;
  prompt_version: string;
  provider: string;
  model: string;
  route_version: typeof ROUTE_VERSION;
  evidence_kind: 'verbatim_user_feedback';
}

export interface ClassifierFeedbackLabel extends ClassifierFeedbackLabelInput {
  queue_sha256: string;
  label_id: string;
}

interface CliOptions {
  input?: string;
  queues: string[];
  output: string;
  help: boolean;
}

const USAGE = `Usage: record:classifier-feedback -- --input <labels.json|labels.jsonl|-> --queue <queue.txt> [options]

Options:
  --input <path|->  JSON object, JSON array, JSONL file, or - for stdin.
  --queue <path>    Validated queue named by the label. Repeat for multiple queues.
  --output <path>   Append-only JSONL path under .private/.
                    Defaults to .private/classifier-feedback/labels.jsonl.
  --help            Show this help text.
`;

export function parseClassifierFeedbackLabel(candidate: unknown): ClassifierFeedbackLabel {
  const record = requireRecord(candidate, 'label');
  const input = parseLabelInput(record, true);
  const queueSha256 = requireQueueFingerprint(record.queue_sha256, 'label.queue_sha256');
  const labelId = deriveLabelId(input, queueSha256);
  if (record.label_id !== labelId) {
    throw new Error(`label.label_id must equal the derived id ${labelId}`);
  }
  return { ...input, queue_sha256: queueSha256, label_id: labelId };
}

export function parseClassifierFeedbackInput(text: string): ClassifierFeedbackLabelInput[] {
  const trimmed = text.trim();
  if (trimmed.length === 0) throw new Error('Feedback input is empty');

  let candidates: unknown[];
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    candidates = Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    candidates = trimmed.split(/\r?\n/).map((line, index) => {
      try {
        return JSON.parse(line) as unknown;
      } catch (error) {
        throw new Error(`Feedback JSONL line ${index + 1} is invalid: ${errorMessage(error)}`);
      }
    });
  }
  if (candidates.length === 0) throw new Error('Feedback input contains no labels');
  return candidates.map((candidate) => parseLabelInput(candidate, false));
}

export function bindClassifierFeedbackLabels(
  inputs: ClassifierFeedbackLabelInput[],
  queues: Array<{ filename: string; text: string }>
): ClassifierFeedbackLabel[] {
  const byFilename = new Map<string, Record<string, unknown>>();
  for (const supplied of queues) {
    if (byFilename.has(supplied.filename)) {
      throw new Error(`Queue supplied more than once: ${supplied.filename}`);
    }
    let candidate: unknown;
    try {
      candidate = JSON.parse(supplied.text) as unknown;
    } catch (error) {
      throw new Error(`Queue ${supplied.filename} is invalid JSON: ${errorMessage(error)}`);
    }
    byFilename.set(supplied.filename, validateTldrCommuteQueueV2(candidate));
  }

  return inputs.map((input) => {
    const queue = byFilename.get(input.queue_filename);
    if (queue === undefined) {
      throw new Error(`No --queue file supplied for ${input.queue_filename}`);
    }
    const items = queue.items as Record<string, unknown>[];
    const item = items.find((candidate) => candidate.source_item_id === input.source_item_id);
    if (item === undefined) {
      throw new Error(
        `${input.queue_filename} has no item with source_item_id ${input.source_item_id}`
      );
    }
    requireExactQueueValue(item.title, input.title, 'title', input.source_item_id);
    requireExactQueueValue(item.url, input.url, 'url', input.source_item_id);
    requireExactQueueValue(
      item.interest_level,
      input.original.interest_level,
      'interest_level',
      input.source_item_id
    );
    requireExactQueueValue(
      item.interest_score,
      input.original.interest_score,
      'interest_score',
      input.source_item_id
    );
    requireExactQueueValue(
      item.consumption_depth,
      input.original.consumption_depth,
      'consumption_depth',
      input.source_item_id
    );
    requireExactQueueValue(
      item.depth_score,
      input.original.depth_score,
      'depth_score',
      input.source_item_id
    );
    requireExactQueueValue(
      item.commute_behavior,
      input.original.route,
      'commute_behavior',
      input.source_item_id
    );
    for (const field of ['profile_version', 'prompt_version', 'provider', 'model'] as const) {
      requireExactQueueValue(item[field], input[field], field, input.source_item_id);
    }
    requireExactQueueValue(
      item.route_version,
      input.route_version,
      'route_version',
      input.source_item_id
    );
    const queueSha256 = queueSnapshotFingerprint(queue);
    return {
      ...input,
      queue_sha256: queueSha256,
      label_id: deriveLabelId(input, queueSha256),
    };
  });
}

export async function appendClassifierFeedbackLabels(
  outputPath: string,
  labels: ClassifierFeedbackLabel[]
): Promise<void> {
  ensurePrivateOutput(outputPath);
  if (labels.length === 0) throw new Error('No classifier feedback labels to record');
  const incomingIds = new Set<string>();
  for (const label of labels) {
    if (incomingIds.has(label.label_id)) {
      throw new Error(`Duplicate feedback label in input: ${label.label_id}`);
    }
    incomingIds.add(label.label_id);
  }

  await mkdir(path.dirname(outputPath), { recursive: true });
  const lockPath = `${outputPath}.lock`;
  const lock = await acquireStoreLock(lockPath);

  try {
    let existing = '';
    try {
      existing = await readFile(outputPath, 'utf8');
    } catch (error) {
      if (!isMissingFile(error)) throw error;
    }
    if (existing.trim().length > 0) {
      for (const label of parseStoredJsonl(existing)) {
        if (incomingIds.has(label.label_id)) {
          throw new Error(`Feedback label already recorded: ${label.label_id}`);
        }
      }
    }
    const separator = existing.length > 0 && !existing.endsWith('\n') ? '\n' : '';
    await appendFile(
      outputPath,
      `${separator}${labels.map((label) => JSON.stringify(label)).join('\n')}\n`,
      'utf8'
    );
  } finally {
    try {
      await lock.close();
    } finally {
      await unlink(lockPath);
    }
  }
}

export async function runClassifierFeedbackCommand(argv: string[]): Promise<number> {
  const options = parseOptions(argv);
  if (options.help) {
    process.stdout.write(USAGE);
    return 0;
  }
  if (options.input === undefined || options.queues.length === 0) {
    process.stderr.write(USAGE);
    return 1;
  }
  ensurePrivateOutput(options.output);
  const text =
    options.input === '-' ? await readStdin() : await readFile(path.resolve(options.input), 'utf8');
  const queueInputs = await Promise.all(
    options.queues.map(async (queuePath) => ({
      filename: path.basename(queuePath),
      text: await readFile(path.resolve(queuePath), 'utf8'),
    }))
  );
  const labels = bindClassifierFeedbackLabels(parseClassifierFeedbackInput(text), queueInputs);
  const outputPath = path.resolve(options.output);
  await appendClassifierFeedbackLabels(outputPath, labels);
  process.stdout.write(`${outputPath}\n${labels.length} classifier feedback label(s) recorded\n`);
  return 0;
}

function parseLabelInput(candidate: unknown, stored: boolean): ClassifierFeedbackLabelInput {
  const input = requireRecord(candidate, 'label');
  rejectUnknownKeys(
    input,
    [
      'schema_version',
      ...(stored ? ['label_id', 'queue_sha256'] : []),
      'queue_filename',
      'source_item_id',
      'title',
      'url',
      'correction_type',
      'original',
      'corrected',
      'reason',
      'session_date',
      'recorded_at',
      'profile_version',
      'prompt_version',
      'provider',
      'model',
      'route_version',
      'evidence_kind',
    ],
    'label'
  );
  if (input.schema_version !== CLASSIFIER_FEEDBACK_LABEL_SCHEMA_VERSION) {
    throw new Error(`label.schema_version must be ${CLASSIFIER_FEEDBACK_LABEL_SCHEMA_VERSION}`);
  }
  const queueFilename = requireNonEmptyString(input.queue_filename, 'label.queue_filename');
  if (queueFilename !== queueFilename.trim()) {
    throw new Error('label.queue_filename must not have leading or trailing whitespace');
  }
  if (path.basename(queueFilename) !== queueFilename) {
    throw new Error('label.queue_filename must be a filename without directory components');
  }

  const url = requireNonEmptyString(input.url, 'label.url');
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error('label.url must be a credential-free HTTP(S) URL');
  }
  if (
    !/^https?:\/\/\S+$/.test(url) ||
    !['http:', 'https:'].includes(parsedUrl.protocol) ||
    parsedUrl.username ||
    parsedUrl.password
  ) {
    throw new Error('label.url must be a credential-free HTTP(S) URL');
  }

  const correctionType = requireEnum(
    input.correction_type,
    CORRECTION_TYPES,
    'label.correction_type'
  );
  const original = parseOriginalValues(input.original);
  const corrected = parseCorrectedValues(input.corrected);
  validateRoute(original, 'label.original');
  validateCorrection(correctionType, original, corrected);
  if (correctionType === 'route') {
    if (
      original.interest_level !== corrected.interest_level ||
      original.consumption_depth !== corrected.consumption_depth
    ) {
      throw new Error('route correction must not change interest or depth labels');
    }
  } else {
    validateRoute(corrected, 'label.corrected');
  }

  const sessionDate = requireNonEmptyString(input.session_date, 'label.session_date');
  validateCalendarDate(sessionDate, 'label.session_date');
  const recordedAt = requireNonEmptyString(input.recorded_at, 'label.recorded_at');
  if (
    !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.test(
      recordedAt
    ) ||
    Number.isNaN(Date.parse(recordedAt))
  ) {
    throw new Error('label.recorded_at must be an RFC 3339 timestamp with a timezone');
  }
  validateCalendarDate(recordedAt.slice(0, 10), 'label.recorded_at date');
  if (input.evidence_kind !== 'verbatim_user_feedback') {
    throw new Error('label.evidence_kind must be verbatim_user_feedback');
  }

  const routeVersion = requireNonEmptyString(input.route_version, 'label.route_version');
  if (routeVersion !== ROUTE_VERSION) {
    throw new Error(
      `label.route_version must be ${ROUTE_VERSION}; historical route policies require an explicit migration`
    );
  }

  return {
    schema_version: CLASSIFIER_FEEDBACK_LABEL_SCHEMA_VERSION,
    queue_filename: queueFilename,
    source_item_id: requireNonEmptyString(input.source_item_id, 'label.source_item_id'),
    title: requireNonEmptyString(input.title, 'label.title'),
    url,
    correction_type: correctionType,
    original,
    corrected,
    reason: requireNonEmptyString(input.reason, 'label.reason'),
    session_date: sessionDate,
    recorded_at: recordedAt,
    profile_version: requireNonEmptyString(input.profile_version, 'label.profile_version'),
    prompt_version: requireNonEmptyString(input.prompt_version, 'label.prompt_version'),
    provider: requireNonEmptyString(input.provider, 'label.provider'),
    model: requireNonEmptyString(input.model, 'label.model'),
    route_version: ROUTE_VERSION,
    evidence_kind: 'verbatim_user_feedback',
  };
}

function parseOriginalValues(candidate: unknown): OriginalClassifierFeedbackValues {
  const values = requireRecord(candidate, 'label.original');
  rejectUnknownKeys(
    values,
    ['interest_level', 'interest_score', 'consumption_depth', 'depth_score', 'route'],
    'label.original'
  );
  return {
    interest_level: requireEnum(
      values.interest_level,
      INTEREST_LEVELS,
      'label.original.interest_level'
    ),
    interest_score: requireScore(values.interest_score, 'label.original.interest_score'),
    consumption_depth: requireEnum(
      values.consumption_depth,
      CONSUMPTION_DEPTHS,
      'label.original.consumption_depth'
    ),
    depth_score: requireScore(values.depth_score, 'label.original.depth_score'),
    route: requireEnum(values.route, COMMUTE_BEHAVIORS, 'label.original.route'),
  };
}

function parseCorrectedValues(candidate: unknown): ClassifierFeedbackValues {
  const values = requireRecord(candidate, 'label.corrected');
  rejectUnknownKeys(values, ['interest_level', 'consumption_depth', 'route'], 'label.corrected');
  return {
    interest_level: requireEnum(
      values.interest_level,
      INTEREST_LEVELS,
      'label.corrected.interest_level'
    ),
    consumption_depth: requireEnum(
      values.consumption_depth,
      CONSUMPTION_DEPTHS,
      'label.corrected.consumption_depth'
    ),
    route: requireEnum(values.route, COMMUTE_BEHAVIORS, 'label.corrected.route'),
  };
}

function validateRoute(values: ClassifierFeedbackValues, field: string): void {
  const derived = deriveRouteFromClassification({
    classifier_item_id: 'feedback-validation',
    interest_level: values.interest_level,
    interest_score: 0,
    consumption_depth: values.consumption_depth,
    depth_score: 0,
    signals: [],
    reason: 'feedback validation',
  }).commute_behavior;
  if (values.route !== derived) {
    throw new Error(`${field}.route must be ${derived} for its interest and depth labels`);
  }
}

function validateCorrection(
  correctionType: ClassifierCorrectionType,
  original: ClassifierFeedbackValues,
  corrected: ClassifierFeedbackValues
): void {
  if (
    original.interest_level === corrected.interest_level &&
    original.consumption_depth === corrected.consumption_depth &&
    original.route === corrected.route
  ) {
    throw new Error('label.corrected must differ from label.original');
  }
  if (correctionType === 'interest') {
    if (original.interest_level === corrected.interest_level) {
      throw new Error('interest correction must change corrected.interest_level');
    }
    if (original.consumption_depth !== corrected.consumption_depth) {
      throw new Error('interest correction must not change corrected.consumption_depth');
    }
  }
  if (correctionType === 'depth') {
    if (original.consumption_depth === corrected.consumption_depth) {
      throw new Error('depth correction must change corrected.consumption_depth');
    }
    if (original.interest_level !== corrected.interest_level) {
      throw new Error('depth correction must not change corrected.interest_level');
    }
  }
  if (correctionType === 'route' && original.route === corrected.route) {
    throw new Error('route correction must change corrected.route');
  }
}

function deriveLabelId(input: ClassifierFeedbackLabelInput, queueSha256: string): string {
  const semanticInput = Object.fromEntries(
    Object.entries(input).filter(([key]) => key !== 'recorded_at')
  );
  const digest = createHash('sha256')
    .update(JSON.stringify({ ...semanticInput, queue_sha256: queueSha256 }))
    .digest('hex')
    .slice(0, 20);
  return `feedback_${digest}`;
}

function parseStoredJsonl(text: string): ClassifierFeedbackLabel[] {
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line, index) => {
      try {
        return parseClassifierFeedbackLabel(JSON.parse(line) as unknown);
      } catch (error) {
        throw new Error(
          `Existing feedback JSONL line ${index + 1} is invalid: ${errorMessage(error)}`
        );
      }
    });
}

function parseOptions(argv: string[]): CliOptions {
  const options: CliOptions = {
    queues: [],
    output: '.private/classifier-feedback/labels.jsonl',
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--input') {
      options.input = readValue(argv, index, arg);
      index += 1;
    } else if (arg === '--queue') {
      options.queues.push(readValue(argv, index, arg));
      index += 1;
    } else if (arg === '--output') {
      options.output = readValue(argv, index, arg);
      index += 1;
    } else if (arg === '--help') {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg ?? ''}`);
    }
  }
  return options;
}

function validateCalendarDate(value: string, field: string): void {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match === null) throw new Error(`${field} must use YYYY-MM-DD`);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error(`${field} must be a real calendar date`);
  }
}

function requireExactQueueValue(
  actual: unknown,
  expected: unknown,
  field: string,
  sourceItemId: string
): void {
  if (actual !== expected) {
    throw new Error(`Queue item ${sourceItemId} ${field} does not match the feedback label`);
  }
}

function requireQueueFingerprint(value: unknown, field: string): string {
  if (typeof value !== 'string' || !/^sha256:[a-f0-9]{64}$/.test(value)) {
    throw new Error(`${field} must be a sha256 queue fingerprint`);
  }
  return value;
}

async function acquireStoreLock(lockPath: string): Promise<FileHandle> {
  let handle: FileHandle;
  try {
    handle = await open(lockPath, 'wx');
  } catch (error) {
    if (!isExistingFile(error)) throw error;
    const owner = await readLockOwner(lockPath);
    if (owner === undefined) {
      throw new Error(`Feedback store has an unreadable lock requiring review: ${lockPath}`);
    }
    if (isProcessAlive(owner.pid)) {
      throw new Error(
        `Feedback store is locked by recorder process ${owner.pid} since ${owner.created_at}: ${lockPath}`
      );
    }
    throw new Error(
      `Feedback store has a stale lock from process ${owner.pid} since ${owner.created_at}; inspect and remove it before retrying: ${lockPath}`
    );
  }

  try {
    await handle.writeFile(
      `${JSON.stringify({ pid: process.pid, created_at: new Date().toISOString() })}\n`,
      'utf8'
    );
    return handle;
  } catch (error) {
    const cleanupErrors: unknown[] = [];
    try {
      await handle.close();
    } catch (closeError) {
      cleanupErrors.push(closeError);
    }
    try {
      await unlink(lockPath);
    } catch (unlinkError) {
      if (!isMissingFile(unlinkError)) cleanupErrors.push(unlinkError);
    }
    if (cleanupErrors.length > 0) {
      throw new AggregateError(
        [error, ...cleanupErrors],
        'Failed to initialize and clean up the feedback store lock'
      );
    }
    throw error;
  }
}

async function readLockOwner(
  lockPath: string
): Promise<{ pid: number; created_at: string } | undefined> {
  let candidate: unknown;
  try {
    candidate = JSON.parse(await readFile(lockPath, 'utf8')) as unknown;
  } catch {
    return undefined;
  }
  if (typeof candidate !== 'object' || candidate === null || Array.isArray(candidate)) {
    return undefined;
  }
  const owner = candidate as Record<string, unknown>;
  if (
    !Number.isInteger(owner.pid) ||
    (owner.pid as number) <= 0 ||
    typeof owner.created_at !== 'string' ||
    Number.isNaN(Date.parse(owner.created_at))
  ) {
    return undefined;
  }
  return { pid: owner.pid as number, created_at: owner.created_at };
}

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return errorCode(error) !== 'ESRCH';
  }
}

function readValue(argv: string[], index: number, arg: string): string {
  const value = argv[index + 1];
  if (value === undefined || value.startsWith('--')) {
    throw new Error(`Missing value for ${arg}`);
  }
  return value;
}

function ensurePrivateOutput(output: string): void {
  if (!path.resolve(output).split(path.sep).includes('.private')) {
    throw new Error('--output must be under a .private directory');
  }
}

function requireRecord(value: unknown, field: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${field} must be an object`);
  }
  return value as Record<string, unknown>;
}

function rejectUnknownKeys(
  record: Record<string, unknown>,
  allowed: readonly string[],
  field: string
): void {
  const unknown = Object.keys(record).filter((key) => !allowed.includes(key));
  if (unknown.length > 0) throw new Error(`${field} has unknown field(s): ${unknown.join(', ')}`);
}

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value;
}

function requireScore(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`${field} must be a number from 0 through 1`);
  }
  return value;
}

function requireEnum<const T extends readonly string[]>(
  value: unknown,
  allowed: T,
  field: string
): T[number] {
  if (typeof value !== 'string' || !allowed.includes(value)) {
    throw new Error(`${field} must be one of: ${allowed.join(', ')}`);
  }
  return value as T[number];
}

function isMissingFile(error: unknown): boolean {
  return errorCode(error) === 'ENOENT';
}

function isExistingFile(error: unknown): boolean {
  return errorCode(error) === 'EEXIST';
}

function errorCode(error: unknown): unknown {
  return typeof error === 'object' && error !== null && 'code' in error
    ? (error as { code?: unknown }).code
    : undefined;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] ?? '')) {
  runClassifierFeedbackCommand(process.argv.slice(2))
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error: unknown) => {
      process.stderr.write(`${errorMessage(error)}\n`);
      process.exitCode = 1;
    });
}
