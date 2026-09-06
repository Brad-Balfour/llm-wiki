import { createHash } from 'node:crypto';

import { errorMessage } from '../shared/errors.js';
import { stripMarkdownFence } from '../shared/json.js';
import { requireDate, requireDateTime } from '../shared/time.js';
import { requireHttpUrl } from '../shared/url.js';
import {
  optionalString,
  rejectUnknownKeys,
  requireArray,
  requireEnum,
  requirePositiveInteger,
  requireRecord,
  requireScore,
  requireString,
  requireStringArray,
  requireUniqueStrings,
} from '../shared/validate.js';
export const COMMUTE_SESSION_BUNDLE_SCHEMA_VERSION = 'commute-session-bundle.v1';

export const VOICE_SURFACES = [
  'chatgpt_live',
  'chatgpt_advanced',
  'chatgpt_standard',
  'other',
] as const;
export type VoiceSurface = (typeof VOICE_SURFACES)[number];

export const INTEGRITY_STATES = ['complete', 'partial', 'recovered'] as const;
export type IntegrityState = (typeof INTEGRITY_STATES)[number];

export const EVIDENCE_SOURCES = [
  'durable_contemporaneous_record',
  'selected_queue_snapshot',
  'explicit_user_capture',
  'user_provided_chat_or_ui_observation',
] as const;
export type EvidenceSource = (typeof EVIDENCE_SOURCES)[number];

export const ITEM_ACTIONS = [
  'wiki_this',
  'mark_interested',
  'mark_uninterested',
  'promote_to_in_depth',
  'save_for_review',
  'skip',
] as const;
export type ItemAction = (typeof ITEM_ACTIONS)[number];

export const PLAYBACK_STATUSES = ['not_started', 'partial', 'completed', 'abandoned'] as const;
export type PlaybackStatus = (typeof PLAYBACK_STATUSES)[number];

export const PLAYBACK_TRANSITIONS = [
  'next',
  'previous',
  'jump',
  'repeat',
  'interrupted',
  'voice_restart',
  'duplicate_recognition',
] as const;
export type PlaybackTransition = (typeof PLAYBACK_TRANSITIONS)[number];

export interface QueueItemIdentity {
  source_item_id: string;
  title: string;
  url: string;
}

export interface QueueSnapshot {
  filename: string;
  queue: Record<string, unknown>;
}

export interface QueueV4Pair {
  playbackFile: Record<string, unknown>;
  referenceFile: Record<string, unknown>;
}

export interface DailyQueueV4PairInput {
  mainFilename: string;
  referenceFilename?: string;
  playbackFile: unknown;
  referenceFile: unknown;
}

interface QueueItemIndex {
  byId: Map<string, QueueItemIdentity>;
  ordered: QueueItemIdentity[];
}

export interface EventEvidence {
  source: EvidenceSource;
  reference: string;
}

interface BaseSessionEvent {
  event_id: string;
  sequence: number;
  evidence: EventEvidence[];
}

export interface ItemAnnouncedEvent extends BaseSessionEvent {
  kind: 'item_announced';
  item: QueueItemIdentity;
}

export interface ItemActionEvent extends BaseSessionEvent {
  kind: 'item_action';
  action: ItemAction;
  item: QueueItemIdentity;
  user_words: string;
  discussion?: ItemDiscussion;
  discussion_warning?: string;
}

export interface ItemDiscussion {
  summary: string;
  important_questions: string[];
  conclusions: string[];
  requested_emphasis: string[];
  evidence: EventEvidence[];
}

export interface UnresolvedCaptureEvent extends BaseSessionEvent {
  kind: 'unresolved_capture';
  capture_type: 'wiki_this' | 'feedback' | 'general_save' | 'unknown';
  user_words: string;
  recovery_clues: string[];
}

export interface QualityIncidentEvent extends BaseSessionEvent {
  kind: 'quality_incident';
  observed_behavior: string;
  boundary: string;
}

export interface PlaybackTransitionEvent extends BaseSessionEvent {
  kind: 'playback_transition';
  transition: PlaybackTransition;
  item: QueueItemIdentity;
}

export interface GeneralCaptureEvent extends BaseSessionEvent {
  kind: 'general_capture';
  user_words: string;
}

export interface SessionBoundaryEvent extends BaseSessionEvent {
  kind: 'session_boundary';
  boundary: 'start' | 'end';
}

export type SessionEvent =
  | ItemAnnouncedEvent
  | ItemActionEvent
  | UnresolvedCaptureEvent
  | QualityIncidentEvent
  | PlaybackTransitionEvent
  | GeneralCaptureEvent
  | SessionBoundaryEvent;

export interface PlaybackState {
  status: PlaybackStatus;
  last_announced_source_item_id?: string;
  resume_source_item_id?: string;
}

export interface BundleIntegrity {
  state: IntegrityState;
  incomplete_reason?: string;
  unresolved_event_ids: string[];
  durable_event_record?: {
    filename: string;
    sha256: string;
    covered_event_ids: string[];
  };
}

export interface CommuteSessionBundle {
  schema_version: typeof COMMUTE_SESSION_BUNDLE_SCHEMA_VERSION;
  session: {
    session_id: string;
    session_date: string;
    artifact_filename: string;
    voice_surface: VoiceSurface;
  };
  queue_snapshot: QueueSnapshot;
  playback: PlaybackState;
  integrity: BundleIntegrity;
  events: SessionEvent[];
}

export function parseCommuteSessionBundleText(text: string): CommuteSessionBundle {
  return validateCommuteSessionBundle(parseCommuteSessionBundleJson(text));
}

export interface RelaxedArtifactFilenameParse {
  bundle: CommuteSessionBundle;
  declaredArtifactFilename?: string;
}

export function parseCommuteSessionBundleTextWithRelaxedArtifactFilename(
  text: string,
  fallbackArtifactFilename: string
): RelaxedArtifactFilenameParse {
  const candidate = requireRecord(parseCommuteSessionBundleJson(text), 'bundle');
  const session = requireRecord(candidate.session, 'session');
  const rawArtifactFilename = session.artifact_filename;
  const declaredArtifactFilename =
    typeof rawArtifactFilename === 'string' && rawArtifactFilename.trim().length > 0
      ? rawArtifactFilename
      : undefined;
  if (
    rawArtifactFilename !== undefined &&
    !(typeof rawArtifactFilename === 'string' && rawArtifactFilename.trim().length === 0)
  ) {
    requireString(rawArtifactFilename, 'session.artifact_filename');
  }
  const normalizedCandidate =
    declaredArtifactFilename === undefined
      ? {
          ...candidate,
          session: { ...session, artifact_filename: fallbackArtifactFilename },
        }
      : candidate;

  return {
    bundle: validateCommuteSessionBundleCandidate(normalizedCandidate, false),
    ...(declaredArtifactFilename === undefined ? {} : { declaredArtifactFilename }),
  };
}

function parseCommuteSessionBundleJson(text: string): unknown {
  const normalized = stripMarkdownFence(text.trim());

  try {
    return JSON.parse(normalized) as unknown;
  } catch (error) {
    throw new Error(`Commute session bundle is not valid JSON: ${errorMessage(error)}`);
  }
}

export function validateCommuteSessionBundle(candidate: unknown): CommuteSessionBundle {
  return validateCommuteSessionBundleCandidate(candidate, true);
}

function validateCommuteSessionBundleCandidate(
  candidate: unknown,
  validateSessionArtifactFilename: boolean
): CommuteSessionBundle {
  const record = requireRecord(candidate, 'bundle');
  rejectUnknownKeys(
    record,
    ['schema_version', 'session', 'queue_snapshot', 'playback', 'integrity', 'events'],
    'bundle'
  );

  if (record.schema_version !== COMMUTE_SESSION_BUNDLE_SCHEMA_VERSION) {
    throw new Error(
      `schema_version must be ${COMMUTE_SESSION_BUNDLE_SCHEMA_VERSION}, not ${String(record.schema_version)}`
    );
  }

  const session = validateSession(record.session, validateSessionArtifactFilename);
  const queueSnapshot = validateQueueSnapshot(record.queue_snapshot);
  const queueItems = indexQueueItems(queueSnapshot.queue, queueSnapshot.filename);
  const playback = validatePlayback(record.playback, queueItems);
  const events = validateEvents(record.events, queueItems);
  const integrity = validateIntegrity(record.integrity, events);
  const finalCurrentSourceItemId = validateLifecycle(events, queueItems, integrity.state);
  validatePlaybackMatchesEvents(playback, events, finalCurrentSourceItemId);

  return {
    schema_version: COMMUTE_SESSION_BUNDLE_SCHEMA_VERSION,
    session,
    queue_snapshot: queueSnapshot,
    playback,
    integrity,
    events,
  };
}

export function queueSnapshotFingerprint(queue: unknown): string {
  return `sha256:${createHash('sha256').update(canonicalJson(queue), 'utf8').digest('hex')}`;
}

export function playbackFileFingerprint(playback: unknown): string {
  return `sha256:${createHash('sha256').update(JSON.stringify(playback), 'utf8').digest('hex')}`;
}

