import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  bundleArtifactFilenameMatches,
  type CommuteSessionBundle,
  parseCommuteSessionBundleText,
  queueSnapshotFingerprint,
} from './session-bundle.js';
import { recoverSessionBundleWithSuppliedQueue } from './recover-session-bundle.js';

const IMPORT_SCHEMA_VERSION = 'commute-session-import.v1';

interface Options {
  inputs: Array<{ bundle: string; recoveryQueue?: string }>;
  output: string;
}

export interface SessionBundleInput {
  filename: string;
  text: string;
  recoveryQueue?: { filename: string; text: string };
}

interface ImportedSession {
  input_filename: string;
  status: 'accepted' | 'rejected';
  session_id?: string;
  integrity_state?: CommuteSessionBundle['integrity']['state'];
  queue_filename?: string;
  queue_fingerprint?: string;
  error?: string;
}

export interface MaintenanceCandidate {
  maintenance_key: string;
  session_id: string;
  event_id: string;
  source_item_id: string;
  title: string;
  url: string;
  status: 'pending';
}

export type MaintenanceAttemptStatus =
  | 'inaccessible_source'
  | 'unsupported_source'
  | 'no_change'
  | 'insufficient_source'
  | 'unresolved'
  | 'pr_created'
  | 'failed';

export interface MaintenanceAttemptInput {
  maintenance_key: string;
  source: 'retrieval' | 'maintainer';
  status: MaintenanceAttemptStatus;
  detail: string;
  attempted_at: string;
}

export interface MaintenanceAttempt extends MaintenanceAttemptInput {
  attempt_id: string;
  bundle_session_id: string;
  event_id: string;
  source_url: string;
}

export interface MaintenanceLatestResult {
  maintenance_key: string;
  bundle_session_id: string;
  event_id: string;
  source_url: string;
  latest_status: MaintenanceAttemptStatus;
  latest_detail: string;
  latest_attempted_at: string;
  attempt_count: number;
  retryable: boolean;
}

interface ReconciledEvent {
  session_id: string;
  event_id: string;
  kind: string;
  event: CommuteSessionBundle['events'][number];
}

interface EventConversion {
  session_id: string;
  event_id: string;
  reason: string;
  original_event: CommuteSessionBundle['events'][number];
  converted_event: CommuteSessionBundle['events'][number];
}

export interface CommuteSessionImport {
  schema_version: typeof IMPORT_SCHEMA_VERSION;
  imported_at: string;
  sessions: ImportedSession[];
  maintenance_candidates: MaintenanceCandidate[];
  maintenance_attempts: MaintenanceAttempt[];
  maintenance_results: MaintenanceLatestResult[];
  feedback_events: ReconciledEvent[];
  unresolved_captures: ReconciledEvent[];
  quality_incidents: ReconciledEvent[];
  general_captures: ReconciledEvent[];
  event_conversions: EventConversion[];
}

