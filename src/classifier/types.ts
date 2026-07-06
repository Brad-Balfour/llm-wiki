export const INTEREST_LEVELS = ['interested', 'maybe', 'uninterested'] as const;

export type InterestLevel = (typeof INTEREST_LEVELS)[number];

export const CONSUMPTION_DEPTHS = ['headline_only', 'in_depth'] as const;

export type ConsumptionDepth = (typeof CONSUMPTION_DEPTHS)[number];

export interface ClassifierInputItem {
  classifier_item_id: string;
  source_item_id: string;
  newsletter: string;
  edition_date: string;
  section: string | null;
  title: string;
  summary: string;
  url: string;
}

export interface ClassificationRecord {
  classifier_item_id: string;
  interest_level: InterestLevel;
  interest_score: number;
  consumption_depth: ConsumptionDepth;
  depth_score: number;
  signals: string[];
  reason: string;
}

export interface ClassifierThresholds {
  interest: {
    maybe_min: number;
    interested_min: number;
  };
  depth: {
    in_depth_min: number;
  };
}

export const DEFAULT_CLASSIFIER_THRESHOLDS: ClassifierThresholds = {
  interest: {
    maybe_min: 0.6,
    interested_min: 0.8,
  },
  depth: {
    in_depth_min: 0.6,
  },
};

export function deriveInterestLevel(
  score: number,
  thresholds: ClassifierThresholds = DEFAULT_CLASSIFIER_THRESHOLDS
): InterestLevel {
  if (score >= thresholds.interest.interested_min) {
    return 'interested';
  }

  if (score >= thresholds.interest.maybe_min) {
    return 'maybe';
  }

  return 'uninterested';
}

export function deriveConsumptionDepth(
  score: number,
  thresholds: ClassifierThresholds = DEFAULT_CLASSIFIER_THRESHOLDS
): ConsumptionDepth {
  return score >= thresholds.depth.in_depth_min ? 'in_depth' : 'headline_only';
}
