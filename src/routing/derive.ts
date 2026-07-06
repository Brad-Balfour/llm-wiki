import type { ClassificationRecord } from '../classifier/types.js';

export const ROUTE_VERSION = 'routing-rules.v1';

export type CommuteBehavior =
  'none' | 'skip' | 'quick_read' | 'discuss' | 'optional_quick_read' | 'optional_discuss_or_teaser';

export type WikiBehavior =
  | 'none'
  | 'discard'
  | 'stream_log_only'
  | 'full_source_candidate'
  | 'stream_log_or_review'
  | 'review_required';

export type StreamLogBehavior = 'none' | 'write' | 'optional_summary' | 'candidate_after_review';

export type ReviewReason = 'none' | 'classification_boundary' | 'parse_error' | 'validation_error';

export interface RouteDecision {
  route_version: typeof ROUTE_VERSION;
  commute_behavior: CommuteBehavior;
  wiki_behavior: WikiBehavior;
  stream_log: StreamLogBehavior;
  review: ReviewReason;
  discard: boolean;
}

export function deriveRouteFromClassification(record: ClassificationRecord): RouteDecision {
  if (record.interest_level === 'uninterested') {
    return {
      route_version: ROUTE_VERSION,
      commute_behavior: 'skip',
      wiki_behavior: 'discard',
      stream_log: 'none',
      review: 'none',
      discard: true,
    };
  }

  if (record.interest_level === 'interested' && record.consumption_depth === 'headline_only') {
    return {
      route_version: ROUTE_VERSION,
      commute_behavior: 'quick_read',
      wiki_behavior: 'stream_log_only',
      stream_log: 'write',
      review: 'none',
      discard: false,
    };
  }

  if (record.interest_level === 'interested' && record.consumption_depth === 'in_depth') {
    return {
      route_version: ROUTE_VERSION,
      commute_behavior: 'discuss',
      wiki_behavior: 'full_source_candidate',
      stream_log: 'optional_summary',
      review: 'none',
      discard: false,
    };
  }

  if (record.interest_level === 'maybe' && record.consumption_depth === 'headline_only') {
    return {
      route_version: ROUTE_VERSION,
      commute_behavior: 'optional_quick_read',
      wiki_behavior: 'stream_log_or_review',
      stream_log: 'candidate_after_review',
      review: 'classification_boundary',
      discard: false,
    };
  }

  return {
    route_version: ROUTE_VERSION,
    commute_behavior: 'optional_discuss_or_teaser',
    wiki_behavior: 'review_required',
    stream_log: 'none',
    review: 'classification_boundary',
    discard: false,
  };
}

export function deriveParserFailureRoute(): RouteDecision {
  return reviewRoute('parse_error');
}

export function deriveClassifierValidationFailureRoute(): RouteDecision {
  return reviewRoute('validation_error');
}

function reviewRoute(review: Exclude<ReviewReason, 'none'>): RouteDecision {
  return {
    route_version: ROUTE_VERSION,
    commute_behavior: 'none',
    wiki_behavior: 'none',
    stream_log: 'none',
    review,
    discard: false,
  };
}