export function reconcileSessionBundles(
  inputs: SessionBundleInput[],
  importedAt = new Date().toISOString()
): CommuteSessionImport {
  const result: CommuteSessionImport = {
    schema_version: IMPORT_SCHEMA_VERSION,
    imported_at: importedAt,
    sessions: [],
    maintenance_candidates: [],
    maintenance_attempts: [],
    maintenance_results: [],
    feedback_events: [],
    unresolved_captures: [],
    quality_incidents: [],
    general_captures: [],
    event_conversions: [],
  };
  const sessionIds = new Set<string>();
  const maintenanceKeys = new Set<string>();

  for (const input of inputs) {
    let bundle: CommuteSessionBundle;
    try {
      bundle = parseCommuteSessionBundleText(input.text);
      if (!bundleArtifactFilenameMatches(input.filename, bundle.session.artifact_filename)) {
        throw new Error(
          'Bundle filename does not match session.artifact_filename (except a Library-added numeric suffix)'
        );
      }
      if (sessionIds.has(bundle.session.session_id)) {
        throw new Error(`Duplicate session_id ${bundle.session.session_id}`);
      }
      sessionIds.add(bundle.session.session_id);
    } catch (error) {
      if (input.recoveryQueue) {
        try {
          const recovered = recoverSessionBundleWithSuppliedQueue({
            bundleFilename: input.filename,
            bundleText: input.text,
            queueFilename: input.recoveryQueue.filename,
            queueText: input.recoveryQueue.text,
          });
          if (sessionIds.has(recovered.sessionId)) {
            throw new Error(`Duplicate session_id ${recovered.sessionId}`);
          }
          sessionIds.add(recovered.sessionId);
          result.sessions.push({
            input_filename: input.filename,
            status: 'accepted',
            session_id: recovered.sessionId,
            integrity_state: 'recovered',
            queue_filename: recovered.queueFilename,
            queue_fingerprint: recovered.queueFingerprint,
          });
          for (const capture of recovered.wikiCaptures) {
            const maintenanceKey = [recovered.sessionId, capture.eventId, capture.url].join(':');
            if (maintenanceKeys.has(maintenanceKey)) continue;
            maintenanceKeys.add(maintenanceKey);
            result.maintenance_candidates.push({
              maintenance_key: maintenanceKey,
              session_id: recovered.sessionId,
              event_id: capture.eventId,
              source_item_id: capture.sourceItemId,
              title: capture.title,
              url: capture.url,
              status: 'pending',
            });
          }
          continue;
        } catch (recoveryError) {
          result.sessions.push({
            input_filename: input.filename,
            status: 'rejected',
            error: `Bundle validation failed: ${errorMessage(error)}; supplied-queue recovery failed: ${errorMessage(recoveryError)}`,
          });
          continue;
        }
      }
      result.sessions.push({
        input_filename: input.filename,
        status: 'rejected',
        error: errorMessage(error),
      });
      continue;
    }

    result.sessions.push({
      input_filename: input.filename,
      status: 'accepted',
      session_id: bundle.session.session_id,
      integrity_state: bundle.integrity.state,
      queue_filename: bundle.queue_snapshot.filename,
      queue_fingerprint: queueSnapshotFingerprint(bundle.queue_snapshot.queue),
    });

    for (const event of bundle.events) {
      const reconciled: ReconciledEvent = {
        session_id: bundle.session.session_id,
        event_id: event.event_id,
        kind: event.kind,
        event,
      };

      if (event.kind === 'item_action') {
        if (event.action === 'wiki_this') {
          const maintenanceKey = [bundle.session.session_id, event.event_id, event.item.url].join(
            ':'
          );
          if (!maintenanceKeys.has(maintenanceKey)) {
            maintenanceKeys.add(maintenanceKey);
            result.maintenance_candidates.push({
              maintenance_key: maintenanceKey,
              session_id: bundle.session.session_id,
              event_id: event.event_id,
              source_item_id: event.item.source_item_id,
              title: event.item.title,
              url: event.item.url,
              status: 'pending',
            });
          }
        } else if (
          event.action === 'promote_to_in_depth' &&
          queueItemConsumptionDepth(bundle, event.item.source_item_id) === 'in_depth'
        ) {
          const convertedEvent: CommuteSessionBundle['events'][number] = {
            event_id: event.event_id,
            sequence: event.sequence,
            kind: 'quality_incident',
            observed_behavior:
              `A promote_to_in_depth action was recorded for "${event.item.title}", ` +
              'but the embedded canonical queue already classified that item as in_depth.',
            boundary: 'bundle import semantic normalization',
            evidence: event.evidence,
          };
          result.event_conversions.push({
            session_id: bundle.session.session_id,
            event_id: event.event_id,
            reason:
              'The requested promotion contradicts the canonical queue and is playback/process evidence, not classifier feedback.',
            original_event: event,
            converted_event: convertedEvent,
          });
          result.quality_incidents.push({
            session_id: bundle.session.session_id,
            event_id: convertedEvent.event_id,
            kind: convertedEvent.kind,
            event: convertedEvent,
          });
        } else {
          result.feedback_events.push(reconciled);
        }
      } else if (event.kind === 'unresolved_capture') {
        result.unresolved_captures.push(reconciled);
      } else if (event.kind === 'quality_incident') {
        result.quality_incidents.push(reconciled);
      } else if (event.kind === 'general_capture') {
        result.general_captures.push(reconciled);
      }
    }
  }

  return result;
}

