import {
  CONSUMPTION_DEPTHS,
  DEFAULT_CLASSIFIER_THRESHOLDS,
  INTEREST_LEVELS,
  deriveConsumptionDepth,
  deriveInterestLevel,
} from './types.js';
import type { ClassificationRecord, ClassifierInputItem, ClassifierThresholds } from './types.js';

const REQUIRED_FIELDS = [
  'classifier_item_id',
  'interest_level',
  'interest_score',
  'consumption_depth',
  'depth_score',
  'signals',
  'reason',
] as const;

const ALLOWED_FIELDS = new Set<string>(REQUIRED_FIELDS);

export const FORBIDDEN_DOWNSTREAM_FIELDS = [
  'voice_behavior',
  'route',
  'routing',
  'wiki_destination',
  'wiki_path',
  'commute_behavior',
  'stream_log',
  'review_queue',
  'discard',
  'source_destination',
  'full_fetch',
] as const;

const FORBIDDEN_FIELD_SET = new Set<string>(FORBIDDEN_DOWNSTREAM_FIELDS);

export interface ClassifierValidationError {
  code:
    | 'invalid_output_shape'
    | 'batch_size_mismatch'
    | 'missing_required_field'
    | 'unexpected_field'
    | 'forbidden_downstream_field'
    | 'invalid_classifier_item_id'
    | 'duplicate_classifier_item_id'
    | 'unknown_classifier_item_id'
    | 'missing_classifier_item_id'
    | 'invalid_enum'
    | 'invalid_score'
    | 'score_label_mismatch'
    | 'invalid_signals'
    | 'invalid_reason';
  message: string;
  field?: string | undefined;
  classifier_item_id?: string | undefined;
}

export type ClassifierValidationResult =
  | {
      ok: true;
      records: ClassificationRecord[];
    }
  | {
      ok: false;
      errors: ClassifierValidationError[];
    };

interface ValidationOptions {
  thresholds?: ClassifierThresholds;
}