export function createQueueV4Snapshot(
  playbackCandidate: unknown,
  referenceCandidate: unknown,
  mainFilename?: string,
  referenceFilename?: string
): Record<string, unknown> {
  const pair = validateTldrCommuteQueuePair(
    playbackCandidate,
    referenceCandidate,
    mainFilename,
    referenceFilename
  );
  return {
    queue_version: 'tldr-commute-queue.v4',
    playback_file: pair.playbackFile,
    reference_file: pair.referenceFile,
  };
}

export function validateTldrCommuteQueuePair(
  playbackCandidate: unknown,
  referenceCandidate: unknown,
  mainFilename?: string,
  referenceFilename?: string
): QueueV4Pair {
  const playback = requireRecord(playbackCandidate, 'playback_file');
  if (Object.keys(playback).join(',') !== 'sweep_playback,items') {
    throw new Error('playback_file keys must be sweep_playback then items, with no other fields');
  }
  const playbackItems = requireArray(playback.items, 'playback_file.items');
  playbackItems.forEach((candidate, index) => {
    const field = `playback_file.items[${index}]`;
    const item = requireRecord(candidate, field);
    rejectUnknownKeys(item, ['item_playback'], field);
    requireString(item.item_playback, `${field}.item_playback`);
  });

  const reference = requireRecord(referenceCandidate, 'reference_file');
  rejectSensitiveQueueFields(reference, 'reference_file');
  rejectUnknownKeys(
    reference,
    [
      'queue_version',
      'main_filename',
      'main_sha256',
      'newsletter',
      'edition_date',
      'source_email',
      'daily_generation_id',
      'total_items',
      'profile_version',
      'prompt_version',
      'provider',
      'model',
      'parser_version',
      'route_version',
      'coverage_decisions',
      'items',
    ],
    'reference_file'
  );
  if (reference.queue_version !== 'tldr-commute-queue.v4') {
    throw new Error('reference_file.queue_version must be tldr-commute-queue.v4');
  }
  const declaredMainFilename = requireString(
    reference.main_filename,
    'reference_file.main_filename'
  );
  if (mainFilename !== undefined && declaredMainFilename !== mainFilename) {
    throw new Error('reference_file.main_filename does not match the playback filename');
  }
  if (
    referenceFilename !== undefined &&
    referenceFilename !== declaredMainFilename.replace(/\.txt$/, '-reference.txt')
  ) {
    throw new Error('Reference filename must be the playback filename with -reference before .txt');
  }
  const mainSha256 = requireString(reference.main_sha256, 'reference_file.main_sha256');
  if (!/^sha256:[a-f0-9]{64}$/.test(mainSha256)) {
    throw new Error('reference_file.main_sha256 must be a SHA-256 fingerprint');
  }
  if (mainSha256 !== playbackFileFingerprint(playback)) {
    throw new Error('reference_file.main_sha256 does not match the canonical playback JSON');
  }
  requireString(reference.newsletter, 'reference_file.newsletter');
  requireDate(reference.edition_date, 'reference_file.edition_date');
  validateSourceEmail(reference.source_email, 'tldr-commute-queue.v4');
  requireString(reference.daily_generation_id, 'reference_file.daily_generation_id');
  for (const field of [
    'profile_version',
    'prompt_version',
    'provider',
    'model',
    'parser_version',
    'route_version',
  ] as const) {
    requireString(reference[field], `reference_file.${field}`);
  }
  const totalItems = requireNonNegativeInteger(reference.total_items, 'reference_file.total_items');
  const referenceItems = requireArray(reference.items, 'reference_file.items');
  if (playbackItems.length !== totalItems || referenceItems.length !== totalItems) {
    throw new Error('v4 pair total_items must equal both item-array lengths');
  }

  const identities = referenceItems.map((candidate, index) => {
    const field = `reference_file.items[${index}]`;
    const item = validateQueueV4ReferenceItem(candidate, field, index + 1);
    const playbackItem = requireRecord(playbackItems[index], `playback_file.items[${index}]`);
    const actualPlayback = requireString(
      playbackItem.item_playback,
      `playback_file.items[${index}].item_playback`
    );
    const prefix = renderV4PlaybackPrefix(index + 1, totalItems, item.consumptionDepth, item.title);
    const expected = [prefix, ...item.playbackLines].join('\n');
    if (actualPlayback !== expected) {
      throw new Error(
        `playback_file.items[${index}].item_playback must equal the deterministic v4 playback`
      );
    }
    return item.identity;
  });
  requireUniqueStrings(
    identities.map((item) => item.source_item_id),
    'reference_file.items[].source_item_id'
  );
  requireUniqueStrings(
    identities.map((item) => item.url),
    'reference_file.items[].url'
  );
  const decisions = requireArray(
    reference.coverage_decisions,
    'reference_file.coverage_decisions'
  ).map((candidate, index) =>
    validateCoverageDecision(candidate, `reference_file.coverage_decisions[${index}]`)
  );
  requireUniqueStrings(
    decisions.map((decision) => decision.sourceOccurrenceId),
    'reference_file.coverage_decisions[].source_occurrence_id'
  );
  const localItemIds = new Set(identities.map((item) => item.source_item_id));
  for (const decision of decisions) {
    if (
      decision.retainedMainFilename === declaredMainFilename &&
      !localItemIds.has(decision.retainedSourceItemId)
    ) {
      throw new Error(
        `reference_file.coverage_decisions retained item ${decision.retainedSourceItemId} does not exist in ${declaredMainFilename}`
      );
    }
  }
  const expectedSweep = referenceItems
    .map((candidate, index) => {
      const item = requireRecord(candidate, `reference_file.items[${index}]`);
      return renderV4PlaybackPrefix(
        index + 1,
        totalItems,
        requireEnum(
          item.consumption_depth,
          ['headline_only', 'in_depth'] as const,
          `reference_file.items[${index}].consumption_depth`
        ),
        requireString(item.title, `reference_file.items[${index}].title`)
      );
    })
    .join('\n');
  if (
    requireStringAllowEmpty(playback.sweep_playback, 'playback_file.sweep_playback') !==
    expectedSweep
  ) {
    throw new Error('playback_file.sweep_playback must equal the deterministic v4 sweep');
  }
  return { playbackFile: playback, referenceFile: reference };
}

export function validateTldrCommuteDailyPairs(candidates: DailyQueueV4PairInput[]): QueueV4Pair[] {
  const pairs = candidates.map((candidate) =>
    validateTldrCommuteQueuePair(
      candidate.playbackFile,
      candidate.referenceFile,
      candidate.mainFilename,
      candidate.referenceFilename
    )
  );
  if (pairs.length === 0) return pairs;

  const generationIds = new Set(
    pairs.map((pair) =>
      requireString(pair.referenceFile.daily_generation_id, 'daily_generation_id')
    )
  );
  const editionDates = new Set(
    pairs.map((pair) => requireDate(pair.referenceFile.edition_date, 'edition_date'))
  );
  if (generationIds.size !== 1 || editionDates.size !== 1) {
    throw new Error('Daily v4 pairs must share one daily_generation_id and edition_date');
  }

  const retainedItems = new Map<string, Set<string>>();
  const occurrenceOwners = new Map<string, string>();
  const retainedUrls = new Map<string, string>();
  const requiredDecisions = new Map<string, { owner: string; outcomes: ReadonlySet<string> }>();
  for (const pair of pairs) {
    const filename = requireString(
      pair.referenceFile.main_filename,
      'reference_file.main_filename'
    );
    if (retainedItems.has(filename)) throw new Error(`Duplicate daily main filename: ${filename}`);
    const itemIds = new Set<string>();
    for (const [index, candidate] of requireArray(pair.referenceFile.items, 'items').entries()) {
      const item = requireRecord(candidate, `items[${index}]`);
      const itemId = requireString(item.source_item_id, `items[${index}].source_item_id`);
      const owner = `${filename}#${itemId}`;
      const itemUrl = requireHttpUrl(item.url, `items[${index}].url`);
      const priorUrlOwner = retainedUrls.get(itemUrl);
      if (priorUrlOwner !== undefined && priorUrlOwner !== owner) {
        throw new Error(`Resolved URL ${itemUrl} is retained by multiple daily items`);
      }
      retainedUrls.set(itemUrl, owner);
      itemIds.add(itemId);
      const selectedOccurrenceId = requireString(
        item.selected_source_occurrence_id,
        `items[${index}].selected_source_occurrence_id`
      );
      const coverage = requireRecord(item.coverage, `items[${index}].coverage`);
      const coverageStatus = requireEnum(
        coverage.status,
        ['original', 'deduplicated', 'useful_update', 'uncertain'] as const,
        `items[${index}].coverage.status`
      );
      for (const [occurrenceIndex, occurrenceCandidate] of requireArray(
        item.source_occurrences,
        `items[${index}].source_occurrences`
      ).entries()) {
        const occurrence = requireRecord(
          occurrenceCandidate,
          `items[${index}].source_occurrences[${occurrenceIndex}]`
        );
        const occurrenceId = requireString(occurrence.occurrence_id, 'occurrence_id');
        const priorOwner = occurrenceOwners.get(occurrenceId);
        if (priorOwner !== undefined && priorOwner !== owner) {
          throw new Error(`Source occurrence ${occurrenceId} is retained by multiple daily items`);
        }
        occurrenceOwners.set(occurrenceId, owner);
        if (occurrenceId !== selectedOccurrenceId) {
          requiredDecisions.set(occurrenceId, {
            owner,
            outcomes: new Set(['removed_exact_url', 'removed_same_story']),
          });
        }
      }
      if (coverageStatus === 'useful_update' || coverageStatus === 'uncertain') {
        requiredDecisions.set(selectedOccurrenceId, {
          owner,
          outcomes: new Set([
            coverageStatus === 'useful_update' ? 'kept_update' : 'kept_uncertain',
          ]),
        });
      }
    }
    retainedItems.set(filename, itemIds);
  }

  const decisions = new Map<string, ReturnType<typeof validateCoverageDecision>>();
  for (const pair of pairs) {
    for (const [index, candidate] of requireArray(
      pair.referenceFile.coverage_decisions,
      'coverage_decisions'
    ).entries()) {
      const decision = validateCoverageDecision(candidate, `coverage_decisions[${index}]`);
      if (decisions.has(decision.sourceOccurrenceId)) {
        throw new Error(
          `Coverage decision for ${decision.sourceOccurrenceId} appears more than once in the daily pairs`
        );
      }
      decisions.set(decision.sourceOccurrenceId, decision);
      const targetIds = retainedItems.get(decision.retainedMainFilename);
      if (targetIds === undefined || !targetIds.has(decision.retainedSourceItemId)) {
        throw new Error(
          `Coverage decision target ${decision.retainedMainFilename}#${decision.retainedSourceItemId} does not exist in the daily pairs`
        );
      }
      const owner = occurrenceOwners.get(decision.sourceOccurrenceId);
      const expectedOwner = `${decision.retainedMainFilename}#${decision.retainedSourceItemId}`;
      if (owner !== expectedOwner) {
        throw new Error(
          `Coverage decision occurrence ${decision.sourceOccurrenceId} is not stored on retained item ${expectedOwner}`
        );
      }
    }
  }
  for (const [occurrenceId, required] of requiredDecisions) {
    const decision = decisions.get(occurrenceId);
    if (decision === undefined) {
      throw new Error(`Source occurrence ${occurrenceId} is missing its coverage decision`);
    }
    if (
      `${decision.retainedMainFilename}#${decision.retainedSourceItemId}` !== required.owner ||
      !required.outcomes.has(decision.outcome)
    ) {
      throw new Error(`Coverage decision for ${occurrenceId} does not match its retained item`);
    }
  }
  for (const occurrenceId of decisions.keys()) {
    if (!requiredDecisions.has(occurrenceId)) {
      throw new Error(`Coverage decision for ${occurrenceId} has no removed or related occurrence`);
    }
  }
  return pairs;
}

