import { parseJsonObject } from '../shared/json.js';
import {
  rejectUnknownKeys,
  requireArray,
  requireEnum,
  requireRecord,
  requireString,
  requireStringArray,
  requireUniqueStrings,
} from '../shared/validate.js';
import {
  createQueueV4Snapshot,
  queueMetadataRecord,
  validateTldrCommuteQueue,
  ITEM_ACTIONS,
  validateSession,
  type CommuteSessionBundle,
  type EventEvidence,
  type QueueItemIdentity,
  type SessionEvent,
} from './session-bundle.js';

export const COMPACT_BUNDLE_VERSION = 'commute-session-bundle.v2';

export interface SuppliedQueue {
  filename: string;
  text: string;
  reference?: { filename: string; text: string };
}

type SessionContent = Pick<CommuteSessionBundle, 'session' | 'queue_snapshot' | 'events'>;
export interface CompactSession extends SessionContent {
  schema_version: typeof COMPACT_BUNDLE_VERSION;
}

export function readCanonicalQueue(supplied: SuppliedQueue) {
  const main = parseJsonObject(supplied.text, 'Canonical queue');
  let queue: Record<string, unknown>;
  if (supplied.reference) {
    queue = createQueueV4Snapshot(
      main,
      parseJsonObject(supplied.reference.text, 'Canonical reference'),
      supplied.filename,
      supplied.reference.filename
    );
  } else {
    if (
      main.queue_version !== 'tldr-commute-queue.v2' &&
      main.queue_version !== 'tldr-commute-queue.v3'
    ) {
      throw new Error('Compact v4 bundle requires the canonical --reference file');
    }
    queue = validateTldrCommuteQueue(main);
  }
  const reference = queueMetadataRecord(queue);
  const items = new Map<string, QueueItemIdentity>();
  for (const candidate of requireArray(reference.items, 'reference_file.items')) {
    const row = requireRecord(candidate, 'reference item');
    const item = {
      source_item_id: requireString(row.source_item_id, 'source_item_id'),
      title: requireString(row.title, 'title'),
      url: requireString(row.url, 'url'),
    };
    items.set(item.source_item_id, item);
  }
  return { snapshot: { filename: supplied.filename, queue }, items };
}

export function validateCompactSession(
  record: Record<string, unknown>,
  pair: ReturnType<typeof readCanonicalQueue>
): CompactSession {
  rejectUnknownKeys(record, ['schema_version', 'session', 'queue_filename', 'events'], 'bundle');
  if (record.schema_version !== COMPACT_BUNDLE_VERSION)
    throw new Error('Expected a compact session bundle');
  const session = validateSession(record.session, true);
  if (requireString(record.queue_filename, 'queue_filename') !== pair.snapshot.filename) {
    throw new Error('queue_filename does not match the supplied canonical queue');
  }
  const events = requireArray(record.events, 'events').map((value, index): SessionEvent => {
    const field = `events[${index}]`;
    const event = requireRecord(value, field);
    const event_id = requireString(event.event_id, `${field}.event_id`);
    const kind = requireEnum(
      event.kind,
      ['item_action', 'quality_incident', 'general_capture', 'unresolved_capture'] as const,
      `${field}.kind`
    );
    const allowed = (...keys: string[]) =>
      rejectUnknownKeys(event, ['kind', 'event_id', ...keys], field);
    // Retain a pointer to the actual capture for the existing maintenance record.
    const evidence: EventEvidence[] = [
      {
        source:
          kind === 'quality_incident'
            ? 'user_provided_chat_or_ui_observation'
            : 'explicit_user_capture',
        reference: session.artifact_filename + '#' + event_id,
      },
    ];
    const base = { event_id, sequence: index + 1, evidence };
    if (kind === 'quality_incident') {
      allowed('observed_behavior', 'boundary');
      return {
        ...base,
        kind,
        observed_behavior: requireString(event.observed_behavior, field + '.observed_behavior'),
        boundary: requireString(event.boundary, field + '.boundary'),
      };
    }
    const user_words = requireString(event.user_words, field + '.user_words');
    if (kind === 'general_capture') {
      allowed('user_words');
      return { ...base, kind, user_words };
    }
    if (kind === 'unresolved_capture') {
      allowed('user_words', 'capture_type', 'recovery_clues');
      return {
        ...base,
        kind,
        user_words,
        capture_type: requireEnum(
          event.capture_type,
          ['wiki_this', 'feedback', 'general_save', 'unknown'] as const,
          field + '.capture_type'
        ),
        recovery_clues: requireStringArray(event.recovery_clues, field + '.recovery_clues'),
      };
    }
    allowed('source_item_id', 'action', 'user_words', 'discussion');
    const action = requireEnum(event.action, ITEM_ACTIONS, field + '.action');
    const id = requireString(event.source_item_id, field + '.source_item_id');
    const item = pair.items.get(id);
    if (!item)
      throw new Error(`${field}.source_item_id ${id} is absent from ${pair.snapshot.filename}`);
    const capture = { ...base, kind, user_words, action, item };
    if (event.discussion === undefined) return capture;
    if (action !== 'wiki_this') throw new Error(field + '.discussion requires wiki_this');
    const discussion = requireRecord(event.discussion, field + '.discussion');
    rejectUnknownKeys(
      discussion,
      ['summary', 'important_questions', 'conclusions', 'requested_emphasis'],
      field + '.discussion'
    );
    const list = (key: string) =>
      discussion[key] === undefined
        ? []
        : requireStringArray(discussion[key], field + '.discussion.' + key);
    return {
      ...capture,
      discussion: {
        summary: requireString(discussion.summary, field + '.discussion.summary'),
        important_questions: list('important_questions'),
        conclusions: list('conclusions'),
        requested_emphasis: list('requested_emphasis'),
        evidence,
      },
    };
  });
  requireUniqueStrings(
    events.map((event) => event.event_id),
    'events[].event_id'
  );
  return { schema_version: COMPACT_BUNDLE_VERSION, session, queue_snapshot: pair.snapshot, events };
}
