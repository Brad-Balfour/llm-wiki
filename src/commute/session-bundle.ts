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
import type { VoiceSurface } from './handoff.js';
import { VOICE_SURFACES } from './handoff.js';

export const COMMUTE_SESSION_BUNDLE_SCHEMA_VERSION = 'commute-session-bundle.v1';

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
  const normalized = stripMarkdownFence(text.trim());
  let candidate: unknown;

  try {
    candidate = JSON.parse(normalized);
  } catch (error) {
    throw new Error(`Commute session bundle is not valid JSON: ${errorMessage(error)}`);
  }

  return validateCommuteSessionBundle(candidate);
}

export function validateCommuteSessionBundle(candidate: unknown): CommuteSessionBundle {
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

  const session = validateSession(record.session);
  const queueSnapshot = validateQueueSnapshot(record.queue_snapshot);
  const queueItems = indexQueueItems(queueSnapshot.queue);
  const playback = validatePlayback(record.playback, queueItems);
  const events = validateEvents(record.events, queueItems);
  const integrity = validateIntegrity(record.integrity, events);
  validateLifecycle(events, queueItems, integrity.state);
  validatePlaybackMatchesEvents(playback, events);

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

/** Validate the single queue contract without requiring a session bundle. */
export function validateTldrCommuteQueueV2(candidate: unknown): Record<string, unknown> {
  const queue = requireRecord(candidate, 'queue');
  rejectSensitiveQueueFields(queue, 'queue');
  indexQueueItems(queue);
  return queue;
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

function validateSession(candidate: unknown): CommuteSessionBundle['session'] {
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
  validateArtifactFilename(artifactFilename, sessionDate);

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

function indexQueueItems(record: Record<string, unknown>): QueueItemIndex {
  const queueVersion = requireString(record.queue_version, 'queue_snapshot.queue.queue_version');
  requireString(record.newsletter, 'queue_snapshot.queue.newsletter');
  requireDate(record.edition_date, 'queue_snapshot.queue.edition_date');
  validateSourceEmail(record.source_email);
  const ordered =
    queueVersion === 'tldr-commute-queue.v2'
      ? indexV2Queue(record)
      : unsupportedQueueVersion(queueVersion);
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
  if (byId.size === 0) {
    throw new Error(
      'queue_snapshot.queue must contain queue items with source_item_id, title, and url'
    );
  }
  return { byId, ordered };
}

function indexV2Queue(record: Record<string, unknown>): QueueItemIdentity[] {
  rejectUnknownKeys(
    record,
    ['queue_version', 'newsletter', 'edition_date', 'source_email', 'total_items', 'items'],
    'queue_snapshot.queue'
  );
  const totalItems = requirePositiveInteger(record.total_items, 'queue_snapshot.queue.total_items');
  const values = requireArray(record.items, 'queue_snapshot.queue.items');
  if (values.length !== totalItems) {
    throw new Error('queue_snapshot.queue.total_items must equal items.length');
  }
  return values.map((candidate, index) => {
    const itemPath = `queue_snapshot.queue.items[${index}]`;
    const item = validateQueueItem(candidate, itemPath);
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
}

function unsupportedQueueVersion(version: string): never {
  throw new Error(
    `queue_snapshot.queue.queue_version must be tldr-commute-queue.v2, not ${version}`
  );
}

function validateQueueItem(candidate: unknown, itemPath: string): QueueItemIdentity {
  const record = requireRecord(candidate, itemPath);
  rejectUnknownKeys(
    record,
    [
      'playback',
      'source_item_id',
      'title',
      'summary',
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
  requireString(record.summary, `${itemPath}.summary`);
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

function validateSourceEmail(candidate: unknown): void {
  const record = requireRecord(candidate, 'queue_snapshot.queue.source_email');
  rejectUnknownKeys(
    record,
    ['gmail_message_id', 'subject', 'sender', 'delivered_at'],
    'queue_snapshot.queue.source_email'
  );
  requireString(record.gmail_message_id, 'queue_snapshot.queue.source_email.gmail_message_id');
  // `subject` was emitted by early v2 queues. It is deliberately ignored when
  // present so historical queue snapshots remain importable, but new queues do
  // not carry it: it is not part of playback identity and invites topic drift.
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
  if (status === 'completed' && resume !== undefined) {
    throw new Error('playback.resume_source_item_id is not allowed for completed playback');
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
        ['event_id', 'sequence', 'kind', 'action', 'item', 'user_words', 'evidence'],
        field
      );
      const action = requireEnum(record.action, ITEM_ACTIONS, `${field}.action`);
      const userWords = requireString(record.user_words, `${field}.user_words`);
      requireUserActionEvidence(base.evidence, `${field}.evidence`);
      return {
        ...base,
        kind,
        action,
        item: validateExactItem(record.item, `${field}.item`, queueItems),
        user_words: userWords,
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
      if (transition === 'previous' || transition === 'jump') {
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
  if (
    !evidence.some((item) =>
      [
        'durable_contemporaneous_record',
        'explicit_user_capture',
        'user_provided_chat_or_ui_observation',
      ].includes(item.source)
    )
  ) {
    throw new Error(`${field} must include direct evidence of the user's action`);
  }
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
): void {
  let currentItemIndex: number | undefined;
  let expectedItemIndex: number | undefined = 0;
  let jumpDepartingItemIndex: number | undefined;
  let skipAwaitingNavigation = false;

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
      if (
        (currentItemIndex !== undefined && !isImplicitNavigationAfterSkip) ||
        (expectedItemIndex === undefined && !isJumpDestination)
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
      if (!isJumpDestination && announcedIndex !== expectedAnnouncementIndex) {
        throw new Error(
          `events[${event.sequence - 1}] item_announced does not match the expected queue position`
        );
      }
      currentItemIndex = announcedIndex;
      jumpDepartingItemIndex = undefined;
      skipAwaitingNavigation = false;
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
        const canRecoverMissingAnnouncement =
          integrityState !== 'complete' &&
          event.transition === 'next' &&
          expectedItemIndex !== undefined &&
          event.item.source_item_id === queueItems.ordered[expectedItemIndex]?.source_item_id;
        if (!canRecoverMissingAnnouncement) {
          throw new Error(
            `events[${event.sequence - 1}] playback_transition has no current announced item`
          );
        }
        // A partial/recovered Voice reconstruction may omit the announcement
        // while preserving an exact departing item. Reconstruct only that
        // cursor state; it never turns an ambiguous action into a wiki target.
        currentItemIndex = expectedItemIndex;
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
      if (event.transition === 'next') {
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
}

function validatePlaybackMatchesEvents(playback: PlaybackState, events: SessionEvent[]): void {
  const announced = [...events].reverse().find((event) => event.kind === 'item_announced');
  if (
    playback.last_announced_source_item_id !== undefined &&
    announced?.kind === 'item_announced' &&
    announced.item.source_item_id !== playback.last_announced_source_item_id
  ) {
    throw new Error('playback.last_announced_source_item_id must match the final announced item');
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