/** Validate the single queue contract without requiring a session bundle. */
export function validateTldrCommuteQueue(candidate: unknown): Record<string, unknown> {
  const queue = requireRecord(candidate, 'queue');
  rejectSensitiveQueueFields(queue, 'queue');
  indexQueueItems(queue);
  return queue;
}

/** @deprecated Use validateTldrCommuteQueue. Kept for source compatibility. */
export const validateTldrCommuteQueueV2 = validateTldrCommuteQueue;

export function queueMetadataRecord(queue: Record<string, unknown>): Record<string, unknown> {
  return queue.queue_version === 'tldr-commute-queue.v4'
    ? requireRecord(queue.reference_file, 'queue.reference_file')
    : queue;
}

/** Hash an externally stored record byte-for-byte. Unlike a queue snapshot, a
 * durable record is not JSON-normalized before hashing. */
export function fileSha256(text: string): string {
  return `sha256:${createHash('sha256').update(text, 'utf8').digest('hex')}`;
}

export function bundleArtifactFilenameMatches(
  actualFilename: string,
  declaredFilename: string
): boolean {
  if (actualFilename === declaredFilename) return true;
  return (
    !hasLibrarySuffix(declaredFilename) &&
    /^\d{8}\d{4}-(?:morning|evening)-commute-session-bundle ?\([1-9][0-9]*\)\.txt$/.test(
      actualFilename
    ) &&
    actualFilename.replace(/ ?\([1-9][0-9]*\)\.txt$/, '.txt') === declaredFilename
  );
}

export function canonicalBundleArtifactFilename(filename: string): string {
  validateArtifactFilenameShape(filename);
  return filename.replace(/ ?\([1-9][0-9]*\)\.txt$/, '.txt');
}

function validateSession(
  candidate: unknown,
  validateSessionArtifactFilename: boolean
): CommuteSessionBundle['session'] {
  const record = requireRecord(candidate, 'session');
  rejectUnknownKeys(
    record,
    ['session_id', 'session_date', 'artifact_filename', 'voice_surface'],
    'session'
  );
  const sessionDate = requireString(record.session_date, 'session.session_date');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(sessionDate)) {
    throw new Error('session.session_date must use YYYY-MM-DD');
  }

  const artifactFilename = requireString(record.artifact_filename, 'session.artifact_filename');
  if (validateSessionArtifactFilename) validateArtifactFilename(artifactFilename, sessionDate);

  return {
    session_id: requireString(record.session_id, 'session.session_id'),
    session_date: sessionDate,
    artifact_filename: artifactFilename,
    voice_surface: requireEnum(record.voice_surface, VOICE_SURFACES, 'session.voice_surface'),
  };
}

function validateQueueSnapshot(candidate: unknown): QueueSnapshot {
  const record = requireRecord(candidate, 'queue_snapshot');
  rejectUnknownKeys(record, ['filename', 'queue'], 'queue_snapshot');
  const queue = requireRecord(record.queue, 'queue_snapshot.queue');
  rejectSensitiveQueueFields(queue, 'queue_snapshot.queue');

  return {
    filename: requireString(record.filename, 'queue_snapshot.filename'),
    queue,
  };
}

function indexQueueItems(
  record: Record<string, unknown>,
  expectedMainFilename?: string
): QueueItemIndex {
  const queueVersion = requireString(record.queue_version, 'queue_snapshot.queue.queue_version');
  if (
    queueVersion !== 'tldr-commute-queue.v2' &&
    queueVersion !== 'tldr-commute-queue.v3' &&
    queueVersion !== 'tldr-commute-queue.v4'
  ) {
    unsupportedQueueVersion(queueVersion);
  }
  if (queueVersion === 'tldr-commute-queue.v4') {
    rejectUnknownKeys(
      record,
      ['queue_version', 'playback_file', 'reference_file'],
      'queue_snapshot.queue'
    );
    const pair = validateTldrCommuteQueuePair(
      record.playback_file,
      record.reference_file,
      expectedMainFilename
    );
    const referenceItems = requireArray(pair.referenceFile.items, 'reference_file.items');
    const ordered = referenceItems.map((candidate, index) => {
      const item = validateQueueV4ReferenceItem(
        candidate,
        `reference_file.items[${index}]`,
        index + 1
      );
      return item.identity;
    });
    return indexUniqueQueueItems(ordered);
  }
  requireString(record.newsletter, 'queue_snapshot.queue.newsletter');
  requireDate(record.edition_date, 'queue_snapshot.queue.edition_date');
  validateSourceEmail(record.source_email, queueVersion);
  const ordered =
    queueVersion === 'tldr-commute-queue.v2'
      ? indexQueue(record, 'v2')
      : queueVersion === 'tldr-commute-queue.v3'
        ? indexQueue(record, 'v3')
        : unsupportedQueueVersion(queueVersion);
  return indexUniqueQueueItems(ordered, true);
}

function indexUniqueQueueItems(
  ordered: QueueItemIdentity[],
  requireAtLeastOne = false
): QueueItemIndex {
  const byId = new Map<string, QueueItemIdentity>();
  const urls = new Set<string>();
  for (const item of ordered) {
    if (byId.has(item.source_item_id)) {
      throw new Error(`queue_snapshot.queue contains duplicate ${item.source_item_id}`);
    }
    byId.set(item.source_item_id, item);
    if (urls.has(item.url)) {
      throw new Error(`queue_snapshot.queue contains duplicate URL ${item.url}`);
    }
    urls.add(item.url);
  }
  if (requireAtLeastOne && byId.size === 0) {
    throw new Error(
      'queue_snapshot.queue must contain queue items with source_item_id, title, and url'
    );
  }
  return { byId, ordered };
}

