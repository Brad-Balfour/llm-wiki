import type { ClassificationRecord, ConsumptionDepth, InterestLevel } from '../classifier/types.js';

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

/** A route without its version stamp, which every decision shares. */
type RouteBehavior = Omit<RouteDecision, 'route_version'>;

/**
 * An uninterested item is discarded whatever its depth score says: depth only
 * describes how the item would be consumed, and it is not going to be.
 */
const DISCARD_UNINTERESTED: RouteBehavior = {
  commute_behavior: 'skip',
  wiki_behavior: 'discard',
  stream_log: 'none',
  review: 'none',
  discard: true,
};

/**
 * The whole routing policy, as one table keyed by the two classifier labels.
 * This is the executable form of `schema/routing-rules.md`; the two should be
 * readable side by side, and every cell is pinned by
 * `tests/fixtures/expected/routing/default-routes.json`.
 */
const ROUTES: Record<InterestLevel, Record<ConsumptionDepth, RouteBehavior>> = {
  interested: {
    headline_only: {
      commute_behavior: 'quick_read',
      wiki_behavior: 'stream_log_only',
      stream_log: 'write',
      review: 'none',
      discard: false,
    },
    in_depth: {
      commute_behavior: 'discuss',
      wiki_behavior: 'full_source_candidate',
      stream_log: 'optional_summary',
      review: 'none',
      discard: false,
    },
  },
  maybe: {
    headline_only: {
      commute_behavior: 'optional_quick_read',
      wiki_behavior: 'stream_log_or_review',
      stream_log: 'candidate_after_review',
      review: 'classification_boundary',
      discard: false,
    },
    in_depth: {
      commute_behavior: 'optional_discuss_or_teaser',
      wiki_behavior: 'review_required',
      stream_log: 'none',
      review: 'classification_boundary',
      discard: false,
    },
  },
  uninterested: {
    headline_only: DISCARD_UNINTERESTED,
    in_depth: DISCARD_UNINTERESTED,
  },
};

export function deriveRouteFromClassification(record: ClassificationRecord): RouteDecision {
  return {
    route_version: ROUTE_VERSION,
    ...ROUTES[record.interest_level][record.consumption_depth],
  };
}

export function deriveParserFailureRoute(): RouteDecision {
  return reviewRoute('parse_error');
}

export function deriveClassifierValidationFailureRoute(): RouteDecision {
  return reviewRoute('validation_error');
}

/** A failure never reaches the commute or the wiki; it only reaches review. */
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