export function recordMaintenanceAttempts(
  record: CommuteSessionImport,
  inputs: MaintenanceAttemptInput[]
): CommuteSessionImport {
  const candidates = maintenanceCandidatesByKey(record.maintenance_candidates);
  const attempts = [...record.maintenance_attempts];
  const attemptIds = new Set(attempts.map((attempt) => attempt.attempt_id));

  for (const input of inputs) {
    const candidate = candidates.get(input.maintenance_key);
    if (!candidate) {
      throw new Error(`Maintenance attempt names unknown candidate ${input.maintenance_key}`);
    }
    requireMaintenanceAttemptStatus(input.status, 'Maintenance attempt status');
    requireMaintenanceAttemptSource(input.source, 'Maintenance attempt source');
    requireNonEmpty(input.detail, 'Maintenance attempt detail');
    requireIsoTimestamp(input.attempted_at, 'Maintenance attempt attempted_at');

    const attempt: MaintenanceAttempt = {
      attempt_id: maintenanceAttemptId(input),
      maintenance_key: candidate.maintenance_key,
      bundle_session_id: candidate.session_id,
      event_id: candidate.event_id,
      source_url: candidate.url,
      source: input.source,
      status: input.status,
      detail: input.detail,
      attempted_at: input.attempted_at,
    };
    if (attemptIds.has(attempt.attempt_id)) continue;
    attemptIds.add(attempt.attempt_id);
    attempts.push(attempt);
  }

  return {
    ...record,
    maintenance_attempts: attempts,
    maintenance_results: deriveMaintenanceResults(attempts),
  };
}

export function carryForwardMaintenanceHistory(
  record: CommuteSessionImport,
  previous: unknown
): CommuteSessionImport {
  if (typeof previous !== 'object' || previous === null || Array.isArray(previous)) {
    throw new Error('Prior commute import record must be an object');
  }
  const prior = previous as Record<string, unknown>;
  if (prior.schema_version !== IMPORT_SCHEMA_VERSION) {
    throw new Error('Prior commute import record has an unsupported schema_version');
  }
  if (!Array.isArray(prior.maintenance_candidates)) {
    throw new Error('Prior commute import record must contain maintenance_candidates');
  }

  const currentCandidates = maintenanceCandidatesByKey(record.maintenance_candidates);
  const priorCandidates = maintenanceCandidatesByKey(
    prior.maintenance_candidates.map((candidate, index) =>
      parsePriorMaintenanceCandidate(candidate, index)
    )
  );
  if (currentCandidates.size !== priorCandidates.size) {
    throw new Error('Prior commute import record names a different maintenance candidate set');
  }
  for (const [key, current] of currentCandidates) {
    const candidate = priorCandidates.get(key);
    if (
      !candidate ||
      candidate.session_id !== current.session_id ||
      candidate.event_id !== current.event_id ||
      candidate.url !== current.url
    ) {
      throw new Error(`Prior commute import record does not match maintenance candidate ${key}`);
    }
  }

  if (prior.maintenance_attempts === undefined) return record;
  if (!Array.isArray(prior.maintenance_attempts)) {
    throw new Error('Prior commute import record maintenance_attempts must be an array');
  }
  const attempts = prior.maintenance_attempts.map((attempt, index) =>
    parsePriorMaintenanceAttempt(attempt, index, currentCandidates)
  );
  if (new Set(attempts.map((attempt) => attempt.attempt_id)).size !== attempts.length) {
    throw new Error('Prior commute import record contains duplicate maintenance attempt ids');
  }
  return {
    ...record,
    maintenance_attempts: attempts,
    maintenance_results: deriveMaintenanceResults(attempts),
  };
}

function deriveMaintenanceResults(attempts: MaintenanceAttempt[]): MaintenanceLatestResult[] {
  const results = new Map<string, MaintenanceLatestResult>();
  for (const attempt of attempts) {
    const prior = results.get(attempt.maintenance_key);
    results.set(attempt.maintenance_key, {
      maintenance_key: attempt.maintenance_key,
      bundle_session_id: attempt.bundle_session_id,
      event_id: attempt.event_id,
      source_url: attempt.source_url,
      latest_status: attempt.status,
      latest_detail: attempt.detail,
      latest_attempted_at: attempt.attempted_at,
      attempt_count: (prior?.attempt_count ?? 0) + 1,
      retryable: attempt.status !== 'pr_created',
    });
  }
  return [...results.values()];
}

