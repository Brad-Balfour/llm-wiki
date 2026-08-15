import { createHash } from 'node:crypto';

import { errorMessage } from '../shared/errors.js';
import { optionalRecord, requireArray, requireRecord } from '../shared/validate.js';
import {
  bundleArtifactFilenameMatches,
  queueSnapshotFingerprint,
  validateTldrCommuteQueueV2,
} from './session-bundle.js';

export interface SuppliedQueueRecoveryInput {
  bundleFilename: string;
  bundleText: string;
  queueFilename: string;
  queueText: string;
}

export interface RecoveredWikiCapture {
  eventId: string;
  sequence: number;
  sourceItemId: string;
  title: string;
  url: string;
}

export interface RecoveredContradictoryWikiCapture extends RecoveredWikiCapture {
  userWords: string;
}

export interface RecoveredSessionBundle {
  sessionId: string;
  declaredArtifactFilename?: string;
  recoveryWarnings: string[];
  queueFilename: string;
  queueFingerprint: string;
  wikiCaptures: RecoveredWikiCapture[];
  contradictoryWikiCaptures: RecoveredContradictoryWikiCapture[];
}

/**
 * Recover only explicitly marked wiki captures from a malformed historical
 * bundle. This is intentionally separate from v1 validation: the supplied
 * queue supplies exact item identity; the malformed bundle supplies only its
 * named queue and legacy item reference.
 */
export function recoverSessionBundleWithSuppliedQueue(
  input: SuppliedQueueRecoveryInput
): RecoveredSessionBundle {
  const bundle = parseJsonObject(input.bundleText, 'Recovery bundle');
  const queue = validateTldrCommuteQueueV2(parseJsonObject(input.queueText, 'Recovery queue'));
  const declaredQueueFilename = declaredQueueName(bundle);
  if (declaredQueueFilename !== input.queueFilename) {
    throw new Error(
      `Recovery queue filename ${input.queueFilename} does not match malformed bundle queue ${declaredQueueFilename}`
    );
  }

  const items = queue.items;
  if (!Array.isArray(items)) {
    throw new Error('Recovery queue must contain an items array');
  }
  const exactItems = items.map((item, index) => parseQueueItem(item, index));
  const events = requireArray(bundle.events, 'Recovery bundle events');
  const artifactEvidence = inspectArtifactFilenameEvidence(bundle, input.bundleFilename);
  const queueFingerprint = queueSnapshotFingerprint(queue);
  const sessionId = declaredSessionId(bundle, queueFingerprint, events);
  const wikiCaptures: RecoveredWikiCapture[] = [];
  const contradictoryWikiCaptures: RecoveredContradictoryWikiCapture[] = [];

  for (const [index, event] of events.entries()) {
    const record = requireRecord(event, `Recovery bundle events[${index}]`);
    if (!isWikiCapture(record)) continue;
    const item = resolveLegacyItem(
      record.item,
      exactItems,
      `Recovery bundle events[${index}].item`
    );
    const eventId = lenientOptionalString(record.event_id) ?? `recovered-event-${index + 1}`;
    const sequence = lenientPositiveInteger(record.sequence) ?? index + 1;
    const userWords =
      lenientOptionalString(record.user_words) ?? lenientOptionalString(record.feedback);
    if (userWords && refersToPriorWikiCapture(userWords)) {
      contradictoryWikiCaptures.push({
        eventId,
        sequence,
        sourceItemId: item.sourceItemId,
        title: item.title,
        url: item.url,
        userWords,
      });
      continue;
    }
    wikiCaptures.push({
      eventId,
      sequence,
      sourceItemId: item.sourceItemId,
      title: item.title,
      url: item.url,
    });
  }

  return {
    sessionId,
    ...(artifactEvidence.declaredArtifactFilename === undefined
      ? {}
      : { declaredArtifactFilename: artifactEvidence.declaredArtifactFilename }),
    recoveryWarnings: artifactEvidence.warnings,
    queueFilename: input.queueFilename,
    queueFingerprint,
    wikiCaptures,
    contradictoryWikiCaptures,
  };
}

export function refersToPriorWikiCapture(userWords: string): boolean {
  const priorCapture =
    /\b(?:already|previously)\s+(?:wiki(?:ed|d)|wikked|saved\s+(?:this|it)\s+(?:to|for|in)\s+(?:(?:my|the)\s+)?wiki)\b/i.exec(
      userWords
    );
  if (!priorCapture) return false;

  const followingWords = userWords.slice(priorCapture.index + priorCapture[0].length);
  return !/\b(?:but|then)\b[\s\S]*\b(?:please\s+)?(?:wiki|save)\s+(?:this|it)\b/i.test(
    followingWords
  );
}

interface ExactQueueItem {
  position: number;
  sourceItemId: string;
  title: string;
  url: string;
}

function declaredQueueName(bundle: Record<string, unknown>): string {
  const snapshot = optionalRecord(bundle.queue_snapshot);
  const snapshotFilename = snapshot && lenientOptionalString(snapshot.filename);
  const session = optionalRecord(bundle.session);
  const sessionFilename = session && lenientOptionalString(session.queue_filename);
  const filename = snapshotFilename ?? sessionFilename;
  if (!filename) {
    throw new Error('Malformed bundle does not name the selected queue file');
  }
  return filename;
}

