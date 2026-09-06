import { createHash } from 'node:crypto';

import { errorMessage } from '../shared/errors.js';
import { optionalRecord, requireArray, requireRecord } from '../shared/validate.js';
import {
  bundleArtifactFilenameMatches,
  EVIDENCE_SOURCES,
  createQueueV4Snapshot,
  queueMetadataRecord,
  queueSnapshotFingerprint,
  type EventEvidence,
  validateTldrCommuteQueueV2,
} from './session-bundle.js';

export interface SuppliedQueueRecoveryInput {
  bundleFilename: string;
  bundleText: string;
  queueFilename: string;
  queueText: string;
  referenceFilename?: string;
  referenceText?: string;
}

export interface RecoveredWikiCapture {
  eventId: string;
  sequence: number;
  sourceItemId: string;
  title: string;
  url: string;
  discussion?: RecoveredDiscussion;
}

export interface RecoveredDiscussion {
  summary: string;
  importantQuestions: string[];
  conclusions: string[];
  requestedEmphasis: string[];
  evidence: EventEvidence[];
}

export interface RecoveredContradictoryWikiCapture extends RecoveredWikiCapture {
  userWords: string;
}

export interface RecoveredQualityIncident {
  eventId: string;
  sequence: number;
  observedBehavior: string;
  boundary: string;
  evidence: EventEvidence[];
}

export interface RecoveredGeneralCapture {
  eventId: string;
  sequence: number;
  userWords: string;
  evidence: EventEvidence[];
}

export interface RecoveredSessionBundle {
  sessionId: string;
  declaredArtifactFilename?: string;
  recoveryWarnings: string[];
  queueFilename: string;
  queueFingerprint: string;
  wikiCaptures: RecoveredWikiCapture[];
  contradictoryWikiCaptures: RecoveredContradictoryWikiCapture[];
  qualityIncidents: RecoveredQualityIncident[];
  generalCaptures: RecoveredGeneralCapture[];
}

/**
 * Recover evidence-supported observations from a malformed historical bundle.
 * Exact wiki captures remain the only recovered item actions: the supplied
 * queue supplies their exact identity. Non-item observations can be retained
 * when they are independently well-formed, without making recovery depend on
 * malformed item lifecycle data.
 */