export function validateClassifierBatch(
  output: unknown,
  inputs: readonly ClassifierInputItem[],
  options: ValidationOptions = {}
): ClassifierValidationResult {
  const thresholds = options.thresholds ?? DEFAULT_CLASSIFIER_THRESHOLDS;
  const expectedIds = new Set(inputs.map((item) => item.classifier_item_id));
  const records = coerceOutputRecords(output, inputs.length);
  const errors: ClassifierValidationError[] = [];

  if (!records) {
    return {
      ok: false,
      errors: [
        {
          code: 'invalid_output_shape',
          message:
            inputs.length === 1
              ? 'Classifier output must be one object or an array containing one object.'
              : 'Classifier batch output must be an array of objects.',
        },
      ],
    };
  }

  if (records.length !== inputs.length) {
    errors.push({
      code: 'batch_size_mismatch',
      message: `Expected ${inputs.length} classifier record(s), received ${records.length}.`,
    });
  }

  const seenIds = new Set<string>();
  const validated: ClassificationRecord[] = [];

  for (const record of records) {
    if (!isPlainObject(record)) {
      errors.push({
        code: 'invalid_output_shape',
        message: 'Each classifier record must be a JSON object.',
      });
      continue;
    }

    const id = validateRecordKeys(record, errors);
    const validatedRecord = validateRecordFields(record, id, thresholds, errors);

    if (id) {
      if (seenIds.has(id)) {
        errors.push({
          code: 'duplicate_classifier_item_id',
          field: 'classifier_item_id',
          classifier_item_id: id,
          message: `Duplicate classifier_item_id: ${id}.`,
        });
      } else {
        seenIds.add(id);
      }

      if (!expectedIds.has(id)) {
        errors.push({
          code: 'unknown_classifier_item_id',
          field: 'classifier_item_id',
          classifier_item_id: id,
          message: `Unknown classifier_item_id: ${id}.`,
        });
      }
    }

    if (validatedRecord) {
      validated.push(validatedRecord);
    }
  }

  for (const expectedId of expectedIds) {
    if (!seenIds.has(expectedId)) {
      errors.push({
        code: 'missing_classifier_item_id',
        field: 'classifier_item_id',
        classifier_item_id: expectedId,
        message: `Missing classifier output for ${expectedId}.`,
      });
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, records: validated };
}

function coerceOutputRecords(output: unknown, inputCount: number): unknown[] | null {
  if (Array.isArray(output)) {
    return output;
  }

  if (inputCount === 1 && isPlainObject(output)) {
    return [output];
  }

  return null;
}

function validateRecordKeys(
  record: Record<string, unknown>,
  errors: ClassifierValidationError[]
): string | undefined {
  const keys = Object.keys(record);

  for (const key of keys) {
    if (FORBIDDEN_FIELD_SET.has(key)) {
      errors.push({
        code: 'forbidden_downstream_field',
        field: key,
        classifier_item_id: stringValue(record.classifier_item_id),
        message: `Classifier output included downstream behavior field: ${key}.`,
      });
      continue;
    }

    if (!ALLOWED_FIELDS.has(key)) {
      errors.push({
        code: 'unexpected_field',
        field: key,
        classifier_item_id: stringValue(record.classifier_item_id),
        message: `Classifier output included unexpected field: ${key}.`,
      });
    }
  }

  for (const field of REQUIRED_FIELDS) {
    if (!Object.hasOwn(record, field)) {
      errors.push({
        code: 'missing_required_field',
        field,
        classifier_item_id: stringValue(record.classifier_item_id),
        message: `Classifier output is missing required field: ${field}.`,
      });
    }
  }

  return stringValue(record.classifier_item_id);
}

/**
 * One field rule: how to recognize a valid value and what to report when it is
 * not. Collecting these in a table keeps the check and its error message
 * together, and lets validity be derived from the errors actually collected
 * rather than restated as a second condition.
 */
interface FieldRule {
  code: ClassifierValidationError['code'];
  isValid: (value: unknown) => boolean;
  message: string;
}

/** Every classifier-supplied field except the id, which is checked separately. */
type ValidatedField = keyof Omit<ClassificationRecord, 'classifier_item_id'>;

/**
 * Keying the table by `ValidatedField` makes exhaustiveness a compile error:
 * adding a field to `ClassificationRecord` without adding its rule here will
 * not build. That is what makes the assertions in the success path safe.
 */
const FIELD_RULES: Record<ValidatedField, FieldRule> = {
  interest_level: {
    code: 'invalid_enum',
    isValid: isInterestLevel,
    message: 'interest_level must be interested, maybe, or uninterested.',
  },
  interest_score: {
    code: 'invalid_score',
    isValid: isValidScore,
    message: 'interest_score must be a finite number from 0.0 through 1.0.',
  },
  consumption_depth: {
    code: 'invalid_enum',
    isValid: isConsumptionDepth,
    message: 'consumption_depth must be headline_only or in_depth.',
  },
  depth_score: {
    code: 'invalid_score',
    isValid: isValidScore,
    message: 'depth_score must be a finite number from 0.0 through 1.0.',
  },
  signals: {
    code: 'invalid_signals',
    isValid: isValidSignals,
    message: 'signals must be a non-empty array of non-empty strings.',
  },
  reason: {
    code: 'invalid_reason',
    isValid: (value) => typeof value === 'string' && value.trim().length > 0,
    message: 'reason must be a non-empty string.',
  },
};

function validateRecordFields(
  record: Record<string, unknown>,
  id: string | undefined,
  thresholds: ClassifierThresholds,
  errors: ClassifierValidationError[]
): ClassificationRecord | null {
  const before = errors.length;

  if (!id || id.trim().length === 0) {
    errors.push({
      code: 'invalid_classifier_item_id',
      field: 'classifier_item_id',
      message: 'classifier_item_id must be a non-empty string.',
    });
  }

  for (const field of Object.keys(FIELD_RULES) as ValidatedField[]) {
    const rule = FIELD_RULES[field];
    if (!rule.isValid(record[field])) {
      errors.push({
        code: rule.code,
        field,
        classifier_item_id: id ?? undefined,
        message: rule.message,
      });
    }
  }

  validateScoreLabelAgreement(record, id, thresholds, errors);

  // A record is valid exactly when this call collected no errors. Deriving it
  // avoids restating every predicate a second time purely to satisfy narrowing.
  // The assertions below are sound because FIELD_RULES is exhaustive over
  // ValidatedField and every rule passed.
  if (errors.length !== before) return null;

  return {
    classifier_item_id: id as string,
    interest_level: record.interest_level as ClassificationRecord['interest_level'],
    interest_score: record.interest_score as number,
    consumption_depth: record.consumption_depth as ClassificationRecord['consumption_depth'],
    depth_score: record.depth_score as number,
    signals: record.signals as string[],
    reason: record.reason as string,
  };
}

/**
 * A label and its score must agree. Checked separately because it is the one
 * rule that reads two fields at once, and it only applies when both are
 * individually well-formed.
 */
function validateScoreLabelAgreement(
  record: Record<string, unknown>,
  id: string | undefined,
  thresholds: ClassifierThresholds,
  errors: ClassifierValidationError[]
): void {
  const interestLevel = record.interest_level;
  const interestScore = record.interest_score;
  const consumptionDepth = record.consumption_depth;
  const depthScore = record.depth_score;

  if (isInterestLevel(interestLevel) && isValidScore(interestScore)) {
    const expected = deriveInterestLevel(interestScore, thresholds);
    if (interestLevel !== expected) {
      errors.push({
        code: 'score_label_mismatch',
        field: 'interest_level',
        classifier_item_id: id ?? undefined,
        message: `interest_level ${interestLevel} does not match interest_score ${interestScore}; expected ${expected}.`,
      });
    }
  }

  if (isConsumptionDepth(consumptionDepth) && isValidScore(depthScore)) {
    const expected = deriveConsumptionDepth(depthScore, thresholds);
    if (consumptionDepth !== expected) {
      errors.push({
        code: 'score_label_mismatch',
        field: 'consumption_depth',
        classifier_item_id: id ?? undefined,
        message: `consumption_depth ${consumptionDepth} does not match depth_score ${depthScore}; expected ${expected}.`,
      });
    }
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function isInterestLevel(value: unknown): value is ClassificationRecord['interest_level'] {
  return typeof value === 'string' && (INTEREST_LEVELS as readonly string[]).includes(value);
}

function isConsumptionDepth(value: unknown): value is ClassificationRecord['consumption_depth'] {
  return typeof value === 'string' && (CONSUMPTION_DEPTHS as readonly string[]).includes(value);
}

function isValidScore(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
}

function isValidSignals(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((signal) => typeof signal === 'string' && signal.trim().length > 0)
  );
}