function indexQueue(record: Record<string, unknown>, version: 'v2' | 'v3'): QueueItemIdentity[] {
  rejectUnknownKeys(
    record,
    [
      'queue_version',
      'newsletter',
      'edition_date',
      'source_email',
      'total_items',
      ...(version === 'v3' ? ['sweep_playback'] : []),
      'items',
    ],
    'queue_snapshot.queue'
  );
  const totalItems = requirePositiveInteger(record.total_items, 'queue_snapshot.queue.total_items');
  const values = requireArray(record.items, 'queue_snapshot.queue.items');
  if (values.length !== totalItems) {
    throw new Error('queue_snapshot.queue.total_items must equal items.length');
  }
  const ordered = values.map((candidate, index) => {
    const itemPath = `queue_snapshot.queue.items[${index}]`;
    const item = validateQueueItem(candidate, itemPath, version);
    const record = requireRecord(candidate, itemPath);
    const playback = requireRecord(record.playback, `${itemPath}.playback`);
    rejectUnknownKeys(playback, ['position', 'total', 'spoken'], `${itemPath}.playback`);
    const position = requirePositiveInteger(playback.position, `${itemPath}.playback.position`);
    const total = requirePositiveInteger(playback.total, `${itemPath}.playback.total`);
    const spoken = requireString(playback.spoken, `${itemPath}.playback.spoken`);
    if (position !== index + 1 || total !== totalItems || spoken !== `${position} of ${total}`) {
      throw new Error(
        `${itemPath}.playback must be the contiguous literal ${index + 1} of ${totalItems}`
      );
    }
    return item;
  });
  if (version === 'v3') {
    const expected = renderQueueSweepPlayback(
      values.map((candidate, index) => {
        const itemPath = `queue_snapshot.queue.items[${index}]`;
        const item = requireRecord(candidate, itemPath);
        const playback = requireRecord(item.playback, `${itemPath}.playback`);
        return {
          playback: { spoken: requireString(playback.spoken, `${itemPath}.playback.spoken`) },
          consumption_depth: requireEnum(
            item.consumption_depth,
            ['headline_only', 'in_depth'] as const,
            `${itemPath}.consumption_depth`
          ),
          title: requireString(item.title, `${itemPath}.title`),
        };
      })
    );
    if (requireString(record.sweep_playback, 'queue_snapshot.queue.sweep_playback') !== expected) {
      throw new Error(
        'queue_snapshot.queue.sweep_playback must equal the deterministic rendered sweep'
      );
    }
  }
  return ordered;
}

function unsupportedQueueVersion(version: string): never {
  throw new Error(
    `queue_snapshot.queue.queue_version must be tldr-commute-queue.v2, tldr-commute-queue.v3, or tldr-commute-queue.v4, not ${version}`
  );
}

function validateQueueV4ReferenceItem(
  candidate: unknown,
  itemPath: string,
  expectedPosition: number
): {
  identity: QueueItemIdentity;
  title: string;
  description: string;
  consumptionDepth: 'headline_only' | 'in_depth';
  playbackLines: string[];
} {
  const record = requireRecord(candidate, itemPath);
  rejectUnknownKeys(
    record,
    [
      'position',
      'source_item_id',
      'title',
      'description',
      'author',
      'publication',
      'attribution',
      'url',
      'source_occurrences',
      'selected_source_occurrence_id',
      'coverage',
      'playback_context',
      'interest_level',
      'interest_score',
      'consumption_depth',
      'depth_score',
      'commute_behavior',
      'signals',
      'reason',
      'classified_at',
      'routed_at',
    ],
    itemPath
  );
  if (requirePositiveInteger(record.position, `${itemPath}.position`) !== expectedPosition) {
    throw new Error(`${itemPath}.position must be ${expectedPosition}`);
  }
  const title = requireString(record.title, `${itemPath}.title`);
  const description = requireString(record.description, `${itemPath}.description`);
  const author = requireString(record.author, `${itemPath}.author`);
  const publication = requireString(record.publication, `${itemPath}.publication`);
  const url = identityUrl(record.url, itemPath);
  validateAttribution(record.attribution, itemPath, author, publication, url);
  const occurrences = requireArray(record.source_occurrences, `${itemPath}.source_occurrences`).map(
    (occurrence, index) =>
      validateSourceOccurrence(occurrence, `${itemPath}.source_occurrences[${index}]`)
  );
  if (occurrences.length === 0) {
    throw new Error(`${itemPath}.source_occurrences must contain at least one occurrence`);
  }
  requireUniqueStrings(
    occurrences.map((occurrence) => occurrence.occurrenceId),
    `${itemPath}.source_occurrences[].occurrence_id`
  );
  const selectedOccurrenceId = requireString(
    record.selected_source_occurrence_id,
    `${itemPath}.selected_source_occurrence_id`
  );
  const selectedOccurrence = occurrences.find(
    (occurrence) => occurrence.occurrenceId === selectedOccurrenceId
  );
  if (selectedOccurrence === undefined) {
    throw new Error(`${itemPath}.selected_source_occurrence_id must name a source occurrence`);
  }
  const sourceItemId = requireString(record.source_item_id, `${itemPath}.source_item_id`);
  if (
    selectedOccurrence.sourceItemId !== sourceItemId ||
    selectedOccurrence.title !== title ||
    selectedOccurrence.description !== description ||
    selectedOccurrence.url !== url
  ) {
    throw new Error(`${itemPath} must copy identity and source text from its selected occurrence`);
  }
  const coverage = validateItemCoverage(record.coverage, `${itemPath}.coverage`);
  requireEnum(
    record.interest_level,
    ['interested', 'maybe', 'uninterested'] as const,
    `${itemPath}.interest_level`
  );
  requireScore(record.interest_score, `${itemPath}.interest_score`);
  const consumptionDepth = requireEnum(
    record.consumption_depth,
    ['headline_only', 'in_depth'] as const,
    `${itemPath}.consumption_depth`
  );
  const playbackLines = validatePlaybackContext(
    record.playback_context,
    `${itemPath}.playback_context`,
    consumptionDepth,
    description,
    selectedOccurrenceId,
    occurrences,
    coverage
  );
  requireScore(record.depth_score, `${itemPath}.depth_score`);
  requireString(record.commute_behavior, `${itemPath}.commute_behavior`);
  requireStringArray(record.signals, `${itemPath}.signals`);
  requireString(record.reason, `${itemPath}.reason`);
  requireDateTime(record.classified_at, `${itemPath}.classified_at`);
  requireDateTime(record.routed_at, `${itemPath}.routed_at`);
  const identity = {
    source_item_id: sourceItemId,
    title,
    url,
  };
  return { identity, title, description, consumptionDepth, playbackLines };
}

interface ValidatedSourceOccurrence {
  occurrenceId: string;
  sourceItemId: string;
  title: string;
  description: string;
  url: string;
}

function validateSourceOccurrence(candidate: unknown, field: string): ValidatedSourceOccurrence {
  const record = requireRecord(candidate, field);
  rejectUnknownKeys(
    record,
    [
      'occurrence_id',
      'newsletter',
      'source_item_id',
      'source_order',
      'title',
      'description',
      'url',
    ],
    field
  );
  requirePositiveInteger(record.source_order, `${field}.source_order`);
  requireString(record.newsletter, `${field}.newsletter`);
  return {
    occurrenceId: requireString(record.occurrence_id, `${field}.occurrence_id`),
    sourceItemId: requireString(record.source_item_id, `${field}.source_item_id`),
    title: requireString(record.title, `${field}.title`),
    description: requireString(record.description, `${field}.description`),
    url: requireHttpUrl(record.url, `${field}.url`),
  };
}

function validateRetainedItem(
  candidate: unknown,
  field: string
): {
  mainFilename: string;
  sourceItemId: string;
} {
  const record = requireRecord(candidate, field);
  rejectUnknownKeys(record, ['main_filename', 'source_item_id'], field);
  return {
    mainFilename: requireString(record.main_filename, `${field}.main_filename`),
    sourceItemId: requireString(record.source_item_id, `${field}.source_item_id`),
  };
}

function validateNullableText(candidate: unknown, field: string): string | null {
  if (candidate === null) return null;
  return requireString(candidate, field);
}

function validateItemCoverage(
  candidate: unknown,
  field: string
): {
  status: 'original' | 'deduplicated' | 'useful_update' | 'uncertain';
  updateNote: string | null;
} {
  const record = requireRecord(candidate, field);
  rejectUnknownKeys(
    record,
    ['status', 'related_retained_item', 'decision_reason', 'update_note'],
    field
  );
  const status = requireEnum(
    record.status,
    ['original', 'deduplicated', 'useful_update', 'uncertain'] as const,
    `${field}.status`
  );
  const related =
    record.related_retained_item === null
      ? null
      : validateRetainedItem(record.related_retained_item, `${field}.related_retained_item`);
  requireString(record.decision_reason, `${field}.decision_reason`);
  const updateNote = validateNullableText(record.update_note, `${field}.update_note`);
  if (
    (status === 'original' || status === 'deduplicated') &&
    (related !== null || updateNote !== null)
  ) {
    throw new Error(`${field} ${status} items must not name a related item or update note`);
  }
  if ((status === 'useful_update' || status === 'uncertain') && related === null) {
    throw new Error(`${field} ${status} items must name the related retained item`);
  }
  if (status === 'useful_update' && updateNote === null) {
    throw new Error(`${field} useful updates must include update_note`);
  }
  if (status !== 'useful_update' && updateNote !== null) {
    throw new Error(`${field} update_note is only allowed for useful updates`);
  }
  return { status, updateNote };
}

