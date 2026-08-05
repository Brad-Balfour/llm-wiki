import { errorMessage } from '../shared/errors.js';
import { stripMarkdownFence } from '../shared/json.js';
import {
  optionalString,
  rejectUnknownKeys,
  requireArray,
  requireEnum,
  requireRecord,
  requireString,
  requireStringArray,
  requireUniqueStrings,
} from '../shared/validate.js';

export const COMMUTE_HANDOFF_SCHEMA_VERSIONS = [
  'commute-handoff.v1',
  'commute-handoff.v2',
] as const;

export const COMMUTE_HANDOFF_SCHEMA_VERSION = 'commute-handoff.v2';

export type CommuteHandoffSchemaVersion = (typeof COMMUTE_HANDOFF_SCHEMA_VERSIONS)[number];

export const VOICE_SURFACES = [
  'chatgpt_live',
  'chatgpt_advanced',
  'chatgpt_standard',
  'other',
] as const;

export type VoiceSurface = (typeof VOICE_SURFACES)[number];

export const FEEDBACK_ACTIONS = [
  'mark_interested',
  'mark_uninterested',
  'promote_to_in_depth',
  'save_for_review',
  'skip',
] as const;

export type FeedbackAction = (typeof FEEDBACK_ACTIONS)[number];

export const REVIEW_DESTINATIONS = ['wiki_review', 'range_review', 'general_review'] as const;

export type ReviewDestination = (typeof REVIEW_DESTINATIONS)[number];

export const QUEUE_STATUSES = ['not_started', 'partial', 'completed'] as const;

export type QueueStatus = (typeof QUEUE_STATUSES)[number];

export interface CommuteFeedback {
  queue_file: string;
  source_item_id: string;
  title?: string;
  url?: string;
  action: FeedbackAction;
  note?: string;
}

export interface CommuteReviewNote {
  queue_file?: string;
  source_item_id?: string;
  title: string;
  url?: string;
  note: string;
  destination: ReviewDestination;
}

export interface CommuteQueueState {
  queue_file: string;
  status: QueueStatus;
  last_completed_source_item_id?: string;
  current_source_item_id?: string;
  resume_source_item_id?: string;
}

export interface CommuteHandoff {
  schema_version: CommuteHandoffSchemaVersion;
  session_id: string;
  session_date: string;
  voice_surface: VoiceSurface;
  queue_files: string[];
  queue_states?: CommuteQueueState[];
  feedback: CommuteFeedback[];
  review_notes: CommuteReviewNote[];
  issues: string[];
}

export function parseCommuteHandoffText(text: string): CommuteHandoff {
  const normalized = stripMarkdownFence(text.trim());
  let candidate: unknown;

  try {
    candidate = JSON.parse(normalized);
  } catch (error) {
    throw new Error(`Commute handoff is not valid JSON: ${errorMessage(error)}`);
  }

  return validateCommuteHandoff(candidate);
}

export function validateCommuteHandoff(candidate: unknown): CommuteHandoff {
  const record = requireRecord(candidate, 'handoff');
  const schemaVersion = requireEnum(
    record.schema_version,
    COMMUTE_HANDOFF_SCHEMA_VERSIONS,
    'schema_version'
  );
  rejectUnknownKeys(
    record,
    [
      'schema_version',
      'session_id',
      'session_date',
      'voice_surface',
      'queue_files',
      ...(schemaVersion === 'commute-handoff.v2' ? ['queue_states'] : []),
      'feedback',
      'review_notes',
      'issues',
    ],
    'handoff'
  );

  const sessionDate = requireString(record.session_date, 'session_date');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(sessionDate)) {
    throw new Error('session_date must use YYYY-MM-DD');
  }

  const voiceSurface = requireEnum(record.voice_surface, VOICE_SURFACES, 'voice_surface');
  const queueFiles = requireStringArray(record.queue_files, 'queue_files');
  requireUniqueStrings(queueFiles, 'queue_files');
  const queueStates =
    schemaVersion === 'commute-handoff.v2'
      ? validateQueueStates(record.queue_states, queueFiles)
      : undefined;
  const issues = requireStringArray(record.issues, 'issues');
  const feedback = requireArray(record.feedback, 'feedback').map((item, index) =>
    validateFeedback(item, index)
  );
  const reviewNotes = requireArray(record.review_notes, 'review_notes').map((item, index) =>
    validateReviewNote(item, index)
  );

  return {
    schema_version: schemaVersion,
    session_id: requireString(record.session_id, 'session_id'),
    session_date: sessionDate,
    voice_surface: voiceSurface,
    queue_files: queueFiles,
    ...(queueStates === undefined ? {} : { queue_states: queueStates }),
    feedback,
    review_notes: reviewNotes,
    issues,
  };
}