function maintenanceCandidatesByKey(
  candidates: MaintenanceCandidate[]
): Map<string, MaintenanceCandidate> {
  const byKey = new Map<string, MaintenanceCandidate>();
  for (const candidate of candidates) {
    if (byKey.has(candidate.maintenance_key)) {
      throw new Error(`Duplicate maintenance_key ${candidate.maintenance_key}`);
    }
    byKey.set(candidate.maintenance_key, candidate);
  }
  return byKey;
}

function parsePriorMaintenanceCandidate(candidate: unknown, index: number): MaintenanceCandidate {
  const field = `Prior maintenance_candidates[${index}]`;
  const record = requireRecord(candidate, field);
  return {
    maintenance_key: requireNonEmpty(record.maintenance_key, `${field}.maintenance_key`),
    session_id: requireNonEmpty(record.session_id, `${field}.session_id`),
    event_id: requireNonEmpty(record.event_id, `${field}.event_id`),
    source_item_id: requireNonEmpty(record.source_item_id, `${field}.source_item_id`),
    title: requireNonEmpty(record.title, `${field}.title`),
    url: requireHttpUrl(record.url, `${field}.url`),
    status: 'pending',
  };
}

function parsePriorMaintenanceAttempt(
  attempt: unknown,
  index: number,
  candidates: Map<string, MaintenanceCandidate>
): MaintenanceAttempt {
  const field = `Prior maintenance_attempts[${index}]`;
  const record = requireRecord(attempt, field);
  const maintenanceKey = requireNonEmpty(record.maintenance_key, `${field}.maintenance_key`);
  const candidate = candidates.get(maintenanceKey);
  if (!candidate) {
    throw new Error(`${field} names unknown candidate ${maintenanceKey}`);
  }
  const source = requireMaintenanceAttemptSource(record.source, `${field}.source`);
  const status = requireMaintenanceAttemptStatus(record.status, `${field}.status`);
  const input: MaintenanceAttemptInput = {
    maintenance_key: maintenanceKey,
    source,
    status,
    detail: requireNonEmpty(record.detail, `${field}.detail`),
    attempted_at: requireIsoTimestamp(record.attempted_at, `${field}.attempted_at`),
  };
  const parsed: MaintenanceAttempt = {
    ...input,
    attempt_id: requireNonEmpty(record.attempt_id, `${field}.attempt_id`),
    bundle_session_id: requireNonEmpty(record.bundle_session_id, `${field}.bundle_session_id`),
    event_id: requireNonEmpty(record.event_id, `${field}.event_id`),
    source_url: requireHttpUrl(record.source_url, `${field}.source_url`),
  };
  if (
    parsed.bundle_session_id !== candidate.session_id ||
    parsed.event_id !== candidate.event_id ||
    parsed.source_url !== candidate.url
  ) {
    throw new Error(`${field} identity does not match maintenance candidate ${maintenanceKey}`);
  }
  if (parsed.attempt_id !== maintenanceAttemptId(input)) {
    throw new Error(`${field}.attempt_id does not match its attempt fields`);
  }
  return parsed;
}

function maintenanceAttemptId(input: MaintenanceAttemptInput): string {
  const identity = [
    input.maintenance_key,
    input.source,
    input.status,
    input.detail,
    input.attempted_at,
  ].join('\u0000');
  return `sha256:${createHash('sha256').update(identity, 'utf8').digest('hex')}`;
}

function requireRecord(candidate: unknown, field: string): Record<string, unknown> {
  if (typeof candidate !== 'object' || candidate === null || Array.isArray(candidate)) {
    throw new Error(`${field} must be an object`);
  }
  return candidate as Record<string, unknown>;
}

function requireNonEmpty(candidate: unknown, field: string): string {
  if (typeof candidate !== 'string' || candidate.trim().length === 0) {
    throw new Error(`${field} must be a non-empty string`);
  }
  return candidate;
}

function requireIsoTimestamp(candidate: unknown, field: string): string {
  const value = requireNonEmpty(candidate, field);
  if (!Number.isFinite(Date.parse(value))) {
    throw new Error(`${field} must be an ISO timestamp`);
  }
  return value;
}

