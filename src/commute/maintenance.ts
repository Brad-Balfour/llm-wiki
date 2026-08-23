/**
 * The single owner of the wiki-maintenance candidate contract.
 *
 * This shape crosses the commute/wiki boundary: `import-session-bundles`
 * produces candidates from session bundles and `retrieve-maintenance-sources`
 * consumes them. Both previously declared it independently, so structural
 * typing let the two drift silently. Keep one declaration and one parser here.
 */

import { requireHttpUrl } from '../shared/url.js';
import { requireRecord, requireString, requireStringArray } from '../shared/validate.js';
import { createHash } from 'node:crypto';
import type { EventEvidence } from './session-bundle.js';

export interface DiscussionContext {
  discussion_key: string;
  summary: string;
  important_questions: string[];
  conclusions: string[];
  requested_emphasis: string[];
  evidence: EventEvidence[];
}

export const MAINTENANCE_ATTEMPT_SOURCES = ['retrieval', 'maintainer'] as const;
export type MaintenanceAttemptSource = (typeof MAINTENANCE_ATTEMPT_SOURCES)[number];

export const MAINTENANCE_ATTEMPT_STATUSES = [
  'inaccessible_source',
  'unsupported_source',
  'no_change',
  'insufficient_source',
  'unresolved',
  'pr_created',
  'review_required',
  'failed',
] as const;
export type MaintenanceAttemptStatus = (typeof MAINTENANCE_ATTEMPT_STATUSES)[number];

export interface MaintenanceCandidate {
  maintenance_key: string;
  session_id: string;
  event_id: string;
  source_item_id: string;
  title: string;
  url: string;
  status: 'pending';
  discussion?: DiscussionContext;
}

export interface MaintenanceAttemptInput {
  maintenance_key: string;
  source: MaintenanceAttemptSource;
  status: MaintenanceAttemptStatus;
  detail: string;
  attempted_at: string;
  discussion_disposition?: DiscussionDisposition;
}

export type DiscussionDisposition = 'incorporated' | 'omitted_unsupported' | 'unresolved';

export function requireDiscussionDisposition(
  candidate: unknown,
  field: string
): DiscussionDisposition {
  if (
    candidate !== 'incorporated' &&
    candidate !== 'omitted_unsupported' &&
    candidate !== 'unresolved'
  ) {
    throw new Error(`${field} has an unsupported status`);
  }
  return candidate;
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

/** Parse a persisted maintenance candidate from any prior record. */
export function parseMaintenanceCandidate(candidate: unknown, field: string): MaintenanceCandidate {
  const record = requireRecord(candidate, field);
  return {
    maintenance_key: requireString(record.maintenance_key, `${field}.maintenance_key`),
    session_id: requireString(record.session_id, `${field}.session_id`),
    event_id: requireString(record.event_id, `${field}.event_id`),
    source_item_id: requireString(record.source_item_id, `${field}.source_item_id`),
    title: requireString(record.title, `${field}.title`),
    url: requireMaintenanceHttpUrl(record.url, `${field}.url`),
    status: 'pending',
    ...optionalDiscussionContext(record.discussion, `${field}.discussion`),
  };
}

function optionalDiscussionContext(
  candidate: unknown,
  field: string
): { discussion?: DiscussionContext } {
  if (candidate === undefined) return {};
  try {
    return { discussion: parseDiscussionContext(candidate, field) };
  } catch {
    return {};
  }
}

export function discussionContextKey(sessionId: string, eventId: string, url: string): string {
  return `discussion-${createHash('sha256')
    .update(JSON.stringify([sessionId, eventId, url]))
    .digest('hex')
    .slice(0, 16)}`;
}

function parseDiscussionContext(candidate: unknown, field: string): DiscussionContext {
  const record = requireRecord(candidate, field);
  const evidence = requireRecordArray(record.evidence, `${field}.evidence`).map((entry, index) => {
    const value = requireRecord(entry, `${field}.evidence[${index}]`);
    return {
      source: requireString(
        value.source,
        `${field}.evidence[${index}].source`
      ) as EventEvidence['source'],
      reference: requireString(value.reference, `${field}.evidence[${index}].reference`),
    };
  });
  if (evidence.length === 0) throw new Error(`${field}.evidence must not be empty`);
  return {
    discussion_key: requireString(record.discussion_key, `${field}.discussion_key`),
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

function requireRecordArray(candidate: unknown, field: string): unknown[] {
  if (!Array.isArray(candidate)) throw new Error(`${field} must be an array`);
  return candidate;
}

export function requireMaintenanceAttemptSource(
  candidate: unknown,
  field: string
): MaintenanceAttemptSource {
  if (
    typeof candidate !== 'string' ||
    !(MAINTENANCE_ATTEMPT_SOURCES as readonly string[]).includes(candidate)
  ) {
    throw new Error(`${field} must be retrieval or maintainer`);
  }
  return candidate as MaintenanceAttemptSource;
}

/**
 * A maintenance URL is an exact captured source URL. Report a malformed one as
 * a contract failure naming its field, never as a raw URL TypeError.
 */
export function requireMaintenanceHttpUrl(candidate: unknown, field: string): string {
  return requireHttpUrl(candidate, field);
}

export function requireMaintenanceAttemptStatus(
  candidate: unknown,
  field: string
): MaintenanceAttemptStatus {
  if (
    typeof candidate !== 'string' ||
    !(MAINTENANCE_ATTEMPT_STATUSES as readonly string[]).includes(candidate)
  ) {
    throw new Error(`${field} is unsupported`);
  }
  return candidate as MaintenanceAttemptStatus;
}