function validateQueueStates(candidate: unknown, queueFiles: string[]): CommuteQueueState[] {
  const states = requireArray(candidate, 'queue_states').map((item, index) =>
    validateQueueState(item, index)
  );
  const stateQueueFiles = states.map((state) => state.queue_file);
  requireUniqueStrings(stateQueueFiles, 'queue_states[].queue_file');

  const expected = new Set(queueFiles);
  const unexpected = stateQueueFiles.filter((queueFile) => !expected.has(queueFile));
  const missing = queueFiles.filter((queueFile) => !stateQueueFiles.includes(queueFile));
  if (unexpected.length > 0 || missing.length > 0) {
    throw new Error('queue_states must contain exactly one entry for every queue_files value');
  }

  return states;
}

function validateQueueState(candidate: unknown, index: number): CommuteQueueState {
  const field = `queue_states[${index}]`;
  const record = requireRecord(candidate, field);
  rejectUnknownKeys(
    record,
    [
      'queue_file',
      'status',
      'last_completed_source_item_id',
      'current_source_item_id',
      'resume_source_item_id',
    ],
    field
  );
  const status = requireEnum(record.status, QUEUE_STATUSES, `${field}.status`);
  const lastCompleted = optionalSourceItemId(
    record.last_completed_source_item_id,
    `${field}.last_completed_source_item_id`
  );
  const current = optionalSourceItemId(
    record.current_source_item_id,
    `${field}.current_source_item_id`
  );
  const resume = optionalSourceItemId(
    record.resume_source_item_id,
    `${field}.resume_source_item_id`
  );

  if (status === 'partial' && resume === undefined) {
    throw new Error(`${field}.resume_source_item_id is required for partial queue state`);
  }
  if (status !== 'partial' && (current !== undefined || resume !== undefined)) {
    throw new Error(`${field} may only include current or resume ids when status is partial`);
  }
  if (status === 'not_started' && lastCompleted !== undefined) {
    throw new Error(`${field} may not include a last completed id when status is not_started`);
  }

  return {
    queue_file: requireString(record.queue_file, `${field}.queue_file`),
    status,
    ...(lastCompleted === undefined ? {} : { last_completed_source_item_id: lastCompleted }),
    ...(current === undefined ? {} : { current_source_item_id: current }),
    ...(resume === undefined ? {} : { resume_source_item_id: resume }),
  };
}

function validateFeedback(candidate: unknown, index: number): CommuteFeedback {
  const field = `feedback[${index}]`;
  const record = requireRecord(candidate, field);
  rejectUnknownKeys(
    record,
    ['queue_file', 'source_item_id', 'title', 'url', 'action', 'note'],
    field
  );
  const title = optionalString(record.title, `${field}.title`);
  const url = optionalString(record.url, `${field}.url`);
  const note = optionalString(record.note, `${field}.note`);
  return {
    queue_file: requireString(record.queue_file, `${field}.queue_file`),
    source_item_id: requireString(record.source_item_id, `${field}.source_item_id`),
    action: requireEnum(record.action, FEEDBACK_ACTIONS, `${field}.action`),
    ...(title === undefined ? {} : { title }),
    ...(url === undefined ? {} : { url }),
    ...(note === undefined ? {} : { note }),
  };
}

function validateReviewNote(candidate: unknown, index: number): CommuteReviewNote {
  const field = `review_notes[${index}]`;
  const record = requireRecord(candidate, field);
  rejectUnknownKeys(
    record,
    ['queue_file', 'source_item_id', 'title', 'url', 'note', 'destination'],
    field
  );
  const queueFile = optionalString(record.queue_file, `${field}.queue_file`);
  const sourceItemId = optionalString(record.source_item_id, `${field}.source_item_id`);
  const url = optionalString(record.url, `${field}.url`);
  const destination = requireEnum(record.destination, REVIEW_DESTINATIONS, `${field}.destination`);
  if (destination === 'wiki_review') {
    if (queueFile === undefined) throw new Error(`${field}.queue_file is required for wiki_review`);
    if (sourceItemId === undefined || sourceItemId === 'unknown') {
      throw new Error(`${field}.source_item_id is required for wiki_review`);
    }
    if (url === undefined) throw new Error(`${field}.url is required for wiki_review`);
  }
  return {
    title: requireString(record.title, `${field}.title`),
    note: requireString(record.note, `${field}.note`),
    destination,
    ...(queueFile === undefined ? {} : { queue_file: queueFile }),
    ...(sourceItemId === undefined ? {} : { source_item_id: sourceItemId }),
    ...(url === undefined ? {} : { url }),
  };
}

function optionalSourceItemId(candidate: unknown, field: string): string | undefined {
  const value = optionalString(candidate, field);
  if (value === 'unknown') {
    throw new Error(`${field} must use an exact source item id`);
  }
  return value;
}