function requireHttpUrl(candidate: unknown, field: string): string {
  const value = requireNonEmpty(candidate, field);
  const parsed = new URL(value);
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`${field} must be an HTTP(S) URL`);
  }
  return value;
}

function requireMaintenanceAttemptSource(
  candidate: unknown,
  field: string
): MaintenanceAttemptInput['source'] {
  if (candidate !== 'retrieval' && candidate !== 'maintainer') {
    throw new Error(`${field} must be retrieval or maintainer`);
  }
  return candidate;
}

function requireMaintenanceAttemptStatus(
  candidate: unknown,
  field: string
): MaintenanceAttemptStatus {
  if (
    candidate !== 'inaccessible_source' &&
    candidate !== 'unsupported_source' &&
    candidate !== 'no_change' &&
    candidate !== 'insufficient_source' &&
    candidate !== 'unresolved' &&
    candidate !== 'pr_created' &&
    candidate !== 'failed'
  ) {
    throw new Error(`${field} is unsupported`);
  }
  return candidate;
}

function queueItemConsumptionDepth(
  bundle: CommuteSessionBundle,
  sourceItemId: string
): string | undefined {
  const items = bundle.queue_snapshot.queue.items;
  if (!Array.isArray(items)) return undefined;
  for (const candidate of items) {
    if (typeof candidate !== 'object' || candidate === null || Array.isArray(candidate)) continue;
    const item = candidate as Record<string, unknown>;
    if (item.source_item_id === sourceItemId) {
      return typeof item.consumption_depth === 'string' ? item.consumption_depth : undefined;
    }
  }
  return undefined;
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  const inputs = await Promise.all(
    options.inputs.map(async (input) => ({
      filename: path.basename(input.bundle),
      text: await readFile(input.bundle, 'utf8'),
      ...(input.recoveryQueue === undefined
        ? {}
        : {
            recoveryQueue: {
              filename: path.basename(input.recoveryQueue),
              text: await readFile(input.recoveryQueue, 'utf8'),
            },
          }),
    }))
  );
  const result = reconcileSessionBundles(inputs);
  ensurePrivateOutput(options.output);
  await mkdir(path.dirname(options.output), { recursive: true });
  await writeFile(options.output, `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' });

  const accepted = result.sessions.filter((session) => session.status === 'accepted').length;
  const rejected = result.sessions.length - accepted;
  process.stdout.write(
    [
      options.output,
      `${accepted} accepted session(s), ${rejected} rejected session(s)`,
      `${result.maintenance_candidates.length} wiki maintenance candidate(s)`,
      `${result.feedback_events.length} feedback event(s), ${result.unresolved_captures.length} unresolved capture(s)`,
    ].join('\n') + '\n'
  );
}

function parseOptions(args: string[]): Options {
  const inputs: Array<{ bundle: string; recoveryQueue?: string }> = [];
  let output: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--input') {
      const input = args[index + 1];
      if (!input) throw new Error('--input requires a filename');
      inputs.push({ bundle: input });
      index += 1;
    } else if (arg === '--recover-with') {
      const queue = args[index + 1];
      const prior = inputs.at(-1);
      if (!queue || !prior) {
        throw new Error('--recover-with requires a preceding --input and a queue filename');
      }
      if (prior.recoveryQueue)
        throw new Error('Each --input accepts at most one --recover-with queue');
      prior.recoveryQueue = queue;
      index += 1;
    } else if (arg === '--output') {
      const value = args[index + 1];
      if (!value) throw new Error('--output requires a filename');
      output = value;
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${arg ?? ''}`);
    }
  }

  if (inputs.length === 0 || !output) {
    throw new Error(
      'Usage: import:commute-session-bundles -- --input <bundle.txt> [--recover-with <queue.txt>] [--input <bundle.txt> ...] --output <private-record.json>'
    );
  }

  return { inputs, output };
}

function ensurePrivateOutput(output: string): void {
  const privateRoot = path.resolve('.private');
  const resolvedOutput = path.resolve(output);
  if (!resolvedOutput.startsWith(`${privateRoot}${path.sep}`)) {
    throw new Error('--output must be inside the gitignored .private directory');
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))
) {
  await main();
}