function validatePlaybackContext(
  candidate: unknown,
  field: string,
  consumptionDepth: 'headline_only' | 'in_depth',
  selectedDescription: string,
  selectedOccurrenceId: string,
  occurrences: ValidatedSourceOccurrence[],
  coverage: {
    status: 'original' | 'deduplicated' | 'useful_update' | 'uncertain';
    updateNote: string | null;
  }
): string[] {
  const record = requireRecord(candidate, field);
  rejectUnknownKeys(
    record,
    ['headline_context', 'excerpt_source_occurrence_id', 'unusually_long_excerpt', 'update_prefix'],
    field
  );
  const headlineContext = validateNullableText(
    record.headline_context,
    `${field}.headline_context`
  );
  const occurrenceId = validateNullableText(
    record.excerpt_source_occurrence_id,
    `${field}.excerpt_source_occurrence_id`
  );
  if (typeof record.unusually_long_excerpt !== 'boolean') {
    throw new Error(`${field}.unusually_long_excerpt must be a boolean`);
  }
  const unusuallyLong = record.unusually_long_excerpt;
  const updatePrefix = validateNullableText(record.update_prefix, `${field}.update_prefix`);

  if (consumptionDepth === 'in_depth' && (headlineContext !== null || occurrenceId !== null)) {
    throw new Error(`${field} must not add headline context to an in-depth item`);
  }
  if ((headlineContext === null) !== (occurrenceId === null)) {
    throw new Error(`${field} must provide headline context and its occurrence together`);
  }
  if (headlineContext === null && unusuallyLong) {
    throw new Error(`${field} cannot flag a missing excerpt as unusually long`);
  }
  if (headlineContext !== null && occurrenceId !== null) {
    if (occurrenceId !== selectedOccurrenceId) {
      throw new Error(`${field}.excerpt_source_occurrence_id must name the selected occurrence`);
    }
    const occurrence = occurrences.find((value) => value.occurrenceId === occurrenceId);
    if (occurrence === undefined) {
      throw new Error(`${field}.excerpt_source_occurrence_id must name a source occurrence`);
    }
    if (!occurrence.description.startsWith(headlineContext)) {
      throw new Error(`${field}.headline_context must be a literal opening source excerpt`);
    }
    const trimmedContext = headlineContext.trim();
    const closingCharacters = new Set(['"', "'", '”', '’', ')', ']']);
    const finalCharacter = closingCharacters.has(trimmedContext.at(-1) ?? '')
      ? trimmedContext.at(-2)
      : trimmedContext.at(-1);
    if (finalCharacter !== '.' && finalCharacter !== '!' && finalCharacter !== '?') {
      throw new Error(`${field}.headline_context must end at a complete sentence boundary`);
    }
  }
  if (coverage.status === 'useful_update' && updatePrefix !== coverage.updateNote) {
    throw new Error(`${field}.update_prefix must equal the prepared useful-update note`);
  }
  if (coverage.status !== 'useful_update' && updatePrefix !== null) {
    throw new Error(`${field}.update_prefix is only allowed for useful updates`);
  }
  if (headlineContext !== null && headlineContext === updatePrefix) {
    throw new Error(`${field}.update_prefix must not be represented as quoted headline context`);
  }

  const lines: string[] = [];
  if (updatePrefix !== null) lines.push(updatePrefix);
  if (consumptionDepth === 'in_depth') {
    lines.push(selectedDescription);
  } else if (headlineContext !== null) {
    lines.push(headlineContext);
  }
  return lines;
}

function validateCoverageDecision(
  candidate: unknown,
  field: string
): {
  sourceOccurrenceId: string;
  retainedMainFilename: string;
  retainedSourceItemId: string;
  outcome: 'removed_exact_url' | 'removed_same_story' | 'kept_update' | 'kept_uncertain';
} {
  const record = requireRecord(candidate, field);
  rejectUnknownKeys(
    record,
    ['source_occurrence_id', 'outcome', 'retained_item', 'reason', 'new_information'],
    field
  );
  const outcome = requireEnum(
    record.outcome,
    ['removed_exact_url', 'removed_same_story', 'kept_update', 'kept_uncertain'] as const,
    `${field}.outcome`
  );
  const target = validateRetainedItem(record.retained_item, `${field}.retained_item`);
  requireString(record.reason, `${field}.reason`);
  const newInformation = validateNullableText(record.new_information, `${field}.new_information`);
  if (outcome === 'kept_update' && newInformation === null) {
    throw new Error(`${field}.new_information is required for a kept update`);
  }
  if (outcome !== 'kept_update' && newInformation !== null) {
    throw new Error(`${field}.new_information is only allowed for a kept update`);
  }
  return {
    sourceOccurrenceId: requireString(record.source_occurrence_id, `${field}.source_occurrence_id`),
    retainedMainFilename: target.mainFilename,
    retainedSourceItemId: target.sourceItemId,
    outcome,
  };
}

function identityUrl(candidate: unknown, itemPath: string): string {
  return requireHttpUrl(candidate, `${itemPath}.url`);
}

function validateAttribution(
  candidate: unknown,
  itemPath: string,
  author: string,
  publication: string,
  url: string
): void {
  const field = `${itemPath}.attribution`;
  const record = requireRecord(candidate, field);
  rejectUnknownKeys(
    record,
    ['resolved_url', 'author_source', 'publication_source', 'lookup_attempts'],
    field
  );
  const resolvedUrl = requireHttpUrl(record.resolved_url, `${field}.resolved_url`);
  if (resolvedUrl !== url) throw new Error(`${field}.resolved_url must equal the item URL`);
  const authorSource = requireEnum(
    record.author_source,
    ['newsletter', 'article_page', 'no_authors_listed', 'lookup_failed'] as const,
    `${field}.author_source`
  );
  const publicationSource = requireEnum(
    record.publication_source,
    ['newsletter', 'article_page', 'hostname_fallback'] as const,
    `${field}.publication_source`
  );
  const attempts = requireNonNegativeInteger(record.lookup_attempts, `${field}.lookup_attempts`);
  if (attempts > 2) throw new Error(`${field}.lookup_attempts must be no more than 2`);
  const newsletterSufficient = authorSource === 'newsletter' && publicationSource === 'newsletter';
  if (newsletterSufficient && attempts !== 0) {
    throw new Error(`${field}.lookup_attempts must be 0 when newsletter attribution is sufficient`);
  }
  if (!newsletterSufficient && attempts === 0) {
    throw new Error(`${field}.lookup_attempts must be at least 1 for non-newsletter attribution`);
  }
  if (authorSource === 'lookup_failed' && attempts !== 2) {
    throw new Error(`${field}.lookup_attempts must be 2 for a failed lookup after retry`);
  }
  if (authorSource === 'no_authors_listed' && author !== 'No authors listed') {
    throw new Error(`${itemPath}.author must be No authors listed for absent-byline status`);
  }
  if (authorSource === 'lookup_failed' && author !== 'Author lookup failed') {
    throw new Error(`${itemPath}.author must be Author lookup failed for failed lookup status`);
  }
  if (
    (authorSource === 'newsletter' || authorSource === 'article_page') &&
    (author === 'No authors listed' || author === 'Author lookup failed')
  ) {
    throw new Error(`${itemPath}.author status strings are not verified author names`);
  }
  if (publicationSource === 'hostname_fallback') {
    const expected = new URL(url).hostname.replace(/^www\./, '');
    if (publication !== expected) {
      throw new Error(`${itemPath}.publication must equal ${expected} for hostname fallback`);
    }
  }
}

function renderV4PlaybackPrefix(
  position: number,
  total: number,
  depth: 'headline_only' | 'in_depth',
  title: string
): string {
  return `${position} of ${total}. ${depth === 'headline_only' ? 'Headline only' : 'In depth'}. ${title}`;
}

function requireNonNegativeInteger(candidate: unknown, field: string): number {
  if (!Number.isInteger(candidate) || (candidate as number) < 0) {
    throw new Error(`${field} must be a non-negative integer`);
  }
  return candidate as number;
}

function requireStringAllowEmpty(candidate: unknown, field: string): string {
  if (typeof candidate !== 'string') throw new Error(`${field} must be a string`);
  return candidate;
}

export function renderQueuePlaybackText(item: {
  playback: { spoken: string };
  consumption_depth: 'headline_only' | 'in_depth';
  title: string;
  description: string;
}): string {
  const mode = item.consumption_depth === 'headline_only' ? 'Headline only' : 'In depth';
  const prefix = `${item.playback.spoken}. ${mode}. ${item.title}`;
  return item.consumption_depth === 'headline_only' ? prefix : `${prefix}\n${item.description}`;
}

export function renderQueueSweepPlayback(
  items: Array<{
    playback: { spoken: string };
    consumption_depth: 'headline_only' | 'in_depth';
    title: string;
  }>
): string {
  return items
    .map((item) => {
      const mode = item.consumption_depth === 'headline_only' ? 'Headline only' : 'In depth';
      return `${item.playback.spoken}. ${mode}. ${item.title}`;
    })
    .join('\n');
}