export function recoverSessionBundleWithSuppliedQueue(
  input: SuppliedQueueRecoveryInput
): RecoveredSessionBundle {
  const bundle = parseJsonObject(input.bundleText, 'Recovery bundle');
  const queueCandidate = parseJsonObject(input.queueText, 'Recovery queue');
  const queue = validateTldrCommuteQueueV2(
    input.referenceText === undefined
      ? queueCandidate
      : createQueueV4Snapshot(
          queueCandidate,
          parseJsonObject(input.referenceText, 'Recovery reference'),
          input.queueFilename,
          input.referenceFilename
        )
  );
  const declaredQueueFilename = declaredQueueName(bundle);
  if (declaredQueueFilename !== input.queueFilename) {
    throw new Error(
      `Recovery queue filename ${input.queueFilename} does not match malformed bundle queue ${declaredQueueFilename}`
    );
  }

  const items = queueMetadataRecord(queue).items;
  if (!Array.isArray(items)) {
    throw new Error('Recovery queue must contain an items array');
  }
  const exactItems = items.map((item, index) => parseQueueItem(item, index));
  const events = requireArray(bundle.events, 'Recovery bundle events');
  const reservedWikiEventIds = recoveredWikiEventIds(events, exactItems);
  const ambiguousNonItemEventIds = duplicateNonItemEventIds(events);
  const artifactEvidence = inspectArtifactFilenameEvidence(bundle, input.bundleFilename);
  const queueFingerprint = queueSnapshotFingerprint(queue);
  const wikiCaptures: RecoveredWikiCapture[] = [];
  const contradictoryWikiCaptures: RecoveredContradictoryWikiCapture[] = [];
  const qualityIncidents: RecoveredQualityIncident[] = [];
  const generalCaptures: RecoveredGeneralCapture[] = [];
  const recoveredEventIds = new Set<string>();
  const recoveryWarnings = [...artifactEvidence.warnings];

  for (const [index, event] of events.entries()) {
    const field = `Recovery bundle events[${index}]`;
    const record = optionalRecord(event);
    if (!record) {
      recoveryWarnings.push(`${field} is not an object and was not recovered.`);
      continue;
    }

    const qualityIncident = recoverQualityIncident(
      record,
      field,
      recoveredEventIds,
      reservedWikiEventIds,
      ambiguousNonItemEventIds,
      recoveryWarnings
    );
    if (qualityIncident) {
      qualityIncidents.push(qualityIncident);
      continue;
    }

    const generalCapture = recoverGeneralCapture(
      record,
      field,
      recoveredEventIds,
      reservedWikiEventIds,
      ambiguousNonItemEventIds,
      recoveryWarnings
    );
    if (generalCapture) {
      generalCaptures.push(generalCapture);
      continue;
    }

    if (!isWikiCapture(record)) continue;
    const item = resolveLegacyItem(record.item, exactItems, `${field}.item`);
    const captureOrdinal = wikiCaptures.length + contradictoryWikiCaptures.length + 1;
    const userWords =
      lenientOptionalString(record.user_words) ?? lenientOptionalString(record.feedback);
    const contradictory = Boolean(userWords && refersToPriorWikiCapture(userWords));
    const eventId =
      lenientOptionalString(record.event_id) ?? recoveredCaptureEventId(item, contradictory);
    if (recoveredEventIds.has(eventId)) {
      throw new Error(
        `Recovery bundle wiki captures reuse event identity ${eventId}; distinct actions are ambiguous`
      );
    }
    recoveredEventIds.add(eventId);
    const sequence = lenientPositiveInteger(record.sequence) ?? captureOrdinal;
    const discussion = recoverDiscussion(
      record.discussion,
      `${field}.discussion`,
      recoveryWarnings
    );
    if (contradictory && userWords) {
      contradictoryWikiCaptures.push({
        eventId,
        sequence,
        sourceItemId: item.sourceItemId,
        title: item.title,
        url: item.url,
        userWords,
        ...(discussion === undefined ? {} : { discussion }),
      });
      continue;
    }
    wikiCaptures.push({
      eventId,
      sequence,
      sourceItemId: item.sourceItemId,
      title: item.title,
      url: item.url,
      ...(discussion === undefined ? {} : { discussion }),
    });
  }

  const sessionId = declaredSessionId(
    bundle,
    queueFingerprint,
    wikiCaptures,
    contradictoryWikiCaptures,
    qualityIncidents,
    generalCaptures
  );

  return {
    sessionId,
    ...(artifactEvidence.declaredArtifactFilename === undefined
      ? {}
      : { declaredArtifactFilename: artifactEvidence.declaredArtifactFilename }),
    recoveryWarnings,
    queueFilename: input.queueFilename,
    queueFingerprint,
    wikiCaptures,
    contradictoryWikiCaptures,
    qualityIncidents,
    generalCaptures,
  };
}

function recoverDiscussion(
  candidate: unknown,
  field: string,
  recoveryWarnings: string[]
): RecoveredDiscussion | undefined {
  if (candidate === undefined) return undefined;
  const record = optionalRecord(candidate);
  const summary = record && lenientOptionalString(record.summary);
  const importantQuestions = record && lenientStringArray(record.important_questions);
  const conclusions = record && lenientStringArray(record.conclusions);
  const requestedEmphasis = record && lenientStringArray(record.requested_emphasis);
  const evidence = record && recoverEvidence(record.evidence);
  if (
    !summary ||
    !importantQuestions ||
    !conclusions ||
    !requestedEmphasis ||
    !evidence ||
    !hasUserActionEvidence(evidence)
  ) {
    recoveryWarnings.push(
      `${field} lacks supported item-bound discussion evidence and was not recovered.`
    );
    return undefined;
  }
  return { summary, importantQuestions, conclusions, requestedEmphasis, evidence };
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
  wikiCaptures: RecoveredWikiCapture[],
  contradictoryWikiCaptures: RecoveredContradictoryWikiCapture[],
  qualityIncidents: RecoveredQualityIncident[],
  generalCaptures: RecoveredGeneralCapture[]
): string {
  const session = optionalRecord(bundle.session);
  const declared = session && lenientOptionalString(session.session_id);
  if (declared) return declared;

  const sessionDate = session && lenientOptionalString(session.session_date);
  const canonicalEvidence = stableJson({
    ...(sessionDate === undefined ? {} : { sessionDate }),
    queueFingerprint,
    wikiCaptures: canonicalCaptureOrder(wikiCaptures),
    contradictoryWikiCaptures: canonicalCaptureOrder(contradictoryWikiCaptures),
    qualityIncidents: canonicalObservationOrder(qualityIncidents),
    generalCaptures: canonicalObservationOrder(generalCaptures),
  });
  return `recovered-${createHash('sha256').update(canonicalEvidence).digest('hex').slice(0, 16)}`;
}

