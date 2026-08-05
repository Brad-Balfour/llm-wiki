/**
 * The single owner of the wiki-maintenance candidate contract.
 *
 * This shape crosses the commute/wiki boundary: `import-session-bundles`
 * produces candidates from session bundles and `retrieve-maintenance-sources`
 * consumes them. Both previously declared it independently, so structural
 * typing let the two drift silently. Keep one declaration and one parser here.
 */

import { requireHttpUrl } from '../shared/url.js';
import { requireIsoTimestamp } from '../shared/time.js';
import { requireRecord, requireString } from '../shared/validate.js';

export { requireIsoTimestamp, requireRecord };

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
}

export interface MaintenanceAttemptInput {
  maintenance_key: string;
  source: MaintenanceAttemptSource;
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
  };
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

export { requireString as requireNonEmptyString };

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

/**
 * A maintenance URL is always an exact captured source URL. Report a malformed
 * one as a contract failure naming its field, never as a raw URL TypeError.
 */