function validateQueueItem(
  candidate: unknown,
  itemPath: string,
  version: 'v2' | 'v3'
): QueueItemIdentity {
  const record = requireRecord(candidate, itemPath);
  rejectUnknownKeys(
    record,
    [
      'playback',
      'source_item_id',
      'title',
      version === 'v2' ? 'summary' : 'description',
      ...(version === 'v3' ? ['author', 'publication', 'playback_text'] : []),
      'url',
      'interest_level',
      'interest_score',
      'consumption_depth',
      'depth_score',
      'commute_behavior',
      'signals',
      'reason',
      'profile_version',
      'prompt_version',
      'provider',
      'model',
      'parser_version',
      'route_version',
      'classified_at',
      'routed_at',
    ],
    itemPath
  );
  const playback = requireRecord(record.playback, `${itemPath}.playback`);
  rejectUnknownKeys(playback, ['position', 'total', 'spoken'], `${itemPath}.playback`);
  requirePositiveInteger(playback.position, `${itemPath}.playback.position`);
  requirePositiveInteger(playback.total, `${itemPath}.playback.total`);
  requireString(playback.spoken, `${itemPath}.playback.spoken`);
  if (version === 'v2') {
    requireString(record.summary, `${itemPath}.summary`);
  } else {
    const description = requireString(record.description, `${itemPath}.description`);
    validateNullableString(record.author, `${itemPath}.author`);
    validateNullableString(record.publication, `${itemPath}.publication`);
    const playbackText = requireString(record.playback_text, `${itemPath}.playback_text`);
    const consumptionDepth = requireEnum(
      record.consumption_depth,
      ['headline_only', 'in_depth'] as const,
      `${itemPath}.consumption_depth`
    );
    const expected = renderQueuePlaybackText({
      playback: { spoken: requireString(playback.spoken, `${itemPath}.playback.spoken`) },
      consumption_depth: consumptionDepth,
      title: requireString(record.title, `${itemPath}.title`),
      description,
    });
    if (playbackText !== expected) {
      throw new Error(`${itemPath}.playback_text must equal the deterministic rendered playback`);
    }
  }
  requireEnum(
    record.interest_level,
    ['interested', 'maybe', 'uninterested'] as const,
    `${itemPath}.interest_level`
  );
  requireScore(record.interest_score, `${itemPath}.interest_score`);
  requireEnum(
    record.consumption_depth,
    ['headline_only', 'in_depth'] as const,
    `${itemPath}.consumption_depth`
  );
  requireScore(record.depth_score, `${itemPath}.depth_score`);
  requireString(record.commute_behavior, `${itemPath}.commute_behavior`);
  requireStringArray(record.signals, `${itemPath}.signals`);
  requireString(record.reason, `${itemPath}.reason`);
  requireString(record.profile_version, `${itemPath}.profile_version`);
  requireString(record.prompt_version, `${itemPath}.prompt_version`);
  requireString(record.provider, `${itemPath}.provider`);
  requireString(record.model, `${itemPath}.model`);
  requireString(record.parser_version, `${itemPath}.parser_version`);
  requireString(record.route_version, `${itemPath}.route_version`);
  requireDateTime(record.classified_at, `${itemPath}.classified_at`);
  requireDateTime(record.routed_at, `${itemPath}.routed_at`);
  return {
    source_item_id: requireString(record.source_item_id, `${itemPath}.source_item_id`),
    title: requireString(record.title, `${itemPath}.title`),
    url: requireHttpUrl(record.url, `${itemPath}.url`),
  };
}

function validateNullableString(candidate: unknown, field: string): void {
  if (candidate !== null) requireString(candidate, field);
}

function validateSourceEmail(
  candidate: unknown,
  queueVersion: 'tldr-commute-queue.v2' | 'tldr-commute-queue.v3' | 'tldr-commute-queue.v4'
): void {
  const record = requireRecord(candidate, 'queue_snapshot.queue.source_email');
  rejectUnknownKeys(
    record,
    [
      'gmail_message_id',
      ...(queueVersion === 'tldr-commute-queue.v2' ? ['subject'] : []),
      'sender',
      'delivered_at',
    ],
    'queue_snapshot.queue.source_email'
  );
  requireString(record.gmail_message_id, 'queue_snapshot.queue.source_email.gmail_message_id');
  // `subject` was emitted by early v2 queues. Historical v2 snapshots remain
  // importable, but the v3 schema rejects it because it is not playback identity.
  if (record.subject !== undefined) {
    requireString(record.subject, 'queue_snapshot.queue.source_email.subject');
  }
  requireString(record.sender, 'queue_snapshot.queue.source_email.sender');
  requireDateTime(record.delivered_at, 'queue_snapshot.queue.source_email.delivered_at');
}

function validateArtifactFilename(filename: string, sessionDate: string): void {
  const match = validateArtifactFilenameShape(filename);
  if (match[1] !== sessionDate.replaceAll('-', '')) {
    throw new Error('session.artifact_filename date must match session.session_date');
  }
}

function validateArtifactFilenameShape(filename: string): RegExpExecArray {
  const match =
    /^(\d{8})(\d{4})-(morning|evening)-commute-session-bundle(?: ?\([1-9][0-9]*\))?\.txt$/.exec(
      filename
    );
  if (!match) {
    throw new Error(
      'session.artifact_filename must use YYYYMMDDHHmm-morning|evening-commute-session-bundle.txt, with an optional Library suffix'
    );
  }
  const time = match[2]!;
  const hour = Number(time.slice(0, 2));
  const minute = Number(time.slice(2, 4));
  if (hour > 23 || minute > 59) {
    throw new Error('session.artifact_filename HHmm must be a real local time');
  }
  if (match[3] === 'morning' && hour >= 12) {
    throw new Error('session.artifact_filename morning must use a local time before 1200');
  }
  if (match[3] === 'evening' && hour < 12) {
    throw new Error('session.artifact_filename evening must use a local time from 1200 onward');
  }
  return match;
}

function hasLibrarySuffix(filename: string): boolean {
  return / ?\([1-9][0-9]*\)\.txt$/.test(filename);
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, canonicalize(child)])
    );
  }
  return value;
}

function validatePlayback(candidate: unknown, queueItems: QueueItemIndex): PlaybackState {
  const record = requireRecord(candidate, 'playback');
  rejectUnknownKeys(
    record,
    ['status', 'last_announced_source_item_id', 'resume_source_item_id'],
    'playback'
  );
  const status = requireEnum(record.status, PLAYBACK_STATUSES, 'playback.status');
  const lastAnnounced = optionalQueueItemId(
    record.last_announced_source_item_id,
    'playback.last_announced_source_item_id',
    queueItems
  );
  const resume = optionalQueueItemId(
    record.resume_source_item_id,
    'playback.resume_source_item_id',
    queueItems
  );

  if (status === 'partial' && resume === undefined) {
    throw new Error('playback.resume_source_item_id is required for partial playback');
  }
  if (status === 'not_started' && lastAnnounced !== undefined) {
    throw new Error(
      'playback.last_announced_source_item_id is not allowed for not_started playback'
    );
  }

  return {
    status,
    ...(lastAnnounced === undefined ? {} : { last_announced_source_item_id: lastAnnounced }),
    ...(resume === undefined ? {} : { resume_source_item_id: resume }),
  };
}

function validateEvents(candidate: unknown, queueItems: QueueItemIndex): SessionEvent[] {
  const values = requireArray(candidate, 'events');
  const events = values.map((item, index) => validateEvent(item, index, queueItems));
  const eventIds = events.map((event) => event.event_id);
  requireUniqueStrings(eventIds, 'events[].event_id');

  events.forEach((event, index) => {
    if (event.sequence !== index + 1) {
      throw new Error('events[].sequence must start at 1 and increase without gaps');
    }
  });

  return events;
}

