import { createHash } from 'node:crypto';
import { appendFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  CONSUMPTION_DEPTHS,
  INTEREST_LEVELS,
  type ConsumptionDepth,
  type InterestLevel,
} from './types.js';
import { deriveRouteFromClassification, type CommuteBehavior } from '../routing/derive.js';

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
  evidence_kind: 'verbatim_user_feedback';
}

export interface ClassifierFeedbackLabel extends ClassifierFeedbackLabelInput {
  label_id: string;
}

interface CliOptions {
  input?: string;
  output: string;
  help: boolean;
}

const USAGE = `Usage: record:classifier-feedback -- --input <labels.json|labels.jsonl|-> [options]

Options:
  --input <path|->  JSON object, JSON array, JSONL file, or - for stdin.
  --output <path>   Append-only JSONL path under .private/.
                    Defaults to .private/classifier-feedback/labels.jsonl.
  --help            Show this help text.
`;

export function parseClassifierFeedbackLabel(candidate: unknown): ClassifierFeedbackLabel {
  const input = requireRecord(candidate, 'label');
  rejectUnknownKeys(
    input,
    [
      'schema_version',
      'label_id',
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
      'evidence_kind',
    ],
    'label'
  );
  if (input.schema_version !== CLASSIFIER_FEEDBACK_LABEL_SCHEMA_VERSION) {
    throw new Error(`label.schema_version must be ${CLASSIFIER_FEEDBACK_LABEL_SCHEMA_VERSION}`);
  }

  const queueFilename = requireNonEmptyString(input.queue_filename, 'label.queue_filename');
  if (path.basename(queueFilename) !== queueFilename) {
    throw new Error('label.queue_filename must be a filename without directory components');
  }
  const url = requireNonEmptyString(input.url, 'label.url');
  const parsedUrl = new URL(url);
  if (
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
  validateRoute(corrected, 'label.corrected');
  validateCorrection(correctionType, original, corrected);

  const sessionDate = requireNonEmptyString(input.session_date, 'label.session_date');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(sessionDate)) {
    throw new Error('label.session_date must use YYYY-MM-DD');
  }
  const recordedAt = requireNonEmptyString(input.recorded_at, 'label.recorded_at');
  if (Number.isNaN(Date.parse(recordedAt)) || !/[zZ]|[+-]\d{2}:\d{2}$/.test(recordedAt)) {
    throw new Error('label.recorded_at must be an RFC 3339 timestamp with a timezone');
  }
  if (input.evidence_kind !== 'verbatim_user_feedback') {
    throw new Error('label.evidence_kind must be verbatim_user_feedback');
  }

  const withoutId: ClassifierFeedbackLabelInput = {
    schema_version: CLASSIFIER_FEEDBACK_LABEL_SCHEMA_VERSION,
    queue_filename: queueFilename,
    source_item_id: requireNonEmptyString(input.source_item_id, 'label.source_item_id'),
    title: requireNonEmptyString(input.title, 'label.title'),
    url: parsedUrl.toString(),
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
    evidence_kind: 'verbatim_user_feedback',
  };
  const labelId = deriveLabelId(withoutId);
  if (input.label_id !== undefined && input.label_id !== labelId) {
    throw new Error(`label.label_id must equal the derived id ${labelId}`);
  }
  return { ...withoutId, label_id: labelId };
}

export function parseClassifierFeedbackInput(text: string): ClassifierFeedbackLabel[] {
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
  return candidates.map(parseClassifierFeedbackLabel);
}

export async function appendClassifierFeedbackLabels(
  outputPath: string,
  labels: ClassifierFeedbackLabel[]
): Promise<void> {
  const incomingIds = new Set<string>();
  for (const label of labels) {
    if (incomingIds.has(label.label_id)) {
      throw new Error(`Duplicate feedback label in input: ${label.label_id}`);
    }
    incomingIds.add(label.label_id);
  }

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

  await mkdir(path.dirname(outputPath), { recursive: true });
  await appendFile(
    outputPath,
    `${labels.map((label) => JSON.stringify(label)).join('\n')}\n`,
    'utf8'
  );
}

export async function runClassifierFeedbackCommand(argv: string[]): Promise<number> {
  const options = parseOptions(argv);
  if (options.help) {
    process.stdout.write(USAGE);
    return 0;
  }
  if (options.input === undefined) {
    process.stderr.write(USAGE);
    return 1;
  }
  ensurePrivateOutput(options.output);
  const text =
    options.input === '-' ? await readStdin() : await readFile(path.resolve(options.input), 'utf8');
  const labels = parseClassifierFeedbackInput(text);
  const outputPath = path.resolve(options.output);
  await appendClassifierFeedbackLabels(outputPath, labels);
  process.stdout.write(`${outputPath}\n${labels.length} classifier feedback label(s) recorded\n`);
  return 0;
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
  if (correctionType === 'interest' && original.interest_level === corrected.interest_level) {
    throw new Error('interest correction must change corrected.interest_level');
  }
  if (correctionType === 'depth' && original.consumption_depth === corrected.consumption_depth) {
    throw new Error('depth correction must change corrected.consumption_depth');
  }
  if (correctionType === 'route' && original.route === corrected.route) {
    throw new Error('route correction must change corrected.route');
  }
}

function deriveLabelId(input: ClassifierFeedbackLabelInput): string {
  const digest = createHash('sha256').update(JSON.stringify(input)).digest('hex').slice(0, 20);
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
    output: '.private/classifier-feedback/labels.jsonl',
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--input') {
      options.input = readValue(argv, index, arg);
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

function readValue(argv: string[], index: number, arg: string): string {
  const value = argv[index + 1];
  if (value === undefined || value.startsWith('--')) {
    throw new Error(`Missing value for ${arg}`);
  }
  return value;
}

function ensurePrivateOutput(output: string): void {
  const segments = path.resolve(output).split(path.sep);
  if (!segments.includes('.private')) {
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
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'ENOENT'
  );
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