function canonicalObservationOrder<T extends { eventId: string; sequence: number }>(
  observations: T[]
): Array<Omit<T, 'sequence'>> {
  return observations
    .map(({ sequence: _sequence, ...observation }) => observation)
    .sort((left, right) => left.eventId.localeCompare(right.eventId));
}

function recoverQualityIncident(
  record: Record<string, unknown>,
  field: string,
  recoveredEventIds: Set<string>,
  reservedWikiEventIds: Set<string>,
  ambiguousNonItemEventIds: Set<string>,
  recoveryWarnings: string[]
): RecoveredQualityIncident | undefined {
  if (record.kind !== 'quality_incident') return undefined;
  const event = recoverNonItemEventBase(
    record,
    field,
    recoveredEventIds,
    reservedWikiEventIds,
    ambiguousNonItemEventIds,
    recoveryWarnings
  );
  const observedBehavior = lenientOptionalString(record.observed_behavior);
  const boundary = lenientOptionalString(record.boundary);
  if (!event || !observedBehavior || !boundary) {
    recoveryWarnings.push(
      `${field} quality incident lacks supported non-item fields and was not recovered.`
    );
    return undefined;
  }
  recoveredEventIds.add(event.eventId);
  return { ...event, observedBehavior, boundary };
}

function recoverGeneralCapture(
  record: Record<string, unknown>,
  field: string,
  recoveredEventIds: Set<string>,
  reservedWikiEventIds: Set<string>,
  ambiguousNonItemEventIds: Set<string>,
  recoveryWarnings: string[]
): RecoveredGeneralCapture | undefined {
  if (record.kind !== 'general_capture') return undefined;
  const event = recoverNonItemEventBase(
    record,
    field,
    recoveredEventIds,
    reservedWikiEventIds,
    ambiguousNonItemEventIds,
    recoveryWarnings
  );
  const userWords = lenientOptionalString(record.user_words);
  if (!event || !userWords || !hasUserActionEvidence(event.evidence)) {
    recoveryWarnings.push(
      `${field} general capture lacks direct supported evidence and was not recovered.`
    );
    return undefined;
  }
  recoveredEventIds.add(event.eventId);
  return { ...event, userWords };
}

function recoverNonItemEventBase(
  record: Record<string, unknown>,
  field: string,
  recoveredEventIds: Set<string>,
  reservedWikiEventIds: Set<string>,
  ambiguousNonItemEventIds: Set<string>,
  recoveryWarnings: string[]
): { eventId: string; sequence: number; evidence: EventEvidence[] } | undefined {
  const eventId = lenientOptionalString(record.event_id);
  const sequence = lenientPositiveInteger(record.sequence);
  const evidence = recoverEvidence(record.evidence);
  if (!eventId || sequence === undefined || !evidence) return undefined;
  if (ambiguousNonItemEventIds.has(eventId)) {
    recoveryWarnings.push(
      `${field} reuses non-item event identity ${eventId} and was not recovered.`
    );
    return undefined;
  }
  if (reservedWikiEventIds.has(eventId)) {
    recoveryWarnings.push(
      `${field} reuses event identity ${eventId} reserved for a wiki capture and was not recovered.`
    );
    return undefined;
  }
  if (recoveredEventIds.has(eventId)) {
    recoveryWarnings.push(`${field} reuses event identity ${eventId} and was not recovered.`);
    return undefined;
  }
  return { eventId, sequence, evidence };
}