function validateEvent(
  candidate: unknown,
  index: number,
  queueItems: QueueItemIndex
): SessionEvent {
  const field = `events[${index}]`;
  const record = requireRecord(candidate, field);
  const kind = requireEnum(
    record.kind,
    [
      'item_announced',
      'item_action',
      'unresolved_capture',
      'quality_incident',
      'playback_transition',
      'general_capture',
      'session_boundary',
    ] as const,
    `${field}.kind`
  );
  const base = {
    event_id: requireString(record.event_id, `${field}.event_id`),
    sequence: requirePositiveInteger(record.sequence, `${field}.sequence`),
    evidence: validateEvidence(record.evidence, `${field}.evidence`),
  };

  switch (kind) {
    case 'item_announced':
      rejectUnknownKeys(record, ['event_id', 'sequence', 'kind', 'item', 'evidence'], field);
      return {
        ...base,
        kind,
        item: validateExactItem(record.item, `${field}.item`, queueItems),
      };
    case 'item_action': {
      rejectUnknownKeys(
        record,
        ['event_id', 'sequence', 'kind', 'action', 'item', 'user_words', 'discussion', 'evidence'],
        field
      );
      const action = requireEnum(record.action, ITEM_ACTIONS, `${field}.action`);
      const userWords = requireString(record.user_words, `${field}.user_words`);
      requireUserActionEvidence(base.evidence, `${field}.evidence`);
      let discussion: ItemDiscussion | undefined;
      let discussionWarning: string | undefined;
      if (record.discussion !== undefined) {
        try {
          if (action !== 'wiki_this') throw new Error('is allowed only for wiki_this');
          discussion = validateItemDiscussion(record.discussion, `${field}.discussion`);
        } catch (error) {
          discussionWarning = `${field}.discussion was omitted: ${error instanceof Error ? error.message : 'invalid discussion'}`;
        }
      }
      return {
        ...base,
        kind,
        action,
        item: validateExactItem(record.item, `${field}.item`, queueItems),
        user_words: userWords,
        ...(discussion === undefined ? {} : { discussion }),
        ...(discussionWarning === undefined ? {} : { discussion_warning: discussionWarning }),
      };
    }
    case 'unresolved_capture':
      rejectUnknownKeys(
        record,
        [
          'event_id',
          'sequence',
          'kind',
          'capture_type',
          'user_words',
          'recovery_clues',
          'evidence',
        ],
        field
      );
      return {
        ...base,
        kind,
        capture_type: requireEnum(
          record.capture_type,
          ['wiki_this', 'feedback', 'general_save', 'unknown'] as const,
          `${field}.capture_type`
        ),
        user_words: requireString(record.user_words, `${field}.user_words`),
        recovery_clues: requireStringArray(record.recovery_clues, `${field}.recovery_clues`),
      };
    case 'quality_incident':
      rejectUnknownKeys(
        record,
        ['event_id', 'sequence', 'kind', 'observed_behavior', 'boundary', 'evidence'],
        field
      );
      return {
        ...base,
        kind,
        observed_behavior: requireString(record.observed_behavior, `${field}.observed_behavior`),
        boundary: requireString(record.boundary, `${field}.boundary`),
      };
    case 'playback_transition': {
      rejectUnknownKeys(
        record,
        ['event_id', 'sequence', 'kind', 'transition', 'item', 'evidence'],
        field
      );
      const transition = requireEnum(
        record.transition,
        PLAYBACK_TRANSITIONS,
        `${field}.transition`
      );
      if (transition === 'previous' || transition === 'jump' || transition === 'repeat') {
        requireUserActionEvidence(base.evidence, `${field}.evidence`);
      }
      return {
        ...base,
        kind,
        transition,
        item: validateExactItem(record.item, `${field}.item`, queueItems),
      };
    }
    case 'general_capture':
      rejectUnknownKeys(record, ['event_id', 'sequence', 'kind', 'user_words', 'evidence'], field);
      requireUserActionEvidence(base.evidence, `${field}.evidence`);
      return {
        ...base,
        kind,
        user_words: requireString(record.user_words, `${field}.user_words`),
      };
    case 'session_boundary':
      rejectUnknownKeys(record, ['event_id', 'sequence', 'kind', 'boundary', 'evidence'], field);
      return {
        ...base,
        kind,
        boundary: requireEnum(record.boundary, ['start', 'end'] as const, `${field}.boundary`),
      };
  }
}

function validateItemDiscussion(candidate: unknown, field: string): ItemDiscussion {
  const record = requireRecord(candidate, field);
  rejectUnknownKeys(
    record,
    ['summary', 'important_questions', 'conclusions', 'requested_emphasis', 'evidence'],
    field
  );
  const evidence = validateEvidence(record.evidence, `${field}.evidence`);
  requireUserActionEvidence(evidence, `${field}.evidence`);
  return {
    summary: requireString(record.summary, `${field}.summary`),
    important_questions: requireStringArray(
      record.important_questions,
      `${field}.important_questions`
    ),
    conclusions: requireStringArray(record.conclusions, `${field}.conclusions`),
    requested_emphasis: requireStringArray(
      record.requested_emphasis,
      `${field}.requested_emphasis`
    ),
    evidence,
  };
}

function validateEvidence(candidate: unknown, field: string): EventEvidence[] {
  const evidence = requireArray(candidate, field).map((item, index) => {
    const itemField = `${field}[${index}]`;
    const record = requireRecord(item, itemField);
    rejectUnknownKeys(record, ['source', 'reference'], itemField);
    return {
      source: requireEnum(record.source, EVIDENCE_SOURCES, `${itemField}.source`),
      reference: requireString(record.reference, `${itemField}.reference`),
    };
  });
  if (evidence.length === 0) {
    throw new Error(`${field} must contain at least one evidence source`);
  }
  return evidence;
}

function requireUserActionEvidence(evidence: EventEvidence[], field: string): void {
  if (!hasUserActionEvidence(evidence)) {
    throw new Error(`${field} must include direct evidence of the user's action`);
  }
}

function hasUserActionEvidence(evidence: EventEvidence[]): boolean {
  return evidence.some((item) =>
    [
      'durable_contemporaneous_record',
      'explicit_user_capture',
      'user_provided_chat_or_ui_observation',
    ].includes(item.source)
  );
}

function validateExactItem(
  candidate: unknown,
  field: string,
  queueItems: QueueItemIndex
): QueueItemIdentity {
  const record = requireRecord(candidate, field);
  rejectUnknownKeys(record, ['source_item_id', 'title', 'url'], field);
  const item: QueueItemIdentity = {
    source_item_id: requireString(record.source_item_id, `${field}.source_item_id`),
    title: requireString(record.title, `${field}.title`),
    url: requireHttpUrl(record.url, `${field}.url`),
  };
  const snapshotItem = queueItems.byId.get(item.source_item_id);
  if (snapshotItem === undefined) {
    throw new Error(`${field}.source_item_id is not present in the embedded queue snapshot`);
  }
  if (snapshotItem.title !== item.title || snapshotItem.url !== item.url) {
    throw new Error(`${field} must exactly match title and url in the embedded queue snapshot`);
  }
  return item;
}

function validateIntegrity(candidate: unknown, events: SessionEvent[]): BundleIntegrity {
  const record = requireRecord(candidate, 'integrity');
  rejectUnknownKeys(
    record,
    ['state', 'incomplete_reason', 'unresolved_event_ids', 'durable_event_record'],
    'integrity'
  );
  const state = requireEnum(record.state, INTEGRITY_STATES, 'integrity.state');
  const incompleteReason = optionalString(record.incomplete_reason, 'integrity.incomplete_reason');
  const durableEventRecord =
    record.durable_event_record === undefined
      ? undefined
      : validateDurableEventRecord(record.durable_event_record);
  const unresolvedEventIds = requireStringArray(
    record.unresolved_event_ids,
    'integrity.unresolved_event_ids'
  );
  requireUniqueStrings(unresolvedEventIds, 'integrity.unresolved_event_ids');
  const knownEventIds = new Set(events.map((event) => event.event_id));
  for (const eventId of unresolvedEventIds) {
    if (!knownEventIds.has(eventId)) {
      throw new Error('integrity.unresolved_event_ids must name events in this bundle');
    }
  }

  const hasUnresolvedCapture = events.some((event) => event.kind === 'unresolved_capture');
  if (state === 'complete') {
    if (
      incompleteReason !== undefined ||
      unresolvedEventIds.length > 0 ||
      hasUnresolvedCapture ||
      durableEventRecord === undefined
    ) {
      throw new Error(
        'complete integrity requires a durable event record and may not include incomplete or unresolved declarations'
      );
    }
    if (events.length < 2 || !isDurablyBoundedSession(events)) {
      throw new Error('complete integrity requires durable session start and end boundary events');
    }
    if (
      events.some(
        (event) =>
          !event.evidence.some((evidence) => evidence.source === 'durable_contemporaneous_record')
      )
    ) {
      throw new Error(
        'complete integrity requires durable contemporaneous evidence for every event'
      );
    }
    if (
      !sameStringSet(
        durableEventRecord.covered_event_ids,
        events.map((event) => event.event_id)
      )
    ) {
      throw new Error(
        'complete integrity durable_event_record must cover every event exactly once'
      );
    }
  } else {
    if (incompleteReason === undefined) {
      throw new Error('partial or recovered integrity requires integrity.incomplete_reason');
    }
    if (durableEventRecord !== undefined) {
      throw new Error(
        'partial or recovered integrity may not declare a complete durable event record'
      );
    }
  }

  return {
    state,
    ...(incompleteReason === undefined ? {} : { incomplete_reason: incompleteReason }),
    unresolved_event_ids: unresolvedEventIds,
    ...(durableEventRecord === undefined ? {} : { durable_event_record: durableEventRecord }),
  };
}

function validateDurableEventRecord(
  candidate: unknown
): NonNullable<BundleIntegrity['durable_event_record']> {
  const record = requireRecord(candidate, 'integrity.durable_event_record');
  rejectUnknownKeys(
    record,
    ['filename', 'sha256', 'covered_event_ids'],
    'integrity.durable_event_record'
  );
  const sha256 = requireString(record.sha256, 'integrity.durable_event_record.sha256');
  if (!/^sha256:[a-f0-9]{64}$/.test(sha256)) {
    throw new Error('integrity.durable_event_record.sha256 must be a sha256 fingerprint');
  }
  const coveredEventIds = requireStringArray(
    record.covered_event_ids,
    'integrity.durable_event_record.covered_event_ids'
  );
  requireUniqueStrings(coveredEventIds, 'integrity.durable_event_record.covered_event_ids');
  return {
    filename: requireString(record.filename, 'integrity.durable_event_record.filename'),
    sha256,
    covered_event_ids: coveredEventIds,
  };
}

function isDurablyBoundedSession(events: SessionEvent[]): boolean {
  const first = events[0];
  const last = events.at(-1);
  return (
    first?.kind === 'session_boundary' &&
    first.boundary === 'start' &&
    first.evidence.some((evidence) => evidence.source === 'durable_contemporaneous_record') &&
    last?.kind === 'session_boundary' &&
    last.boundary === 'end' &&
    last.evidence.some((evidence) => evidence.source === 'durable_contemporaneous_record')
  );
}

