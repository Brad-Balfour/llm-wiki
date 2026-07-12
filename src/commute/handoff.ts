export const COMMUTE_HANDOFF_SCHEMA_VERSION = 'commute-handoff.v1';

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

export interface CommuteFeedback {
  source_item_id: string;
  title?: string;
  url?: string;
  action: FeedbackAction;
  note?: string;
}

export interface CommuteReviewNote {
  source_item_id?: string;
  title: string;
  url?: string;
  note: string;
  destination: ReviewDestination;
}

export interface CommuteHandoff {
  schema_version: typeof COMMUTE_HANDOFF_SCHEMA_VERSION;
  session_id: string;
  session_date: string;
  voice_surface: VoiceSurface;
  queue_files: string[];
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
  rejectUnknownKeys(record, [
    'schema_version',
    'session_id',
    'session_date',
    'voice_surface',
    'queue_files',
    'feedback',
    'review_notes',
    'issues',
  ]);

  const schemaVersion = requireString(record.schema_version, 'schema_version');
  if (schemaVersion !== COMMUTE_HANDOFF_SCHEMA_VERSION) {
    throw new Error(`schema_version must be ${COMMUTE_HANDOFF_SCHEMA_VERSION}`);
  }

  const sessionDate = requireString(record.session_date, 'session_date');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(sessionDate)) {
    throw new Error('session_date must use YYYY-MM-DD');
  }

  const voiceSurface = requireEnum(record.voice_surface, VOICE_SURFACES, 'voice_surface');
  const queueFiles = requireStringArray(record.queue_files, 'queue_files');
  const issues = requireStringArray(record.issues, 'issues');
  const feedback = requireArray(record.feedback, 'feedback').map((item, index) =>
    validateFeedback(item, index)
  );
  const reviewNotes = requireArray(record.review_notes, 'review_notes').map((item, index) =>
    validateReviewNote(item, index)
  );

  return {
    schema_version: COMMUTE_HANDOFF_SCHEMA_VERSION,
    session_id: requireString(record.session_id, 'session_id'),
    session_date: sessionDate,
    voice_surface: voiceSurface,
    queue_files: queueFiles,
    feedback,
    review_notes: reviewNotes,
    issues,
  };
}

function validateFeedback(candidate: unknown, index: number): CommuteFeedback {
  const field = `feedback[${index}]`;
  const record = requireRecord(candidate, field);
  rejectUnknownKeys(record, ['source_item_id', 'title', 'url', 'action', 'note'], field);
  const title = optionalString(record.title, `${field}.title`);
  const url = optionalString(record.url, `${field}.url`);
  const note = optionalString(record.note, `${field}.note`);
  return {
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
  rejectUnknownKeys(record, ['source_item_id', 'title', 'url', 'note', 'destination'], field);
  const sourceItemId = optionalString(record.source_item_id, `${field}.source_item_id`);
  const url = optionalString(record.url, `${field}.url`);
  return {
    title: requireString(record.title, `${field}.title`),
    note: requireString(record.note, `${field}.note`),
    destination: requireEnum(record.destination, REVIEW_DESTINATIONS, `${field}.destination`),
    ...(sourceItemId === undefined ? {} : { source_item_id: sourceItemId }),
    ...(url === undefined ? {} : { url }),
  };
}

function stripMarkdownFence(text: string): string {
  const match = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(text);
  return match?.[1] ?? text;
}

function requireRecord(candidate: unknown, field: string): Record<string, unknown> {
  if (typeof candidate !== 'object' || candidate === null || Array.isArray(candidate)) {
    throw new Error(`${field} must be an object`);
  }
  return candidate as Record<string, unknown>;
}

function requireArray(candidate: unknown, field: string): unknown[] {
  if (!Array.isArray(candidate)) {
    throw new Error(`${field} must be an array`);
  }
  return candidate;
}

function requireString(candidate: unknown, field: string): string {
  if (typeof candidate !== 'string' || candidate.trim().length === 0) {
    throw new Error(`${field} must be a non-empty string`);
  }
  return candidate;
}

function optionalString(candidate: unknown, field: string): string | undefined {
  if (candidate === undefined) {
    return undefined;
  }
  return requireString(candidate, field);
}

function requireStringArray(candidate: unknown, field: string): string[] {
  return requireArray(candidate, field).map((item, index) =>
    requireString(item, `${field}[${index}]`)
  );
}

function requireEnum<const T extends readonly string[]>(
  candidate: unknown,
  values: T,
  field: string
): T[number] {
  if (typeof candidate !== 'string' || !values.includes(candidate)) {
    throw new Error(`${field} must be one of: ${values.join(', ')}`);
  }
  return candidate as T[number];
}

function rejectUnknownKeys(
  record: Record<string, unknown>,
  allowed: readonly string[],
  field = 'handoff'
): void {
  const unknown = Object.keys(record).filter((key) => !allowed.includes(key));
  if (unknown.length > 0) {
    throw new Error(`${field} contains unsupported fields: ${unknown.join(', ')}`);
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