function recoveredWikiEventIds(events: unknown[], queueItems: ExactQueueItem[]): Set<string> {
  const eventIds = new Set<string>();
  for (const [index, event] of events.entries()) {
    const record = optionalRecord(event);
    if (!record || !isWikiCapture(record)) continue;
    const item = resolveLegacyItem(
      record.item,
      queueItems,
      `Recovery bundle events[${index}].item`
    );
    const userWords =
      lenientOptionalString(record.user_words) ?? lenientOptionalString(record.feedback);
    const contradictory = Boolean(userWords && refersToPriorWikiCapture(userWords));
    eventIds.add(
      lenientOptionalString(record.event_id) ?? recoveredCaptureEventId(item, contradictory)
    );
  }
  return eventIds;
}

function duplicateNonItemEventIds(events: unknown[]): Set<string> {
  const counts = new Map<string, number>();
  for (const event of events) {
    const record = optionalRecord(event);
    if (!record || (record.kind !== 'quality_incident' && record.kind !== 'general_capture')) {
      continue;
    }
    const eventId = lenientOptionalString(record.event_id);
    if (eventId) counts.set(eventId, (counts.get(eventId) ?? 0) + 1);
  }
  return new Set([...counts].flatMap(([eventId, count]) => (count > 1 ? [eventId] : [])));
}

function recoverEvidence(candidate: unknown): EventEvidence[] | undefined {
  if (!Array.isArray(candidate) || candidate.length === 0) return undefined;
  const evidence: EventEvidence[] = [];
  for (const item of candidate) {
    const record = optionalRecord(item);
    const source = record && lenientOptionalString(record.source);
    const reference = record && lenientOptionalString(record.reference);
    if (!source || !reference || !(EVIDENCE_SOURCES as readonly string[]).includes(source)) {
      return undefined;
    }
    evidence.push({ source: source as EventEvidence['source'], reference });
  }
  return evidence;
}

function hasUserActionEvidence(evidence: EventEvidence[]): boolean {
  return evidence.some((item) =>
    [
      'durable_contemporaneous_record',
      'explicit_user_capture',
      'user_provided_chat_or_ui_observation',
    ].includes(item.source)
  );
}

function canonicalCaptureOrder<T extends RecoveredWikiCapture>(
  captures: T[]
): Array<Omit<T, 'sequence'>> {
  return captures
    .map(({ sequence: _sequence, ...capture }) => capture)
    .sort((left, right) => {
      const eventOrder = left.eventId.localeCompare(right.eventId);
      return eventOrder === 0 ? stableJson(left).localeCompare(stableJson(right)) : eventOrder;
    });
}

function recoveredCaptureEventId(item: ExactQueueItem, contradictory: boolean): string {
  const identity = stableJson({
    kind: contradictory ? 'contradictory_wiki_capture' : 'wiki_capture',
    sourceItemId: item.sourceItemId,
    url: item.url,
  });
  return `recovered-event-${createHash('sha256').update(identity).digest('hex').slice(0, 16)}`;
}

function inspectArtifactFilenameEvidence(
  bundle: Record<string, unknown>,
  inputFilename: string
): { declaredArtifactFilename?: string; warnings: string[] } {
  const session = optionalRecord(bundle.session);
  const sessionDate = session && lenientOptionalString(session.session_date);
  const declaredArtifactFilename = session && lenientOptionalString(session.artifact_filename);
  const warnings = recoveryArtifactFilenameWarnings(
    inputFilename,
    'Downloaded bundle filename',
    sessionDate
  );
  if (declaredArtifactFilename === undefined) {
    warnings.push('Malformed bundle does not declare session.artifact_filename.');
  } else {
    if (declaredArtifactFilename !== inputFilename) {
      warnings.push(
        ...recoveryArtifactFilenameWarnings(
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

export function recoveryArtifactFilenameWarnings(
  filename: string,
  field: string,
  sessionDate?: string
): string[] {
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

function lenientStringArray(candidate: unknown): string[] | undefined {
  if (!Array.isArray(candidate)) return undefined;
  const values = candidate.map(lenientOptionalString);
  return values.every((value) => value !== undefined) ? (values as string[]) : undefined;
}