function declaredSessionId(
  bundle: Record<string, unknown>,
  queueFingerprint: string,
  events: unknown[]
): string {
  const session = optionalRecord(bundle.session);
  const declared = session && lenientOptionalString(session.session_id);
  if (declared) return declared;

  const sessionEvidence = { ...(session ?? {}) };
  delete sessionEvidence.session_id;
  delete sessionEvidence.artifact_filename;
  const canonicalEvidence = stableJson({ session: sessionEvidence, queueFingerprint, events });
  return `recovered-${createHash('sha256').update(canonicalEvidence).digest('hex').slice(0, 16)}`;
}

function inspectArtifactFilenameEvidence(
  bundle: Record<string, unknown>,
  inputFilename: string
): { declaredArtifactFilename?: string; warnings: string[] } {
  const session = optionalRecord(bundle.session);
  const sessionDate = session && lenientOptionalString(session.session_date);
  const declaredArtifactFilename = session && lenientOptionalString(session.artifact_filename);
  const warnings = artifactFilenameWarnings(
    inputFilename,
    'Downloaded bundle filename',
    sessionDate
  );
  if (declaredArtifactFilename === undefined) {
    warnings.push('Malformed bundle does not declare session.artifact_filename.');
  } else {
    if (declaredArtifactFilename !== inputFilename) {
      warnings.push(
        ...artifactFilenameWarnings(
          declaredArtifactFilename,
          'Declared artifact filename',
          sessionDate
        )
      );
    }
    if (!bundleArtifactFilenameMatches(inputFilename, declaredArtifactFilename)) {
      warnings.push(
        `Downloaded bundle filename ${inputFilename} does not match declared artifact filename ${declaredArtifactFilename}.`
      );
    }
  }
  return {
    ...(declaredArtifactFilename === undefined ? {} : { declaredArtifactFilename }),
    warnings,
  };
}

function artifactFilenameWarnings(filename: string, field: string, sessionDate?: string): string[] {
  const match =
    /^(\d{8})(\d{2})(\d{2})-(morning|evening)-commute-session-bundle(?: ?\([1-9][0-9]*\))?\.txt$/.exec(
      filename
    );
  if (!match) return [`${field} ${filename} is not in the canonical bundle filename shape.`];

  const hour = Number(match[2]);
  const minute = Number(match[3]);
  const warnings: string[] = [];
  const hasRealTime = hour <= 23 && minute <= 59;
  if (!hasRealTime) warnings.push(`${field} ${filename} does not contain a real local time.`);
  if (/^\d{4}-\d{2}-\d{2}$/.test(sessionDate ?? '')) {
    const artifactDate = match[1];
    const expectedDate = sessionDate!.replaceAll('-', '');
    if (artifactDate !== expectedDate) {
      warnings.push(
        `${field} ${filename} uses date ${artifactDate}, which does not match session.session_date ${sessionDate}.`
      );
    }
  }
  const period = match[4];
  if (hasRealTime && period === 'morning' && hour >= 12) {
    warnings.push(`${field} ${filename} labels a time from 1200 onward as morning.`);
  }
  if (hasRealTime && period === 'evening' && hour < 12) {
    warnings.push(`${field} ${filename} labels a time before 1200 as evening.`);
  }
  return warnings;
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

export function recoveryArtifactKey(filename: string): string {
  return filename.replace(/ ?\([1-9][0-9]*\)\.txt$/, '.txt');
}

function parseQueueItem(candidate: unknown, index: number): ExactQueueItem {
  const item = requireRecord(candidate, `Recovery queue items[${index}]`);
  const sourceItemId = requiredString(
    item.source_item_id,
    `Recovery queue items[${index}].source_item_id`
  );
  const title = requiredString(item.title, `Recovery queue items[${index}].title`);
  const url = requiredString(item.url, `Recovery queue items[${index}].url`);
  return { position: index + 1, sourceItemId, title, url };
}

function isWikiCapture(event: Record<string, unknown>): boolean {
  return event.action === 'wiki' || (event.kind === 'item_action' && event.action === 'wiki_this');
}

function resolveLegacyItem(
  candidate: unknown,
  queueItems: ExactQueueItem[],
  field: string
): ExactQueueItem {
  if (typeof candidate === 'number' && Number.isInteger(candidate)) {
    return byPosition(candidate, queueItems, field);
  }
  const record = requireRecord(candidate, field);
  const sourceItemId = lenientOptionalString(record.source_item_id);
  if (sourceItemId) {
    const exact = queueItems.find((item) => item.sourceItemId === sourceItemId);
    if (exact) return exact;
    if (/^[1-9][0-9]*$/.test(sourceItemId)) {
      return byPosition(Number(sourceItemId), queueItems, field);
    }
  }
  throw new Error(`${field} does not identify an exact item or one-based queue position`);
}

function byPosition(position: number, queueItems: ExactQueueItem[], field: string): ExactQueueItem {
  const item = queueItems[position - 1];
  if (!item) throw new Error(`${field} position ${position} is outside the supplied queue`);
  return item;
}

function parseJsonObject(text: string, field: string): Record<string, unknown> {
  try {
    return requireRecord(JSON.parse(text) as unknown, field);
  } catch (error) {
    throw new Error(`${field} is not valid JSON: ${errorMessage(error)}`);
  }
}

function requiredString(candidate: unknown, field: string): string {
  const value = lenientOptionalString(candidate);
  if (!value) throw new Error(`${field} must be a non-empty string`);
  return value;
}

/** Legacy bundles are salvaged leniently: absent and blank are both "missing". */
function lenientOptionalString(candidate: unknown): string | undefined {
  return typeof candidate === 'string' && candidate.trim().length > 0 ? candidate : undefined;
}

function lenientPositiveInteger(candidate: unknown): number | undefined {
  return typeof candidate === 'number' && Number.isInteger(candidate) && candidate > 0
    ? candidate
    : undefined;
}