function sameStringSet(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value) => right.includes(value));
}

function validateLifecycle(
  events: SessionEvent[],
  queueItems: QueueItemIndex,
  integrityState: IntegrityState
): string | undefined {
  let currentItemIndex: number | undefined;
  let expectedItemIndex: number | undefined;
  let jumpDepartingItemIndex: number | undefined;
  let skipAwaitingNavigation = false;
  let hasAnnouncedItem = false;

  for (const event of events) {
    if (event.kind === 'item_announced') {
      const announcedIndex = queueItems.ordered.findIndex(
        (item) => item.source_item_id === event.item.source_item_id
      );
      const isImplicitNavigationAfterSkip =
        skipAwaitingNavigation &&
        currentItemIndex !== undefined &&
        announcedIndex === currentItemIndex + 1;
      const isJumpDestination =
        jumpDepartingItemIndex !== undefined && currentItemIndex === undefined;
      const hasPendingTransition = expectedItemIndex !== undefined || isJumpDestination;
      const isFirstAnnouncement = !hasAnnouncedItem && !hasPendingTransition;
      const canRecoverMissingTransition =
        integrityState !== 'complete' &&
        hasAnnouncedItem &&
        !hasPendingTransition &&
        !skipAwaitingNavigation;
      if (
        skipAwaitingNavigation &&
        currentItemIndex !== undefined &&
        announcedIndex !== currentItemIndex + 1
      ) {
        throw new Error(
          `events[${event.sequence - 1}] item_announced is an impossible destination for the recorded relative transition`
        );
      }
      if (
        !isFirstAnnouncement &&
        !hasPendingTransition &&
        !isImplicitNavigationAfterSkip &&
        !canRecoverMissingTransition
      ) {
        throw new Error(
          `events[${event.sequence - 1}] item_announced must follow a valid next, previous, jump, or repeat transition`
        );
      }
      if (isJumpDestination && announcedIndex === jumpDepartingItemIndex) {
        throw new Error(
          `events[${event.sequence - 1}] jump transition must announce a different queue item`
        );
      }
      const expectedAnnouncementIndex =
        currentItemIndex === undefined ? expectedItemIndex : currentItemIndex + 1;
      if (
        !isFirstAnnouncement &&
        !canRecoverMissingTransition &&
        !isJumpDestination &&
        announcedIndex !== expectedAnnouncementIndex
      ) {
        throw new Error(
          `events[${event.sequence - 1}] item_announced is an impossible destination for the recorded relative transition`
        );
      }
      currentItemIndex = announcedIndex;
      jumpDepartingItemIndex = undefined;
      expectedItemIndex = undefined;
      skipAwaitingNavigation = false;
      hasAnnouncedItem = true;
      continue;
    }
    if (event.kind === 'item_action') {
      if (currentItemIndex === undefined) {
        throw new Error(
          `events[${event.sequence - 1}] item_action has no prior announced current item`
        );
      }
      if (event.item.source_item_id !== queueItems.ordered[currentItemIndex]?.source_item_id) {
        throw new Error(
          `events[${event.sequence - 1}] item_action does not match the currently announced item`
        );
      }
      if (event.action === 'skip') {
        // Voice commonly records both a spoken `skip` and a following `next`.
        // Keep the item current until the actual transition, while also
        // accepting the next announcement as an implicit departure if no
        // separate transition was captured.
        skipAwaitingNavigation = true;
      }
      continue;
    }
    if (event.kind === 'playback_transition') {
      if (currentItemIndex === undefined) {
        const transitionItemIndex = queueItems.ordered.findIndex(
          (item) => item.source_item_id === event.item.source_item_id
        );
        const canRecoverMissingAnnouncement =
          integrityState !== 'complete' &&
          ((expectedItemIndex !== undefined && transitionItemIndex === expectedItemIndex) ||
            (jumpDepartingItemIndex !== undefined &&
              transitionItemIndex !== jumpDepartingItemIndex) ||
            (expectedItemIndex === undefined && jumpDepartingItemIndex === undefined));
        if (!canRecoverMissingAnnouncement) {
          throw new Error(
            `events[${event.sequence - 1}] playback_transition has no current announced item`
          );
        }
        // A partial/recovered Voice reconstruction may omit the announcement
        // while preserving an exact departing item. Reconstruct only that
        // cursor state; it never turns an ambiguous action into a wiki target.
        currentItemIndex = transitionItemIndex;
        expectedItemIndex = undefined;
        jumpDepartingItemIndex = undefined;
      }
      const announcedItemIndex: number | undefined = currentItemIndex;
      if (announcedItemIndex === undefined) {
        throw new Error(
          `events[${event.sequence - 1}] playback_transition has no current announced item`
        );
      }
      if (event.item.source_item_id !== queueItems.ordered[announcedItemIndex]?.source_item_id) {
        throw new Error(
          `events[${event.sequence - 1}] playback_transition does not match the currently announced item`
        );
      }
      if (
        event.transition === 'next' &&
        !skipAwaitingNavigation &&
        !hasUserActionEvidence(event.evidence)
      ) {
        throw new Error(
          `events[${event.sequence - 1}] next transition must include direct user evidence or follow an evidenced skip action`
        );
      }
      if (event.transition === 'next') {
        if (announcedItemIndex === queueItems.ordered.length - 1) {
          throw new Error(
            `events[${event.sequence - 1}] next transition cannot move beyond the final queue item`
          );
        }
        expectedItemIndex = announcedItemIndex + 1;
        currentItemIndex = undefined;
        jumpDepartingItemIndex = undefined;
        skipAwaitingNavigation = false;
      } else if (event.transition === 'previous') {
        if (announcedItemIndex === 0) {
          throw new Error(
            `events[${event.sequence - 1}] previous transition cannot move before the first queue item`
          );
        }
        expectedItemIndex = announcedItemIndex - 1;
        currentItemIndex = undefined;
        jumpDepartingItemIndex = undefined;
        skipAwaitingNavigation = false;
      } else if (event.transition === 'jump') {
        expectedItemIndex = undefined;
        currentItemIndex = undefined;
        jumpDepartingItemIndex = announcedItemIndex;
        skipAwaitingNavigation = false;
      } else if (event.transition === 'repeat') {
        // A repeat must be followed by a fresh announcement before any later
        // feedback can be bound to this item. That keeps a post-repeat action
        // from being silently attributed to a stale announcement.
        expectedItemIndex = announcedItemIndex;
        currentItemIndex = undefined;
        jumpDepartingItemIndex = undefined;
        skipAwaitingNavigation = false;
      } else {
        currentItemIndex = undefined;
        expectedItemIndex = undefined;
        jumpDepartingItemIndex = undefined;
        skipAwaitingNavigation = false;
      }
    }
  }

  if (
    integrityState === 'complete' &&
    currentItemIndex === undefined &&
    (expectedItemIndex !== undefined || jumpDepartingItemIndex !== undefined)
  ) {
    throw new Error(
      'complete integrity cannot end with navigation awaiting its destination announcement'
    );
  }

  return currentItemIndex === undefined
    ? undefined
    : queueItems.ordered[currentItemIndex]?.source_item_id;
}

function validatePlaybackMatchesEvents(
  playback: PlaybackState,
  events: SessionEvent[],
  finalCurrentSourceItemId: string | undefined
): void {
  const announced = [...events].reverse().find((event) => event.kind === 'item_announced');
  const finalAnnouncedId =
    announced?.kind === 'item_announced' ? announced.item.source_item_id : undefined;
  if (
    playback.last_announced_source_item_id !== undefined &&
    finalAnnouncedId !== undefined &&
    finalAnnouncedId !== playback.last_announced_source_item_id
  ) {
    throw new Error('playback.last_announced_source_item_id must match the final announced item');
  }
  if (playback.status === 'completed' && playback.resume_source_item_id !== undefined) {
    if (finalCurrentSourceItemId === undefined) {
      throw new Error('completed playback resume cursor requires a final verified current item');
    }
    if (playback.resume_source_item_id !== finalCurrentSourceItemId) {
      throw new Error('completed playback resume cursor must match the final current item');
    }
  }
}

function optionalQueueItemId(
  candidate: unknown,
  field: string,
  queueItems: QueueItemIndex
): string | undefined {
  if (candidate === undefined) return undefined;
  const value = requireString(candidate, field);
  if (!queueItems.byId.has(value)) {
    throw new Error(`${field} is not present in the embedded queue snapshot`);
  }
  return value;
}

function rejectSensitiveQueueFields(candidate: unknown, path: string): void {
  if (Array.isArray(candidate)) {
    candidate.forEach((item, index) => rejectSensitiveQueueFields(item, `${path}[${index}]`));
    return;
  }
  if (typeof candidate !== 'object' || candidate === null) {
    return;
  }

  for (const [key, value] of Object.entries(candidate as Record<string, unknown>)) {
    if (
      /(?:credential|password|secret|api[_-]?key|authorization|cookie|raw.*(?:email|gmail|body)|(?:email|gmail).*body|range)/i.test(
        key
      )
    ) {
      throw new Error(`${path}.${key} is not allowed in a session-bundle queue snapshot`);
    }
    rejectSensitiveQueueFields(value, `${path}.${key}`);
  }
}
